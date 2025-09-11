import { NextRequest, NextResponse } from 'next/server';
import { 
  makeWaiverPick, 
  getWaiverPicks,
  getWaiverDraftOrder,
  getWaiverDraftByWeek,
  updatePlayerOwnershipAfterWaiver,
  markWaiverPlayerAsDrafted,
  getWaivedPlayers
} from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('draftId');

    if (!draftId) {
      return NextResponse.json(
        { success: false, error: 'Draft ID is required' },
        { status: 400 }
      );
    }

    const picks = await getWaiverPicks(draftId);
    return NextResponse.json({
      success: true,
      data: picks
    });
  } catch (error) {
    console.error('Error fetching waiver picks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch waiver picks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'make-pick':
        const { draftId, teamId, playerId, pickNumber } = data;
        
        if (!draftId || !teamId || !playerId || !pickNumber) {
          return NextResponse.json(
            { success: false, error: 'Draft ID, team ID, player ID, and pick number are required' },
            { status: 400 }
          );
        }

        // Verify it's the team's turn to pick
        const draftOrder = await getWaiverDraftOrder(draftId);
        const currentPickTeam = draftOrder.find(team => team.draft_order === pickNumber);
        
        if (!currentPickTeam || currentPickTeam.team_id !== teamId) {
          return NextResponse.json(
            { success: false, error: 'It is not this team\'s turn to pick' },
            { status: 400 }
          );
        }

        // Check if player is available
        const waivedPlayers = await getWaivedPlayers();
        const availablePlayer = waivedPlayers.find(p => p.player_id === playerId);
        
        if (!availablePlayer) {
          return NextResponse.json(
            { success: false, error: 'Player is not available for waiver draft' },
            { status: 404 }
          );
        }

        // Make the pick
        await makeWaiverPick(draftId, teamId, playerId, pickNumber);
        
        // Update player ownership
        await updatePlayerOwnershipAfterWaiver(playerId, teamId);
        
        // Mark player as drafted
        await markWaiverPlayerAsDrafted(playerId);

        return NextResponse.json({
          success: true,
          message: 'Pick made successfully'
        });

      case 'auto-pick':
        const { draftId: autoDraftId, teamId: autoTeamId, pickNumber: autoPickNumber } = data;
        
        if (!autoDraftId || !autoTeamId || !autoPickNumber) {
          return NextResponse.json(
            { success: false, error: 'Draft ID, team ID, and pick number are required' },
            { status: 400 }
          );
        }

        // Get available players
        const availablePlayers = await getWaivedPlayers();
        
        if (availablePlayers.length === 0) {
          return NextResponse.json(
            { success: false, error: 'No players available for auto-pick' },
            { status: 404 }
          );
        }

        // Auto-pick the first available player
        const autoPlayer = availablePlayers[0];
        
        // Make the pick
        await makeWaiverPick(autoDraftId, autoTeamId, autoPlayer.player_id, autoPickNumber);
        
        // Update player ownership
        await updatePlayerOwnershipAfterWaiver(autoPlayer.player_id, autoTeamId);
        
        // Mark player as drafted
        await markWaiverPlayerAsDrafted(autoPlayer.player_id);

        return NextResponse.json({
          success: true,
          data: {
            playerId: autoPlayer.player_id,
            playerName: autoPlayer.player_name,
            position: autoPlayer.position
          },
          message: 'Auto-pick completed successfully'
        });

      case 'get-draft-status':
        const { draftId: statusDraftId } = data;
        
        if (!statusDraftId) {
          return NextResponse.json(
            { success: false, error: 'Draft ID is required' },
            { status: 400 }
          );
        }

        const draft = await getWaiverDraftByWeek(parseInt(statusDraftId));
        const statusDraftOrder = await getWaiverDraftOrder(statusDraftId);
        const picks = await getWaiverPicks(statusDraftId);
        const statusWaivedPlayers = await getWaivedPlayers();

        return NextResponse.json({
          success: true,
          data: {
            draft,
            draftOrder: statusDraftOrder,
            picks,
            waivedPlayers: statusWaivedPlayers,
            currentPick: picks.length + 1,
            totalPicks: statusWaivedPlayers.length,
            isComplete: picks.length >= statusWaivedPlayers.length
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in waiver picks POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process waiver pick request' },
      { status: 500 }
    );
  }
}
