import { NextRequest, NextResponse } from 'next/server';
import { dbQueries } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import Database from 'better-sqlite3';
import path from 'path';

interface WeeklyResult {
  week: number;
  opponent: string;
  opponentName: string;
  teamScore: number;
  opponentScore: number;
  teamProjected: number;
  opponentProjected: number;
  result: 'W' | 'L' | 'T';
  date: string;
  isComplete: boolean;
}

interface TeamInfo {
  teamId: string;
  teamName: string;
  record: {
    wins: number;
    losses: number;
    ties: number;
  };
  pointsFor: number;
  pointsAgainst: number;
  rank: number;
  division: string;
}

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        error: 'No authorization token provided' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid or expired token' 
      }, { status: 401 });
    }

    // Get the user's full data from the database to get their team
    const userData = dbQueries.getUserById.get(user.id) as any;
    
    if (!userData) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const week = searchParams.get('week');

    console.log('Getting weekly results for user:', userData.team, 'week:', week);

    // Connect to the database
    const dbPath = path.join(process.cwd(), 'PFL_2025.db');
    const db = new Database(dbPath);

    // Get team information from standings
    const teamStanding = db.prepare(`
      SELECT 
        s.Team_ID as teamId,
        COALESCE(u.team_name, u.username) as teamName,
        COALESCE(s.Wins, 0) as wins,
        COALESCE(s.Losses, 0) as losses,
        COALESCE(s.Ties, 0) as ties,
        COALESCE(s.PF, 0.0) as pointsFor,
        COALESCE(s.PA, 0.0) as pointsAgainst,
        COALESCE(s.Division, 'A') as division
      FROM Standings s
      LEFT JOIN user u ON s.Team_ID = u.team
      WHERE s.Team_ID = ?
    `).get(userData.team) as any;

    if (!teamStanding) {
      return NextResponse.json({
        success: false,
        error: 'Team not found in standings'
      }, { status: 404 });
    }

    // Calculate rank
    const allStandings = db.prepare(`
      SELECT 
        s.Team_ID,
        COALESCE(s.Wins, 0) as wins,
        COALESCE(s.PF, 0.0) as pointsFor
      FROM Standings s
      ORDER BY s.Wins DESC, s.PF DESC
    `).all() as any[];

    const rank = allStandings.findIndex(s => s.Team_ID === userData.team) + 1;

    const teamInfo: TeamInfo = {
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

    // Get weekly results (mock data for now since we don't have actual weekly scores)
    const weeklyResults: WeeklyResult[] = [];
    
    // Generate mock weekly results for weeks 1-18
    for (let weekNum = 1; weekNum <= 18; weekNum++) {
      // Skip if specific week is requested and doesn't match
      if (week && parseInt(week) !== weekNum) {
        continue;
      }

      // Generate mock opponent
      const opponents = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4'];
      const opponent = opponents[(weekNum - 1) % opponents.length];
      
      // Get opponent name
      const opponentData = db.prepare(`
        SELECT COALESCE(team_name, username) as display_name 
        FROM user 
        WHERE team = ?
      `).get(opponent) as any;
      
      const opponentName = opponentData?.display_name || opponent;

      // Generate mock scores
      const teamScore = Math.floor(Math.random() * 50) + 80; // 80-130 range
      const opponentScore = Math.floor(Math.random() * 50) + 80;
      const teamProjected = teamScore + Math.floor(Math.random() * 20) - 10; // ±10 from actual
      const opponentProjected = opponentScore + Math.floor(Math.random() * 20) - 10;

      // Determine result
      let result: 'W' | 'L' | 'T' = 'L';
      if (teamScore > opponentScore) result = 'W';
      else if (teamScore === opponentScore) result = 'T';

      weeklyResults.push({
        week: weekNum,
        opponent,
        opponentName,
        teamScore,
        opponentScore,
        teamProjected,
        opponentProjected,
        result,
        date: `2024-09-${String(weekNum + 20).padStart(2, '0')}`,
        isComplete: weekNum < 5 // Assume weeks 1-4 are complete
      });
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
    console.error('Error fetching team weekly results:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch team weekly results' 
    }, { status: 500 });
  }
} 