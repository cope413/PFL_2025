import { NextResponse } from 'next/server';
import { mockTeams, mockLeagues, mockMatchups, mockNews, getTeamById } from '@/lib/mockData';
import { ApiResponse } from '@/lib/types';
import { getCurrentWeek, getResults, getTeamNameMap } from '@/lib/database';
import { Matchup } from '@/lib/db-types';

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

    // Get current week and real matchups from WeeklyMatchups table
    const currentWeek = await getCurrentWeek();
    let currentWeekMatchups: Matchup[] = [];
    
    try {
      // Check if WeeklyMatchups table exists and get data
      const tableExists = await getResults(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='WeeklyMatchups'
      `);

      if (tableExists && tableExists.length > 0) {
        const weeklyData = await getResults({
          sql: 'SELECT * FROM WeeklyMatchups WHERE Week = ?',
          args: [currentWeek]
        });

        if (weeklyData && weeklyData.length > 0) {
          // Get team names from user table for mapping
          const teamNameMap = await getTeamNameMap();

          // Transform the weekly data into individual matchups
          weeklyData.forEach((weekRow) => {
            const weekNumber = weekRow.Week;

            // Create 8 matchups from the 16 teams (8 pairs)
            for (let i = 0; i < 8; i++) {
              const team1Index = i * 2 + 1;
              const team2Index = i * 2 + 2;

              const team1Id = weekRow[`Team_${team1Index}`];
              const team2Id = weekRow[`Team_${team2Index}`];

              if (team1Id && team2Id) {
                // Map team IDs to display names
                const team1Name = teamNameMap.get(team1Id) || team1Id;
                const team2Name = teamNameMap.get(team2Id) || team2Id;

                currentWeekMatchups.push({
                  id: `week${weekNumber}_match${i + 1}`,
                  week: weekNumber,
                  team1_id: team1Id,
                  team2_id: team2Id,
                  team1_name: team1Name,
                  team2_name: team2Name,
                  team1_score: 0, // These would need to come from a separate scores table
                  team2_score: 0,
                  team1_projected: 0,
                  team2_projected: 0,
                  date: `2024-09-${String(weekNumber + 20).padStart(2, '0')}`, // Mock date based on week
                  is_complete: false
                });
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching real matchups, falling back to mock data:', error);
    }

    // If no real matchups found, use mock data as fallback but with real current week
    if (currentWeekMatchups.length === 0) {
      const mockCurrentWeekMatchups = mockMatchups.filter(
        matchup => matchup.leagueId === league.id && matchup.week === currentWeek
      );
      currentWeekMatchups = mockCurrentWeekMatchups.map(m => ({
        id: m.id,
        week: m.week,
        team1_id: m.team1Id,
        team2_id: m.team2Id,
        team1_name: getTeamById(m.team1Id)?.name || m.team1Id,
        team2_name: getTeamById(m.team2Id)?.name || m.team2Id,
        team1_score: m.team1Score,
        team2_score: m.team2Score,
        team1_projected: m.team1Projected,
        team2_projected: m.team2Projected,
        date: m.date,
        is_complete: m.isComplete
      }));
    }

    // Get user's current matchup
    const userMatchup = currentWeekMatchups.find(
      matchup => matchup.team1_id === userTeam.id || matchup.team2_id === userTeam.id
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
      currentWeek: currentWeek,
      upcomingMatchup: userMatchup ? {
        id: userMatchup.id,
        team1: { id: userMatchup.team1_id, name: userMatchup.team1_name },
        team2: { id: userMatchup.team2_id, name: userMatchup.team2_name },
        team1Projected: userMatchup.team1_projected,
        team2Projected: userMatchup.team2_projected,
        date: userMatchup.date,
        isUserTeam1: userMatchup.team1_id === userTeam.id
      } : null,
      matchups: currentWeekMatchups,
      league: {
        id: league.id,
        name: league.name,
        type: league.type,
        currentWeek: currentWeek,
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