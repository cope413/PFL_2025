import { NextRequest, NextResponse } from 'next/server';
import { getUsers } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug: Checking users in database...');

    // Get all users
    const users = await getUsers();

    console.log('Debug: Found users:', users);

    return NextResponse.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('Debug: Error getting users:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}