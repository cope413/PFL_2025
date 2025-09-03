#!/usr/bin/env node

const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

class NFLScheduleService {
    constructor() {
        this.apiKey = null;
        this.baseUrl = 'https://v1.american-football.api-sports.io';
        this.db = null;
        this.loadApiKey();
        this.initDatabase();
    }

    loadApiKey() {
        try {
            const keyPath = path.join(process.cwd(), 'API Sports', 'API_SPORTS_KEY.json');
            const keyData = fs.readFileSync(keyPath, 'utf8');
            const apiData = JSON.parse(keyData);
            this.apiKey = apiData.key;
            console.log('✓ API Sports key loaded successfully');
        } catch (error) {
            console.error('Error loading API Sports key:', error);
            throw new Error('Failed to load API Sports key');
        }
    }

    initDatabase() {
        this.db = createClient({
            url: process.env.TURSO_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });
        console.log('✓ Database connection initialized');
    }

    /**
     * Convert UTC time to Los Angeles time
     * Note: API Sports sometimes returns Eastern time labeled as UTC
     */
    convertToLATime(utcDateTime) {
        const utcDate = new Date(utcDateTime);
        
        // Get the LA time components
        const laTimeString = utcDate.toLocaleString("en-CA", {
            timeZone: "America/Los_Angeles",
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        // Format: YYYY-MM-DD HH:MM:SS (remove any commas)
        const cleanTimeString = laTimeString.replace(/,/g, '');
        const [datePart, timePart] = cleanTimeString.split(' ');
        
        // Store as UTC time that represents the LA time
        // This way it can be displayed correctly without additional conversion
        return `${datePart}T${timePart}.000Z`;
    }

    /**
     * Fetch NFL schedule from API Sports for a specific season
     */
    async fetchSeasonSchedule(season) {
        const url = `${this.baseUrl}/games`;
        const params = {
            season: season.toString(),
            league: '1' // NFL league ID
        };

        const headers = {
            'x-rapidapi-key': this.apiKey,
            'x-rapidapi-host': 'v1.american-football.api-sports.io'
        };

        try {
            console.log(`Fetching complete schedule for ${season} season...`);
            
            const response = await fetch(url + '?' + new URLSearchParams(params), {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.errors && data.errors.length > 0) {
                console.warn(`API returned errors for ${season}:`, data.errors);
                return [];
            }

            console.log(`✓ Retrieved ${data.response?.length || 0} total games for ${season}`);
            return data.response || [];

        } catch (error) {
            console.error(`Error fetching ${season} schedule:`, error);
            return [];
        }
    }

    /**
     * Fetch complete NFL schedule for weeks 1-18 (Regular Season only)
     */
    async fetchCompleteSchedule(season = 2025) {
        console.log(`\n=== Fetching NFL Schedule for ${season} Season ===`);
        
        // Fetch all games for the season
        const allGames = await this.fetchSeasonSchedule(season);
        
        // Filter for Regular Season games only
        const regularSeasonGames = allGames.filter(game => 
            game.game.stage === 'Regular Season'
        );
        
        console.log(`✓ Found ${regularSeasonGames.length} Regular Season games`);
        
        // Filter for weeks 1-18
        const regularSeasonWeeks1to18 = regularSeasonGames.filter(game => {
            const weekStr = game.game.week;
            // Extract week number from strings like "Week 1", "Week 2", etc.
            const weekMatch = weekStr.match(/Week (\d+)/);
            if (weekMatch) {
                const weekNum = parseInt(weekMatch[1]);
                return weekNum >= 1 && weekNum <= 18;
            }
            return false;
        });

        console.log(`✓ Found ${regularSeasonWeeks1to18.length} games in weeks 1-18`);
        return regularSeasonWeeks1to18;
    }

    /**
     * Process and format game data for database insertion
     */
    processGameData(games) {
        return games.map(game => {
            // Extract week number from "Week X" string
            const weekStr = game.game.week;
            const weekMatch = weekStr.match(/Week (\d+)/);
            const weekNum = weekMatch ? parseInt(weekMatch[1]) : 0;
            
            // Format date and time
            const gameDate = game.game.date.date; // "2025-08-01"
            const gameTime = game.game.date.time; // "00:00"
            const gameTimeUTC = `${gameDate}T${gameTime}:00Z`;
            const gameTimeLA = this.convertToLATime(gameTimeUTC);
            
            return {
                game_id: game.game.id,
                week: weekNum,
                season: parseInt(game.league.season),
                game_date: gameDate,
                game_time_utc: gameTimeUTC,
                game_time_la: gameTimeLA,
                home_team_id: game.teams.home.id,
                home_team_name: game.teams.home.name,
                home_team_abbrev: game.teams.home.name, // API doesn't provide abbrev, using name
                away_team_id: game.teams.away.id,
                away_team_name: game.teams.away.name,
                away_team_abbrev: game.teams.away.name, // API doesn't provide abbrev, using name
                venue: game.game.venue?.name || null,
                status: game.game.status?.short || 'Scheduled'
            };
        });
    }

    /**
     * Insert games into the NFL_Schedule table
     */
    async insertGames(games) {
        if (games.length === 0) {
            console.log('No games to insert');
            return;
        }

        console.log(`\n=== Inserting ${games.length} games into NFL_Schedule table ===`);

        try {
            // Clear existing data for the season
            const season = games[0].season;
            await this.db.execute({
                sql: 'DELETE FROM NFL_Schedule WHERE season = ?',
                args: [season]
            });
            console.log(`✓ Cleared existing data for ${season} season`);

            // Insert new games
            let insertedCount = 0;
            for (const game of games) {
                try {
                    await this.db.execute({
                        sql: `
                            INSERT INTO NFL_Schedule (
                                Week, Home_Team, Away_Team, season, game_date, game_time_utc, game_time_la,
                                home_team_id, home_team_name, home_team_abbrev,
                                away_team_id, away_team_name, away_team_abbrev,
                                venue, status
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `,
                        args: [
                            game.week, game.home_team_name, game.away_team_name, game.season, game.game_date, 
                            game.game_time_utc, game.game_time_la,
                            game.home_team_id, game.home_team_name, game.home_team_abbrev,
                            game.away_team_id, game.away_team_name, game.away_team_abbrev,
                            game.venue, game.status
                        ]
                    });
                    insertedCount++;
                } catch (error) {
                    console.error(`Error inserting game ${game.game_id}:`, error);
                }
            }

            console.log(`✓ Successfully inserted ${insertedCount} games`);

        } catch (error) {
            console.error('Error inserting games:', error);
            throw error;
        }
    }

    /**
     * Display summary of inserted schedule
     */
    async displayScheduleSummary(season = 2025) {
        try {
            console.log(`\n=== NFL Schedule Summary for ${season} ===`);
            
            // Get games by week
            const result = await this.db.execute({
                sql: `
                    SELECT week, COUNT(*) as game_count, 
                           MIN(game_time_la) as first_game, 
                           MAX(game_time_la) as last_game
                    FROM NFL_Schedule 
                    WHERE season = ?
                    GROUP BY week 
                    ORDER BY week
                `,
                args: [season]
            });

            result.rows.forEach(row => {
                const firstGame = new Date(row.first_game).toLocaleString('en-US', {
                    timeZone: 'America/Los_Angeles',
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                });
                
                const lastGame = new Date(row.last_game).toLocaleString('en-US', {
                    timeZone: 'America/Los_Angeles',
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                });

                console.log(`Week ${row.week}: ${row.game_count} games (${firstGame} - ${lastGame} LA time)`);
            });

            // Get total count
            const totalResult = await this.db.execute({
                sql: 'SELECT COUNT(*) as total FROM NFL_Schedule WHERE season = ?',
                args: [season]
            });

            console.log(`\nTotal: ${totalResult.rows[0].total} games for ${season} season`);

        } catch (error) {
            console.error('Error displaying schedule summary:', error);
        }
    }

    /**
     * Main method to fetch and store complete NFL schedule
     */
    async fetchAndStoreSchedule(season = 2025) {
        try {
            console.log('🚀 Starting NFL Schedule fetch and store process...\n');

            // Fetch complete schedule
            const rawGames = await this.fetchCompleteSchedule(season);
            
            if (rawGames.length === 0) {
                console.log('❌ No games found. Check API key and season availability.');
                return false;
            }

            // Process game data
            const processedGames = this.processGameData(rawGames);
            console.log(`✓ Processed ${processedGames.length} games`);

            // Insert into database
            await this.insertGames(processedGames);

            // Display summary
            await this.displayScheduleSummary(season);

            console.log('\n🎉 NFL Schedule fetch and store completed successfully!');
            return true;

        } catch (error) {
            console.error('❌ Error in fetch and store process:', error);
            return false;
        }
    }
}

// Run the service if this script is executed directly
async function main() {
    const service = new NFLScheduleService();
    const success = await service.fetchAndStoreSchedule(2025);
    
    if (success) {
        console.log('\n✅ NFL Schedule successfully fetched and stored!');
        process.exit(0);
    } else {
        console.log('\n❌ NFL Schedule fetch failed!');
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
}

module.exports = { NFLScheduleService };
