import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { getAllUsers, updateUserAdminStatus, deleteUserById, updateUserInfo } from '@/lib/database';

// GET /api/admin/users - Get all users
export async function GET(request: NextRequest) {
  try {
    const adminUser = requireAdmin(request);
    const users = await getAllUsers();
    
    return NextResponse.json({
      success: true,
      data: users,
      message: `Retrieved ${users.length} users`
    });
  } catch (error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: error instanceof Error && error.message.includes('Admin privileges') ? 403 : 500 }
    );
  }
}

// PUT /api/admin/users - Update user admin status
export async function PUT(request: NextRequest) {
  try {
    const adminUser = requireAdmin(request);
    const { userId, isAdmin } = await request.json();
    
    await updateUserAdminStatus(userId, isAdmin);
    
    return NextResponse.json({
      success: true,
      message: 'User admin status updated successfully'
    });
  } catch (error) {
    console.error('Admin users PUT error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: error instanceof Error && error.message.includes('Admin privileges') ? 403 : 500 }
    );
  }
}

// PATCH /api/admin/users - Update user information
export async function PATCH(request: NextRequest) {
  try {
    const adminUser = requireAdmin(request);
    const { userId, username, team, email } = await request.json();
    
    await updateUserInfo(userId, username, team, email);
    
    return NextResponse.json({
      success: true,
      message: 'User information updated successfully'
    });
  } catch (error) {
    console.error('Admin users PATCH error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: error instanceof Error && error.message.includes('Admin privileges') ? 403 : 500 }
    );
  }
}

// DELETE /api/admin/users - Delete a user
export async function DELETE(request: NextRequest) {
  try {
    const adminUser = requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    await deleteUserById(userId);
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Admin users DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: error instanceof Error && error.message.includes('Admin privileges') ? 403 : 500 }
    );
  }
}
