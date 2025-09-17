import { NextRequest, NextResponse } from 'next/server';
import { 
  makeWaiverPick, 
  getWaiverPicks,
  getWaiverDraftOrder,
  getCustomDraftSequence,
  getWaiverDraftByWeek,
  updatePlayerOwnershipAfterWaiver,
  markWaiverPlayerAsDrafted,
  getWaivedPlayers,
  getResults
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
        
        console.log('Make pick request:', { draftId, teamId, playerId, pickNumber });
        
        if (!draftId || !teamId || !playerId || !pickNumber) {
          console.log('Missing required fields:', { draftId, teamId, playerId, pickNumber });
          return NextResponse.json(
            { success: false, error: 'Draft ID, team ID, player ID, and pick number are required' },
            { status: 400 }
          );
        }

        // Verify it's the team's turn to pick
        const customSequence = await getCustomDraftSequence(draftId);
        
        // Temporary fix: Use hardcoded custom sequence if database functions return empty
        const hardcodedCustomSequence = [
          { pick_number: 1, team_id: 'D4', round_number: 1, team_name: null, owner_name: 'John/Tom', username: 'Team Hapa' },
          { pick_number: 2, team_id: 'A1', round_number: 1, team_name: null, owner_name: 'Matt/Tyler', username: 'MattTyler' },
          { pick_number: 3, team_id: 'A4', round_number: 1, team_name: 'Cadrocks', owner_name: 'Noel', username: 'Cadrocks' },
          { pick_number: 4, team_id: 'C2', round_number: 1, team_name: 'Purdy-er than You Are', owner_name: 'Taylor', username: 'cope413' },
          { pick_number: 5, team_id: 'C3', round_number: 1, team_name: 'StraightCashHomey', owner_name: 'Corey', username: 'CHGrif' },
          { pick_number: 6, team_id: 'A1', round_number: 2, team_name: null, owner_name: 'Matt/Tyler', username: 'MattTyler' },
          { pick_number: 7, team_id: 'A4', round_number: 2, team_name: 'Cadrocks', owner_name: 'Noel', username: 'Cadrocks' },
          { pick_number: 8, team_id: 'C3', round_number: 2, team_name: 'StraightCashHomey', owner_name: 'Corey', username: 'CHGrif' },
          { pick_number: 9, team_id: 'A1', round_number: 3, team_name: null, owner_name: 'Matt/Tyler', username: 'MattTyler' },
          { pick_number: 10, team_id: 'C3', round_number: 3, team_name: 'StraightCashHomey', owner_name: 'Corey', username: 'CHGrif' }
        ];
        
        const finalCustomSequence = customSequence.length > 0 ? customSequence : hardcodedCustomSequence;
        
        let currentPickTeam = null;
        
        if (finalCustomSequence.length > 0) {
          // Use custom sequence
          currentPickTeam = finalCustomSequence.find(pick => pick.pick_number === pickNumber);
        } else {
          // Fallback to regular draft order
          const draftOrder = await getWaiverDraftOrder(draftId);
          currentPickTeam = draftOrder.find(team => team.draft_order === pickNumber);
        }
        
        if (!currentPickTeam || currentPickTeam.team_id !== teamId) {
          console.log('Validation failed:', { currentPickTeam, teamId, pickNumber });
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

      case 'undo-last-pick':
        const { draftId: undoDraftId } = data;
        
        if (!undoDraftId) {
          return NextResponse.json(
            { success: false, error: 'Draft ID is required' },
            { status: 400 }
          );
        }

        // Get the last pick
        const lastPick = await getResults({
          sql: 'SELECT * FROM WaiverPicks WHERE draft_id = ? ORDER BY pick_number DESC LIMIT 1',
          args: [undoDraftId]
        });

        if (!lastPick || lastPick.length === 0) {
          return NextResponse.json(
            { success: false, error: 'No picks to undo' },
            { status: 404 }
          );
        }

        const pickToUndo = lastPick[0];

        // Remove the pick from WaiverPicks
        await getResults({
          sql: 'DELETE FROM WaiverPicks WHERE draft_id = ? AND pick_number = ?',
          args: [undoDraftId, pickToUndo.pick_number]
        });

        // Revert player ownership to original team
        await getResults({
          sql: 'UPDATE Players SET owner_ID = ? WHERE player_ID = ?',
          args: [pickToUndo.team_id, pickToUndo.player_id]
        });

        // Mark player as available again
        await getResults({
          sql: 'UPDATE WaiverPlayers SET status = ? WHERE player_id = ?',
          args: ['available', pickToUndo.player_id]
        });

        return NextResponse.json({
          success: true,
          message: `Undid pick ${pickToUndo.pick_number}: ${pickToUndo.player_id} back to team ${pickToUndo.team_id}`,
          data: {
            undonePick: pickToUndo
          }
        });

      case 'clear-draft':
        const { draftId: clearDraftId } = data;
        
        if (!clearDraftId) {
          return NextResponse.json(
            { success: false, error: 'Draft ID is required' },
            { status: 400 }
          );
        }

        // Get all picks for this draft
        const allPicks = await getResults({
          sql: 'SELECT * FROM WaiverPicks WHERE draft_id = ? ORDER BY pick_number',
          args: [clearDraftId]
        });

        if (!allPicks || allPicks.length === 0) {
          return NextResponse.json(
            { success: false, error: 'No picks to clear' },
            { status: 404 }
          );
        }

        // Revert all player ownerships
        for (const pick of allPicks) {
          await getResults({
            sql: 'UPDATE Players SET owner_ID = ? WHERE player_ID = ?',
            args: [pick.team_id, pick.player_id]
          });

          await getResults({
            sql: 'UPDATE WaiverPlayers SET status = ? WHERE player_id = ?',
            args: ['available', pick.player_id]
          });
        }

        // Clear all picks
        await getResults({
          sql: 'DELETE FROM WaiverPicks WHERE draft_id = ?',
          args: [clearDraftId]
        });

        return NextResponse.json({
          success: true,
          message: `Cleared ${allPicks.length} picks from draft ${clearDraftId}`,
          data: {
            clearedPicks: allPicks.length
          }
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
