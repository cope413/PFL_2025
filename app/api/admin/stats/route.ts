import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { getSystemStats } from '@/lib/database';

// GET /api/admin/stats - Get system statistics
export async function GET(request: NextRequest) {
  try {
    const adminUser = requireAdmin(request);
    
    const stats = await getSystemStats();
    
    return NextResponse.json({
      success: true,
      data: stats,
      message: 'System statistics retrieved successfully'
    });
    
  } catch (error) {
    console.error('Admin stats GET error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: error instanceof Error && error.message.includes('Admin privileges') ? 403 : 500 });
  }
}
