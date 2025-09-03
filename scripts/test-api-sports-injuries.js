#!/usr/bin/env node
/**
 * Script to test API Sports injury endpoint with different seasons
 */

const fs = require('fs');
const path = require('path');

class ApiSportsTester {
  constructor() {
    this.apiKey = this.loadApiKey();
    this.baseUrl = 'https://v1.american-football.api-sports.io';
  }

  loadApiKey() {
    const keyPath = path.join(process.cwd(), 'API Sports', 'API_SPORTS_KEY.json');
    try {
      const keyData = fs.readFileSync(keyPath, 'utf8');
      const apiData = JSON.parse(keyData);
      return apiData.key;
    } catch (error) {
      console.error('Error loading API Sports key:', error);
      throw new Error('Failed to load API Sports key');
    }
  }

  async testInjuryEndpoint(season) {
    const url = `${this.baseUrl}/injuries`;
    const headers = {
      'x-rapidapi-key': this.apiKey,
      'x-rapidapi-host': 'v1.american-football.api-sports.io'
    };

    try {
      console.log(`\n=== Testing Injury Endpoint for Season ${season} ===`);
      console.log(`URL: ${url}?season=${season}`);
      
      const response = await fetch(`${url}?season=${season}`, { headers });
      
      console.log(`Response Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        console.log(`❌ API request failed: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      
      console.log(`Results: ${data.results}`);
      console.log(`Errors: ${data.errors ? data.errors.length : 0}`);
      
      if (data.errors && data.errors.length > 0) {
        console.log('API Errors:', data.errors);
      }

      if (data.response && data.response.length > 0) {
        console.log('\nSample injury records:');
        data.response.slice(0, 3).forEach((injury, index) => {
          console.log(`  ${index + 1}. ${injury.name} (${injury.team}) - ${injury.status}`);
        });
      } else {
        console.log('No injury records found for this season');
      }

      return data;

    } catch (error) {
      console.error(`Error testing season ${season}:`, error);
      return null;
    }
  }

  async testAllSeasons() {
    console.log('=== Testing API Sports Injury Endpoint ===');
    console.log(`API Key: ${this.apiKey.substring(0, 8)}...`);
    
    const seasons = ['2024', '2023', '2022'];
    
    for (const season of seasons) {
      await this.testInjuryEndpoint(season);
      // Add a small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n=== Testing Complete ===');
    console.log('If any season returned injury data, you can use that season in the sync script.');
  }
}

// Run the test
async function main() {
  try {
    const tester = new ApiSportsTester();
    await tester.testAllSeasons();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

main();


