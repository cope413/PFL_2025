import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getTeamStanding, getAllStandings, getTeamNameByTeamId, getCurrentWeek, getResults, getTeamNameMap } from '@/lib/database';
import { TeamInfo, TeamWeeklyResult } from '@/lib/db-types';

// Simple in-memory cache for weekly results data
const weeklyResultsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

// Optimized function to calculate all team scores for a week in bulk
async function calculateAllTeamScoresForWeek(weekNumber: number): Promise<Map<string, number>> {
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
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let teamId = searchParams.get('teamId');
    const week = searchParams.get('week');

    // Check cache first
    const cacheKey = `weekly-results-${teamId || 'user'}-${week || 'all'}`;
    const cached = weeklyResultsCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

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
      // Get team name mapping once
      const teamNameMap = await getTeamNameMap();

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
        const isComplete = weekNum < currentWeek;
        
        // Calculate all team scores for this week in one go (only for completed weeks)
        const teamScoresMap = isComplete ? await calculateAllTeamScoresForWeek(weekNum) : new Map();
        
        // Find which team slot this user's team is in
        let opponent = null;
        
        for (let i = 1; i <= 16; i++) {
          if (weekRow[`Team_${i}`] === teamId) {
            // Found the user's team, find their opponent
            if (i % 2 === 1) {
              // Odd number, opponent is the next team
              opponent = weekRow[`Team_${i + 1}`];
            } else {
              // Even number, opponent is the previous team
              opponent = weekRow[`Team_${i - 1}`];
            }
            break;
          }
        }

        if (opponent) {
          // Get opponent name from pre-loaded map
          const opponentName = teamNameMap.get(opponent) || opponent;

          // Determine if this week is complete or upcoming
          const isCurrentWeek = weekNum === currentWeek;
          
          // Get scores from pre-calculated map
          let teamScore = 0;
          let opponentScore = 0;
          let result: 'W' | 'L' | 'T' = 'L';
          
          if (isComplete) {
            teamScore = teamScoresMap.get(teamId) || 0;
            opponentScore = teamScoresMap.get(opponent) || 0;
            
            // Determine result based on scores
            if (teamScore > opponentScore) result = 'W';
            else if (teamScore === opponentScore) result = 'T';
            else result = 'L';
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

      const responseData = {
        success: true,
        data: {
          teamInfo,
          weeklyResult: weekResult
        }
      };

      // Cache the result
      weeklyResultsCache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now()
      });

      return NextResponse.json(responseData);
    }

    const responseData = {
      success: true,
      data: {
        teamInfo,
        weeklyResults
      }
    };

    // Cache the result
    weeklyResultsCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Get Team Weekly Results Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
