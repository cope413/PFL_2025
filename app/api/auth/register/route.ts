import { NextRequest, NextResponse } from 'next/server';
import { registerUser, generateToken } from '@/lib/auth';
import { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, teamId } = body;

    if (!username || !password || !teamId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Missing required fields: username, password, teamId'
      }, { status: 400 });
    }

    // Register the user
    const user = await registerUser({ username, password, teamId });
    
    // Generate authentication token
    const token = generateToken(user);

    // Send welcome email if email is provided
    if (user.email) {
      try {
        const { NotificationService } = await import('@/lib/email');
        await NotificationService.sendWelcomeEmail(
          user.email,
          user.username,
          user.team_name || user.username
        );
      } catch (error) {
        console.error('Failed to send welcome email:', error);
        // Don't fail registration if email fails
      }
    }

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