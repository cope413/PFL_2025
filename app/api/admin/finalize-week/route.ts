import { NextRequest, NextResponse } from 'next/server';
import { getResults, getFirstResult } from '@/lib/database';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    // Verify admin access (this should be handled by middleware in production)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Admin access required'
      }, { status: 401 });
    }

    const { week } = await request.json();
    
    if (!week || typeof week !== 'number' || week < 1 || week > 14) {
      return NextResponse.json({
        success: false,
        error: 'Invalid week number. Must be between 1 and 14.'
      }, { status: 400 });
    }

    // Check if week is already finalized
    const weekStatus = await getFirstResult({
      sql: "SELECT is_finalized FROM WeekStatus WHERE week = ?",
      args: [week]
    });

    if (weekStatus?.is_finalized) {
      return NextResponse.json({
        success: false,
        error: `Week ${week} has already been finalized.`
      }, { status: 400 });
    }

    // Execute the finalization script
    console.log(`Executing finalization script for week ${week}...`);
    
    try {
      // Use the generic script with week parameter
      const scriptPath = `/home/cope413/Documents/GitHub/PFL_2025/scripts/finalize-week-generic.js`;
      
      const { stdout, stderr } = await execAsync(`node ${scriptPath} ${week}`, {
        cwd: '/home/cope413/Documents/GitHub/PFL_2025',
        timeout: 30000 // 30 second timeout
      });
      
      if (stderr) {
        console.error('Script stderr:', stderr);
      }
      
      console.log('Script output:', stdout);
      
      // Mark week as finalized in the database
      await finalizeWeek(week);
      
    } catch (error) {
      console.error('Error executing finalization script:', error);
      throw new Error(`Failed to execute finalization script: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: `Week ${week} has been finalized successfully.`,
      data: {
        week,
        matchupResults,
        weeklyResults
      }
    });

  } catch (error) {
    console.error('Error finalizing week:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to finalize week'
    }, { status: 500 });
  }
}

async function updateTeamStandings(teamId: string, result: string, pointsFor: number, pointsAgainst: number) {
  try {
    // Get current standings
    const currentStanding = await getFirstResult({
      sql: "SELECT * FROM Standings WHERE Team_ID = ?",
      args: [teamId]
    });

    if (!currentStanding) {
      // Create new standing record if it doesn't exist
      await getResults({
        sql: `INSERT INTO Standings (Team_ID, Wins, Losses, Ties, PF, PA, Division) 
              VALUES (?, 0, 0, 0, 0, 0, ?)`,
        args: [teamId, getDivisionFromTeamId(teamId)]
      });
    }

    // Update standings based on result
    let wins = currentStanding?.Wins || 0;
    let losses = currentStanding?.Losses || 0;
    let ties = currentStanding?.Ties || 0;
    let pf = (currentStanding?.PF || 0) + pointsFor;
    let pa = (currentStanding?.PA || 0) + pointsAgainst;

    if (result === 'W') {
      wins += 1;
    } else if (result === 'L') {
      losses += 1;
    } else if (result === 'T') {
      ties += 1;
    }

    // Update or insert standings
    if (currentStanding) {
      await getResults({
        sql: `UPDATE Standings 
              SET Wins = ?, Losses = ?, Ties = ?, PF = ?, PA = ?
              WHERE Team_ID = ?`,
        args: [wins, losses, ties, pf, pa, teamId]
      });
    } else {
      await getResults({
        sql: `INSERT INTO Standings (Team_ID, Wins, Losses, Ties, PF, PA, Division)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [teamId, wins, losses, ties, pf, pa, getDivisionFromTeamId(teamId)]
      });
    }

  } catch (error) {
    console.error(`Error updating standings for team ${teamId}:`, error);
    throw error;
  }
}

function getDivisionFromTeamId(teamId: string): string {
  // Extract division from team ID (e.g., A1 -> A, B2 -> B, C3 -> C)
  return teamId.charAt(0).toUpperCase();
}

async function finalizeWeek(week: number) {
  try {
    // Check if WeekStatus table exists, create if not
    const tableExists = await getResults({
      sql: "SELECT name FROM sqlite_master WHERE type='table' AND name='WeekStatus'"
    });

    if (!tableExists || tableExists.length === 0) {
      // Create WeekStatus table
      await getResults(`
        CREATE TABLE IF NOT EXISTS WeekStatus (
          week INTEGER PRIMARY KEY,
          is_finalized BOOLEAN DEFAULT FALSE,
          finalized_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Mark week as finalized
    await getResults({
      sql: `INSERT OR REPLACE INTO WeekStatus (week, is_finalized, finalized_at)
            VALUES (?, TRUE, CURRENT_TIMESTAMP)`,
      args: [week]
    });

  } catch (error) {
    console.error(`Error finalizing week ${week}:`, error);
    throw error;
  }
}

async function storeWeeklyScores(week: number, weeklyResults: any[]) {
  try {
    // Check if WeeklyScores table exists, create if not
    const tableExists = await getResults({
      sql: "SELECT name FROM sqlite_master WHERE type='table' AND name='WeeklyScores'"
    });

    if (!tableExists || tableExists.length === 0) {
      // Create WeeklyScores table
      await getResults(`
        CREATE TABLE IF NOT EXISTS WeeklyScores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          week INTEGER NOT NULL,
          team_id TEXT NOT NULL,
          score REAL NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(week, team_id)
        )
      `);
    }

    // Store scores for this week
    for (const result of weeklyResults) {
      await getResults({
        sql: `INSERT OR REPLACE INTO WeeklyScores (week, team_id, score)
              VALUES (?, ?, ?)`,
        args: [result.week, result.teamId, result.score]
      });
    }

  } catch (error) {
    console.error(`Error storing weekly scores for week ${week}:`, error);
    throw error;
  }
}
