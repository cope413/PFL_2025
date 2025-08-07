import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { getAllPlayersWithStats, updatePlayerWithStats } from '@/lib/database';

// GET /api/admin/players - Get all players with stats
export async function GET(request: NextRequest) {
  try {
    const adminUser = requireAdmin(request);
    const players = await getAllPlayersWithStats();
    
    return NextResponse.json({
      success: true,
      data: players,
      message: `Retrieved ${players.length} players`
    });
  } catch (error) {
    console.error('Admin players GET error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: error instanceof Error && error.message.includes('Admin privileges') ? 403 : 500 }
    );
  }
}

// PATCH /api/admin/players - Update player information and stats
export async function PATCH(request: NextRequest) {
  try {
    const adminUser = requireAdmin(request);
    const { 
      playerId, 
      name, 
      position, 
      team, 
      nflTeam, 
      ownerId, 
      weeklyStats 
    } = await request.json();
    
    await updatePlayerWithStats(playerId, name, position, team, nflTeam, ownerId, weeklyStats);
    
    return NextResponse.json({
      success: true,
      message: 'Player information updated successfully'
    });
  } catch (error) {
    console.error('Admin players PATCH error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: error instanceof Error && error.message.includes('Admin privileges') ? 403 : 500 }
    );
  }
}
