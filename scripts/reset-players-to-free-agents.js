#!/usr/bin/env node

/**
 * PFL Reset Players Script
 * 
 * This script resets all players back to free agents (owner_ID = "99")
 * to prepare for a fresh draft simulation.
 */

const API_BASE = 'http://localhost:3001/api';

// Reset all players to free agents
async function resetPlayersToFreeAgents() {
  console.log('🔄 Resetting all players to free agents...');
  
  try {
    // Get all players
    const response = await fetch(`${API_BASE}/players`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`Failed to fetch players: ${result.error}`);
    }
    
    const players = result.data;
    console.log(`Found ${players.length} total players`);
    
    // Count players that need to be reset
    const ownedPlayers = players.filter(p => p.owner_ID !== "99");
    console.log(`${ownedPlayers.length} players need to be reset to free agents`);
    
    if (ownedPlayers.length === 0) {
      console.log('✅ All players are already free agents!');
      return;
    }
    
    // Reset each owned player to free agent status
    let resetCount = 0;
    for (const player of ownedPlayers) {
      try {
        const resetResponse = await fetch(`${API_BASE}/draft`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'assignPlayer',
            player_id: player.id,
            team_id: "99"
          }),
        });
        
        const resetResult = await resetResponse.json();
        if (resetResult.success) {
          resetCount++;
          if (resetCount % 50 === 0) {
            console.log(`Reset ${resetCount}/${ownedPlayers.length} players...`);
          }
        } else {
          console.error(`❌ Failed to reset player ${player.id}: ${resetResult.error}`);
        }
      } catch (error) {
        console.error(`❌ Error resetting player ${player.id}:`, error.message);
      }
    }
    
    console.log(`✅ Successfully reset ${resetCount} players to free agents!`);
    
    // Verify the reset
    const verifyResponse = await fetch(`${API_BASE}/players`);
    const verifyResult = await verifyResponse.json();
    const freeAgents = verifyResult.data.filter(p => p.owner_ID === "99");
    console.log(`📊 Verification: ${freeAgents.length} players are now free agents`);
    
  } catch (error) {
    console.error('❌ Error during player reset:', error.message);
    process.exit(1);
  }
}

// Also clear the draft table
async function clearDraftTable() {
  console.log('🗑️ Clearing draft table...');
  
  try {
    const response = await fetch(`${API_BASE}/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'clear'
      }),
    });
    
    const result = await response.json();
    if (result.success) {
      console.log('✅ Draft table cleared successfully!');
    } else {
      console.error(`❌ Failed to clear draft table: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ Error clearing draft table:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🏈 PFL Player Reset Script Starting...\n');
  
  // Check if server is running
  try {
    await fetch(`${API_BASE}/players`);
  } catch (error) {
    console.error('❌ Development server is not running on port 3001!');
    console.error('Please start the dev server with: npm run dev');
    process.exit(1);
  }
  
  await resetPlayersToFreeAgents();
  await clearDraftTable();
  
  console.log('\n🎉 All players have been reset to free agents and draft table cleared!');
  console.log('Ready for a fresh draft simulation.');
}

main().catch(console.error);
