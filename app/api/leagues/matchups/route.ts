import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWeek, getResults, getTeamNameMap } from '@/lib/database';
import { Matchup, ApiResponse } from '@/lib/db-types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let week = searchParams.get('week');
    const leagueId = searchParams.get('leagueId') || 'l1'; // Default league ID

    // If no week parameter provided, determine current week
    if (!week) {
      const currentWeek = await getCurrentWeek();
      week = currentWeek.toString();
    }

    // Check if WeeklyMatchups table exists
    const tableExists = await getResults(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='WeeklyMatchups'
    `);

    if (!tableExists || tableExists.length === 0) {
      // If WeeklyMatchups doesn't exist, return empty array
      return NextResponse.json<ApiResponse<Matchup[]>>({
        success: true,
        data: [],
        message: 'No matchups available - WeeklyMatchups table not found'
      });
    }

    // If WeeklyMatchups exists, query it and transform the data
    let query = `SELECT * FROM WeeklyMatchups`;
    const params: any[] = [];

    if (week) {
      query += ' WHERE Week = ?';
      params.push(parseInt(week));
    }

    query += ' ORDER BY Week DESC';

    const weeklyData = await getResults({
      sql: query,
      args: params
    });

    // Get team names from user table for mapping
    const teamNameMap = await getTeamNameMap();

    // Transform the weekly data into individual matchups
    const matchups: Matchup[] = [];

    // Helper function to calculate team score for a given week
    const calculateTeamScore = async (teamId: string, week: number): Promise<{ actual: number, projected: number }> => {
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

    for (const weekRow of weeklyData) {
      const weekNumber = weekRow.Week;

      // Create 8 matchups from the 16 teams (8 pairs)
      for (let i = 0; i < 8; i++) {
        const team1Index = i * 2 + 1;
        const team2Index = i * 2 + 2;

        const team1Id = weekRow[`Team_${team1Index}`];
        const team2Id = weekRow[`Team_${team2Index}`];

        if (team1Id && team2Id) {
          // Map team IDs to display names
          const team1Name = teamNameMap.get(team1Id) || team1Id;
          const team2Name = teamNameMap.get(team2Id) || team2Id;

          // Calculate actual scores for both teams
          const team1Scores = await calculateTeamScore(team1Id, weekNumber);
          const team2Scores = await calculateTeamScore(team2Id, weekNumber);

          // Determine if the matchup is complete (for completed weeks)
          const currentWeek = await getCurrentWeek();
          const isComplete = weekNumber < currentWeek;

          // Determine result (from team1's perspective)
          let result: 'W' | 'L' | 'T' = 'L';
          if (team1Scores.actual > team2Scores.actual) result = 'W';
          else if (team1Scores.actual === team2Scores.actual) result = 'T';

          matchups.push({
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

    // If no matchups found, return empty array
    if (matchups.length === 0) {
      return NextResponse.json<ApiResponse<Matchup[]>>({
        success: true,
        data: [],
        message: `No matchups found for week ${week}`
      });
    }

    return NextResponse.json<ApiResponse<Matchup[]>>({
      success: true,
      data: matchups,
      message: 'Matchups retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching matchups:', error);

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: `Failed to fetch matchups: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}