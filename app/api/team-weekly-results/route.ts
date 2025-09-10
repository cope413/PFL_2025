import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getTeamStanding, getAllStandings, getTeamNameByTeamId, getCurrentWeek, getResults } from '@/lib/database';
import { TeamInfo, TeamWeeklyResult } from '@/lib/db-types';

// Function to get week dates from the database
async function getWeekDate(weekNumber: number): Promise<string> {
  try {
    const weekData = await getResults({
      sql: 'SELECT start FROM Weeks WHERE week = ?',
      args: [weekNumber]
    });
    
    if (weekData && weekData.length > 0) {
      const startDate = weekData[0].start;
      // Convert from M/D/YY format to YYYY-MM-DD format
      const [month, day, year] = startDate.split('/');
      const fullYear = year.length === 2 ? `20${year}` : year;
      return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  } catch (error) {
    console.error('Error fetching week date:', error);
  }
  
  // Fallback to a calculated date if database lookup fails
  const baseDate = new Date('2025-09-04'); // Week 1 start date
  const weekDate = new Date(baseDate);
  weekDate.setDate(baseDate.getDate() + (weekNumber - 1) * 7);
  return weekDate.toISOString().split('T')[0];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let teamId = searchParams.get('teamId');
    const week = searchParams.get('week');

    // If no teamId is provided, require authentication and use user's team
    if (!teamId) {
      const authUser = getUserFromRequest(request);
      if (!authUser) {
        return NextResponse.json({
          success: false,
          error: 'Authentication required when teamId is not provided'
        }, { status: 401 });
      }
      teamId = authUser.team;
    }

    if (!teamId) {
      return NextResponse.json({
        success: false,
        error: 'Team ID is required'
      }, { status: 400 });
    }

    // Get team information from standings
    const teamStanding = await getTeamStanding(teamId) as any;

    if (!teamStanding) {
      return NextResponse.json({
        success: false,
        error: 'Team not found in standings'
      }, { status: 404 });
    }

    // Calculate rank
    const allStandings = await getAllStandings() as any[];
    const rank = allStandings.findIndex(s => s.Team_ID === teamId) + 1;

    const teamInfo = {
      teamId: teamStanding.teamId,
      teamName: teamStanding.teamName,
      record: {
        wins: teamStanding.wins,
        losses: teamStanding.losses,
        ties: teamStanding.ties
      },
      pointsFor: teamStanding.pointsFor,
      pointsAgainst: teamStanding.pointsAgainst,
      rank,
      division: teamStanding.division
    };

    // Get weekly results from WeeklyMatchups and current week
    const weeklyResults = [];
    const currentWeek = await getCurrentWeek();
    
    try {
      // Get matchup data from WeeklyMatchups table
      const matchupsQuery = week ? 
        'SELECT * FROM WeeklyMatchups WHERE Week = ?' :
        'SELECT * FROM WeeklyMatchups ORDER BY Week';
      
      const matchupsData = await getResults(week ? 
        { sql: matchupsQuery, args: [parseInt(week)] } :
        { sql: matchupsQuery }
      );

      // Process each week's matchups to find this team's results
      for (const weekRow of matchupsData) {
        const weekNum = weekRow.Week;
        
        // Find which team slot this user's team is in
        let opponent = null;
        let isTeam1 = false;
        
        for (let i = 1; i <= 16; i++) {
          if (weekRow[`Team_${i}`] === teamId) {
            // Found the user's team, find their opponent
            if (i % 2 === 1) {
              // Odd number, opponent is the next team
              opponent = weekRow[`Team_${i + 1}`];
              isTeam1 = true;
            } else {
              // Even number, opponent is the previous team
              opponent = weekRow[`Team_${i - 1}`];
              isTeam1 = false;
            }
            break;
          }
        }

        if (opponent) {
          // Get opponent name
          const opponentData = await getTeamNameByTeamId(opponent) as any;
          const opponentName = opponentData?.display_name || opponent;

          // Determine if this week is complete or upcoming
          const isComplete = weekNum < currentWeek;
          const isCurrentWeek = weekNum === currentWeek;
          
          // Generate realistic but placeholder scores/results
          let teamScore = 0;
          let opponentScore = 0;
          let result: 'W' | 'L' | 'T' = 'L';
          
          if (isComplete) {
            // Calculate actual scores from lineup data
            try {
              // Get team's lineup for this week
              const teamLineup = await getResults({
                sql: 'SELECT * FROM Lineups WHERE owner_ID = ? AND week = ?',
                args: [teamId, weekNum.toString()]
              });

              const opponentLineup = await getResults({
                sql: 'SELECT * FROM Lineups WHERE owner_ID = ? AND week = ?',
                args: [opponent, weekNum.toString()]
              });

              if (teamLineup && teamLineup.length > 0) {
                // Calculate team score from lineup
                const positions = ['QB', 'RB_1', 'WR_1', 'FLEX_1', 'FLEX_2', 'TE', 'K', 'DEF'];
                for (const pos of positions) {
                  const playerId = teamLineup[0][pos];
                  if (playerId) {
                    const playerPoints = await getResults({
                      sql: `SELECT week_${weekNum} as points FROM Points WHERE player_ID = ?`,
                      args: [playerId]
                    });
                    if (playerPoints && playerPoints.length > 0) {
                      const points = playerPoints[0].points === null ? 0 : Math.floor(playerPoints[0].points || 0);
                      teamScore += points;
                    }
                  }
                }
              }

              if (opponentLineup && opponentLineup.length > 0) {
                // Calculate opponent score from lineup
                const positions = ['QB', 'RB_1', 'WR_1', 'FLEX_1', 'FLEX_2', 'TE', 'K', 'DEF'];
                for (const pos of positions) {
                  const playerId = opponentLineup[0][pos];
                  if (playerId) {
                    const playerPoints = await getResults({
                      sql: `SELECT week_${weekNum} as points FROM Points WHERE player_ID = ?`,
                      args: [playerId]
                    });
                    if (playerPoints && playerPoints.length > 0) {
                      const points = playerPoints[0].points === null ? 0 : Math.floor(playerPoints[0].points || 0);
                      opponentScore += points;
                    }
                  }
                }
              }
              
              // Determine result based on scores
              if (teamScore > opponentScore) result = 'W';
              else if (teamScore === opponentScore) result = 'T';
              else result = 'L';
            } catch (error) {
              console.error(`Error calculating actual scores for week ${weekNum}:`, error);
              // Fallback to 0 scores if calculation fails
              teamScore = 0;
              opponentScore = 0;
              result = 'L';
            }
          } else if (isCurrentWeek) {
            // Current week - might be in progress
            teamScore = 0;
            opponentScore = 0;
            result = 'L'; // Default until game is played
          } else {
            // Future weeks - no scores yet
            teamScore = 0;
            opponentScore = 0;
            result = 'L'; // Default for upcoming games
          }

          // Get the proper date for this week from the database
          const weekDate = await getWeekDate(weekNum);
          
          weeklyResults.push({
            week: weekNum,
            opponent,
            opponentName,
            teamScore,
            opponentScore,
            result,
            date: weekDate,
            isComplete
          });
        }
      }
    } catch (error) {
      console.error('Error fetching weekly matchups:', error);
      // Return empty results instead of mock data
    }

    // If specific week requested, return only that week
    if (week) {
      const weekResult = weeklyResults.find(r => r.week === parseInt(week));
      if (!weekResult) {
        return NextResponse.json({
          success: false,
          error: 'Week not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          teamInfo,
          weeklyResult: weekResult
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        teamInfo,
        weeklyResults
      }
    });

  } catch (error) {
    console.error('Get Team Weekly Results Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
