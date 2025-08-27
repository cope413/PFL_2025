#!/usr/bin/env node

/**
 * PFL Corrected Draft Simulation Script
 * 
 * This script simulates a complete 16-round, 16-team fantasy football draft
 * following the exact roster requirements:
 * - 2 QB, 2 RB, 2 WR, 2 TE, 2 PK, 2 D/ST (12 required positions)
 * - 4 flex picks (QB, RB, WR, TE, or PK) 
 * - Maximum 2 D/ST per team
 * - Total: 16 players per team
 */

const API_BASE = 'http://localhost:3001/api';

// Draft order configuration - matches the DraftRoom component
const DRAFT_ORDER = [
  "A1", "B1", "C1", "D1", "D2", "C2", "B2", "A2",
  "A3", "B3", "C3", "D3", "D4", "C4", "B4", "A4"
];

// Position requirements per team
const REQUIRED_POSITIONS = {
  'QB': 2,
  'RB': 2, 
  'WR': 2,
  'TE': 2,
  'PK': 2,
  'D/ST': 2
};

const MAX_POSITIONS = {
  'QB': 4,   // 2 required + up to 2 flex
  'RB': 6,   // 2 required + up to 4 flex  
  'WR': 6,   // 2 required + up to 4 flex
  'TE': 4,   // 2 required + up to 2 flex
  'PK': 4,   // 2 required + up to 2 flex
  'D/ST': 2  // Maximum 2, cannot be flex
};

// Flex-eligible positions (D/ST cannot be used as flex)
const FLEX_POSITIONS = ['QB', 'RB', 'WR', 'TE', 'PK'];

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
async function getAvailablePlayers() {
  const response = await fetch(`${API_BASE}/players`);
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(`Failed to fetch players: ${result.error}`);
  }
  
  // Filter for free agents (owner_ID = "99") and sort by total points
  const availablePlayers = result.data
    .filter(player => player.owner_ID === "99")
    .sort((a, b) => b.totalPoints - a.totalPoints);
  
  return availablePlayers;
}

// Smart player selection based on team needs and value
function selectPlayerForTeam(availablePlayers, teamId, round, teamRosters) {
  const teamRoster = teamRosters[teamId] || [];
  const positionCounts = teamRoster.reduce((counts, player) => {
    counts[player.position] = (counts[player.position] || 0) + 1;
    return counts;
  }, {});

  // Calculate how many players the team has drafted so far
  const totalDrafted = teamRoster.length;

  // Define the exact drafting strategy for perfect roster composition
  let positionPriority = [];

  if (totalDrafted < 12) {
    // Rounds 1-12: Fill the required positions (2 each of QB, RB, WR, TE, PK, D/ST)
    // Priority order: fill each requirement but spread them out sensibly
    
    const requiredNeeded = [];
    for (const [position, required] of Object.entries(REQUIRED_POSITIONS)) {
      const current = positionCounts[position] || 0;
      if (current < required) {
        requiredNeeded.push(position);
      }
    }

    if (requiredNeeded.length > 0) {
      // Early rounds: prefer skill positions
      if (round <= 4) {
        positionPriority = requiredNeeded.filter(p => ['RB', 'WR'].includes(p));
      } else if (round <= 6) {
        positionPriority = requiredNeeded.filter(p => ['QB', 'TE', 'RB', 'WR'].includes(p));
      } else if (round <= 10) {
        positionPriority = requiredNeeded.filter(p => ['QB', 'RB', 'WR', 'TE'].includes(p));
      } else {
        // Rounds 11-12: Must fill remaining requirements including PK and D/ST
        positionPriority = requiredNeeded;
      }
      
      // If no priority positions available, take any required position
      if (positionPriority.length === 0) {
        positionPriority = requiredNeeded;
      }
    }
  } else {
    // Rounds 13-16: Fill flex positions (4 remaining spots)
    // Flex can be QB, RB, WR, TE, or PK (not D/ST)
    // Use a balanced approach for flex picks
    const flexNeeded = 16 - totalDrafted; // How many flex spots left
    
    if (flexNeeded > 0) {
      // Prioritize positions that could use depth, with some variety
      positionPriority = FLEX_POSITIONS.filter(position => {
        const current = positionCounts[position] || 0;
        return current < MAX_POSITIONS[position];
      });
      
      // For better distribution, prefer positions with fewer players first
      positionPriority.sort((a, b) => {
        const aCount = positionCounts[a] || 0;
        const bCount = positionCounts[b] || 0;
        return aCount - bCount;
      });
    }
  }

  // Find the best available player for priority positions
  for (const position of positionPriority) {
    const player = availablePlayers.find(p => p.position === position);
    if (player) {
      return player;
    }
  }

  // Fallback: pick the best available player that fits roster limits
  for (const player of availablePlayers) {
    const currentCount = positionCounts[player.position] || 0;
    const maxAllowed = MAX_POSITIONS[player.position] || 0;
    
    if (currentCount < maxAllowed) {
      return player;
    }
  }

  // Last resort: return the first available player (shouldn't happen with proper data)
  return availablePlayers[0];
}

