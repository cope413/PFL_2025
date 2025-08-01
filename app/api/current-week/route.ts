import { getCurrentWeek, getResults } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if Weeks table exists
    const tableExists = getResults(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='Weeks'
    `);

    if (!tableExists) {
      console.log('Weeks table does not exist, returning default week 1');
      return NextResponse.json({
        success: true,
        data: { currentWeek: 1 },
        message: 'Weeks table not found, using default week 1'
      });
    }

    const currentWeek = await getCurrentWeek();

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