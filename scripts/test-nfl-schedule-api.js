#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class NFLScheduleAPITester {
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

    async testAPIEndpoint(season, week) {
        const url = `${this.baseUrl}/games`;
        const params = {
            season: season.toString(),
            league: '1', // NFL league ID
            week: week.toString()
        };

        const headers = {
            'x-rapidapi-key': this.apiKey,
            'x-rapidapi-host': 'v1.american-football.api-sports.io'
        };

        try {
            console.log(`\n=== Testing API for ${season} Week ${week} ===`);
            console.log(`URL: ${url}`);
            console.log(`Params:`, params);
            console.log(`Headers:`, headers);
            
            const response = await fetch(url + '?' + new URLSearchParams(params), {
                method: 'GET',
                headers: headers
            });

            console.log(`Response Status: ${response.status} ${response.statusText}`);
            console.log(`Response Headers:`, Object.fromEntries(response.headers.entries()));

            const data = await response.json();
            console.log(`Response Data:`, JSON.stringify(data, null, 2));

            if (data.errors && data.errors.length > 0) {
                console.log(`API Errors:`, data.errors);
            }

            if (data.response && data.response.length > 0) {
                console.log(`Found ${data.response.length} games`);
                if (data.response[0]) {
                    console.log(`Sample game:`, JSON.stringify(data.response[0], null, 2));
                }
            } else {
                console.log('No games found in response');
            }

            return data;

        } catch (error) {
            console.error(`Error testing API:`, error);
            return null;
        }
    }

    async testMultipleSeasons() {
        console.log('🧪 Testing NFL Schedule API with different seasons and weeks...\n');

        // Test 2024 season (should have data)
        await this.testAPIEndpoint(2024, 1);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 2025 season (might not have data yet)
        await this.testAPIEndpoint(2025, 1);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test without week parameter
        console.log('\n=== Testing API without week parameter ===');
        const url = `${this.baseUrl}/games`;
        const params = {
            season: '2024',
            league: '1'
        };

        const headers = {
            'x-rapidapi-key': this.apiKey,
            'x-rapidapi-host': 'v1.american-football.api-sports.io'
        };

        try {
            const response = await fetch(url + '?' + new URLSearchParams(params), {
                method: 'GET',
                headers: headers
            });

            const data = await response.json();
            console.log(`Response without week:`, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error testing without week:', error);
        }
    }
}

// Run the tester if this script is executed directly
async function main() {
    const tester = new NFLScheduleAPITester();
    await tester.testMultipleSeasons();
}

if (require.main === module) {
    main().catch(error => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
}

module.exports = { NFLScheduleAPITester };
