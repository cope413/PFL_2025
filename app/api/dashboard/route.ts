import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/types';
import { getCurrentWeek, getResults, getTeamNameMap, getAllStandings, getTeamStanding } from '@/lib/database';
import { Matchup } from '@/lib/db-types';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get user from authentication token
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Get user's team information from standings
    const userTeamStanding = await getTeamStanding(authUser.team);
    if (!userTeamStanding) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Team not found in standings'
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

    // If no real matchups found, return empty array - no mock data fallback
    if (currentWeekMatchups.length === 0) {
      console.log('No matchups found for current week:', currentWeek);
    }

    // Get user's current matchup
    const userMatchup = currentWeekMatchups.find(
      matchup => matchup.team1_id === authUser.team || matchup.team2_id === authUser.team
    );

    // Get real league standings from database
    const allStandings = await getAllStandings() as any[];
    const standings = allStandings.map((standing, index) => ({
      teamId: standing.Team_ID,
      teamName: standing.teamName || standing.Team_ID,
      wins: standing.wins,
      losses: standing.losses || 0,
      ties: standing.ties || 0,
      pointsFor: standing.pointsFor,
      pointsAgainst: standing.pointsAgainst || 0,
      rank: index + 1
    }));

    // Get user's rank
    const userRank = allStandings.findIndex(s => s.Team_ID === authUser.team) + 1;

    // Remove news section - no real news data available

    const dashboardData = {
      userTeam: {
        id: authUser.team,
        name: userTeamStanding.teamName,
        record: {
          wins: userTeamStanding.wins,
          losses: userTeamStanding.losses,
          ties: userTeamStanding.ties
        },
        pointsFor: userTeamStanding.pointsFor,
        pointsAgainst: userTeamStanding.pointsAgainst,
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
        isUserTeam1: userMatchup.team1_id === authUser.team
      } : null,
      matchups: currentWeekMatchups,
      league: {
        id: "main",
        name: "PFL 2025",
        type: "fantasy",
        currentWeek: currentWeek,
        totalTeams: standings.length
      },
      standings: standings.slice(0, 6) // Top 6 teams
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