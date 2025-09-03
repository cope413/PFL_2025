#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class APITimeDebugger {
    constructor() {
        this.apiKey = null;
        this.baseUrl = 'https://v1.american-football.api-sports.io';
        this.loadApiKey();
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

    async debugAPITimes() {
        const url = `${this.baseUrl}/games`;
        const params = {
            season: '2025',
            league: '1'
        };

        const headers = {
            'x-rapidapi-key': this.apiKey,
            'x-rapidapi-host': 'v1.american-football.api-sports.io'
        };

        try {
            console.log('Fetching sample games to debug time format...');
            
            const response = await fetch(url + '?' + new URLSearchParams(params), {
                method: 'GET',
                headers: headers
            });

            const data = await response.json();
            
            if (data.response && data.response.length > 0) {
                console.log('\n=== Sample Game Time Data ===');
                
                // Look at first few regular season games
                const regularSeasonGames = data.response.filter(game => 
                    game.game.stage === 'Regular Season'
                ).slice(0, 5);

                regularSeasonGames.forEach((game, index) => {
                    console.log(`\nGame ${index + 1}:`);
                    console.log(`  Teams: ${game.teams.away.name} @ ${game.teams.home.name}`);
                    console.log(`  Week: ${game.game.week}`);
                    console.log(`  Venue: ${game.game.venue?.name || 'Unknown'}`);
                    console.log(`  Raw date object:`, game.game.date);
                    console.log(`  Date: ${game.game.date.date}`);
                    console.log(`  Time: ${game.game.date.time}`);
                    console.log(`  Timezone: ${game.game.date.timezone}`);
                    console.log(`  Timestamp: ${game.game.date.timestamp}`);
                    
                    // Test different interpretations
                    const dateStr = game.game.date.date;
                    const timeStr = game.game.date.time;
                    const fullDateTime = `${dateStr}T${timeStr}:00Z`;
                    
                    console.log(`  Constructed UTC: ${fullDateTime}`);
                    
                    const utcDate = new Date(fullDateTime);
                    console.log(`  As UTC: ${utcDate.toLocaleString('en-US', { timeZone: 'UTC' })}`);
                    console.log(`  As Eastern: ${utcDate.toLocaleString('en-US', { timeZone: 'America/New_York' })}`);
                    console.log(`  As Pacific: ${utcDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}`);
                    
                    // Test if it's actually Eastern time
                    const easternAsUTC = `${dateStr}T${timeStr}:00-05:00`; // Eastern as UTC-5
                    const easternDate = new Date(easternAsUTC);
                    console.log(`  If Eastern as UTC-5: ${easternDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}`);
                });
            }

        } catch (error) {
            console.error('Error debugging API times:', error);
        }
    }
}

// Run the debugger
async function main() {
    const timeDebugger = new APITimeDebugger();
    await timeDebugger.debugAPITimes();
}

if (require.main === module) {
    main().catch(error => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
}

module.exports = { APITimeDebugger };
