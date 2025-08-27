#!/usr/bin/env node

/**
 * PFL Draft Simulation Script
 * 
 * This script simulates a complete 16-round, 16-team fantasy football draft
 * by automatically making picks for all 256 draft slots using real player data
 * from the database.
 */

const API_BASE = 'http://localhost:3001/api';

// Draft order configuration - matches the DraftRoom component
const DRAFT_ORDER = [
  "A1", "B1", "C1", "D1", "D2", "C2", "B2", "A2",
  "A3", "B3", "C3", "D3", "D4", "C4", "B4", "A4"
];

// Helper function to get the correct team for a specific round and pick
function getDraftOrderForPosition(round, pick) {
  if (round % 2 === 1) {
    // Odd rounds: forward order
    return DRAFT_ORDER[pick - 1];
  } else {
    // Even rounds: reverse order
    return DRAFT_ORDER[DRAFT_ORDER.length - pick];
  }
}

// Fetch available players from the API
async function fetchPlayers() {
  console.log('Fetching available players...');
  const response = await fetch(`${API_BASE}/players`);
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(`Failed to fetch players: ${result.error}`);
  }
  
  // Filter for free agents (owner_ID = "99") and sort by total points
  const availablePlayers = result.data
    .filter(player => player.owner_ID === "99")
    .sort((a, b) => b.totalPoints - a.totalPoints);
    
  console.log(`Found ${availablePlayers.length} available players`);
  return availablePlayers;
}

// Clear the existing draft
async function clearDraft() {
  console.log('Clearing existing draft...');
  const response = await fetch(`${API_BASE}/draft`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'clearDraft'
    }),
  });
  
  const result = await response.json();
  if (!result.success) {
    throw new Error(`Failed to clear draft: ${result.error}`);
  }
  
  console.log('Draft cleared successfully');
}

// Make a draft pick
async function makePick(round, pick, teamId, player) {
  const response = await fetch(`${API_BASE}/draft`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'savePick',
      round,
      pick,
      team_id: teamId,
      player_id: player.id,
      player_name: player.name,
      position: player.position,
      team: player.team
    }),
  });
  
  const result = await response.json();
  if (!result.success) {
    throw new Error(`Failed to save pick: ${result.error}`);
  }
  
  console.log(`✓ Round ${round}, Pick ${pick}: ${teamId} selects ${player.name} (${player.position}, ${player.team}) - ${player.totalPoints.toFixed(1)} pts`);
}

// Smart player selection based on PFL roster requirements
function selectPlayerForTeam(availablePlayers, teamId, round, teamRosters) {
  const teamRoster = teamRosters[teamId] || [];
  const positionCounts = teamRoster.reduce((counts, player) => {
    counts[player.position] = (counts[player.position] || 0) + 1;
    return counts;
  }, {});

  // PFL Roster Requirements:
  // 2 QB, 2 RB, 2 WR, 2 TE, 2 PK, 2 D/ST + 4 flex (QB/RB/WR/TE/PK)
  const requiredPositions = {
    'QB': 2,
    'RB': 2, 
    'WR': 2,
    'TE': 2,
    'PK': 2,
    'D/ST': 2
  };

  const maxPositions = {
    'QB': 6,  // 2 required + 4 flex
    'RB': 6,  // 2 required + 4 flex  
    'WR': 6,  // 2 required + 4 flex
    'TE': 6,  // 2 required + 4 flex
    'PK': 6,  // 2 required + 4 flex
    'D/ST': 2 // Maximum 2 D/ST (cannot be flex)
  };

  // Draft strategy by round
  let positionPriority;
  if (round <= 4) {
    // Rounds 1-4: Focus on RB and WR first
    positionPriority = ['RB', 'WR'];
  } else if (round <= 6) {
    // Rounds 5-6: Add QB and TE
    positionPriority = ['QB', 'TE', 'RB', 'WR'];
  } else if (round <= 12) {
    // Rounds 7-12: Fill remaining skill positions and flex
    positionPriority = ['RB', 'WR', 'TE', 'QB'];
  } else if (round <= 14) {
    // Rounds 13-14: Kickers
    positionPriority = ['PK', 'RB', 'WR', 'TE', 'QB'];
  } else {
    // Rounds 15-16: Defense/Special Teams (REQUIRED)
    positionPriority = ['D/ST'];
  }

  // Special handling for rounds 15-16: MUST draft D/ST
  if (round >= 15) {
    const currentDST = positionCounts['D/ST'] || 0;
    if (currentDST < 2) {
      const dstPlayer = availablePlayers.find(p => p.position === 'D/ST');
      if (dstPlayer) {
        return dstPlayer;
      }
    }
  }

  // First, try to fill required positions
  for (const position of positionPriority) {
    const currentCount = positionCounts[position] || 0;
    const required = requiredPositions[position] || 0;
    const maxAllowed = maxPositions[position] || 0;

    // If we haven't met the requirement for this position
    if (currentCount < required) {
      const player = availablePlayers.find(p => p.position === position);
      if (player) {
        return player;
      }
    }
  }

  // Then fill flex positions (avoiding D/ST for flex)
  const flexPositions = ['QB', 'RB', 'WR', 'TE', 'PK'];
  for (const position of flexPositions) {
    const currentCount = positionCounts[position] || 0;
    const maxAllowed = maxPositions[position] || 0;

    if (currentCount < maxAllowed) {
      const player = availablePlayers.find(p => p.position === position);
      if (player) {
        return player;
      }
    }
  }

  // If no position-based selection, take the best available non-D/ST player
  const nonDefensePlayers = availablePlayers.filter(p => p.position !== 'D/ST');
  return nonDefensePlayers[0] || availablePlayers[0];
}

