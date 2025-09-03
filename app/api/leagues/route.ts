import { NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/types';
import { getAllStandings, getCurrentWeek, getResults, getTeamNameMap } from '@/lib/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');

    // For now, we only have one main league
    const mainLeague = {
      id: "main",
      name: "PFL 2025",
      type: "fantasy",
      description: "Premier Fantasy League 2025 Season",
      settings: {
        rosterSize: 16,
        startingLineup: {
          QB: 1,
          RB: 1,
          WR: 1,
          TE: 1,
          FLEX: 2,
          K: 1,
          DEF: 1
        },
        scoringType: "standard"
      }
    };

    // If leagueId is provided, return specific league with details
    if (leagueId) {
      if (leagueId !== "main") {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: 'League not found'
        }, { status: 404 });
      }

      // Get real standings from database
      const standings = await getAllStandings() as any[];
      const currentWeek = await getCurrentWeek();

      // Get current week matchups
      let matchups: any[] = [];
      try {
        const matchupsData = await getResults({
          sql: 'SELECT * FROM WeeklyMatchups WHERE Week = ?',
          args: [currentWeek]
        });

        if (matchupsData && matchupsData.length > 0) {
          const teamNameMap = await getTeamNameMap();
          
          matchupsData.forEach((weekRow) => {
            for (let i = 0; i < 8; i++) {
              const team1Index = i * 2 + 1;
              const team2Index = i * 2 + 2;
              const team1Id = weekRow[`Team_${team1Index}`];
              const team2Id = weekRow[`Team_${team2Index}`];

              if (team1Id && team2Id) {
                matchups.push({
                  id: `week${currentWeek}_match${i + 1}`,
                  week: currentWeek,
                  team1_id: team1Id,
                  team2_id: team2Id,
                  team1_name: teamNameMap.get(team1Id) || team1Id,
                  team2_name: teamNameMap.get(team2Id) || team2Id,
                  team1_score: 0,
                  team2_score: 0,
                  team1_projected: 0,
                  team2_projected: 0,
                  date: `2024-09-${String(currentWeek + 20).padStart(2, '0')}`,
                  is_complete: false
                });
              }
            }
          });
        }
      } catch (error) {
        console.error('Error fetching matchups:', error);
      }

      const leagueData = {
        ...mainLeague,
        currentWeek,
        standings: standings.map((standing, index) => ({
          teamId: standing.Team_ID,
          teamName: standing.teamName,
          wins: standing.wins,
          losses: standing.losses,
          ties: standing.ties,
          pointsFor: standing.pointsFor,
          pointsAgainst: standing.pointsAgainst,
          rank: index + 1
        })),
        matchups,
        totalTeams: standings.length
      };

      return NextResponse.json<ApiResponse<typeof leagueData>>({
        success: true,
        data: leagueData
      });
    }

    // Return main league only
    return NextResponse.json<ApiResponse<typeof mainLeague[]>>({
      success: true,
      data: [mainLeague]
    });

  } catch (error) {
    console.error('Leagues API Error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 