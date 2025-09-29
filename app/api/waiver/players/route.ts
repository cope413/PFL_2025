import { NextRequest, NextResponse } from 'next/server';
import { 
  waivePlayer, 
  getWaivedPlayers, 
  getWaivedPlayersByTeam,
  getTeamRoster,
  getCurrentWeek,
  isWaiverWeek,
  getWaiverDeadline,
  removeWaivedPlayer,
  getUserByTeamId,
  getResults
} from '@/lib/database';
import { NotificationService } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const currentWeek = await getCurrentWeek();

    if (teamId) {
      const waivedPlayers = await getWaivedPlayersByTeam(teamId, currentWeek);
      return NextResponse.json({
        success: true,
        data: waivedPlayers
      });
    } else {
      const waivedPlayers = await getWaivedPlayers(currentWeek);
      return NextResponse.json({
        success: true,
        data: waivedPlayers
      });
    }
  } catch (error) {
    console.error('Error fetching waived players:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch waived players' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'waive-player':
        const { playerId, teamId, waiverOrder } = data;
        
        if (!playerId || !teamId || waiverOrder === undefined) {
          return NextResponse.json(
            { success: false, error: 'Player ID, team ID, and waiver order are required' },
            { status: 400 }
          );
        }

        // Check if it's a valid waiver week
        const currentWeek = await getCurrentWeek();
        if (!isWaiverWeek(currentWeek)) {
          return NextResponse.json(
            { success: false, error: 'Players can only be waived during waiver weeks (2, 5, 8, 11)' },
            { status: 400 }
          );
        }

        // Check if deadline has passed
        const deadline = await getWaiverDeadline(currentWeek);
        if (deadline && new Date() > deadline) {
          return NextResponse.json(
            { success: false, error: 'Waiver deadline has passed' },
            { status: 400 }
          );
        }

        // Verify the player belongs to the team
        const teamRoster = await getTeamRoster(teamId, currentWeek);
        const player = teamRoster.find(p => p.id === playerId);
        if (!player) {
          return NextResponse.json(
            { success: false, error: 'Player not found on team roster' },
            { status: 404 }
          );
        }

        // Check if player is already waived by this team
        const existingWaivedPlayers = await getWaivedPlayersByTeam(teamId, currentWeek);
        const alreadyWaived = existingWaivedPlayers.find(p => p.player_id === playerId);
        if (alreadyWaived) {
          return NextResponse.json(
            { success: false, error: 'Player has already been waived by this team' },
            { status: 400 }
          );
        }

        // Waive the player
        try {
          await waivePlayer(playerId, teamId, waiverOrder, currentWeek);
          
          // Send email notification
          try {
            // Get user information
            const user = await getUserByTeamId(teamId);
            
            // Get player information
            const playerInfo = await getResults({
              sql: 'SELECT player_name, position, team_name FROM Players WHERE player_ID = ?',
              args: [playerId]
            });
            
            if (user && user.email && playerInfo && playerInfo.length > 0) {
              const player = playerInfo[0];
              const deadline = await getWaiverDeadline(currentWeek);
              
              await NotificationService.sendPlayerWaivedNotification(
                user.email,
                user.username || user.owner_name || 'Team Owner',
                user.team_name || teamId,
                player.player_name,
                player.position,
                player.team_name,
                waiverOrder,
                deadline?.toISOString() || new Date().toISOString()
              );
              
              console.log(`Waiver notification sent to ${user.email} for player ${player.player_name}`);
            } else {
              console.warn(`Unable to send waiver notification - missing user info or player info for team ${teamId}, player ${playerId}`);
            }
          } catch (emailError) {
            console.error('Failed to send waiver notification email:', emailError);
            // Don't fail the waiver operation if email fails
          }
          
        } catch (error: any) {
          // Handle unique constraint violation
          if (error.message && error.message.includes('UNIQUE constraint failed')) {
            return NextResponse.json(
              { success: false, error: 'Player has already been waived by this team' },
              { status: 400 }
            );
          }
          throw error; // Re-throw other errors
        }

        return NextResponse.json({
          success: true,
          message: 'Player waived successfully'
        });

      case 'get-team-roster':
        const { teamId: rosterTeamId } = data;
        
        if (!rosterTeamId) {
          return NextResponse.json(
            { success: false, error: 'Team ID is required' },
            { status: 400 }
          );
        }

        const currentWeekForRoster = await getCurrentWeek();
        const roster = await getTeamRoster(rosterTeamId, currentWeekForRoster);
        return NextResponse.json({
          success: true,
          data: roster
        });

      case 'remove-waived-player':
        const { playerId: removePlayerId, teamId: removeTeamId } = data;
        
        if (!removePlayerId || !removeTeamId) {
          return NextResponse.json(
            { success: false, error: 'Player ID and team ID are required' },
            { status: 400 }
          );
        }

        // Check if it's a valid waiver week and before deadline
        const currentWeekRemove = await getCurrentWeek();
        if (!isWaiverWeek(currentWeekRemove)) {
          return NextResponse.json(
            { success: false, error: 'Players can only be removed from waiver list during waiver weeks (2, 5, 8, 11)' },
            { status: 400 }
          );
        }

        // Check if deadline has passed
        const deadlineRemove = await getWaiverDeadline(currentWeekRemove);
        if (deadlineRemove && new Date() > deadlineRemove) {
          return NextResponse.json(
            { success: false, error: 'Waiver deadline has passed' },
            { status: 400 }
          );
        }

        // Remove the player from waiver list
        try {
          await removeWaivedPlayer(removePlayerId, removeTeamId, currentWeekRemove);
          return NextResponse.json({
            success: true,
            message: 'Player removed from waiver list successfully'
          });
        } catch (error: any) {
          return NextResponse.json(
            { success: false, error: error.message || 'Failed to remove player from waiver list' },
            { status: 400 }
          );
        }

      case 'check-waiver-status':
        const currentWeekCheck = await getCurrentWeek();
        const isWaiver = isWaiverWeek(currentWeekCheck);
        const deadlineCheck = isWaiver ? await getWaiverDeadline(currentWeekCheck) : null;
        
        return NextResponse.json({
          success: true,
          data: {
            currentWeek: currentWeekCheck,
            isWaiverWeek: isWaiver,
            deadline: deadlineCheck?.toISOString(),
            canWaivePlayers: isWaiver && deadlineCheck ? new Date() <= deadlineCheck : false
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in waiver players POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process waiver player request' },
      { status: 500 }
    );
  }
}
