import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Get user from authentication token
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Get team ID from query parameters (optional - if not provided, use user's team)
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId') || authUser.team;
    const week = searchParams.get('week');

    if (!teamId) {
      return NextResponse.json({
        success: false,
        error: 'Team ID is required'
      }, { status: 400 });
    }

    // Get team information from standings
    const teamStandingResult = await db.execute({
      sql: `
        SELECT
          s.Team_ID as teamId,
          COALESCE(u.team_name, u.username) as teamName,
          COALESCE(s.Wins, 0) as wins,
          COALESCE(s.Losses, 0) as losses,
          COALESCE(s.Ties, 0) as ties,
          COALESCE(s.PF, 0.0) as pointsFor,
          COALESCE(s.PA, 0.0) as pointsAgainst,
          COALESCE(s.Division, 'A') as division
        FROM Standings s
        LEFT JOIN user u ON s.Team_ID = u.team
        WHERE s.Team_ID = ?
      `,
      args: [teamId]
    });

    const teamStanding = teamStandingResult.rows[0] as any;

    if (!teamStanding) {
      return NextResponse.json({
        success: false,
        error: 'Team not found in standings'
      }, { status: 404 });
    }

    // Calculate rank
    const allStandingsResult = await db.execute(`
      SELECT
        s.Team_ID,
        COALESCE(s.Wins, 0) as wins,
        COALESCE(s.PF, 0.0) as pointsFor
      FROM Standings s
      ORDER BY s.Wins DESC, s.PF DESC
    `);

    const allStandings = allStandingsResult.rows as any[];
    const rank = allStandings.findIndex(s => s.Team_ID === teamId) + 1;

    const teamInfo = {
      teamId: teamStanding.teamId,
      teamName: teamStanding.teamName,
      record: {
        wins: teamStanding.wins,
        losses: teamStanding.losses,
        ties: teamStanding.ties
      },
      pointsFor: teamStanding.pointsFor,
      pointsAgainst: teamStanding.pointsAgainst,
      rank,
      division: teamStanding.division
    };

    // Get weekly results (mock data for now since we don't have actual weekly scores)
    const weeklyResults = [];

    // Generate mock weekly results for weeks 1-18
    for (let weekNum = 1; weekNum <= 18; weekNum++) {
      // Skip if specific week is requested and doesn't match
      if (week && parseInt(week) !== weekNum) {
        continue;
      }

      // Generate mock opponent
      const opponents = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4'];
      const opponent = opponents[(weekNum - 1) % opponents.length];

      // Get opponent name
      const opponentDataResult = await db.execute({
        sql: `
          SELECT COALESCE(team_name, username) as display_name
          FROM user
          WHERE team = ?
        `,
        args: [opponent]
      });

      const opponentData = opponentDataResult.rows[0] as any;
      const opponentName = opponentData?.display_name || opponent;

      // Generate mock scores
      const teamScore = Math.floor(Math.random() * 50) + 80; // 80-130 range
      const opponentScore = Math.floor(Math.random() * 50) + 80;
      const teamProjected = teamScore + Math.floor(Math.random() * 20) - 10; // ±10 from actual
      const opponentProjected = opponentScore + Math.floor(Math.random() * 20) - 10;

      // Determine result
      let result: 'W' | 'L' | 'T' = 'L';
      if (teamScore > opponentScore) result = 'W';
      else if (teamScore === opponentScore) result = 'T';

      weeklyResults.push({
        week: weekNum,
        opponent,
        opponentName,
        teamScore,
        opponentScore,
        teamProjected,
        opponentProjected,
        result,
        date: `2024-09-${String(weekNum + 20).padStart(2, '0')}`,
        isComplete: weekNum < 5 // Assume weeks 1-4 are complete
      });
    }

    // If specific week requested, return only that week
    if (week) {
      const weekResult = weeklyResults.find(r => r.week === parseInt(week));
      if (!weekResult) {
        return NextResponse.json({
          success: false,
          error: 'Week not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          teamInfo,
          weeklyResult: weekResult
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        teamInfo,
        weeklyResults
      }
    });

  } catch (error) {
    console.error('Get Team Weekly Results Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
