import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { ApiResponse } from '@/lib/types';
import { getUserById } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Get user from authentication token
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Get full user data from database
    const user = await getUserById(authUser.id);
    if (!user) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<typeof user>>({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get User Error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get user from authentication token
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const body = await request.json();
    const { username, email, avatar } = body;

    // Import updateUser function
    const { updateUser } = await import('@/lib/auth');
    
    // Update user profile
    const updatedUser = await updateUser(authUser.id, { username, email, avatar });

    return NextResponse.json<ApiResponse<typeof updatedUser>>({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update User Error:', error);
    
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