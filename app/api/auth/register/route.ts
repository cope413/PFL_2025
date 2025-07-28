import { NextRequest, NextResponse } from 'next/server';
import { registerUser, generateToken } from '@/lib/auth';
import { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, avatar } = body;

    if (!username || !email || !password) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Missing required fields: username, email, password'
      }, { status: 400 });
    }

    // Register the user
    const user = await registerUser({ username, email, password, avatar });
    
    // Generate authentication token
    const token = generateToken(user);

    return NextResponse.json<ApiResponse<{ user: typeof user; token: string }>>({
      success: true,
      data: { user, token },
      message: 'User registered successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Registration Error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: error.message
      }, { status: 400 });
    }

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 