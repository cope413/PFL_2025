import { NextRequest, NextResponse } from 'next/server';
import { getResults, getCurrentWeek } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Admin access required'
      }, { status: 401 });
    }

    // Get current week
    const currentWeek = await getCurrentWeek();
    
    // Get week status for all weeks
    const weekStatus = await getResults(`
      SELECT 
        week,
        COALESCE(is_finalized, FALSE) as is_finalized,
        COALESCE(finalized_at, NULL) as finalized_at
      FROM (
        SELECT 1 as week UNION ALL
        SELECT 2 UNION ALL
        SELECT 3 UNION ALL
        SELECT 4 UNION ALL
        SELECT 5 UNION ALL
        SELECT 6 UNION ALL
        SELECT 7 UNION ALL
        SELECT 8 UNION ALL
        SELECT 9 UNION ALL
        SELECT 10 UNION ALL
        SELECT 11 UNION ALL
        SELECT 12 UNION ALL
        SELECT 13 UNION ALL
        SELECT 14
      ) all_weeks
      LEFT JOIN WeekStatus ws ON all_weeks.week = ws.week
      ORDER BY week
    `);

    // Get weekly scores for completed weeks
    const weeklyScores = await getResults(`
      SELECT week, team_id, score 
      FROM WeeklyScores 
      ORDER BY week, team_id
    `);

    // Group scores by week
    const scoresByWeek = weeklyScores.reduce((acc: any, score: any) => {
      if (!acc[score.week]) {
        acc[score.week] = [];
      }
      acc[score.week].push({
        teamId: score.team_id,
        score: score.score
      });
      return acc;
    }, {});

    // Get team names for display
    const teamNames = await getResults(`
      SELECT team, COALESCE(team_name, username) as display_name
      FROM user
      WHERE team IS NOT NULL
      ORDER BY team
    `);

    const teamNameMap = teamNames.reduce((acc: any, team: any) => {
      acc[team.team] = team.display_name;
      return acc;
    }, {});

    // Enhance week status with scores and team names
    const enhancedWeekStatus = weekStatus.map((week: any) => ({
      week: week.week,
      isFinalized: week.is_finalized === 1 || week.is_finalized === true,
      finalizedAt: week.finalized_at,
      isCurrentWeek: week.week === currentWeek,
      scores: scoresByWeek[week.week] || [],
      teamNames: teamNameMap
    }));

    return NextResponse.json({
      success: true,
      data: {
        currentWeek,
        weekStatus: enhancedWeekStatus
      },
      message: 'Week status retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting week status:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to get week status'
    }, { status: 500 });
  }
}
