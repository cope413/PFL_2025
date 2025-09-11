import { NextRequest, NextResponse } from 'next/server';
import { getResults, getAllStandings, getTeamNameByTeamId, getCurrentWeek } from '@/lib/database';

interface TeamWeeklyResult {
  teamId: string;
  teamName: string;
  week: number;
  teamScore: number;
  opponentScore: number;
  result: 'W' | 'L' | 'T';
  isComplete: boolean;
}

interface Award {
  teamId: string;
  teamName: string;
  value: number;
  week?: number;
}

interface AwardsData {
  firstHalf: {
    highGameScore: Award;
    highLosingScore: Award;
    toughestSchedule: Award;
    bestLoser: Award;
  };
  secondHalf: {
    highGameScore: Award;
    highLosingScore: Award;
    toughestSchedule: Award;
    bestLoser: Award;
  };
}

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

async function getAllTeamsWeeklyResults(): Promise<TeamWeeklyResult[]> {
  const allResults: TeamWeeklyResult[] = [];
  const currentWeek = await getCurrentWeek();
  
  try {
    // Get all teams from standings
    const allStandings = await getAllStandings() as any[];
    const teamIds = allStandings.map(standing => standing.Team_ID);
    
    // Get matchup data from WeeklyMatchups table
    const matchupsData = await getResults({
      sql: 'SELECT * FROM WeeklyMatchups ORDER BY Week'
    });

    // Process each week's matchups to find all teams' results
    for (const weekRow of matchupsData) {
      const weekNum = weekRow.Week;
      
      // Process each team in this week
      for (let i = 1; i <= 16; i++) {
        const teamId = weekRow[`Team_${i}`];
        if (!teamId) continue;
        
        // Find opponent
        let opponent = null;
        let isTeam1 = false;
        
        if (i % 2 === 1) {
          // Odd number, opponent is the next team
          opponent = weekRow[`Team_${i + 1}`];
          isTeam1 = true;
        } else {
          // Even number, opponent is the previous team
          opponent = weekRow[`Team_${i - 1}`];
          isTeam1 = false;
        }

        if (opponent) {
          // Get team name
          const teamData = await getTeamNameByTeamId(teamId) as any;
          const teamName = teamData?.display_name || teamId;

          // Determine if this week is complete
          const isComplete = weekNum < currentWeek;
          
          // Calculate actual scores from lineup data
          let teamScore = 0;
          let opponentScore = 0;
          let result: 'W' | 'L' | 'T' = 'L';
          
          if (isComplete) {
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
          }

          allResults.push({
            teamId,
            teamName,
            week: weekNum,
            teamScore,
            opponentScore,
            result,
            isComplete
          });
        }
      }
    }
  } catch (error) {
    console.error('Error fetching all teams weekly results:', error);
  }

  return allResults;
}

function calculateAwards(results: TeamWeeklyResult[], startWeek: number, endWeek: number): {
  highGameScore: Award;
  highLosingScore: Award;
  toughestSchedule: Award;
  bestLoser: Award;
} {
  // Filter results for the specified week range
  const periodResults = results.filter(r => r.week >= startWeek && r.week <= endWeek && r.isComplete);
  
  // High Game Score: Highest single game score
  const highGameScore = periodResults.reduce((max, result) => 
    result.teamScore > max.teamScore ? result : max, 
    { teamId: '', teamName: '', teamScore: 0, week: 0 }
  );

  // High Losing Score: Highest score in a loss (excludes ties)
  const losingResults = periodResults.filter(r => r.result === 'L');
  const highLosingScore = losingResults.reduce((max, result) => 
    result.teamScore > max.teamScore ? result : max, 
    { teamId: '', teamName: '', teamScore: 0, week: 0 }
  );

  // Toughest Schedule: Most points scored against them
  const pointsAgainstByTeam = periodResults.reduce((acc, result) => {
    if (!acc[result.teamId]) {
      acc[result.teamId] = { teamId: result.teamId, teamName: result.teamName, total: 0 };
    }
    acc[result.teamId].total += result.opponentScore;
    return acc;
  }, {} as Record<string, { teamId: string; teamName: string; total: number }>);

  const toughestSchedule = Object.values(pointsAgainstByTeam).reduce((max, team) => 
    team.total > max.total ? team : max, 
    { teamId: '', teamName: '', total: 0 }
  );

  // Best Loser: Most points scored in losses
  const pointsInLossesByTeam = losingResults.reduce((acc, result) => {
    if (!acc[result.teamId]) {
      acc[result.teamId] = { teamId: result.teamId, teamName: result.teamName, total: 0 };
    }
    acc[result.teamId].total += result.teamScore;
    return acc;
  }, {} as Record<string, { teamId: string; teamName: string; total: number }>);

  const bestLoser = Object.values(pointsInLossesByTeam).reduce((max, team) => 
    team.total > max.total ? team : max, 
    { teamId: '', teamName: '', total: 0 }
  );

  return {
    highGameScore: {
      teamId: highGameScore.teamId,
      teamName: highGameScore.teamName,
      value: highGameScore.teamScore,
      week: highGameScore.week
    },
    highLosingScore: {
      teamId: highLosingScore.teamId,
      teamName: highLosingScore.teamName,
      value: highLosingScore.teamScore,
      week: highLosingScore.week
    },
    toughestSchedule: {
      teamId: toughestSchedule.teamId,
      teamName: toughestSchedule.teamName,
      value: toughestSchedule.total
    },
    bestLoser: {
      teamId: bestLoser.teamId,
      teamName: bestLoser.teamName,
      value: bestLoser.total
    }
  };
}

export async function GET(request: NextRequest) {
  try {
    const allResults = await getAllTeamsWeeklyResults();
    
    // Calculate awards for first half (weeks 1-7) and second half (weeks 8-14)
    const firstHalfAwards = calculateAwards(allResults, 1, 7);
    const secondHalfAwards = calculateAwards(allResults, 8, 14);

    const awardsData: AwardsData = {
      firstHalf: firstHalfAwards,
      secondHalf: secondHalfAwards
    };

    return NextResponse.json({
      success: true,
      data: awardsData
    });

  } catch (error) {
    console.error('Get Awards Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
