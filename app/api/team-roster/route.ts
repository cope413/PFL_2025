import { NextResponse } from 'next/server';
import { dbQueries } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import Database from 'better-sqlite3';
import path from 'path';

export async function GET(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        error: 'No authorization token provided' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid or expired token' 
      }, { status: 401 });
    }

    // Get the user's full data from the database to get their team
    const userData = dbQueries.getUserById.get(user.id) as any;
    
    if (!userData) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    console.log('User data:', userData);
    console.log('Looking for players with owner_ID:', userData.team);

    // Connect to the database to get bye week information
    const dbPath = path.join(process.cwd(), 'PFL_2025.db');
    const db = new Database(dbPath);

    // Get players with bye week information by joining with NFL_Teams table
    const playersWithBye = db.prepare(`
      SELECT 
        p.player_ID,
        p.player_name,
        p.position,
        p.team_name,
        p.team_id,
        p.owner_ID,
        COALESCE(n.bye, 0) as bye_week
      FROM Players p
      LEFT JOIN NFL_Teams n ON p.team_id = n.team_id
      WHERE p.owner_ID = ?
    `).all(userData.team) as any[];
    
    console.log('Found players with bye weeks:', playersWithBye);
    
    // Transform the data to match the expected format
    const roster = playersWithBye.map(player => ({
      id: player.player_ID.toString(),
      name: player.player_name,
      position: player.position,
      team: player.team_name,
      nflTeam: player.team_name,
      projectedPoints: 0, // This would need to come from a separate stats table
      status: 'healthy' as const, // Default status
      isStarter: false, // Default to bench, would need to come from lineup table
      byeWeek: player.bye_week || 0, // Get bye week from NFL_Teams table
      recentPerformance: [0, 0], // Would need to come from stats table
      teamId: player.team_id,
      ownerId: player.owner_ID
    }));

    return NextResponse.json({
      success: true,
      data: roster
    });

  } catch (error) {
    console.error('Error fetching team roster:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch team roster' 
    }, { status: 500 });
  }
} 