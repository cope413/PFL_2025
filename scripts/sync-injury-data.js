#!/usr/bin/env node
/**
 * Script to sync injury data from API Sports and update Players table
 */

const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Import the injury service (we'll need to compile TypeScript or use a different approach)
// For now, let's implement the API call directly in this script

class InjurySyncService {
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
      const response = await fetch(`${url}?player=${playerId}`, { headers });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
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
    
    // Log the mapping for debugging
    if (normalizedStatus !== 'healthy') {
      console.log(`    Mapping: "${apiStatus}" -> "${mappedStatus}"`);
    }
    
    return mappedStatus;
  }

  async syncInjuryData() {
    const db = createClient({
      url: process.env.TURSO_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    try {
      console.log('=== Starting Injury Data Sync ===');

      // First, check if injury_status column exists
      console.log('\n=== Checking Database Schema ===');
      const structureResult = await db.execute("PRAGMA table_info(Players)");
      const existingColumns = structureResult.rows.map(row => row.name);
      
      if (!existingColumns.includes('injury_status')) {
        console.log('Adding injury_status column...');
        await db.execute(`
          ALTER TABLE Players 
          ADD COLUMN injury_status TEXT DEFAULT 'healthy'
        `);
        console.log('✓ injury_status column added');
      } else {
        console.log('✓ injury_status column already exists');
      }

      // Get all players from database
      console.log('\n=== Getting Players from Database ===');
      const playersResult = await db.execute(`
        SELECT player_ID, player_name, team_name 
        FROM Players 
        WHERE owner_ID != 99
      `);
      
      const players = playersResult.rows;
      console.log(`Found ${players.length} players in database`);

      // Fetch injury data for each player individually
      console.log('\n=== Fetching Injury Data from API Sports ===');
      let updatedCount = 0;
      let healthyCount = 0;
      let errorCount = 0;

      for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const playerId = player[0];
        const playerName = player[1];
        const teamName = player[2];
        
        try {
          // Fetch injury data for this specific player
          const injuryData = await this.fetchPlayerInjury(playerId);
          
          let injuryStatus = 'healthy'; // Default to healthy
          
          if (injuryData) {
            injuryStatus = this.mapInjuryStatus(injuryData.status);
            console.log(`  - ${playerName} (${teamName}): ${injuryData.status} -> ${injuryStatus}`);
          }

          // Update the player's injury status
          await db.execute({
            sql: 'UPDATE Players SET injury_status = ? WHERE player_ID = ?',
            args: [injuryStatus, playerId]
          });

          if (injuryStatus !== 'healthy') {
            updatedCount++;
          } else {
            healthyCount++;
          }

          // Add a small delay to avoid rate limiting
          if (i % 10 === 0) {
            console.log(`  Processed ${i + 1}/${players.length} players...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

        } catch (error) {
          console.error(`  Error processing ${playerName}: ${error.message}`);
          errorCount++;
          
          // Set to healthy on error
          await db.execute({
            sql: 'UPDATE Players SET injury_status = ? WHERE player_ID = ?',
            args: ['healthy', playerId]
          });
          healthyCount++;
        }
      }

      console.log(`\n=== Sync Complete ===`);
      console.log(`✓ Updated ${updatedCount} players with injury status`);
      console.log(`✓ ${healthyCount} players remain healthy`);
      console.log(`✓ ${errorCount} players had errors (set to healthy)`);
      console.log(`✓ Total players processed: ${players.length}`);

      // Show summary by status
      console.log('\n=== Injury Status Summary ===');
      const statusSummary = await db.execute(`
        SELECT injury_status, COUNT(*) as count 
        FROM Players 
        WHERE owner_ID != 99 
        GROUP BY injury_status 
        ORDER BY count DESC
      `);

      statusSummary.rows.forEach(row => {
        console.log(`  - ${row[0]}: ${row[1]} players`);
      });

    } catch (error) {
      console.error('Error syncing injury data:', error);
      throw error;
    } finally {
      await db.close();
    }
  }
}

// Run the sync
async function main() {
  try {
    const syncService = new InjurySyncService();
    await syncService.syncInjuryData();
    console.log('\n🎉 Injury data sync completed successfully!');
  } catch (error) {
    console.error('\n❌ Injury data sync failed:', error);
    process.exit(1);
  }
}

main();
