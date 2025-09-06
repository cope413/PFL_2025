import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getLockedPlayersForWeek, getPlayerGameStartTime } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'No authorization token provided'
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired token'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const week = searchParams.get('week');

    if (!week) {
      return NextResponse.json({
        success: false,
        error: 'Week parameter is required'
      }, { status: 400 });
    }

    // Get locked players for this week
    const lockedPlayerIds = await getLockedPlayersForWeek(parseInt(week));

    // Get detailed game info for each locked player
    const lockedPlayersWithGameInfo = await Promise.all(
      lockedPlayerIds.map(async (playerId) => {
        const gameInfo = await getPlayerGameStartTime(playerId, parseInt(week));
        return {
          playerId,
          gameInfo
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        lockedPlayerIds,
        lockedPlayersWithGameInfo
      }
    });

  } catch (error) {
    console.error('Error fetching locked players:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch locked players'
    }, { status: 500 });
  }
}
