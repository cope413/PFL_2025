import { NextResponse } from 'next/server';
import { createUser } from '@/lib/database';
import { computeHash } from '@/lib/auth';

export async function POST() {
  try {

    const hashedPassword = await computeHash('password123');
    
    // Create a test user
    const result = await createUser(
      'jlewin5',
      hashedPassword,
      'A8',
      'Test Team'
    );

    const userId = result.lastInsertRowid?.toString() || '0';

    return NextResponse.json({
      success: true,
      data: {
        message: 'Test user created',
        userId: userId,
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