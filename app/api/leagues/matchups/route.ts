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
      // If WeeklyMatchups doesn't exist, return mock data with real team names

      const teamNameMap = await getTeamNameMap();

      const mockMatchups: Matchup[] = [
        {
          id: 'm1',
          week: parseInt(week),
          team1_id: 'A1',
          team2_id: 'A2',
          team1_name: teamNameMap.get('A1') || 'A1',
          team2_name: teamNameMap.get('A2') || 'A2',
          team1_score: 124.2,
          team2_score: 98.7,
          team1_projected: 120.0,
          team2_projected: 105.0,
          date: '2024-09-22',
          is_complete: true
        },
        {
          id: 'm2',
          week: parseInt(week),
          team1_id: 'A3',
          team2_id: 'A4',
          team1_name: teamNameMap.get('A3') || 'A3',
          team2_name: teamNameMap.get('A4') || 'A4',
          team1_score: 0,
          team2_score: 0,
          team1_projected: 115.5,
          team2_projected: 110.2,
          date: '2024-09-22',
          is_complete: false
        },
        {
          id: 'm3',
          week: parseInt(week),
          team1_id: 'B1',
          team2_id: 'B2',
          team1_name: teamNameMap.get('B1') || 'B1',
          team2_name: teamNameMap.get('B2') || 'B2',
          team1_score: 0,
          team2_score: 0,
          team1_projected: 118.3,
          team2_projected: 112.7,
          date: '2024-09-22',
          is_complete: false
        },
        {
          id: 'm4',
          week: parseInt(week),
          team1_id: 'B3',
          team2_id: 'B4',
          team1_name: teamNameMap.get('B3') || 'B3',
          team2_name: teamNameMap.get('B4') || 'B4',
          team1_score: 0,
          team2_score: 0,
          team1_projected: 106.8,
          team2_projected: 109.4,
          date: '2024-09-22',
          is_complete: false
        }
      ];

      return NextResponse.json<ApiResponse<Matchup[]>>({
        success: true,
        data: mockMatchups,
        message: 'Mock matchups retrieved (WeeklyMatchups table not found)'
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

    // If no matchups found, return mock data
    if (matchups.length === 0) {
      const mockMatchups: Matchup[] = [
        {
          id: 'm1',
          week: parseInt(week),
          team1_id: 't1',
          team2_id: 't2',
          team1_name: 'The Touchdown Titans',
          team2_name: 'Team A2',
          team1_score: 124.2,
          team2_score: 98.7,
          team1_projected: 120.0,
          team2_projected: 105.0,
          date: '2024-09-22',
          is_complete: true
        },
        {
          id: 'm2',
          week: parseInt(week),
          team1_id: 't3',
          team2_id: 't4',
          team1_name: 'Team A3',
          team2_name: 'Team A4',
          team1_score: 0,
          team2_score: 0,
          team1_projected: 115.5,
          team2_projected: 110.2,
          date: '2024-09-22',
          is_complete: false
        },
        {
          id: 'm3',
          week: parseInt(week),
          team1_id: 't5',
          team2_id: 't6',
          team1_name: 'Team B1',
          team2_name: 'Team B2',
          team1_score: 0,
          team2_score: 0,
          team1_projected: 118.3,
          team2_projected: 112.7,
          date: '2024-09-22',
          is_complete: false
        },
        {
          id: 'm4',
          week: parseInt(week),
          team1_id: 't7',
          team2_id: 't8',
          team1_name: 'Team B3',
          team2_name: 'Team B4',
          team1_score: 0,
          team2_score: 0,
          team1_projected: 106.8,
          team2_projected: 109.4,
          date: '2024-09-22',
          is_complete: false
        }
      ];



      return NextResponse.json({
        success: true,
        data: mockMatchups,
        message: `Mock matchups retrieved (no data in WeeklyMatchups table)`
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