import { NextResponse } from 'next/server';
import { ApiResponse, Team } from '@/lib/types';
import { getAllStandings, getTeamStanding, getTeamRoster, getCurrentWeek } from '@/lib/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');
    const teamId = searchParams.get('teamId');

    // If teamId is provided, return specific team with roster
    if (teamId) {
      const teamStanding = await getTeamStanding(teamId);
      if (!teamStanding) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: 'Team not found'
        }, { status: 404 });
      }

      // Get team roster
      const currentWeek = await getCurrentWeek();
      const roster = await getTeamRoster(teamId, currentWeek);

      const teamData = {
        id: teamId,
        name: teamStanding.teamName,
        owner: teamStanding.teamName, // Using team name as owner for now
        leagueId: "main",
        players: roster.map((p: any) => p.id),
        record: {
          wins: teamStanding.wins,
          losses: teamStanding.losses,
          ties: teamStanding.ties
        },
        pointsFor: teamStanding.pointsFor,
        pointsAgainst: teamStanding.pointsAgainst,
        roster: roster.map((p: any) => ({
          id: p.id,
          name: p.name,
          position: p.position,
          nflTeam: p.nflTeam,
          team: p.team,
          isStarter: false // Would need lineup data to determine this
        })),
        totalPoints: teamStanding.pointsFor
      };

      return NextResponse.json<ApiResponse<typeof teamData>>({
        success: true,
        data: teamData
      });
    }

    // Return all teams from standings
    const standings = await getAllStandings() as any[];
    const teams = standings.map(standing => ({
      id: standing.Team_ID,
      name: standing.teamName,
      owner: standing.teamName, // Using team name as owner for now
      leagueId: "main",
      players: [], // Would need to query roster for each team
      record: {
        wins: standing.wins,
        losses: standing.losses,
        ties: standing.ties
      },
      pointsFor: standing.pointsFor,
      pointsAgainst: standing.pointsAgainst
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

// Teams are managed through the standings table, not directly created/updated/deleted via API 