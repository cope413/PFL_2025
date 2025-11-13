import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import {
  acceptTrade,
  cancelTrade,
  createTradeProposal,
  declineTrade,
  approveTrade,
  rejectTrade,
  getTradeById,
  getTradesForTeam,
} from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tradeId = searchParams.get('tradeId');
    const requestedTeamId = searchParams.get('teamId');
    const teamId = requestedTeamId || authUser.team;

    if (!teamId) {
      return NextResponse.json({ success: false, error: 'Team ID is required' }, { status: 400 });
    }

    if (teamId === 'all') {
      if (!authUser.is_admin) {
        return NextResponse.json({ success: false, error: 'Not authorized to view all trades' }, { status: 403 });
      }
    } else if (!authUser.is_admin) {
      // Normalize both team IDs for comparison
      const normalizedTeamId = teamId.split('.')[0];
      const normalizedUserTeam = (authUser.team || '').split('.')[0];
      if (normalizedTeamId !== normalizedUserTeam) {
        return NextResponse.json({ success: false, error: 'Not authorized to view trades for this team' }, { status: 403 });
      }
    }

    if (tradeId) {
      const trade = await getTradeById(tradeId);

      if (!trade) {
        return NextResponse.json({ success: false, error: 'Trade not found' }, { status: 404 });
      }

      if (!authUser.is_admin) {
        // Normalize team IDs for comparison
        const normalizedProposerTeamId = (trade.proposerTeamId || '').split('.')[0];
        const normalizedRecipientTeamId = (trade.recipientTeamId || '').split('.')[0];
        const normalizedUserTeam = (authUser.team || '').split('.')[0];
        
        if (normalizedProposerTeamId !== normalizedUserTeam && normalizedRecipientTeamId !== normalizedUserTeam) {
          return NextResponse.json({ success: false, error: 'Not authorized to view this trade' }, { status: 403 });
        }
      }

      return NextResponse.json({ success: true, data: trade });
    }

    const trades = await getTradesForTeam(teamId);
    return NextResponse.json({ success: true, data: trades });
  } catch (error: any) {
    console.error('Trades GET error:', error);
    console.error('Error stack:', error?.stack);
    console.error('Error message:', error?.message);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Failed to fetch trades',
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    if (!authUser.team) {
      return NextResponse.json({ success: false, error: 'User is not associated with a team' }, { status: 400 });
    }

    const body = await request.json();
    const {
      recipientTeamId,
      offeredPlayerIds = [],
      requestedPlayerIds = [],
      message,
    } = body;

    if (!recipientTeamId) {
      return NextResponse.json({ success: false, error: 'Recipient team is required' }, { status: 400 });
    }

    if (recipientTeamId === authUser.team) {
      return NextResponse.json({ success: false, error: 'Cannot propose trade with your own team' }, { status: 400 });
    }

    const trade = await createTradeProposal(
      authUser.id,
      authUser.team,
      recipientTeamId,
      offeredPlayerIds,
      requestedPlayerIds,
      message,
    );

    return NextResponse.json({ success: true, data: trade });
  } catch (error: any) {
    console.error('Trades POST error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to create trade' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  let body: any = null;
  try {
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    body = await request.json();
    const { tradeId, action, message } = body;

    if (!tradeId || !action) {
      return NextResponse.json({ success: false, error: 'tradeId and action are required' }, { status: 400 });
    }

    let updatedTrade;

    try {
      switch (action) {
        case 'accept':
          console.log(`[Trades PATCH] Accepting trade ${tradeId} by user ${authUser.id}`);
          updatedTrade = await acceptTrade(tradeId, authUser.id, message);
          break;
        case 'decline':
          console.log(`[Trades PATCH] Declining trade ${tradeId} by user ${authUser.id}`);
          updatedTrade = await declineTrade(tradeId, authUser.id, message);
          break;
        case 'cancel':
          console.log(`[Trades PATCH] Cancelling trade ${tradeId} by user ${authUser.id}`);
          updatedTrade = await cancelTrade(tradeId, authUser.id, message);
          break;
        case 'approve':
          if (!authUser.is_admin) {
            return NextResponse.json({ success: false, error: 'Only admins can approve trades' }, { status: 403 });
          }
          console.log(`[Trades PATCH] Approving trade ${tradeId} by admin ${authUser.id}`);
          updatedTrade = await approveTrade(tradeId, authUser.id, message);
          break;
        case 'reject':
          if (!authUser.is_admin) {
            return NextResponse.json({ success: false, error: 'Only admins can reject trades' }, { status: 403 });
          }
          console.log(`[Trades PATCH] Rejecting trade ${tradeId} by admin ${authUser.id}`);
          updatedTrade = await rejectTrade(tradeId, authUser.id, message);
          break;
        default:
          return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
      }
    } catch (actionError: any) {
      console.error(`[Trades PATCH] Error in ${action} action:`, actionError);
      throw actionError;
    }

    return NextResponse.json({ success: true, data: updatedTrade });
  } catch (error: any) {
    console.error('Trades PATCH error:', error);
    console.error('Error stack:', error?.stack);
    console.error('Error message:', error?.message);
    console.error('Action:', body?.action, 'TradeId:', body?.tradeId);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Failed to update trade',
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 });
  }
}

