#!/usr/bin/env node

const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });

// Initialize Turso client
const tursoClient = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Get week from command line argument
const week = process.argv[2] ? parseInt(process.argv[2]) : 1;

console.log(`Starting Week ${week} Finalization...`);

async function finalizeWeek(weekNumber) {
  try {
    // Get week matchups
    console.log(`Fetching Week ${weekNumber} matchups...`);
    const matchups = await tursoClient.execute({
      sql: 'SELECT * FROM WeeklyMatchups WHERE Week = ?',
      args: [weekNumber]
    });

    if (!matchups.rows || matchups.rows.length === 0) {
      throw new Error(`No matchups found for Week ${weekNumber}`);
    }

    const weekMatchup = matchups.rows[0];
    console.log(`Week ${weekNumber} matchup data:`, weekMatchup);

    // Calculate scores for each team
    console.log('\nCalculating team scores...');
    const teamScores = {};
    
    // Process each team (Team_1 through Team_16)
    for (let i = 1; i <= 16; i++) {
      const teamId = weekMatchup[`Team_${i}`];
      if (!teamId) continue;

      console.log(`\nProcessing team ${teamId}...`);
      
      // Get team's lineup for this week
      const lineup = await tursoClient.execute({
        sql: 'SELECT * FROM Lineups WHERE owner_ID = ? AND week = ?',
        args: [teamId, weekNumber.toString()]
      });

      if (!lineup.rows || lineup.rows.length === 0) {
        console.log(`No lineup found for team ${teamId} in week ${weekNumber}`);
        teamScores[teamId] = 0;
        continue;
      }

      const teamLineup = lineup.rows[0];
      let teamScore = 0;

      // Calculate score for each position
      const positions = ['QB', 'RB_1', 'WR_1', 'FLEX_1', 'FLEX_2', 'TE', 'K', 'DEF'];
      
      for (const position of positions) {
        const playerId = teamLineup[position];
        if (playerId) {
          // Get player's points for this week
          const playerPoints = await tursoClient.execute({
            sql: `SELECT week_${weekNumber} as points FROM Points WHERE player_ID = ?`,
            args: [playerId]
          });

          if (playerPoints.rows && playerPoints.rows.length > 0) {
            const points = playerPoints.rows[0].points === null ? 0 : (playerPoints.rows[0].points || 0);
            teamScore += points;
            console.log(`  ${position}: Player ${playerId} = ${points} points`);
          } else {
            console.log(`  ${position}: Player ${playerId} = 0 points (not found in Points table)`);
          }
        } else {
          console.log(`  ${position}: No player assigned`);
        }
      }

      teamScores[teamId] = teamScore;
      console.log(`  Total score for team ${teamId}: ${teamScore}`);
    }

    // Process matchups and determine winners
    console.log('\nProcessing matchups and determining winners...');
    const matchupResults = [];

    // Create 8 matchups from the 16 teams
    for (let i = 0; i < 8; i++) {
      const team1Index = i * 2 + 1;
      const team2Index = i * 2 + 2;
      
      const team1Id = weekMatchup[`Team_${team1Index}`];
      const team2Id = weekMatchup[`Team_${team2Index}`];
      
      if (!team1Id || !team2Id) continue;

      const team1Score = teamScores[team1Id] || 0;
      const team2Score = teamScores[team2Id] || 0;
      
      // Determine winner
      let team1Result = 'L';
      let team2Result = 'L';
      
      if (team1Score > team2Score) {
        team1Result = 'W';
        team2Result = 'L';
      } else if (team1Score < team2Score) {
        team1Result = 'L';
        team2Result = 'W';
      } else {
        team1Result = 'T';
        team2Result = 'T';
      }

      matchupResults.push({
        team1Id,
        team1Score,
        team1Result,
        team2Id,
        team2Score,
        team2Result
      });

      console.log(`Matchup ${i + 1}: ${team1Id} (${team1Score}) vs ${team2Id} (${team2Score}) - ${team1Id}: ${team1Result}, ${team2Id}: ${team2Result}`);
    }

    // Update standings for each team
    console.log('\nUpdating team standings...');
    
    for (const result of matchupResults) {
      // Update team 1 standings
      await updateTeamStandings(
        result.team1Id, 
        result.team1Result, 
        result.team1Score, 
        result.team2Score
      );
      
      // Update team 2 standings
      await updateTeamStandings(
        result.team2Id, 
        result.team2Result, 
        result.team2Score, 
        result.team1Score
      );
    }

    // Store weekly scores
    console.log('\nStoring weekly scores...');
    await storeWeeklyScores(weekNumber, teamScores);

    console.log(`\n=== Week ${weekNumber} Finalization Complete ===`);
    console.log(`Processed ${matchupResults.length} matchups`);
    console.log('All team standings and weekly scores have been updated!');

  } catch (error) {
    console.error(`Error finalizing Week ${weekNumber}:`, error);
    throw error;
  }
}

