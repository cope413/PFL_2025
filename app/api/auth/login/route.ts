import { NextRequest, NextResponse } from 'next/server';
import { loginUser, generateToken } from '@/lib/auth';
import { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Missing required fields: username, password'
      }, { status: 400 });
    }

    // Login the user
    const user = await loginUser({ username, password });
    
    // Generate authentication token
    const token = generateToken(user);

    return NextResponse.json<ApiResponse<{ user: typeof user; token: string }>>({
      success: true,
      data: { user, token },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login Error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: error.message
      }, { status: 401 });
    }

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 