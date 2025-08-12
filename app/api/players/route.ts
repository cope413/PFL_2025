import { NextRequest, NextResponse } from 'next/server';
import { createPlayer, createPlayerStats, deletePlayer, generateId, getPlayerById, getPlayers, getPlayersByPosition, getPlayersByTeam, getPlayersWithBye, getPlayerStats, updatePlayer } from '@/lib/database';
import { ApiResponse, Player, PlayerStats } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    // Get players with bye week data from NFL_Teams table
    const players = await getPlayersWithBye();
    
    // Filter for players that are Free Agents (owner_ID = "99") and have draftable positions
    const draftablePositions = ["QB", "RB", "WR", "TE", "PK", "DEF"];
    const availablePlayers = players.filter(player => 
      player.owner_ID === "99" && 
      draftablePositions.includes(player.position)
    );
    
    // Transform the database players to match the frontend Player interface
    const transformedPlayers = availablePlayers.map(player => ({
      id: player.player_ID,
      name: player.player_name || player.name,
      position: player.position,
      team: player.team_name || player.team,
      projectedPoints: player.projectedPoints || 0, // Default points if not available
      bye: player.bye || 0, // Default bye if not available
      owner_ID: player.owner_ID
    }));

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