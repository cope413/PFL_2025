import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getResults, updatePlayerInjuryStatus, resetAllPlayersToHealthy } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const authUser = getUserFromRequest(request);
    if (!authUser || !authUser.is_admin) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    if (playerId) {
      // Get specific player's injury status
      const player = await getResults({
        sql: `
          SELECT player_ID, player_name, team_name, injury_status 
          FROM Players 
          WHERE player_ID = ?
        `,
        args: [playerId]
      });

      if (player.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Player not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: player[0]
      });
    } else {
      // Get all players with injury status
      const players = await getResults({
        sql: `
          SELECT player_ID, player_name, team_name, injury_status 
          FROM Players 
          WHERE owner_ID != 99 
          ORDER BY injury_status DESC, player_name
        `
      });

      // Group by status
      const statusGroups = players.reduce((acc: any, player: any) => {
        const status = player.injury_status || 'healthy';
        if (!acc[status]) {
          acc[status] = [];
        }
        acc[status].push(player);
        return acc;
      }, {});

      return NextResponse.json({
        success: true,
        data: {
          players,
          statusGroups,
          summary: Object.keys(statusGroups).map(status => ({
            status,
            count: statusGroups[status].length
          }))
        }
      });
    }

  } catch (error) {
    console.error('Get Injury Status Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check if user is admin
    const authUser = getUserFromRequest(request);
    if (!authUser || !authUser.is_admin) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    const body = await request.json();
    const { playerId, status } = body;

    if (!playerId || !status) {
      return NextResponse.json({
        success: false,
        error: 'Player ID and status are required'
      }, { status: 400 });
    }

    const validStatuses = ['healthy', 'questionable', 'doubtful', 'out'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      }, { status: 400 });
    }

    // Update player's injury status
    const result = await updatePlayerInjuryStatus(playerId, status);

    if (result.rowsAffected === 0) {
      return NextResponse.json({
        success: false,
        error: 'Player not found'
      }, { status: 404 });
    }

    // Get updated player info
    const updatedPlayer = await getResults({
      sql: `
        SELECT player_ID, player_name, team_name, injury_status 
        FROM Players 
        WHERE player_ID = ?
      `,
      args: [playerId]
    });

    return NextResponse.json({
      success: true,
      data: updatedPlayer[0],
      message: `Player injury status updated to ${status}`
    });

  } catch (error) {
    console.error('Update Injury Status Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const authUser = getUserFromRequest(request);
    if (!authUser || !authUser.is_admin) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'reset_all_healthy') {
      // Reset all players to healthy status
      const result = await resetAllPlayersToHealthy();

      return NextResponse.json({
        success: true,
        message: `Reset ${result.rowsAffected} players to healthy status`
      });
    }

    if (action === 'bulk_update') {
      const { updates } = body;
      
      if (!Array.isArray(updates)) {
        return NextResponse.json({
          success: false,
          error: 'Updates must be an array'
        }, { status: 400 });
      }

      let updatedCount = 0;
      for (const update of updates) {
        if (update.playerId && update.status) {
          const validStatuses = ['healthy', 'questionable', 'doubtful', 'out'];
          if (validStatuses.includes(update.status)) {
            await updatePlayerInjuryStatus(update.playerId, update.status);
            updatedCount++;
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Bulk updated ${updatedCount} players`
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('Bulk Injury Status Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