// Make a draft pick via API
async function makeDraftPick(round, pick, player, teamId) {
  const response = await fetch(`${API_BASE}/draft`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'savePick',
      round: round,
      pick: pick,
      player_id: player.id,
      team_id: teamId,
      player_name: player.name,
      position: player.position,
      team: player.team
    }),
  });
  
  const result = await response.json();
  if (!result.success) {
    throw new Error(`Failed to save pick: ${result.error}`);
  }
}

// Assign player to team (update ownership)
async function assignPlayerToTeam(playerId, teamId) {
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
  if (!result.success) {
    throw new Error(`Failed to assign player: ${result.error}`);
  }
}

// Main draft simulation
async function simulateDraft() {
  console.log('🏈 Starting PFL Draft Simulation with Correct Roster Requirements...\n');

  let availablePlayers = await getAvailablePlayers();
  console.log(`📊 ${availablePlayers.length} players available for draft\n`);

  // Track each team's roster
  const teamRosters = {};
  DRAFT_ORDER.forEach(team => {
    teamRosters[team] = [];
  });

  // Simulate all 16 rounds
  for (let round = 1; round <= 16; round++) {
    console.log(`--- ROUND ${round} ---`);
    
    for (let pick = 1; pick <= 16; pick++) {
      const teamId = getDraftOrderForPosition(round, pick);
      
      // Select best player for this team
      const selectedPlayer = selectPlayerForTeam(availablePlayers, teamId, round, teamRosters);
      
      if (!selectedPlayer) {
        console.error(`❌ No available players for team ${teamId} in round ${round}, pick ${pick}`);
        continue;
      }

      // Calculate overall pick number
      const overallPick = (round - 1) * 16 + pick;
      
      console.log(`Pick ${overallPick} (R${round}P${pick}): Team ${teamId} selects ${selectedPlayer.name} (${selectedPlayer.position})`);
      
      try {
        // Make the draft pick
        await makeDraftPick(round, overallPick, selectedPlayer, teamId);
        
        // Assign player to team
        await assignPlayerToTeam(selectedPlayer.id, teamId);
        
        // Update our tracking
        teamRosters[teamId].push(selectedPlayer);
        
        // Remove from available players
        availablePlayers = availablePlayers.filter(p => p.id !== selectedPlayer.id);
        
      } catch (error) {
        console.error(`❌ Error making pick for team ${teamId}:`, error.message);
        continue;
      }
    }
    console.log(); // Empty line between rounds
  }

  // Display final roster summary
  console.log('\n🎉 DRAFT COMPLETE! Final Roster Summary:');
  console.log('=' .repeat(60));
  
  for (const teamId of DRAFT_ORDER) {
    const roster = teamRosters[teamId];
    const positionCounts = roster.reduce((counts, player) => {
      counts[player.position] = (counts[player.position] || 0) + 1;
      return counts;
    }, {});
    
    console.log(`Team ${teamId}: ${roster.length} players`);
    console.log(`  QB: ${positionCounts.QB || 0}, RB: ${positionCounts.RB || 0}, WR: ${positionCounts.WR || 0}`);
    console.log(`  TE: ${positionCounts.TE || 0}, PK: ${positionCounts.PK || 0}, D/ST: ${positionCounts['D/ST'] || 0}`);
    
    // Check requirements
    const violations = [];
    Object.entries(REQUIRED_POSITIONS).forEach(([pos, req]) => {
      const actual = positionCounts[pos] || 0;
      if (actual < req) violations.push(`${pos}: need ${req}, have ${actual}`);
    });
    
    if (violations.length > 0) {
      console.log(`  ⚠️  Violations: ${violations.join(', ')}`);
    } else {
      console.log(`  ✅ All requirements met`);
    }
    console.log();
  }

  console.log(`📊 ${availablePlayers.length} players remain as free agents`);
}

// Main execution
async function main() {
  // Check if server is running
  try {
    await fetch(`${API_BASE}/players`);
  } catch (error) {
    console.error('❌ Development server is not running on port 3001!');
    console.error('Please start the dev server with: npm run dev');
    process.exit(1);
  }

  await simulateDraft();
}

main().catch(console.error);
