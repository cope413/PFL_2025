#!/usr/bin/env node
/**
 * Debug script to test API Sports injury endpoint with detailed logging
 */

const fs = require('fs');
const path = require('path');

class ApiSportsDebugger {
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

  async debugInjuryEndpoint(season = '2024') {
    const url = `${this.baseUrl}/injuries`;
    const headers = {
      'x-rapidapi-key': this.apiKey,
      'x-rapidapi-host': 'v1.american-football.api-sports.io'
    };

    try {
      console.log(`\n=== Debugging Injury Endpoint for Season ${season} ===`);
      console.log(`Full URL: ${url}?season=${season}`);
      console.log(`Headers:`, JSON.stringify(headers, null, 2));
      
      const response = await fetch(`${url}?season=${season}`, { headers });
      
      console.log(`\nResponse Status: ${response.status} ${response.statusText}`);
      console.log(`Response Headers:`, Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log(`\nRaw Response Body:`, responseText);
      
      if (response.ok) {
        try {
          const data = JSON.parse(responseText);
          console.log(`\nParsed JSON:`, JSON.stringify(data, null, 2));
          
          if (data.response && data.response.length > 0) {
            console.log(`\nFirst few injury records:`);
            data.response.slice(0, 3).forEach((injury, index) => {
              console.log(`  ${index + 1}. ${injury.name} (${injury.team}) - ${injury.status}`);
            });
          }
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
        }
      }
      
      return responseText;

    } catch (error) {
      console.error(`Error debugging season ${season}:`, error);
      return null;
    }
  }

  async testDifferentParameters() {
    console.log('=== Testing Different API Parameters ===');
    
    const baseUrl = `${this.baseUrl}/injuries`;
    const headers = {
      'x-rapidapi-key': this.apiKey,
      'x-rapidapi-host': 'v1.american-football.api-sports.io'
    };

    const testCases = [
      { season: '2024' },
      { season: '2023' },
      { season: '2022' },
      { season: '2021' },
      { season: '2020' },
      // Try without season parameter
      {},
      // Try with different parameter names
      { year: '2024' },
      { league: '1' },
      { league: '1', season: '2024' }
    ];

    for (const params of testCases) {
      const queryString = new URLSearchParams(params).toString();
      const fullUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;
      
      console.log(`\n--- Testing: ${fullUrl} ---`);
      
      try {
        const response = await fetch(fullUrl, { headers });
        const data = await response.json();
        
        console.log(`Status: ${response.status}`);
        console.log(`Results: ${data.results}`);
        
        if (data.results > 0) {
          console.log(`✅ Found ${data.results} injury records!`);
          console.log(`Sample: ${data.response[0]?.name} - ${data.response[0]?.status}`);
          break; // Stop on first successful result
        }
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Error: ${error.message}`);
      }
    }
  }
}

// Run the debug
async function main() {
  try {
    const apiDebugger = new ApiSportsDebugger();
    
    // First, test with detailed logging
    await apiDebugger.debugInjuryEndpoint('2024');
    
    // Then test different parameters
    await apiDebugger.testDifferentParameters();
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

main();
