import { NextRequest, NextResponse } from 'next/server';
import { 
  getWaiverDrafts,
  createWaiverDraft,
  updateWaiverDraftStatus,
  calculateWaiverDraftOrder,
  saveWaiverDraftOrder,
  getWaivedPlayers,
  getWaiverPicks,
  getWaiverDraftOrder,
  isWaiverWeek,
  getWaiverDeadline
} from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const week = searchParams.get('week');

    switch (action) {
      case 'waiver-drafts':
        const waiverDrafts = await getWaiverDrafts();
        return NextResponse.json({
          success: true,
          data: waiverDrafts
        });

      case 'waiver-draft-details':
        if (!week) {
          return NextResponse.json(
            { success: false, error: 'Week parameter is required' },
            { status: 400 }
          );
        }
        
        const draft = await getWaiverDraftByWeek(parseInt(week));
        if (!draft) {
          return NextResponse.json(
            { success: false, error: 'Waiver draft not found for this week' },
            { status: 404 }
          );
        }

        const draftOrder = await getWaiverDraftOrder(draft.id);
        const waivedPlayers = await getWaivedPlayers();
        const picks = await getWaiverPicks(draft.id);

        return NextResponse.json({
          success: true,
          data: {
            draft,
            draftOrder,
            waivedPlayers,
            picks,
            currentPick: picks.length + 1,
            totalPicks: waivedPlayers.length,
            isComplete: picks.length >= waivedPlayers.length
          }
        });

      case 'waiver-status':
        const currentWeek = parseInt(week || '1');
        const isWaiver = isWaiverWeek(currentWeek);
        const deadline = isWaiver ? getWaiverDeadline(currentWeek) : null;
        
        return NextResponse.json({
          success: true,
          data: {
            currentWeek,
            isWaiverWeek: isWaiver,
            deadline: deadline?.toISOString(),
            waiverDrafts: await getWaiverDrafts()
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in admin waiver GET:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch waiver data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create-waiver-draft':
        const { week, scheduledDate } = data;
        
        if (!week || !scheduledDate) {
          return NextResponse.json(
            { success: false, error: 'Week and scheduled date are required' },
            { status: 400 }
          );
        }

        // Check if waiver draft already exists for this week
        const existingDraft = await getWaiverDraftByWeek(week);
        if (existingDraft) {
          return NextResponse.json(
            { success: false, error: 'Waiver draft already exists for this week' },
            { status: 409 }
          );
        }

        const draft = await createWaiverDraft(week, scheduledDate);
        
        // Calculate and save draft order
        const standings = await calculateWaiverDraftOrder(week);
        const draftOrder = standings.map((team, index) => ({
          teamId: team.Team_ID,
          order: index + 1
        }));
        
        await saveWaiverDraftOrder(draft.insertId?.toString() || '', draftOrder);

        return NextResponse.json({
          success: true,
          data: { draftId: draft.insertId },
          message: 'Waiver draft created successfully'
        });

      case 'update-draft-status':
        const { draftId, status } = data;
        
        if (!draftId || !status) {
          return NextResponse.json(
            { success: false, error: 'Draft ID and status are required' },
            { status: 400 }
          );
        }

        await updateWaiverDraftStatus(draftId, status);

        return NextResponse.json({
          success: true,
          message: 'Draft status updated successfully'
        });

      case 'recalculate-draft-order':
        const { draftId: recalcDraftId, week: recalcWeek } = data;
        
        if (!recalcDraftId || !recalcWeek) {
          return NextResponse.json(
            { success: false, error: 'Draft ID and week are required' },
            { status: 400 }
          );
        }

        // Recalculate draft order based on current standings
        const newStandings = await calculateWaiverDraftOrder(recalcWeek);
        const newDraftOrder = newStandings.map((team, index) => ({
          teamId: team.Team_ID,
          order: index + 1
        }));
        
        await saveWaiverDraftOrder(recalcDraftId, newDraftOrder);

        return NextResponse.json({
          success: true,
          data: newDraftOrder,
          message: 'Draft order recalculated successfully'
        });

      case 'get-draft-order':
        const { draftId: orderDraftId } = data;
        
        if (!orderDraftId) {
          return NextResponse.json(
            { success: false, error: 'Draft ID is required' },
            { status: 400 }
          );
        }

        const draftOrderData = await getWaiverDraftOrder(orderDraftId);
        
        return NextResponse.json({
          success: true,
          data: draftOrderData
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in admin waiver POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process waiver request' },
      { status: 500 }
    );
  }
}
