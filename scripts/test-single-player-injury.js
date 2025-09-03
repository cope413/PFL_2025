#!/usr/bin/env node
/**
 * Test script to check injury status for a single player (Brandon Aiyuk)
 */

const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

class SinglePlayerTester {
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

  async fetchPlayerInjury(playerId) {
    const url = `${this.baseUrl}/injuries`;
    const headers = {
      'x-rapidapi-key': this.apiKey,
      'x-rapidapi-host': 'v1.american-football.api-sports.io'
    };

    try {
      console.log(`Fetching injury data for player ID: ${playerId}`);
      console.log(`URL: ${url}?player=${playerId}`);
      
      const response = await fetch(`${url}?player=${playerId}`, { headers });
      
      console.log(`Response Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('Full API Response:', JSON.stringify(data, null, 2));
      
      if (data.errors && data.errors.length > 0) {
        console.warn(`API returned errors for player ${playerId}:`, data.errors);
      }

      if (data.results > 0 && data.response && data.response.length > 0) {
        return data.response[0]; // Return the first injury record
      }

      return null; // No injury data found

    } catch (error) {
      console.error(`Error fetching injury data for player ${playerId}:`, error);
      return null;
    }
  }

  mapInjuryStatus(apiStatus) {
    const statusMap = {
      'healthy': 'healthy',
      'questionable': 'questionable',
      'doubtful': 'doubtful',
      'out': 'out',
      'injured': 'out',
      'ir': 'out',
      'pup': 'out',
      'suspended': 'out',
      'covid': 'out',
      'personal': 'out',
      'not injury related': 'healthy'
    };

    const normalizedStatus = apiStatus.toLowerCase().trim();
    const mappedStatus = statusMap[normalizedStatus] || 'healthy';
    
    console.log(`Mapping: "${apiStatus}" -> "${mappedStatus}"`);
    return mappedStatus;
  }

  async testBrandonAiyuk() {
    const db = createClient({
      url: process.env.TURSO_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    try {
      console.log('=== Testing Brandon Aiyuk Injury Status ===');

      // Find Brandon Aiyuk in the database
      const aiyukResult = await db.execute(`
        SELECT player_ID, player_name, team_name, injury_status 
        FROM Players 
        WHERE player_name LIKE '%Aiyuk%'
      `);

      if (aiyukResult.rows.length === 0) {
        console.log('Brandon Aiyuk not found in database');
        return;
      }

      const aiyuk = aiyukResult.rows[0];
      console.log(`Found: ${aiyuk[1]} (${aiyuk[2]}) - Player ID: ${aiyuk[0]}, Current Status: ${aiyuk[3]}`);

      // Fetch injury data from API Sports
      const injuryData = await this.fetchPlayerInjury(aiyuk[0]);

      if (injuryData) {
        console.log(`\nInjury Data Found:`);
        console.log(`  Name: ${injuryData.player?.name || 'N/A'}`);
        console.log(`  Status: ${injuryData.status}`);
        console.log(`  Description: ${injuryData.description || 'N/A'}`);
        console.log(`  Date: ${injuryData.date || 'N/A'}`);
        
        const mappedStatus = this.mapInjuryStatus(injuryData.status);
        console.log(`\nMapped Status: ${mappedStatus}`);
        
        // Update the database
        await db.execute({
          sql: 'UPDATE Players SET injury_status = ? WHERE player_ID = ?',
          args: [mappedStatus, aiyuk[0]]
        });
        
        console.log(`✓ Updated Brandon Aiyuk's status to: ${mappedStatus}`);
      } else {
        console.log('\nNo injury data found for Brandon Aiyuk');
      }

    } catch (error) {
      console.error('Error testing Brandon Aiyuk:', error);
    } finally {
      await db.close();
    }
  }
}

// Run the test
async function main() {
  try {
    const tester = new SinglePlayerTester();
    await tester.testBrandonAiyuk();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

main();


