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

    if (!teamId) {
      return NextResponse.json({
        success: false,
        error: 'Team ID is required'
      }, { status: 400 });
    }

    // Get players for the specified team with their average points
    const result = await db.execute({
      sql: `
        SELECT
          p.player_ID as id,
          p.player_name as name,
          p.position,
          p.team_name as nflTeam,
          p.owner_ID as team,
          p.team_id,
          COALESCE(n.bye, 0) as byeWeek,
          COALESCE(pts.week_1, 0) as week_1,
          COALESCE(pts.week_2, 0) as week_2,
          COALESCE(pts.week_3, 0) as week_3,
          COALESCE(pts.week_4, 0) as week_4,
          COALESCE(pts.week_5, 0) as week_5,
          COALESCE(pts.week_6, 0) as week_6,
          COALESCE(pts.week_7, 0) as week_7,
          COALESCE(pts.week_8, 0) as week_8,
          COALESCE(pts.week_9, 0) as week_9,
          COALESCE(pts.week_10, 0) as week_10,
          COALESCE(pts.week_11, 0) as week_11,
          COALESCE(pts.week_12, 0) as week_12,
          COALESCE(pts.week_13, 0) as week_13,
          COALESCE(pts.week_14, 0) as week_14
        FROM Players p
        LEFT JOIN NFL_Teams n ON p.team_id = n.team_id
        LEFT JOIN Points pts ON p.player_ID = pts.player_ID
        WHERE p.owner_ID = ?
        ORDER BY p.position, p.player_name
      `,
      args: [teamId]
    });

    const players = result.rows;

    // Transform the data to match the expected format
    const transformedPlayers = players.map((player: any) => {
      // Calculate average points from weeks 1-14
      const weekPoints = [
        Number(player.week_1), Number(player.week_2), Number(player.week_3), Number(player.week_4),
        Number(player.week_5), Number(player.week_6), Number(player.week_7), Number(player.week_8),
        Number(player.week_9), Number(player.week_10), Number(player.week_11), Number(player.week_12),
        Number(player.week_13), Number(player.week_14)
      ];

      // Filter out zero/null values and calculate average
      const validPoints = weekPoints.filter(point => point > 0);

      const averagePoints = validPoints.length > 0
        ? Math.round((validPoints.reduce((sum, point) => sum + point, 0) / validPoints.length) * 100) / 100
        : 0;

      return {
        id: player.id.toString(),
        name: player.name,
        position: player.position,
        team: player.team,
        nflTeam: player.nflTeam,
        projectedPoints: 0, // Set to 0 since no real data exists
        status: 'healthy' as const, // Mock status
        byeWeek: player.byeWeek || undefined,
        teamId: player.team_id,
        ownerId: player.team,
        recentPerformance: [averagePoints] // Use calculated average points
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedPlayers
    });

  } catch (error) {
    console.error('Get Team Roster Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}