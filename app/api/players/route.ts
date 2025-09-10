import { NextRequest, NextResponse } from 'next/server';
import { createPlayer, createPlayerStats, deletePlayer, generateId, getPlayerById, getPlayers, getPlayersByPosition, getPlayersByTeam, getPlayersWithBye, getPlayerStats, updatePlayer, getResults, getCurrentWeek } from '@/lib/database';
import { ApiResponse, Player, PlayerStats } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    // Get current week for average calculation
    const currentWeek = await getCurrentWeek();
    
    // Get all players with their point totals from the Points table
    const playersWithStats = await getResults({
      sql: `
        SELECT 
          p.player_ID as id,
          p.player_name as name,
          p.position,
          p.team_name as team,
          p.owner_ID,
          COALESCE(n.bye, 0) as byeWeek,
          COALESCE(pts.week_1, 0) + COALESCE(pts.week_2, 0) + COALESCE(pts.week_3, 0) + 
          COALESCE(pts.week_4, 0) + COALESCE(pts.week_5, 0) + COALESCE(pts.week_6, 0) + 
          COALESCE(pts.week_7, 0) + COALESCE(pts.week_8, 0) + COALESCE(pts.week_9, 0) + 
          COALESCE(pts.week_10, 0) + COALESCE(pts.week_11, 0) + COALESCE(pts.week_12, 0) + 
          COALESCE(pts.week_13, 0) + COALESCE(pts.week_14, 0) as totalPoints
        FROM Players p
        LEFT JOIN NFL_Teams n ON p.team_id = n.team_id
        LEFT JOIN Points pts ON p.player_ID = pts.player_ID
        WHERE p.position IN ('QB', 'RB', 'WR', 'TE', 'PK', 'D/ST')
        ORDER BY totalPoints DESC
      `
    });
    
    // Transform the database players to match the frontend interface
    const transformedPlayers = playersWithStats.map(player => {
      const totalPoints = parseFloat(player.totalPoints || 0);
      // Calculate average based on completed weeks (current week - 1)
      const completedWeeks = Math.max(1, currentWeek - 1);
      const avgPoints = completedWeeks > 0 ? totalPoints / completedWeeks : 0;
      
      return {
        id: player.id,
        name: player.name,
        position: player.position,
        team: player.team,
        totalPoints: totalPoints,
        avgPoints: Math.round(avgPoints * 100) / 100, // Round to 2 decimal places
        byeWeek: player.byeWeek || 0,
        owner_ID: player.owner_ID,
        status: 'Active' // Default status
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedPlayers
    });
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}

// Create a new player
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, position, team, nflTeam, image, stats } = body;

    if (!name || !position || !team || !nflTeam) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Missing required fields: name, position, team, nflTeam'
      }, { status: 400 });
    }

    const playerId = generateId('p');

    // Insert player into database
    await createPlayer(
      playerId,
      name,
      position,
      team,
      nflTeam,
      image || ''
    );

    // Add player stats if provided
    if (stats) {
      await createPlayerStats(
        playerId,
        1, // week
        2024, // season
        stats.fantasyPoints || 0,
        stats.passingYards || 0,
        stats.passingTDs || 0,
        stats.rushingYards || 0,
        stats.rushingTDs || 0,
        stats.receptions || 0,
        stats.receivingYards || 0,
        stats.receivingTDs || 0
        // Not received as parameters, but can be added later
        // stats.fumbles || 0,
        // stats.fieldGoals || 0,
        // stats.extraPoints || 0,
        // stats.sacks || 0,
        // stats.interceptions || 0,
        // stats.fumbleRecoveries || 0,
        // stats.defensiveTDs || 0,
        // stats.pointsAllowed || 0,
        // stats.fantasyPoints || 0
      );
    }

    const newPlayer: Player = {
      id: playerId,
      name,
      position,
      team,
      nflTeam,
      image: image || '',
      stats: stats || { fantasyPoints: 0 }
    };

    return NextResponse.json<ApiResponse<Player>>({
      success: true,
      data: newPlayer,
      message: 'Player created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create Player Error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Update a player
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Player ID is required'
      }, { status: 400 });
    }

    const body = await request.json();
    const existingPlayer = await getPlayerById(playerId);

    if (!existingPlayer) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Player not found'
      }, { status: 404 });
    }

    // Update player in database
    await updatePlayer(
      body.name || existingPlayer.name,
      body.position || existingPlayer.position,
      body.team || existingPlayer.team,
      body.nflTeam || existingPlayer.nfl_team,
      body.image || existingPlayer.image,
      playerId
    );

    // Update player stats if provided
    if (body.stats) {
      await createPlayerStats(
        playerId,
        1, // week
        2024, // season
        body.stats.fantasyPoints || 0,
        body.stats.passingYards || 0,
        body.stats.passingTDs || 0,
        body.stats.rushingYards || 0,
        body.stats.rushingTDs || 0,
        body.stats.receptions || 0,
        body.stats.receivingYards || 0,
        body.stats.receivingTDs || 0
        // Not received as parameters, but can be added later
        // body.stats.fumbles || 0,
        // body.stats.fieldGoals || 0,
        // body.stats.extraPoints || 0,
        // body.stats.sacks || 0,
        // body.stats.interceptions || 0,
        // body.stats.fumbleRecoveries || 0,
        // body.stats.defensiveTDs || 0,
        // body.stats.pointsAllowed || 0,
        // body.stats.fantasyPoints || 0
      );
    }

    // Get updated player
    const updatedPlayer = await getPlayerById(playerId);
    const playerData: Player = {
      id: updatedPlayer.id,
      name: updatedPlayer.name,
      position: updatedPlayer.position,
      team: updatedPlayer.team,
      nflTeam: updatedPlayer.nfl_team,
      image: updatedPlayer.image,
      stats: body.stats || { fantasyPoints: 0 }
    };

    return NextResponse.json<ApiResponse<Player>>({
      success: true,
      data: playerData,
      message: 'Player updated successfully'
    });

  } catch (error) {
    console.error('Update Player Error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Delete a player
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Player ID is required'
      }, { status: 400 });
    }

    const existingPlayer = await getPlayerById(playerId);

    if (!existingPlayer) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Player not found'
      }, { status: 404 });
    }

    // Delete player from database (cascade will handle related records)
    await deletePlayer(playerId);

    const deletedPlayer: Player = {
      id: existingPlayer.id,
      name: existingPlayer.name,
      position: existingPlayer.position,
      team: existingPlayer.team,
      nflTeam: existingPlayer.nfl_team,
      image: existingPlayer.image,
      stats: { fantasyPoints: 0 }
    };

    return NextResponse.json<ApiResponse<Player>>({
      success: true,
      data: deletedPlayer,
      message: 'Player deleted successfully'
    });

  } catch (error) {
    console.error('Delete Player Error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}