const { createClient } = require('@libsql/client');
const { execSync } = require('child_process');
require('dotenv').config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function updateWeekValues() {
  try {
    console.log('🔄 Updating week values from PFL_Stats.db to Turso...');
    
    // Export week data from PFL_Stats.db
    console.log('📤 Exporting week data from PFL_Stats.db...');
    const csvData = execSync('sqlite3 PFL_Stats.db -header -csv "SELECT player_id, game_id, week FROM player_stats WHERE week IS NOT NULL"', { encoding: 'utf8' });
    
    const lines = csvData.trim().split('\n');
    const records = lines.slice(1); // Skip header
    
    console.log(`📊 Found ${records.length} records to update`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const record of records) {
      try {
        // Parse CSV record (handle quoted values)
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < record.length; i++) {
          const char = record[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim()); // Add the last value
        
        const [playerId, gameId, weekValue] = values;
        
        // Convert "Week X" to integer X
        let weekInt;
        if (weekValue.startsWith('Week ')) {
          weekInt = parseInt(weekValue.replace('Week ', ''));
        } else {
          weekInt = parseInt(weekValue);
        }
        
        if (isNaN(weekInt)) {
          console.log(`⚠️ Skipping invalid week value: ${weekValue} for player ${playerId}`);
          continue;
        }
        
        // Update the record in Turso
        await client.execute({
          sql: 'UPDATE player_stats SET week = ? WHERE player_id = ? AND game_id = ?',
          args: [weekInt, parseInt(playerId), parseInt(gameId)]
        });
        
        successCount++;
        
        if (successCount % 100 === 0) {
          console.log(`✅ Updated ${successCount} records...`);
        }
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error updating record: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Update completed!`);
    console.log(`✅ Successfully updated: ${successCount} records`);
    console.log(`❌ Errors: ${errorCount} records`);
    
  } catch (error) {
    console.error('💥 Error updating week values:', error);
  }
}

updateWeekValues();
