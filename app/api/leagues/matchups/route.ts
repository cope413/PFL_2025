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

    weeklyData.forEach((weekRow) => {
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

          matchups.push({
            id: `week${weekNumber}_match${i + 1}`,
            week: weekNumber,
            team1_id: team1Id,
            team2_id: team2Id,
            team1_name: team1Name,
            team2_name: team2Name,
            team1_score: 0, // These would need to come from a separate scores table
            team2_score: 0,
            team1_projected: 0,
            team2_projected: 0,
            date: `2024-09-${String(weekNumber + 20).padStart(2, '0')}`, // Mock date based on week
            is_complete: false
          });
        }
      }
    });

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