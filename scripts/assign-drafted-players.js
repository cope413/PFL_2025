#!/usr/bin/env node

/**
 * PFL Draft Player Assignment Script
 * 
 * This script reads the completed draft picks from the Draft table
 * and assigns player ownership in the Players table to reflect
 * the draft results on team dashboards.
 */

const API_BASE = 'http://localhost:3001/api';

// Get all draft picks
async function getDraftPicks() {
  console.log('Fetching draft picks...');
  const response = await fetch(`${API_BASE}/draft`);
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(`Failed to fetch draft picks: ${result.error}`);
  }
  
  const completedPicks = result.data.picks.filter(pick => pick.player_id && pick.player_id.trim() !== '');
  console.log(`Found ${completedPicks.length} completed draft picks`);
  return completedPicks;
}

// Update player ownership via admin API
async function updatePlayerOwnership(playerId, teamId, playerName) {
  try {
    // First get the current player data
    const getResponse = await fetch(`${API_BASE}/admin/players`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    
    if (!getResponse.ok) {
      throw new Error(`Failed to fetch players: ${getResponse.status}`);
    }
    
    const playersResult = await getResponse.json();
    const player = playersResult.data.find(p => p.player_ID === playerId);
    
    if (!player) {
      console.log(`⚠️  Player ${playerId} (${playerName}) not found in database`);
      return false;
    }

    // Update the player with the new ownership
    const updateResponse = await fetch(`${API_BASE}/admin/players`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        playerId: playerId,
        name: player.name,
        position: player.position,
        team: player.nfl_team,
        nflTeam: player.nfl_team,
        ownerId: teamId,
        weeklyStats: {
          week1: player.week1 || 0,
          week2: player.week2 || 0,
          week3: player.week3 || 0,
          week4: player.week4 || 0,
          week5: player.week5 || 0,
          week6: player.week6 || 0,
          week7: player.week7 || 0,
          week8: player.week8 || 0,
          week9: player.week9 || 0,
          week10: player.week10 || 0,
          week11: player.week11 || 0,
          week12: player.week12 || 0,
          week13: player.week13 || 0,
          week14: player.week14 || 0
        }
      })
    });
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Update failed: ${errorData.error || updateResponse.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to update ${playerName} (${playerId}) -> ${teamId}:`, error.message);
    return false;
  }
}

// Get auth token (simplified - in production this should be more secure)
function getAuthToken() {
  // For dev purposes, we'll need to get a valid admin token
  // This is a placeholder - you'd need to implement proper auth
  return 'admin_token_placeholder';
}

// Direct database update approach
async function updatePlayerOwnershipDirect(playerId, teamId, playerName) {
  try {
    const response = await fetch(`${API_BASE}/admin/players`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'updateOwnership',
        playerId: playerId,
        ownerId: teamId
      })
    });
    
    if (response.ok) {
      return true;
    } else {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`❌ Failed to update ${playerName} (${playerId}) -> ${teamId}:`, errorData.error);
      return false;
    }
  } catch (error) {
    console.error(`❌ Failed to update ${playerName} (${playerId}) -> ${teamId}:`, error.message);
    return false;
  }
}

// Main assignment function
async function assignDraftedPlayers() {
  try {
    console.log('🏈 Starting Player Assignment from Draft Results...\n');

    // Get all completed draft picks
    const draftPicks = await getDraftPicks();
    
    if (draftPicks.length === 0) {
      console.log('No completed draft picks found');
      return;
    }

    console.log(`\n📋 Assigning ${draftPicks.length} players to their teams...\n`);

    let successCount = 0;
    let failCount = 0;

    // Process each draft pick
    for (const pick of draftPicks) {
      const { player_id, team_id, player_name, position, round, pick: pickNum } = pick;
      
      console.log(`Round ${round}, Pick ${pickNum}: Assigning ${player_name} (${position}) to ${team_id}...`);
      
      // For now, we'll use a direct database approach via a custom endpoint
      // This is simpler than trying to authenticate as admin
      const success = await assignPlayerDirectly(player_id, team_id, player_name);
      
      if (success) {
        successCount++;
        console.log(`✅ ${player_name} assigned to ${team_id}`);
      } else {
        failCount++;
      }
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log(`\n🎉 Assignment completed!`);
    console.log(`✅ Successfully assigned: ${successCount} players`);
    console.log(`❌ Failed assignments: ${failCount} players`);
    
    if (failCount === 0) {
      console.log('\n🏆 All players successfully assigned! Team dashboards should now show drafted players.');
    }

  } catch (error) {
    console.error('❌ Player assignment failed:', error.message);
    process.exit(1);
  }
}

// Direct assignment using SQL update
async function assignPlayerDirectly(playerId, teamId, playerName) {
  try {
    // We'll create a simple endpoint to update player ownership
    const response = await fetch(`${API_BASE}/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'assignPlayer',
        player_id: playerId,
        team_id: teamId
      }),
    });
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error(`Error assigning ${playerName}:`, error.message);
    return false;
  }
}

// Handle command line execution
if (require.main === module) {
  console.log('PFL Draft Player Assignment Script');
  console.log('==================================');
  
  // Check if dev server is running
  fetch(`${API_BASE}/draft`)
    .then(() => {
      console.log('✅ Development server is running');
      assignDraftedPlayers();
    })
    .catch(() => {
      console.error('❌ Development server is not running on port 3001!');
      console.error('Please start the dev server with: npm run dev');
      process.exit(1);
    });
}

module.exports = { assignDraftedPlayers };