// Main simulation function
async function simulateDraft() {
  try {
    console.log('🏈 Starting PFL Draft Simulation...\n');

    // Clear existing draft
    await clearDraft();
    
    // Fetch available players
    let availablePlayers = await fetchPlayers();
    
    if (availablePlayers.length === 0) {
      throw new Error('No available players found for draft');
    }

    // Track team rosters for smart drafting
    const teamRosters = {};
    DRAFT_ORDER.forEach(team => {
      teamRosters[team] = [];
    });

    console.log(`\n🎯 Beginning 16-round draft with ${availablePlayers.length} players available...\n`);

    // Simulate all 16 rounds
    for (let round = 1; round <= 16; round++) {
      console.log(`\n--- ROUND ${round} ---`);
      
      for (let pick = 1; pick <= 16; pick++) {
        const teamId = getDraftOrderForPosition(round, pick);
        
        if (availablePlayers.length === 0) {
          console.log(`⚠️  No more players available for Round ${round}, Pick ${pick}`);
          break;
        }

        // Select best player for this team
        const selectedPlayer = selectPlayerForTeam(availablePlayers, teamId, round, teamRosters);
        
        if (!selectedPlayer) {
          console.log(`⚠️  No suitable player found for ${teamId} in Round ${round}, Pick ${pick}`);
          continue;
        }

        // Make the pick
        await makePick(round, pick, teamId, selectedPlayer);
        
        // Update team roster
        teamRosters[teamId].push(selectedPlayer);
        
        // Remove player from available list
        availablePlayers = availablePlayers.filter(p => p.id !== selectedPlayer.id);
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log('\n🎉 Draft simulation completed successfully!');
    console.log('\n📊 Final Team Rosters:');
    
    // Display final rosters
    DRAFT_ORDER.forEach(teamId => {
      const roster = teamRosters[teamId];
      const totalPoints = roster.reduce((sum, player) => sum + player.totalPoints, 0);
      
      console.log(`\n${teamId} (${totalPoints.toFixed(1)} total points):`);
      roster.forEach((player, index) => {
        console.log(`  ${index + 1}. ${player.name} (${player.position}, ${player.team}) - ${player.totalPoints.toFixed(1)} pts`);
      });
    });

    console.log('\n✅ Draft simulation completed! You can now view the results in the draft room.');

  } catch (error) {
    console.error('❌ Draft simulation failed:', error.message);
    process.exit(1);
  }
}

// Handle command line execution
if (require.main === module) {
  console.log('PFL Draft Simulation Script');
  console.log('===========================');
  
  // Check if dev server is running
  fetch(`${API_BASE}/players`)
    .then(() => {
      console.log('✅ Development server is running');
      simulateDraft();
    })
    .catch(() => {
      console.error('❌ Development server is not running on port 3001!');
      console.error('Please start the dev server with: npm run dev');
      process.exit(1);
    });
}

module.exports = { simulateDraft, clearDraft, fetchPlayers };
