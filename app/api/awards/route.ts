import { NextRequest, NextResponse } from 'next/server';
import { getResults, getAllStandings, getTeamNameByTeamId, getCurrentWeek, getTeamNameMap } from '@/lib/database';

// Simple in-memory cache for awards data
const awardsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

    // Get team name mapping once
    const teamNameMap = await getTeamNameMap();

    // Optimized function to calculate all team scores for a week in bulk
    const calculateAllTeamScoresForWeek = async (weekNumber: number): Promise<Map<string, number>> => {
      try {
        // Get all lineups for this week in one query
        const lineups = await getResults({
          sql: 'SELECT owner_ID, QB, RB_1, WR_1, FLEX_1, FLEX_2, TE, K, DEF FROM Lineups WHERE week = ?',
          args: [weekNumber.toString()]
        });

        if (!lineups || lineups.length === 0) {
          return new Map();
        }

        // Get all player points for this week in one query
        const playerPoints = await getResults({
          sql: `SELECT player_ID, COALESCE(week_${weekNumber}, 0) as points FROM Points`,
          args: []
        });

        // Create a map for quick player point lookups
        const pointsMap = new Map<string, number>();
        playerPoints.forEach((row: any) => {
          pointsMap.set(row.player_ID.toString(), Math.floor(row.points || 0));
        });

        // Calculate scores for all teams
        const teamScores = new Map<string, number>();
        const positions = ['QB', 'RB_1', 'WR_1', 'FLEX_1', 'FLEX_2', 'TE', 'K', 'DEF'];

        lineups.forEach((lineup: any) => {
          let totalScore = 0;
          positions.forEach(pos => {
            const playerId = lineup[pos];
            if (playerId && pointsMap.has(playerId)) {
              totalScore += pointsMap.get(playerId) || 0;
            }
          });
          teamScores.set(lineup.owner_ID, totalScore);
        });

        return teamScores;
      } catch (error) {
        console.error(`Error calculating team scores for week ${weekNumber}:`, error);
        return new Map();
      }
    };

    // Process each week's matchups to find all teams' results
    for (const weekRow of matchupsData) {
      const weekNum = weekRow.Week;
      const isComplete = weekNum < currentWeek;
      
      // Calculate all team scores for this week in one go
      const teamScoresMap = isComplete ? await calculateAllTeamScoresForWeek(weekNum) : new Map();
      
      // Process each team in this week
      for (let i = 1; i <= 16; i++) {
        const teamId = weekRow[`Team_${i}`];
        if (!teamId) continue;
        
        // Find opponent
        let opponent = null;
        
        if (i % 2 === 1) {
          // Odd number, opponent is the next team
          opponent = weekRow[`Team_${i + 1}`];
        } else {
          // Even number, opponent is the previous team
          opponent = weekRow[`Team_${i - 1}`];
        }

        if (opponent) {
          // Get team name from pre-loaded map
          const teamName = teamNameMap.get(teamId) || teamId;
          
          // Get scores from pre-calculated map
          const teamScore = teamScoresMap.get(teamId) || 0;
          const opponentScore = teamScoresMap.get(opponent) || 0;
          
          // Determine result based on scores
          let result: 'W' | 'L' | 'T' = 'L';
          if (isComplete) {
            if (teamScore > opponentScore) result = 'W';
            else if (teamScore === opponentScore) result = 'T';
            else result = 'L';
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
    // Check cache first
    const cacheKey = 'awards-data';
    const cached = awardsCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: cached.data
      });
    }

    const allResults = await getAllTeamsWeeklyResults();
    
    // Calculate awards for first half (weeks 1-7) and second half (weeks 8-14)
    const firstHalfAwards = calculateAwards(allResults, 1, 7);
    const secondHalfAwards = calculateAwards(allResults, 8, 14);

    const awardsData: AwardsData = {
      firstHalf: firstHalfAwards,
      secondHalf: secondHalfAwards
    };

    // Cache the result
    awardsCache.set(cacheKey, {
      data: awardsData,
      timestamp: Date.now()
    });

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
