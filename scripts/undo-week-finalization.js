#!/usr/bin/env node

const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });

// Initialize Turso client
const tursoClient = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Get week from command line argument
const week = process.argv[2] ? parseInt(process.argv[2]) : 4;

console.log(`Starting Week ${week} Finalization Undo...`);

async function undoWeekFinalization(weekNumber) {
  try {
    console.log(`\n=== Undoing Week ${weekNumber} Finalization ===`);
    
    // 1. Remove week from WeekStatus table
    console.log(`\n1. Removing week ${weekNumber} from WeekStatus...`);
    await tursoClient.execute({
      sql: 'DELETE FROM WeekStatus WHERE week = ?',
      args: [weekNumber]
    });
    console.log(`✓ Week ${weekNumber} removed from WeekStatus`);

    // 2. Remove weekly scores for this week
    console.log(`\n2. Removing weekly scores for week ${weekNumber}...`);
    await tursoClient.execute({
      sql: 'DELETE FROM WeeklyScores WHERE week = ?',
      args: [weekNumber]
    });
    console.log(`✓ Weekly scores for week ${weekNumber} removed`);

    // 3. Get the week's matchup data to determine which teams played
    console.log(`\n3. Getting matchup data for week ${weekNumber}...`);
    const matchups = await tursoClient.execute({
      sql: 'SELECT * FROM WeeklyMatchups WHERE Week = ?',
      args: [weekNumber]
    });

    if (!matchups.rows || matchups.rows.length === 0) {
      throw new Error(`No matchups found for Week ${weekNumber}`);
    }

    const weekMatchup = matchups.rows[0];
    console.log(`Week ${weekNumber} matchup data:`, weekMatchup);

    // 4. Get all teams that played this week
    const teamsPlayed = [];
    for (let i = 1; i <= 16; i++) {
      const teamId = weekMatchup[`Team_${i}`];
      if (teamId) {
        teamsPlayed.push(teamId);
      }
    }
    console.log(`Teams that played in week ${weekNumber}:`, teamsPlayed);

    // 5. Revert standings for all teams that played this week
    console.log(`\n4. Reverting standings for teams that played in week ${weekNumber}...`);
    
    for (const teamId of teamsPlayed) {
      await revertTeamStandings(teamId, weekNumber);
    }

    console.log(`\n=== Week ${weekNumber} Finalization Undo Complete ===`);
    console.log(`✓ Week ${weekNumber} is now unfinalized`);
    console.log(`✓ All weekly scores removed`);
    console.log(`✓ Standings reverted for all teams that played`);
    console.log(`\nYou can now correct the scores and re-finalize week ${weekNumber}`);

  } catch (error) {
    console.error(`Error undoing Week ${weekNumber} finalization:`, error);
    throw error;
  }
}

async function revertTeamStandings(teamId, weekNumber) {
  try {
    console.log(`\nReverting standings for team ${teamId}...`);
    
    // Get current standings
    const currentStandings = await tursoClient.execute({
      sql: 'SELECT * FROM Standings WHERE Team_ID = ?',
      args: [teamId]
    });

    if (!currentStandings.rows || currentStandings.rows.length === 0) {
      console.log(`  No standings found for team ${teamId}, skipping...`);
      return;
    }

    const current = currentStandings.rows[0];
    console.log(`  Current standings: ${current.Wins}W-${current.Losses}L-${current.Ties}T, PF: ${current.PF}, PA: ${current.PA}`);

    // We need to determine what the standings were BEFORE this week
    // Since we don't have historical data, we'll need to recalculate from scratch
    // by going through all finalized weeks except this one
    
    let wins = 0;
    let losses = 0;
    let ties = 0;
    let totalPF = 0;
    let totalPA = 0;

    // Get all finalized weeks except the one we're undoing
    const finalizedWeeks = await tursoClient.execute({
      sql: 'SELECT week FROM WeekStatus WHERE is_finalized = 1 AND week != ? ORDER BY week',
      args: [weekNumber]
    });

    console.log(`  Recalculating standings from ${finalizedWeeks.rows.length} finalized weeks...`);

    // Recalculate standings from all other finalized weeks
    for (const weekRow of finalizedWeeks.rows) {
      const otherWeek = weekRow.week;
      await recalculateWeekForTeam(teamId, otherWeek, { wins, losses, ties, totalPF, totalPA });
    }

    // Update standings with recalculated values
    await tursoClient.execute({
      sql: `UPDATE Standings 
            SET Wins = ?, Losses = ?, Ties = ?, PF = ?, PA = ?
            WHERE Team_ID = ?`,
      args: [wins, losses, ties, totalPF, totalPA, teamId]
    });

    console.log(`  ✓ Reverted standings for ${teamId}: ${wins}W-${losses}L-${ties}T, PF: ${totalPF}, PA: ${totalPA}`);

  } catch (error) {
    console.error(`Error reverting standings for team ${teamId}:`, error);
    throw error;
  }
}

async function recalculateWeekForTeam(teamId, weekNumber, standings) {
  try {
    // Get the week's matchup data
    const matchups = await tursoClient.execute({
      sql: 'SELECT * FROM WeeklyMatchups WHERE Week = ?',
      args: [weekNumber]
    });

    if (!matchups.rows || matchups.rows.length === 0) {
      return;
    }

    const weekMatchup = matchups.rows[0];

    // Find which matchup this team was in
    let team1Id = null;
    let team2Id = null;
    let team1Score = 0;
    let team2Score = 0;

    for (let i = 0; i < 8; i++) {
      const team1Index = i * 2 + 1;
      const team2Index = i * 2 + 2;
      
      const t1Id = weekMatchup[`Team_${team1Index}`];
      const t2Id = weekMatchup[`Team_${team2Index}`];
      
      if (t1Id === teamId || t2Id === teamId) {
        team1Id = t1Id;
        team2Id = t2Id;
        
        // Get scores for this matchup
        const scores = await tursoClient.execute({
          sql: 'SELECT team_id, score FROM WeeklyScores WHERE week = ? AND (team_id = ? OR team_id = ?)',
          args: [weekNumber, t1Id, t2Id]
        });

        for (const scoreRow of scores.rows) {
          if (scoreRow.team_id === t1Id) {
            team1Score = scoreRow.score;
          } else if (scoreRow.team_id === t2Id) {
            team2Score = scoreRow.score;
          }
        }
        break;
      }
    }

    if (team1Id && team2Id) {
      // Determine result for this team
      let result = 'L';
      let pointsFor = 0;
      let pointsAgainst = 0;

      if (teamId === team1Id) {
        pointsFor = team1Score;
        pointsAgainst = team2Score;
        if (team1Score > team2Score) result = 'W';
        else if (team1Score === team2Score) result = 'T';
      } else {
        pointsFor = team2Score;
        pointsAgainst = team1Score;
        if (team2Score > team1Score) result = 'W';
        else if (team2Score === team1Score) result = 'T';
      }

      // Update standings
      if (result === 'W') standings.wins += 1;
      else if (result === 'L') standings.losses += 1;
      else if (result === 'T') standings.ties += 1;
      
      standings.totalPF += pointsFor;
      standings.totalPA += pointsAgainst;
    }

  } catch (error) {
    console.error(`Error recalculating week ${weekNumber} for team ${teamId}:`, error);
  }
}

// Run the undo finalization
undoWeekFinalization(week)
  .then(() => {
    console.log(`Week ${week} finalization undo completed successfully`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`Week ${week} finalization undo failed:`, error);
    process.exit(1);
  });


