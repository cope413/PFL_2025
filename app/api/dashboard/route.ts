import { NextResponse } from 'next/server';
import { mockTeams, mockLeagues, mockMatchups, mockNews, getTeamById } from '@/lib/mockData';
import { ApiResponse } from '@/lib/types';

export async function GET() {
  try {
    // Get the main league (assuming first league for now)
    const league = mockLeagues[0];
    if (!league) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'No league found'
      }, { status: 404 });
    }

    // Get user's team (assuming first team for now)
    const userTeam = mockTeams[0];
    if (!userTeam) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'No team found'
      }, { status: 404 });
    }

    // Get current week matchups
    const currentWeekMatchups = mockMatchups.filter(
      matchup => matchup.leagueId === league.id && matchup.week === league.currentWeek
    );

    // Get user's current matchup
    const userMatchup = currentWeekMatchups.find(
      matchup => matchup.team1Id === userTeam.id || matchup.team2Id === userTeam.id
    );

    // Calculate league standings
    const leagueTeams = mockTeams.filter(team => team.leagueId === league.id);
    const standings = leagueTeams
      .map(team => ({
        teamId: team.id,
        teamName: team.name,
        wins: team.record.wins,
        losses: team.record.losses,
        ties: team.record.ties,
        pointsFor: team.pointsFor,
        pointsAgainst: team.pointsAgainst,
        rank: 0 // Will be calculated below
      }))
      .sort((a, b) => {
        // Sort by wins, then points for
        if (a.wins !== b.wins) return b.wins - a.wins;
        return b.pointsFor - a.pointsFor;
      })
      .map((team, index) => ({
        ...team,
        rank: index + 1
      }));

    // Get user's rank
    const userRank = standings.find(s => s.teamId === userTeam.id)?.rank || 0;

    // Get recent news
    const recentNews = mockNews.slice(0, 3);

    const dashboardData = {
      userTeam: {
        id: userTeam.id,
        name: userTeam.name,
        record: userTeam.record,
        pointsFor: userTeam.pointsFor,
        pointsAgainst: userTeam.pointsAgainst,
        rank: userRank,
        leaguePosition: `${userRank}${getOrdinalSuffix(userRank)}`
      },
      currentWeek: league.currentWeek,
      upcomingMatchup: userMatchup ? {
        id: userMatchup.id,
        team1: getTeamById(userMatchup.team1Id),
        team2: getTeamById(userMatchup.team2Id),
        team1Projected: userMatchup.team1Projected,
        team2Projected: userMatchup.team2Projected,
        date: userMatchup.date,
        isUserTeam1: userMatchup.team1Id === userTeam.id
      } : null,
      league: {
        id: league.id,
        name: league.name,
        type: league.type,
        currentWeek: league.currentWeek,
        totalTeams: leagueTeams.length
      },
      standings: standings.slice(0, 6), // Top 6 teams
      news: recentNews
    };

    return NextResponse.json<ApiResponse<typeof dashboardData>>({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

function getOrdinalSuffix(num: number): string {
  if (num >= 11 && num <= 13) return 'th';
  switch (num % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
} 