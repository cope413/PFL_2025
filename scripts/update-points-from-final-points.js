#!/usr/bin/env node

const { createClient } = require('@libsql/client');
const sqlite3 = require('better-sqlite3');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Initialize Turso client
const tursoClient = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize local SQLite database
const localDbPath = path.join(__dirname, '..', 'API Sports', 'nfl_stats.db');
const localDb = new sqlite3(localDbPath);

console.log('Starting Points table update from Final_Points...');
console.log('Local database path:', localDbPath);

async function updatePointsFromFinalPoints() {
  try {
    // Get all records from Final_Points table
    console.log('Fetching data from Final_Points table...');
    const finalPointsData = localDb.prepare(`
      SELECT 
        player_id,
        player_name,
        team_id,
        week_1, week_2, week_3, week_4, week_5, week_6, week_7, week_8, week_9, week_10,
        week_11, week_12, week_13, week_14, week_15, week_16, week_17, week_18
      FROM Final_Points
    `).all();

    console.log(`Found ${finalPointsData.length} records in Final_Points table`);

    let updatedCount = 0;
    let skippedCount = 0;

    // Process each record from Final_Points
    for (const finalPoint of finalPointsData) {
      const playerId = finalPoint.player_id;
      
      // Get current Points record for this player
      const currentPoints = await tursoClient.execute({
        sql: 'SELECT * FROM Points WHERE player_ID = ?',
        args: [playerId]
      });

      if (currentPoints.rows.length === 0) {
        console.log(`Player ID ${playerId} not found in Points table, skipping...`);
        skippedCount++;
        continue;
      }

      const currentRecord = currentPoints.rows[0];
      
      // Build update query - only update weeks where current value is NULL
      const updateFields = [];
      const updateArgs = [];
      
      for (let week = 1; week <= 18; week++) {
        const weekColumn = `week_${week}`;
        const finalValue = finalPoint[weekColumn];
        const currentValue = currentRecord[weekColumn];
        
        // Only update if current value is NULL and final value is not NULL
        if (currentValue === null && finalValue !== null) {
          updateFields.push(`${weekColumn} = ?`);
          updateArgs.push(finalValue);
        }
      }
      
      // Only proceed with update if there are fields to update
      if (updateFields.length > 0) {
        updateArgs.push(playerId);
        
        const updateQuery = `
          UPDATE Points 
          SET ${updateFields.join(', ')}
          WHERE player_ID = ?
        `;
        
        await tursoClient.execute({
          sql: updateQuery,
          args: updateArgs
        });
        
        console.log(`Updated ${updateFields.length} weeks for player ${playerId} (${finalPoint.player_name})`);
        updatedCount++;
      } else {
        console.log(`No updates needed for player ${playerId} (${finalPoint.player_name}) - all weeks already have values`);
        skippedCount++;
      }
    }

    console.log('\n=== Update Summary ===');
    console.log(`Total records processed: ${finalPointsData.length}`);
    console.log(`Records updated: ${updatedCount}`);
    console.log(`Records skipped: ${skippedCount}`);
    console.log('Update completed successfully!');

  } catch (error) {
    console.error('Error updating Points table:', error);
    throw error;
  } finally {
    // Close local database connection
    localDb.close();
  }
}

// Run the update
updatePointsFromFinalPoints()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
