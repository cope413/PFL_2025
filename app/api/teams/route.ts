import { NextResponse } from 'next/server';
import { dbQueries, generateId, parseJsonField } from '@/lib/database';
import { ApiResponse, Team } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');
    const teamId = searchParams.get('teamId');

    // If teamId is provided, return specific team with roster
    if (teamId) {
      const team = dbQueries.getTeamById.get(teamId);
      if (!team) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: 'Team not found'
        }, { status: 404 });
      }

      // Get team roster with player details
      const teamPlayers = dbQueries.getTeamPlayers.all(teamId);
      const roster = teamPlayers.map(tp => ({
        id: tp.player_id,
        name: tp.name,
        position: tp.position,
        team: tp.team,
        nflTeam: tp.nfl_team,
        isStarter: Boolean(tp.is_starter),
        positionSlot: tp.position_slot
      }));

      const teamData = {
        id: team.id,
        name: team.name,
        owner: team.owner,
        leagueId: team.league_id,
        players: teamPlayers.map(tp => tp.player_id),
        record: {
          wins: team.wins,
          losses: team.losses,
          ties: team.ties
        },
        pointsFor: team.points_for,
        pointsAgainst: team.points_against,
        logo: team.logo,
        roster,
        totalPoints: team.points_for
      };

      return NextResponse.json<ApiResponse<typeof teamData>>({
        success: true,
        data: teamData
      });
    }

    // If leagueId is provided, return teams for that league
    if (leagueId) {
      const leagueTeams = dbQueries.getTeamsByLeague.all(leagueId);
      const teams = leagueTeams.map(team => ({
        id: team.id,
        name: team.name,
        owner: team.owner,
        leagueId: team.league_id,
        players: [], // Will be populated separately if needed
        record: {
          wins: team.wins,
          losses: team.losses,
          ties: team.ties
        },
        pointsFor: team.points_for,
        pointsAgainst: team.points_against,
        logo: team.logo
      }));

      return NextResponse.json<ApiResponse<typeof teams>>({
        success: true,
        data: teams
      });
    }

    // Return all teams
    const allTeams = dbQueries.getTeams.all();
    const teams = allTeams.map(team => ({
      id: team.id,
      name: team.name,
      owner: team.owner,
      leagueId: team.league_id,
      players: [], // Will be populated separately if needed
      record: {
        wins: team.wins,
        losses: team.losses,
        ties: team.ties
      },
      pointsFor: team.points_for,
      pointsAgainst: team.points_against,
      logo: team.logo
    }));

    return NextResponse.json<ApiResponse<typeof teams>>({
      success: true,
      data: teams
    });

  } catch (error) {
    console.error('Teams API Error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Create a new team
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, owner, leagueId, players = [] } = body;

    if (!name || !owner || !leagueId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Missing required fields: name, owner, leagueId'
      }, { status: 400 });
    }

    const teamId = generateId('t');
    
    // Insert team into database
    dbQueries.createTeam.run(
      teamId,
      name,
      owner,
      leagueId,
      0, // wins
      0, // losses
      0, // ties
      0, // points_for
      0, // points_against
      null // logo
    );

    // Add players to team if provided
    if (players.length > 0) {
      for (const playerId of players) {
        dbQueries.addPlayerToTeam.run(teamId, playerId, false, null);
      }
    }

    const newTeam: Team = {
      id: teamId,
      name,
      owner,
      leagueId,
      players,
      record: { wins: 0, losses: 0, ties: 0 },
      pointsFor: 0,
      pointsAgainst: 0
    };

    return NextResponse.json<ApiResponse<Team>>({
      success: true,
      data: newTeam,
      message: 'Team created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create Team Error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Update a team
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    
    if (!teamId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Team ID is required'
      }, { status: 400 });
    }

    const body = await request.json();
    const existingTeam = dbQueries.getTeamById.get(teamId);
    
    if (!existingTeam) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Team not found'
      }, { status: 404 });
    }

    // Update team in database
    dbQueries.updateTeam.run(
      body.name || existingTeam.name,
      body.owner || existingTeam.owner,
      body.record?.wins ?? existingTeam.wins,
      body.record?.losses ?? existingTeam.losses,
      body.record?.ties ?? existingTeam.ties,
      body.pointsFor ?? existingTeam.points_for,
      body.pointsAgainst ?? existingTeam.points_against,
      body.logo || existingTeam.logo,
      teamId
    );

    // Get updated team
    const updatedTeam = dbQueries.getTeamById.get(teamId);
    const teamData: Team = {
      id: updatedTeam.id,
      name: updatedTeam.name,
      owner: updatedTeam.owner,
      leagueId: updatedTeam.league_id,
      players: [], // Will be populated separately if needed
      record: {
        wins: updatedTeam.wins,
        losses: updatedTeam.losses,
        ties: updatedTeam.ties
      },
      pointsFor: updatedTeam.points_for,
      pointsAgainst: updatedTeam.points_against,
      logo: updatedTeam.logo
    };

    return NextResponse.json<ApiResponse<Team>>({
      success: true,
      data: teamData,
      message: 'Team updated successfully'
    });

  } catch (error) {
    console.error('Update Team Error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Delete a team
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    
    if (!teamId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Team ID is required'
      }, { status: 400 });
    }

    const existingTeam = dbQueries.getTeamById.get(teamId);
    
    if (!existingTeam) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Team not found'
      }, { status: 404 });
    }

    // Delete team from database (cascade will handle related records)
    dbQueries.deleteTeam.run(teamId);

    const deletedTeam: Team = {
      id: existingTeam.id,
      name: existingTeam.name,
      owner: existingTeam.owner,
      leagueId: existingTeam.league_id,
      players: [],
      record: {
        wins: existingTeam.wins,
        losses: existingTeam.losses,
        ties: existingTeam.ties
      },
      pointsFor: existingTeam.points_for,
      pointsAgainst: existingTeam.points_against,
      logo: existingTeam.logo
    };

    return NextResponse.json<ApiResponse<Team>>({
      success: true,
      data: deletedTeam,
      message: 'Team deleted successfully'
    });

  } catch (error) {
    console.error('Delete Team Error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 