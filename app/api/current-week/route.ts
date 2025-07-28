import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

// Function to determine current week based on date ranges
function getCurrentWeek(db: Database.Database): number {
  try {
    const currentDate = new Date();
    const currentDateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log('Current date:', currentDateStr);
    
    // First, let's see what's in the Weeks table
    const allWeeks = db.prepare('SELECT * FROM Weeks ORDER BY week').all();
    console.log('All weeks in database:', allWeeks);
    
    // Check each week individually to see which one matches
    for (const weekRow of allWeeks) {
      const startDate = (weekRow as any).start;
      const endDate = (weekRow as any).end;
      const weekNum = (weekRow as any).week;
      
      console.log(`Checking week ${weekNum}: ${startDate} to ${endDate}`);
      console.log(`Current date ${currentDateStr} between ${startDate} and ${endDate}? ${currentDateStr >= startDate && currentDateStr <= endDate}`);
      
      if (currentDateStr >= startDate && currentDateStr <= endDate) {
        console.log(`Found matching week: ${weekNum}`);
        return weekNum;
      }
    }
    
    console.log('No current week found in date ranges');
    
    // If no current week found, check if we're in the offseason
    if (allWeeks.length > 0) {
      const firstWeek = allWeeks[0] as any;
      const lastWeek = allWeeks[allWeeks.length - 1] as any;
      
      console.log(`First week starts: ${firstWeek.start}, Last week ends: ${lastWeek.end}`);
      
      // If current date is before the season starts, return week 1
      if (currentDateStr < firstWeek.start) {
        console.log('Current date is before season starts, returning week 1');
        return 1;
      }
      
      // If current date is after the season ends, return the last week
      if (currentDateStr > lastWeek.end) {
        console.log(`Current date is after season ends, returning last week: ${lastWeek.week}`);
        return lastWeek.week;
      }
    }
    
    // If no weeks found in Weeks table, default to week 1
    console.log('No weeks found in Weeks table, defaulting to week 1');
    return 1;
  } catch (error) {
    console.error('Error determining current week:', error);
    return 1; // Default fallback
  }
}

export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    const dbPath = path.join(process.cwd(), 'PFL_2025.db');
    const db = new Database(dbPath);

    // Check if Weeks table exists
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='Weeks'
    `).get();

    if (!tableExists) {
      console.log('Weeks table does not exist, returning default week 1');
      return NextResponse.json({
        success: true,
        data: { currentWeek: 1 },
        message: 'Weeks table not found, using default week 1'
      });
    }

    const currentWeek = getCurrentWeek(db);
    
    console.log('Current week determined:', currentWeek);

    return NextResponse.json({
      success: true,
      data: { currentWeek },
      message: `Current week is ${currentWeek}`
    });

  } catch (error) {
    console.error('Error getting current week:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to get current week'
    }, { status: 500 });
  }
} 