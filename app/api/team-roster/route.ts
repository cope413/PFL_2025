import { NextResponse } from 'next/server';
import { dbQueries } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

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

    // Get players for this owner from the Players table using the team field
    const players = dbQueries.getPlayersByOwner.all(userData.team) as any[];
    
    console.log('Found players:', players);
    
    // Transform the data to match the expected format
    const roster = players.map(player => ({
      id: player.player_ID.toString(),
      name: player.player_name,
      position: player.position,
      team: player.team_name,
      nflTeam: player.team_name,
      projectedPoints: 0, // This would need to come from a separate stats table
      status: 'healthy' as const, // Default status
      isStarter: false, // Default to bench, would need to come from lineup table
      byeWeek: 0, // Would need to come from NFL schedule
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