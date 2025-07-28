import { NextRequest, NextResponse } from 'next/server';
import { loginUser, generateToken } from '@/lib/auth';
import { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    console.log('Login API called');
    
    const body = await request.json();
    const { username, password } = body;
    
    console.log('Login attempt for:', username);

    if (!username || !password) {
      console.log('Missing credentials');
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Missing required fields: username, password'
      }, { status: 400 });
    }

    console.log('Calling loginUser function...');
    // Login the user
    const user = await loginUser({ username, password });
    
    console.log('Login successful, generating token...');
    // Generate authentication token
    const token = generateToken(user);

    console.log('Returning success response');
    return NextResponse.json<ApiResponse<{ user: typeof user; token: string }>>({
      success: true,
      data: { user, token },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    if (error instanceof Error) {
      // Check if it's a database error
      if (error.message.includes('no such table') || error.message.includes('database')) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: 'Database error: ' + error.message
        }, { status: 500 });
      }
      
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