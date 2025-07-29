import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import Database from 'better-sqlite3';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Get user from authentication token
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Get team ID from query parameters (optional - if not provided, use user's team)
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId') || authUser.team;

    if (!teamId) {
      return NextResponse.json({
        success: false,
        error: 'Team ID is required'
      }, { status: 400 });
    }

    // Connect to database
    const dbPath = path.join(process.cwd(), 'PFL_2025.db');
    const db = new Database(dbPath);

    // Get players for the specified team
    const players = db.prepare(`
      SELECT 
        p.player_ID as id,
        p.player_name as name,
        p.position,
        p.team_name as nflTeam,
        p.owner_ID as team,
        p.team_id,
        COALESCE(n.bye, 0) as byeWeek
      FROM Players p
      LEFT JOIN NFL_Teams n ON p.team_id = n.team_id
      WHERE p.owner_ID = ?
      ORDER BY p.position, p.player_name
    `).all(teamId);

    db.close();

    // Transform the data to match the expected format
    const transformedPlayers = players.map((player: any) => ({
      id: player.id.toString(),
      name: player.name,
      position: player.position,
      team: player.team,
      nflTeam: player.nflTeam,
      projectedPoints: Math.random() * 30 + 10, // Mock projected points
      status: 'healthy' as const, // Mock status
      byeWeek: player.byeWeek || undefined,
      teamId: player.team_id,
      ownerId: player.team
    }));

    return NextResponse.json({
      success: true,
      data: transformedPlayers
    });

  } catch (error) {
    console.error('Get Team Roster Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 