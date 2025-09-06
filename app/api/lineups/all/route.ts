import { NextRequest, NextResponse } from 'next/server';
import { getLineup, getAllUsers, getPlayerById } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const week = searchParams.get('week');

    if (!week) {
      return NextResponse.json({
        success: false,
        error: 'Week parameter is required'
      }, { status: 400 });
    }

    const weekNumber = parseInt(week);
    if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 18) {
      return NextResponse.json({
        success: false,
        error: 'Invalid week number. Must be between 1 and 18'
      }, { status: 400 });
    }

    // Get all users
    const users = await getAllUsers();
    
    // Get lineups for all teams for the specified week
    const allLineups = [];
    
    for (const user of users) {
      try {
        const lineup = await getLineup(user.team, weekNumber);
        
        if (lineup) {
          // Get player names for each position
          const lineupWithNames = {
            teamId: user.team,
            teamName: user.team_name || user.username,
            ownerName: user.owner_name || user.username,
            QB: '',
            RB_1: '',
            WR_1: '',
            FLEX_1: '',
            FLEX_2: '',
            TE: '',
            K: '',
            DEF: ''
          };

          // Fetch player names for each position
          for (const [position, playerId] of Object.entries(lineup)) {
            if (playerId && typeof playerId === 'string' && position !== 'owner_ID' && position !== 'week') {
              try {
                const player = await getPlayerById(playerId);
                if (player) {
                  lineupWithNames[position as keyof typeof lineupWithNames] = player.player_name || 'Unknown Player';
                }
              } catch (error) {
                console.warn(`Failed to get player name for ID ${playerId}:`, error);
                lineupWithNames[position as keyof typeof lineupWithNames] = 'Unknown Player';
              }
            }
          }

          allLineups.push(lineupWithNames);
        }
      } catch (error) {
        console.warn(`Failed to get lineup for team ${user.team}:`, error);
      }
    }

    // Sort lineups by team ID
    allLineups.sort((a, b) => a.teamId.localeCompare(b.teamId));

    return NextResponse.json({
      success: true,
      data: {
        week: weekNumber,
        lineups: allLineups,
        totalTeams: allLineups.length,
        totalTeamsInLeague: users.length
      }
    });

  } catch (error) {
    console.error('Error fetching all lineups:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch lineups'
    }, { status: 500 });
  }
}
