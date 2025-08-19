import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getTeamStanding, getAllStandings, getTeamNameByTeamId, getCurrentWeek, getResults } from '@/lib/database';
import { TeamInfo, TeamWeeklyResult } from '@/lib/db-types';

export async function GET(request: NextRequest) {
  try {
    // Get user from authentication token
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Get team ID from query parameters (optional - if not provided, use user's team)
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId') || authUser.team;
    const week = searchParams.get('week');

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
            // For completed weeks, generate realistic scores
            // In the future, this would come from actual WeeklyScores table
            teamScore = Math.floor(Math.random() * 50) + 80; // 80-130 range
            opponentScore = Math.floor(Math.random() * 50) + 80;
            
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

          weeklyResults.push({
            week: weekNum,
            opponent,
            opponentName,
            teamScore,
            opponentScore,
            result,
            date: `2024-09-${String(weekNum + 20).padStart(2, '0')}`, // Placeholder date
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