async function updateTeamStandings(teamId, result, pointsFor, pointsAgainst) {
  try {
    // Get current standings for this team
    const currentStandings = await tursoClient.execute({
      sql: 'SELECT * FROM Standings WHERE Team_ID = ?',
      args: [teamId]
    });

    let wins = 0;
    let losses = 0;
    let ties = 0;
    let totalPF = pointsFor;
    let totalPA = pointsAgainst;

    if (currentStandings.rows && currentStandings.rows.length > 0) {
      const current = currentStandings.rows[0];
      wins = current.Wins || 0;
      losses = current.Losses || 0;
      ties = current.Ties || 0;
      totalPF = (current.PF || 0) + pointsFor;
      totalPA = (current.PA || 0) + pointsAgainst;
    }

    // Update based on result
    if (result === 'W') {
      wins += 1;
    } else if (result === 'L') {
      losses += 1;
    } else if (result === 'T') {
      ties += 1;
    }

    // Update or insert standings
    await tursoClient.execute({
      sql: `INSERT OR REPLACE INTO Standings (Team_ID, Wins, Losses, Ties, PF, PA, Division)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [teamId, wins, losses, ties, totalPF, totalPA, teamId.charAt(0)]
    });

    console.log(`Updated standings for ${teamId}: ${wins}W-${losses}L-${ties}T, PF: ${totalPF}, PA: ${totalPA}`);

  } catch (error) {
    console.error(`Error updating standings for team ${teamId}:`, error);
    throw error;
  }
}

async function storeWeeklyScores(week, teamScores) {
  try {
    // Check if WeeklyScores table exists, create if not
    const tableExists = await tursoClient.execute({
      sql: "SELECT name FROM sqlite_master WHERE type='table' AND name='WeeklyScores'"
    });

    if (!tableExists.rows || tableExists.rows.length === 0) {
      // Create WeeklyScores table
      await tursoClient.execute(`
        CREATE TABLE IF NOT EXISTS WeeklyScores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          week INTEGER NOT NULL,
          team_id TEXT NOT NULL,
          score REAL NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(week, team_id)
        )
      `);
      console.log('Created WeeklyScores table');
    }

    // Store scores for this week
    for (const [teamId, score] of Object.entries(teamScores)) {
      await tursoClient.execute({
        sql: `INSERT OR REPLACE INTO WeeklyScores (week, team_id, score)
              VALUES (?, ?, ?)`,
        args: [week, teamId, score]
      });
      console.log(`Stored score for team ${teamId}: ${score}`);
    }

  } catch (error) {
    console.error(`Error storing weekly scores for week ${week}:`, error);
    throw error;
  }
}

// Run the finalization
finalizeWeek(week)
  .then(() => {
    console.log(`Week ${week} finalization completed successfully`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`Week ${week} finalization failed:`, error);
    process.exit(1);
  });
