import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWeek, getResults, getTeamNameMap } from '@/lib/database';
import { Matchup, ApiResponse } from '@/lib/db-types';

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { teamId } = params;
    
    if (!teamId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Team ID is required'
      }, { status: 400 });
    }

    // Check if WeeklyMatchups table exists
    const tableExists = await getResults(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='WeeklyMatchups'
    `);

    if (!tableExists || tableExists.length === 0) {
      return NextResponse.json<ApiResponse<Matchup[]>>({
        success: true,
        data: [],
        message: 'No matchups available - WeeklyMatchups table not found'
      });
    }

    // Get all weekly matchup data for all weeks in a single query
    const weeklyData = await getResults({
      sql: 'SELECT * FROM WeeklyMatchups ORDER BY Week ASC',
      args: []
    });

    if (!weeklyData || weeklyData.length === 0) {
      return NextResponse.json<ApiResponse<Matchup[]>>({
        success: true,
        data: [],
        message: 'No matchups found'
      });
    }

    // Get team names from user table for mapping (single query)
    const teamNameMap = await getTeamNameMap();
    const currentWeek = await getCurrentWeek();

    // Transform the weekly data into individual matchups for the specific team
    const teamMatchups: Matchup[] = [];

    // Helper function to calculate team score for a given week
    const calculateTeamScore = async (teamId: string, week: number): Promise<{ actual: number, projected: number }> => {
      // Validate week to prevent SQL injection (whitelist approach)
      if (week < 1 || week > 18 || !Number.isInteger(week)) {
        throw new Error(`Invalid week number: ${week}`);
      }

      try {
        // Get the team's lineup for this week
        const lineup = await getResults({
          sql: 'SELECT * FROM Lineups WHERE owner_ID = ? AND week = ?',
          args: [teamId, week.toString()]
        });

        if (!lineup || lineup.length === 0) {
          return { actual: 0, projected: 0 };
        }

        const teamLineup = lineup[0];
        let actualScore = 0;

        // Calculate scores for each position
        const positions = ['QB', 'RB_1', 'WR_1', 'FLEX_1', 'FLEX_2', 'TE', 'K', 'DEF'];
        
        for (const pos of positions) {
          const playerId = teamLineup[pos];
          if (playerId) {
            // Get player's points for this week
            // Note: Column names cannot be parameterized, so we validate week above
            const playerPoints = await getResults({
              sql: `SELECT week_${week} as points FROM Points WHERE player_ID = ?`,
              args: [playerId]
            });

            if (playerPoints && playerPoints.length > 0) {
              const points = playerPoints[0].points === null ? 0 : Math.floor(playerPoints[0].points || 0);
              actualScore += points;
            }
          }
        }

        return { actual: actualScore, projected: 0 };
      } catch (error) {
        console.error(`Error calculating score for team ${teamId} week ${week}:`, error);
        return { actual: 0, projected: 0 };
      }
    };

    // Process all weeks and filter for the specific team
    for (const weekRow of weeklyData) {
      const weekNumber = weekRow.Week;

      // Create 8 matchups from the 16 teams (8 pairs)
      for (let i = 0; i < 8; i++) {
        const team1Index = i * 2 + 1;
        const team2Index = i * 2 + 2;

        const team1Id = weekRow[`Team_${team1Index}`];
        const team2Id = weekRow[`Team_${team2Index}`];

        if (team1Id && team2Id) {
          // Only include matchups where the requested team is involved
          if (team1Id === teamId || team2Id === teamId) {
            // Map team IDs to display names
            const team1Name = teamNameMap.get(team1Id) || team1Id;
            const team2Name = teamNameMap.get(team2Id) || team2Id;

            // Calculate actual scores for both teams
            const team1Scores = await calculateTeamScore(team1Id, weekNumber);
            const team2Scores = await calculateTeamScore(team2Id, weekNumber);

            // Determine if the matchup is complete (for completed weeks)
            const isComplete = weekNumber < currentWeek;

            // Determine result (from team1's perspective)
            let result: 'W' | 'L' | 'T' = 'L';
            if (team1Scores.actual > team2Scores.actual) result = 'W';
            else if (team1Scores.actual === team2Scores.actual) result = 'T';

            teamMatchups.push({
              id: `week${weekNumber}_match${i + 1}`,
              week: weekNumber,
              team1_id: team1Id,
              team2_id: team2Id,
              team1_name: team1Name,
              team2_name: team2Name,
              team1_score: team1Scores.actual,
              team2_score: team2Scores.actual,
              team1_projected: team1Scores.projected,
              team2_projected: team2Scores.projected,
              date: `2024-09-${String(weekNumber + 20).padStart(2, '0')}`, // Mock date based on week
              is_complete: isComplete,
              result: result
            });
          }
        }
      }
    }

    // Sort matchups by week
    teamMatchups.sort((a, b) => a.week - b.week);

    return NextResponse.json<ApiResponse<Matchup[]>>({
      success: true,
      data: teamMatchups,
      message: `Retrieved ${teamMatchups.length} matchups for team ${teamId}`
    });

  } catch (error) {
    console.error('Error fetching team matchups:', error);

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: `Failed to fetch team matchups: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}
