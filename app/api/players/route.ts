import { NextResponse } from 'next/server';
import { createPlayer, createPlayerStats, generateId, getPlayerById, getPlayers, getPlayersByPosition, getPlayersByTeam, getPlayerStats } from '@/lib/database';
import { ApiResponse, Player, PlayerStats } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');
    const team = searchParams.get('team');
    const playerId = searchParams.get('playerId');

    // If playerId is provided, return specific player
    if (playerId) {
      const player = await getPlayerById(playerId);
      if (!player) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: 'Player not found'
        }, { status: 404 });
      }

      // Get player stats for current week
      const playerStats = await getPlayerStats(playerId, 1, 2024) as PlayerStats;

      const playerData: Player = {
        id: player.id,
        name: player.name,
        position: player.position,
        team: player.team,
        nflTeam: player.nfl_team,
        image: player.image,
        stats: {
          fantasyPoints: playerStats.fantasy_points,
          passingYards: playerStats.passing_yards,
          passingTDs: playerStats.passing_tds,
          rushingYards: playerStats.rushing_yards,
          rushingTDs: playerStats.rushing_tds,
          receptions: playerStats.receptions,
          receivingYards: playerStats.receiving_yards,
          receivingTDs: playerStats.receiving_tds
        }
      };

      return NextResponse.json<ApiResponse<Player>>({
        success: true,
        data: playerData
      });
    }

    // Get all players from database
    let players;
    
    // Filter by position if specified
    if (position) {
      players = await getPlayersByPosition(position);
    }
    // Filter by team if specified
    else if (team) {
      players = await getPlayersByTeam(team);
    }
    // Get all players
    else {
      players = await getPlayers();
    }

    // Convert to Player objects with stats
    const playersWithStats = await Promise.all(players.map(async (player: any) => {
      const stats = await getPlayerStats(String(player.player_ID || player.id), 1, 2024) || {
        fantasy_points: 0
      };

      return {
        id: String(player.player_ID || player.id),
        name: String(player.name),
        position: String(player.position) as "QB" | "RB" | "WR" | "TE" | "K" | "DEF",
        team: String(player.team),
        nflTeam: String(player.nfl_team),
        image: String(player.image || ''),
        stats: {
          fantasyPoints: Number(stats.fantasy_points || 0)
        }
      };
    }));

    // Sort by fantasy points (descending)
    playersWithStats.sort((a: any, b: any) => b.stats.fantasyPoints - a.stats.fantasyPoints);

    return NextResponse.json<ApiResponse<typeof playersWithStats>>({
      success: true,
      data: playersWithStats
    });

  } catch (error) {
    console.error('Players API Error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, position, team, nflTeam, image, stats } = body;

    // Validate required fields
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
