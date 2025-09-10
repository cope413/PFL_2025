import { NextRequest, NextResponse } from 'next/server';
import { 
  getWaivedPlayers, 
  getFreeAgents,
  getWaiverDrafts, 
  getWaiverDraftByWeek,
  createWaiverDraft,
  calculateWaiverDraftOrder,
  saveWaiverDraftOrder,
  getWaiverDraftOrder,
  getWaiverPicks,
  isWaiverWeek,
  getWaiverDeadline,
  getCurrentWeek,
  updateWaiverDraftStatus
} from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const week = searchParams.get('week');

    switch (action) {
      case 'waived-players':
        const currentWeekForWaived = await getCurrentWeek();
        const waivedPlayers = await getWaivedPlayers(currentWeekForWaived);
        return NextResponse.json({
          success: true,
          data: waivedPlayers
        });

      case 'waiver-drafts':
        const waiverDrafts = await getWaiverDrafts();
        return NextResponse.json({
          success: true,
          data: waiverDrafts
        });

      case 'waiver-draft':
        if (!week) {
          return NextResponse.json(
            { success: false, error: 'Week parameter is required' },
            { status: 400 }
          );
        }
        
        const waiverDraft = await getWaiverDraftByWeek(parseInt(week));
        if (!waiverDraft) {
          return NextResponse.json(
            { success: false, error: 'Waiver draft not found for this week' },
            { status: 404 }
          );
        }

        // Get draft order and picks
        const draftOrder = await getWaiverDraftOrder(waiverDraft.id);
        const picks = await getWaiverPicks(waiverDraft.id);
        const currentWeek = await getCurrentWeek();
        const waivedPlayersForDraft = await getWaivedPlayers(currentWeek);
        const freeAgents = await getFreeAgents(currentWeek);
        
        // Combine waived players and free agents
        const allAvailablePlayers = [...waivedPlayersForDraft, ...freeAgents];

        return NextResponse.json({
          success: true,
          data: {
            draft: waiverDraft,
            draftOrder,
            waivedPlayers: allAvailablePlayers,
            picks,
            currentPick: picks.length + 1,
            isActive: waiverDraft.status === 'in_progress'
          }
        });

      case 'waiver-info':
        const weekNumber = parseInt(week || '1');
        const isWaiver = isWaiverWeek(weekNumber);
        const deadline = isWaiver ? getWaiverDeadline(weekNumber) : null;
        
        return NextResponse.json({
          success: true,
          data: {
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
    console.error('Error in waiver GET:', error);
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

      case 'start-waiver-draft':
        const { draftId } = data;
        
        if (!draftId) {
          return NextResponse.json(
            { success: false, error: 'Draft ID is required' },
            { status: 400 }
          );
        }

        // Update draft status to in_progress
        await updateWaiverDraftStatus(draftId, 'in_progress');

        return NextResponse.json({
          success: true,
          message: 'Waiver draft started successfully'
        });

      case 'complete-waiver-draft':
        const { draftId: completeDraftId } = data;
        
        if (!completeDraftId) {
          return NextResponse.json(
            { success: false, error: 'Draft ID is required' },
            { status: 400 }
          );
        }

        // Update draft status to completed
        await updateWaiverDraftStatus(completeDraftId, 'completed');

        return NextResponse.json({
          success: true,
          message: 'Waiver draft completed successfully'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in waiver POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process waiver request' },
      { status: 500 }
    );
  }
}
