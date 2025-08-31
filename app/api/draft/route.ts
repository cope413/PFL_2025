import { NextRequest, NextResponse } from 'next/server';
import { saveDraftPick, getDraftPicks, getDraftProgress, clearDraft, initializeDraftSlots, updatePlayerOwnership } from '@/lib/database';

export async function GET() {
  try {
    // Initialize draft slots if they don't exist
    await initializeDraftSlots();
    
    const picks = await getDraftPicks();
    const progress = await getDraftProgress();
    
    return NextResponse.json({
      success: true,
      data: {
        picks,
        progress
      }
    });
  } catch (error) {
    console.error('Error fetching draft data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch draft data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'savePick':
        const { round, pick, team_id, player_id, player_name, position, team } = data;
        
        // Validate required fields
        if (!round || !pick || !team_id || !player_id || !player_name || !position || !team) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields for draft pick' },
            { status: 400 }
          );
        }
        
        await saveDraftPick(round, pick, team_id, player_id, player_name, position, team);
        return NextResponse.json({ success: true, message: 'Pick saved successfully' });

      case 'clearDraft':
        await clearDraft();
        // Re-initialize empty draft slots after clearing
        await initializeDraftSlots();
        return NextResponse.json({ success: true, message: 'Draft cleared successfully' });

      case 'initialize':
        await initializeDraftSlots();
        return NextResponse.json({ success: true, message: 'Draft slots initialized' });

      case 'assignPlayer':
        const { player_id: playerId, team_id: teamId } = data;
        
        // Validate required fields
        if (!playerId || !teamId) {
          return NextResponse.json(
            { success: false, error: 'Missing player_id or team_id' },
            { status: 400 }
          );
        }
        
        // Update player ownership in the Players table
        await updatePlayerOwnership(playerId, teamId);
        
        return NextResponse.json({ success: true, message: 'Player assigned successfully' });

      case 'undoPick':
        const { round: undoRound, pick: undoPick } = data;
        
        // Validate required fields
        if (!undoRound || !undoPick) {
          return NextResponse.json(
            { success: false, error: 'Missing round or pick for undo operation' },
            { status: 400 }
          );
        }
        
        // Clear the specific pick by setting it to empty values
        await saveDraftPick(undoRound, undoPick, '', '', '', '', '');
        
        // Update player ownership back to free agent (empty owner_ID)
        const pickToUndo = await getDraftPicks();
        const pickData = pickToUndo.find(p => p.round === undoRound && p.pick === undoPick);
        if (pickData && pickData.player_id) {
          await updatePlayerOwnership(pickData.player_id, '');
        }
        
        return NextResponse.json({ success: true, message: 'Pick undone successfully' });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in draft operation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform draft operation' },
      { status: 500 }
    );
  }
}
