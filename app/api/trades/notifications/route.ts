import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getPendingTradeCount } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    if (!authUser.team) {
      return NextResponse.json({ success: true, data: { count: 0 } });
    }

    const count = await getPendingTradeCount(authUser.team);
    return NextResponse.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Trade notifications GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch trade notifications' }, { status: 500 });
  }
}


