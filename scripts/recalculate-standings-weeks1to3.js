#!/usr/bin/env node

const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });

// Initialize Turso client
const tursoClient = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

console.log(`Starting Standings Recalculation from Weeks 1-3...`);

async function recalculateStandingsFromWeeks1to3() {
  try {
    console.log(`\n=== Recalculating Standings from Weeks 1-3 ===`);
    
    // Get all teams
    const teams = await tursoClient.execute({
      sql: 'SELECT team FROM user WHERE team IS NOT NULL ORDER BY team'
    });

    if (!teams.rows || teams.rows.length === 0) {
      throw new Error('No teams found');
    }

    console.log(`Found ${teams.rows.length} teams:`, teams.rows.map(t => t.team));

    // Initialize standings for all teams
    const teamStandings = {};
    for (const team of teams.rows) {
      teamStandings[team.team] = {
        wins: 0,
        losses: 0,
        ties: 0,
        pointsFor: 0,
        pointsAgainst: 0
      };
    }

    // Process each finalized week (1-3)
    for (let week = 1; week <= 3; week++) {
      console.log(`\nProcessing Week ${week}...`);
      
      // Get week matchups
      const matchups = await tursoClient.execute({
        sql: 'SELECT * FROM WeeklyMatchups WHERE Week = ?',
        args: [week]
      });

      if (!matchups.rows || matchups.rows.length === 0) {
        console.log(`  No matchups found for Week ${week}`);
        continue;
      }

      const weekMatchup = matchups.rows[0];
      
      // Process each matchup (8 matchups per week)
      for (let i = 0; i < 8; i++) {
        const team1Index = i * 2 + 1;
        const team2Index = i * 2 + 2;
        
        const team1Id = weekMatchup[`Team_${team1Index}`];
        const team2Id = weekMatchup[`Team_${team2Index}`];
        
        if (!team1Id || !team2Id) continue;

        // Get scores for this matchup
        const scores = await tursoClient.execute({
          sql: 'SELECT team_id, score FROM WeeklyScores WHERE week = ? AND (team_id = ? OR team_id = ?)',
          args: [week, team1Id, team2Id]
        });

        let team1Score = 0;
        let team2Score = 0;

        for (const scoreRow of scores.rows) {
          if (scoreRow.team_id === team1Id) {
            team1Score = scoreRow.score;
          } else if (scoreRow.team_id === team2Id) {
            team2Score = scoreRow.score;
          }
        }

        // Determine results
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

        // Update standings
        if (team1Result === 'W') teamStandings[team1Id].wins += 1;
        else if (team1Result === 'L') teamStandings[team1Id].losses += 1;
        else if (team1Result === 'T') teamStandings[team1Id].ties += 1;

        if (team2Result === 'W') teamStandings[team2Id].wins += 1;
        else if (team2Result === 'L') teamStandings[team2Id].losses += 1;
        else if (team2Result === 'T') teamStandings[team2Id].ties += 1;

        teamStandings[team1Id].pointsFor += team1Score;
        teamStandings[team1Id].pointsAgainst += team2Score;
        teamStandings[team2Id].pointsFor += team2Score;
        teamStandings[team2Id].pointsAgainst += team1Score;

        console.log(`  Matchup ${i + 1}: ${team1Id} (${team1Score}) vs ${team2Id} (${team2Score}) - ${team1Id}: ${team1Result}, ${team2Id}: ${team2Result}`);
      }
    }

    // Update standings in database
    console.log(`\nUpdating standings in database...`);
    
    for (const [teamId, standings] of Object.entries(teamStandings)) {
      await tursoClient.execute({
        sql: `INSERT OR REPLACE INTO Standings (Team_ID, Wins, Losses, Ties, PF, PA, Division)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          teamId, 
          standings.wins, 
          standings.losses, 
          standings.ties, 
          standings.pointsFor, 
          standings.pointsAgainst, 
          teamId.charAt(0)
        ]
      });

      console.log(`  ${teamId}: ${standings.wins}W-${standings.losses}L-${standings.ties}T, PF: ${standings.pointsFor}, PA: ${standings.pointsAgainst}`);
    }

    console.log(`\n=== Standings Recalculation Complete ===`);
    console.log(`✓ All team standings updated based on weeks 1-3`);

  } catch (error) {
    console.error(`Error recalculating standings:`, error);
    throw error;
  }
}

// Run the recalculation
recalculateStandingsFromWeeks1to3()
  .then(() => {
    console.log(`Standings recalculation completed successfully`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`Standings recalculation failed:`, error);
    process.exit(1);
  });


