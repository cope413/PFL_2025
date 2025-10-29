import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getResults } from '@/lib/database';

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
    const playerId = searchParams.get('playerId');
    const week = searchParams.get('week');

    if (!playerId || !week) {
      return NextResponse.json({
        success: false,
        error: 'Player ID and week parameters are required'
      }, { status: 400 });
    }

    const weekNum = parseInt(week);
    if (isNaN(weekNum)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid week parameter'
      }, { status: 400 });
    }

    // Fetch player stats from the player_stats table
    const playerStats = await getResults({
      sql: `
        SELECT 
          player_id,
          player_name,
          team_id,
          season_id,
          game_id,
          week,
          pass_yards,
          pass_touchdowns,
          pass_two_pt,
          total_rushes,
          rush_yards,
          rush_touchdowns,
          rush_two_pt,
          receptions,
          receiving_yards,
          rec_touchdowns,
          rec_two_pt,
          extra_point,
          two_point_conversions,
          pass_td_distances,
          rush_td_distances,
          rec_td_distances,
          FG_length
        FROM player_stats 
        WHERE player_id = ? AND week = ?
        ORDER BY game_id DESC
        LIMIT 1
      `,
      args: [parseInt(playerId), weekNum]
    });

    if (!playerStats || playerStats.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No stats found for this player and week'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: playerStats[0]
    });

  } catch (error) {
    console.error('Error fetching player stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch player stats'
    }, { status: 500 });
  }
}
