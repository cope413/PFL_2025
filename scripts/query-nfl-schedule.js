#!/usr/bin/env node

const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });

class NFLScheduleQuery {
    constructor() {
        this.db = createClient({
            url: process.env.TURSO_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });
    }

    /**
     * Get all games for a specific week
     */
    async getGamesByWeek(week, season = 2025) {
        const result = await this.db.execute({
            sql: `
                SELECT Week, Home_Team, Away_Team, game_date, game_time_la, venue, status
                FROM NFL_Schedule 
                WHERE Week = ? AND season = ?
                ORDER BY game_time_la
            `,
            args: [week, season]
        });

        return result.rows.map(row => ({
            week: row.Week,
            homeTeam: row.Home_Team,
            awayTeam: row.Away_Team,
            gameDate: row.game_date,
            gameTimeLA: new Date(row.game_time_la).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            }),
            venue: row.venue,
            status: row.status
        }));
    }

    /**
     * Get all games for a specific team
     */
    async getGamesByTeam(teamName, season = 2025) {
        const result = await this.db.execute({
            sql: `
                SELECT Week, Home_Team, Away_Team, game_date, game_time_la, venue, status
                FROM NFL_Schedule 
                WHERE (Home_Team LIKE ? OR Away_Team LIKE ?) AND season = ?
                ORDER BY Week, game_time_la
            `,
            args: [`%${teamName}%`, `%${teamName}%`, season]
        });

        return result.rows.map(row => ({
            week: row.Week,
            homeTeam: row.Home_Team,
            awayTeam: row.Away_Team,
            gameDate: row.game_date,
            gameTimeLA: new Date(row.game_time_la).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            }),
            venue: row.venue,
            status: row.status,
            isHome: row.Home_Team.includes(teamName)
        }));
    }

    /**
     * Get games for a specific date range
     */
    async getGamesByDateRange(startDate, endDate, season = 2025) {
        const result = await this.db.execute({
            sql: `
                SELECT Week, Home_Team, Away_Team, game_date, game_time_la, venue, status
                FROM NFL_Schedule 
                WHERE game_date BETWEEN ? AND ? AND season = ?
                ORDER BY game_time_la
            `,
            args: [startDate, endDate, season]
        });

        return result.rows.map(row => ({
            week: row.Week,
            homeTeam: row.Home_Team,
            awayTeam: row.Away_Team,
            gameDate: row.game_date,
            gameTimeLA: new Date(row.game_time_la).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            }),
            venue: row.venue,
            status: row.status
        }));
    }

    /**
     * Get summary statistics
     */
    async getSummary(season = 2025) {
        const totalResult = await this.db.execute({
            sql: 'SELECT COUNT(*) as total FROM NFL_Schedule WHERE season = ?',
            args: [season]
        });

        const weekResult = await this.db.execute({
            sql: `
                SELECT Week, COUNT(*) as game_count
                FROM NFL_Schedule 
                WHERE season = ?
                GROUP BY Week 
                ORDER BY Week
            `,
            args: [season]
        });

        return {
            totalGames: totalResult.rows[0].total,
            gamesByWeek: weekResult.rows.map(row => ({
                week: row.Week,
                gameCount: row.game_count
            }))
        };
    }
}

// CLI interface
async function main() {
    const query = new NFLScheduleQuery();
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('NFL Schedule Query Tool');
        console.log('Usage:');
        console.log('  node scripts/query-nfl-schedule.js week <week_number>');
        console.log('  node scripts/query-nfl-schedule.js team <team_name>');
        console.log('  node scripts/query-nfl-schedule.js summary');
        console.log('  node scripts/query-nfl-schedule.js range <start_date> <end_date>');
        console.log('');
        console.log('Examples:');
        console.log('  node scripts/query-nfl-schedule.js week 1');
        console.log('  node scripts/query-nfl-schedule.js team "Kansas City Chiefs"');
        console.log('  node scripts/query-nfl-schedule.js summary');
        console.log('  node scripts/query-nfl-schedule.js range 2025-09-07 2025-09-08');
        return;
    }

    const command = args[0];

    try {
        switch (command) {
            case 'week':
                const week = parseInt(args[1]);
                if (!week || week < 1 || week > 18) {
                    console.log('Please provide a valid week number (1-18)');
                    return;
                }
                const weekGames = await query.getGamesByWeek(week);
                console.log(`\n=== Week ${week} Games ===`);
                weekGames.forEach(game => {
                    console.log(`${game.awayTeam} @ ${game.homeTeam} - ${game.gameTimeLA} LA time`);
                });
                break;

            case 'team':
                const teamName = args[1];
                if (!teamName) {
                    console.log('Please provide a team name');
                    return;
                }
                const teamGames = await query.getGamesByTeam(teamName);
                console.log(`\n=== ${teamName} Games ===`);
                teamGames.forEach(game => {
                    const vs = game.isHome ? 'vs' : '@';
                    const opponent = game.isHome ? game.awayTeam : game.homeTeam;
                    console.log(`Week ${game.week}: ${vs} ${opponent} - ${game.gameTimeLA} LA time`);
                });
                break;

            case 'summary':
                const summary = await query.getSummary();
                console.log(`\n=== 2025 NFL Season Summary ===`);
                console.log(`Total games: ${summary.totalGames}`);
                console.log('\nGames by week:');
                summary.gamesByWeek.forEach(week => {
                    console.log(`  Week ${week.week}: ${week.gameCount} games`);
                });
                break;

            case 'range':
                const startDate = args[1];
                const endDate = args[2];
                if (!startDate || !endDate) {
                    console.log('Please provide start and end dates (YYYY-MM-DD format)');
                    return;
                }
                const rangeGames = await query.getGamesByDateRange(startDate, endDate);
                console.log(`\n=== Games from ${startDate} to ${endDate} ===`);
                rangeGames.forEach(game => {
                    console.log(`Week ${game.week}: ${game.awayTeam} @ ${game.homeTeam} - ${game.gameTimeLA} LA time`);
                });
                break;

            default:
                console.log(`Unknown command: ${command}`);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

if (require.main === module) {
    main();
}

module.exports = { NFLScheduleQuery };
