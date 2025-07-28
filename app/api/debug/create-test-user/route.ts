import { NextResponse } from 'next/server';
import { dbQueries } from '@/lib/database';

export async function POST() {
  try {
    // Create a test user
    const result = dbQueries.createUser.run(
      'cope413',
      'password123',
      'A1',
      'Test Team'
    );
    
    const userId = result.lastInsertRowid?.toString() || '0';
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Test user created',
        userId: userId,
        username: 'cope413',
        password: 'password123'
      }
    });
  } catch (error) {
    console.error('Create test user error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }, { status: 500 });
  }
} 