import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getTeamRoster, getDraftedTeamRoster, getNFLTeamOpponentInfo, getCurrentWeek } from '@/lib/database';

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
    const isDraftContext = searchParams.get('draft') === 'true';
    const week = parseInt(searchParams.get('week') || '1');

    if (!teamId) {
      return NextResponse.json({
        success: false,
        error: 'Team ID is required'
      }, { status: 400 });
    }

    // Get players for the specified team - use drafted roster if in draft context
    const players = isDraftContext 
      ? await getDraftedTeamRoster(teamId)
      : await getTeamRoster(teamId);

    // Get unique NFL teams to fetch opponent info efficiently
    const uniqueNFLTeams = [...new Set(players.map(p => p.nflTeam))];
    const opponentInfoMap = new Map();
    
    // Fetch opponent info for all unique teams
    for (const nflTeam of uniqueNFLTeams) {
      try {
        const opponentInfo = await getNFLTeamOpponentInfo(nflTeam, week);
        opponentInfoMap.set(nflTeam, opponentInfo);
      } catch (error) {
        console.error(`Error fetching opponent info for ${nflTeam}:`, error);
        opponentInfoMap.set(nflTeam, null);
      }
    }

    // Get current week for average calculation
    const currentWeek = await getCurrentWeek();
    
    // Transform the data to match the expected format
    const transformedPlayers = players.map((player: any) => {
      // Calculate total points from weeks 1-14
      const weekPoints = [
        Number(player.week_1), Number(player.week_2), Number(player.week_3), Number(player.week_4),
        Number(player.week_5), Number(player.week_6), Number(player.week_7), Number(player.week_8),
        Number(player.week_9), Number(player.week_10), Number(player.week_11), Number(player.week_12),
        Number(player.week_13), Number(player.week_14)
      ];

      // Calculate total points
      const totalPoints = weekPoints.reduce((sum, point) => sum + point, 0);
      
      // Calculate average points as totalPoints / currentWeek
      const averagePoints = currentWeek > 0 
        ? Math.round((totalPoints / currentWeek) * 100) / 100
        : 0;

      // Use real injury status from database, fallback to 'healthy' if not set
      console.log(`Player ${player.name}: injury_status = "${player.injury_status}" (type: ${typeof player.injury_status})`);
      const injuryStatus = player.injury_status || 'healthy';

      // Get opponent information from the map
      const opponentInfo = opponentInfoMap.get(player.nflTeam);

      return {
        id: player.id.toString(),
        name: player.name,
        position: player.position,
        team: player.team,
        nflTeam: player.nflTeam,
        projectedPoints: 0, // Set to 0 since no real data exists
        status: injuryStatus as "healthy" | "questionable" | "doubtful" | "out" | "bye",
        byeWeek: player.byeWeek || undefined,
        teamId: player.team_id,
        ownerId: player.team,
        recentPerformance: [averagePoints], // Use calculated average points
        opponentInfo: opponentInfo // Add opponent information
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