import { NextResponse } from 'next/server';
import { mockLeagues, mockTeams, mockMatchups } from '@/lib/mockData';
import { ApiResponse } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');

    // If leagueId is provided, return specific league with details
    if (leagueId) {
      const league = mockLeagues.find(l => l.id === leagueId);
      if (!league) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: 'League not found'
        }, { status: 404 });
      }

      // Get league teams with details
      const leagueTeams = mockTeams.filter(team => team.leagueId === leagueId);
      
      // Get league matchups
      const leagueMatchups = mockMatchups.filter(matchup => matchup.leagueId === leagueId);

      // Calculate standings
      const standings = leagueTeams
        .map(team => ({
          teamId: team.id,
          teamName: team.name,
          owner: team.owner,
          wins: team.record.wins,
          losses: team.record.losses,
          ties: team.record.ties,
          pointsFor: team.pointsFor,
          pointsAgainst: team.pointsAgainst,
          rank: 0
        }))
        .sort((a, b) => {
          if (a.wins !== b.wins) return b.wins - a.wins;
          return b.pointsFor - a.pointsFor;
        })
        .map((team, index) => ({
          ...team,
          rank: index + 1
        }));

      const leagueData = {
        ...league,
        teams: leagueTeams,
        matchups: leagueMatchups,
        standings,
        totalTeams: leagueTeams.length
      };

      return NextResponse.json<ApiResponse<typeof leagueData>>({
        success: true,
        data: leagueData
      });
    }

    // Return all leagues
    return NextResponse.json<ApiResponse<typeof mockLeagues>>({
      success: true,
      data: mockLeagues
    });

  } catch (error) {
    console.error('Leagues API Error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 