import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export interface Matchup {
  id: string;
  week: number;
  team1_id: string;
  team2_id: string;
  team1_name: string;
  team2_name: string;
  team1_score: number;
  team2_score: number;
  team1_projected: number;
  team2_projected: number;
  date: string;
  is_complete: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Function to determine current week based on date ranges
function getCurrentWeek(db: Database.Database, requestId?: string): number {
  try {
    const currentDate = new Date();
    const currentDateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log(`[${requestId || 'unknown'}] Current date:`, currentDateStr);
    
    // First, let's see what's in the Weeks table
    const allWeeks = db.prepare('SELECT * FROM Weeks ORDER BY week').all();
    console.log(`[${requestId || 'unknown'}] All weeks in database:`, allWeeks);
    
    // Check each week individually to see which one matches
    for (const weekRow of allWeeks) {
      const startDate = (weekRow as any).start;
      const endDate = (weekRow as any).end;
      const weekNum = (weekRow as any).week;
      
      console.log(`[${requestId || 'unknown'}] Checking week ${weekNum}: ${startDate} to ${endDate}`);
      console.log(`[${requestId || 'unknown'}] Current date ${currentDateStr} between ${startDate} and ${endDate}? ${currentDateStr >= startDate && currentDateStr <= endDate}`);
      
      if (currentDateStr >= startDate && currentDateStr <= endDate) {
        console.log(`[${requestId || 'unknown'}] Found matching week: ${weekNum}`);
        return weekNum;
      }
    }
    
    console.log(`[${requestId || 'unknown'}] No current week found in date ranges`);
    
    // If no current week found, check if we're in the offseason
    if (allWeeks.length > 0) {
      const firstWeek = allWeeks[0] as any;
      const lastWeek = allWeeks[allWeeks.length - 1] as any;
      
      console.log(`[${requestId || 'unknown'}] First week starts: ${firstWeek.start}, Last week ends: ${lastWeek.end}`);
      
      // If current date is before the season starts, return week 1
      if (currentDateStr < firstWeek.start) {
        console.log(`[${requestId || 'unknown'}] Current date is before season starts, returning week 1`);
        return 1;
      }
      
      // If current date is after the season ends, return the last week
      if (currentDateStr > lastWeek.end) {
        console.log(`[${requestId || 'unknown'}] Current date is after season ends, returning last week: ${lastWeek.week}`);
        return lastWeek.week;
      }
    }
    
    // If no weeks found in Weeks table, default to week 1
    console.log(`[${requestId || 'unknown'}] No weeks found in Weeks table, defaulting to week 1`);
    return 1;
  } catch (error) {
    console.error(`[${requestId || 'unknown'}] Error determining current week:`, error);
    return 1; // Default fallback
  }
}

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] API call started`);
  
  try {
    const { searchParams } = new URL(request.url);
    let week = searchParams.get('week');
    const leagueId = searchParams.get('leagueId') || 'l1'; // Default league ID

    console.log(`[${requestId}] Request parameters - week: ${week}, leagueId: ${leagueId}`);

    // Connect to the PFL_2025.db database
    const dbPath = path.join(process.cwd(), 'PFL_2025.db');
    const db = new Database(dbPath);

    // Check what tables exist
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log(`[${requestId}] Available tables:`, tables);

    // If no week parameter provided, determine current week
    if (!week) {
      const currentWeek = getCurrentWeek(db, requestId);
      week = currentWeek.toString();
      console.log(`[${requestId}] No week parameter provided, using current week: ${week}`);
    }

    // Check if WeeklyMatchups table exists
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='WeeklyMatchups'
    `).get();

    console.log(`[${requestId}] WeeklyMatchups table exists:`, !!tableExists);

    if (tableExists) {
      // Check if there's data in WeeklyMatchups table
      const weeklyMatchupsData = db.prepare(`
        SELECT * FROM WeeklyMatchups WHERE week = ?
      `).all(week);
      
      console.log(`[${requestId}] WeeklyMatchups data for week ${week}:`, weeklyMatchupsData);
    }

    if (!tableExists) {
      // If WeeklyMatchups doesn't exist, return mock data with real team names
      
      // Get team names from user table
      const teamNames = db.prepare(`
        SELECT team, COALESCE(team_name, username) as display_name 
        FROM user 
        ORDER BY team
      `).all() as Array<{team: string, display_name: string}>;
      
      console.log(`[${requestId}] Team names from database:`, teamNames);
      
      // Create a map of team IDs to display names
      const teamNameMap = new Map<string, string>();
      teamNames.forEach(team => {
        teamNameMap.set(team.team, team.display_name);
      });
      
      console.log(`[${requestId}] Team name map:`, Object.fromEntries(teamNameMap));
      
      const mockMatchups: Matchup[] = [
        {
          id: 'm1',
          week: parseInt(week),
          team1_id: 'A1',
          team2_id: 'A2',
          team1_name: teamNameMap.get('A1') || 'A1',
          team2_name: teamNameMap.get('A2') || 'A2',
          team1_score: 124.2,
          team2_score: 98.7,
          team1_projected: 120.0,
          team2_projected: 105.0,
          date: '2024-09-22',
          is_complete: true
        },
        {
          id: 'm2',
          week: parseInt(week),
          team1_id: 'A3',
          team2_id: 'A4',
          team1_name: teamNameMap.get('A3') || 'A3',
          team2_name: teamNameMap.get('A4') || 'A4',
          team1_score: 0,
          team2_score: 0,
          team1_projected: 115.5,
          team2_projected: 110.2,
          date: '2024-09-22',
          is_complete: false
        },
        {
          id: 'm3',
          week: parseInt(week),
          team1_id: 'B1',
          team2_id: 'B2',
          team1_name: teamNameMap.get('B1') || 'B1',
          team2_name: teamNameMap.get('B2') || 'B2',
          team1_score: 0,
          team2_score: 0,
          team1_projected: 118.3,
          team2_projected: 112.7,
          date: '2024-09-22',
          is_complete: false
        },
        {
          id: 'm4',
          week: parseInt(week),
          team1_id: 'B3',
          team2_id: 'B4',
          team1_name: teamNameMap.get('B3') || 'B3',
          team2_name: teamNameMap.get('B4') || 'B4',
          team1_score: 0,
          team2_score: 0,
          team1_projected: 106.8,
          team2_projected: 109.4,
          date: '2024-09-22',
          is_complete: false
        }
      ];

      return NextResponse.json<ApiResponse<Matchup[]>>({
        success: true,
        data: mockMatchups,
        message: 'Mock matchups retrieved (WeeklyMatchups table not found)'
      });
    }

    // If WeeklyMatchups exists, query it and transform the data
    let query = `SELECT * FROM WeeklyMatchups`;
    const params: any[] = [];
    
    if (week) {
      query += ' WHERE Week = ?';
      params.push(parseInt(week));
    }
    
    query += ' ORDER BY Week DESC';

    const weeklyData = db.prepare(query).all(...params) as any[];

    // Get team names from user table for mapping
    const teamNames = db.prepare(`
      SELECT team, COALESCE(team_name, username) as display_name 
      FROM user 
      ORDER BY team
    `).all() as Array<{team: string, display_name: string}>;
    
    console.log(`[${requestId}] Team names from database:`, teamNames);
    
    // Create a map of team IDs to display names
    const teamNameMap = new Map<string, string>();
    teamNames.forEach(team => {
      teamNameMap.set(team.team, team.display_name);
    });
    
    console.log(`[${requestId}] Team name map:`, Object.fromEntries(teamNameMap));

    // Transform the weekly data into individual matchups
    const matchups: Matchup[] = [];
    
    weeklyData.forEach((weekRow, weekIndex) => {
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
          
          matchups.push({
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

    // If no matchups found, return mock data
    if (matchups.length === 0) {
      const mockMatchups: Matchup[] = [
        {
          id: 'm1',
          week: parseInt(week),
          team1_id: 't1',
          team2_id: 't2',
          team1_name: 'The Touchdown Titans',
          team2_name: 'Team A2',
          team1_score: 124.2,
          team2_score: 98.7,
          team1_projected: 120.0,
          team2_projected: 105.0,
          date: '2024-09-22',
          is_complete: true
        },
        {
          id: 'm2',
          week: parseInt(week),
          team1_id: 't3',
          team2_id: 't4',
          team1_name: 'Team A3',
          team2_name: 'Team A4',
          team1_score: 0,
          team2_score: 0,
          team1_projected: 115.5,
          team2_projected: 110.2,
          date: '2024-09-22',
          is_complete: false
        },
        {
          id: 'm3',
          week: parseInt(week),
          team1_id: 't5',
          team2_id: 't6',
          team1_name: 'Team B1',
          team2_name: 'Team B2',
          team1_score: 0,
          team2_score: 0,
          team1_projected: 118.3,
          team2_projected: 112.7,
          date: '2024-09-22',
          is_complete: false
        },
        {
          id: 'm4',
          week: parseInt(week),
          team1_id: 't7',
          team2_id: 't8',
          team1_name: 'Team B3',
          team2_name: 'Team B4',
          team1_score: 0,
          team2_score: 0,
          team1_projected: 106.8,
          team2_projected: 109.4,
          date: '2024-09-22',
          is_complete: false
        }
      ];

      console.log(`[${requestId}] Final mock matchups:`, mockMatchups);

      return NextResponse.json({
        success: true,
        data: mockMatchups,
        message: `Mock matchups retrieved (no data in WeeklyMatchups table)`
      });
    }

    return NextResponse.json<ApiResponse<Matchup[]>>({
      success: true,
      data: matchups,
      message: 'Matchups retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching matchups:', error);
    
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: `Failed to fetch matchups: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
} 