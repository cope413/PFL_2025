import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getTeamRoster } from '@/lib/database';

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
    const players = await getTeamRoster(teamId);

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