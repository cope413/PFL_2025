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
    } else if (!authUser.is_admin && teamId !== authUser.team) {
      return NextResponse.json({ success: false, error: 'Not authorized to view trades for this team' }, { status: 403 });
    }

    if (tradeId) {
      const trade = await getTradeById(tradeId);

      if (!trade) {
        return NextResponse.json({ success: false, error: 'Trade not found' }, { status: 404 });
      }

      if (
        !authUser.is_admin &&
        trade.proposerTeamId !== authUser.team &&
        trade.recipientTeamId !== authUser.team
      ) {
        return NextResponse.json({ success: false, error: 'Not authorized to view this trade' }, { status: 403 });
      }

      return NextResponse.json({ success: true, data: trade });
    }

    const trades = await getTradesForTeam(teamId);
    return NextResponse.json({ success: true, data: trades });
  } catch (error) {
    console.error('Trades GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch trades' }, { status: 500 });
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
  try {
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { tradeId, action, message } = body;

    if (!tradeId || !action) {
      return NextResponse.json({ success: false, error: 'tradeId and action are required' }, { status: 400 });
    }

    let updatedTrade;

    switch (action) {
      case 'accept':
        updatedTrade = await acceptTrade(tradeId, authUser.id, message);
        break;
      case 'decline':
        updatedTrade = await declineTrade(tradeId, authUser.id, message);
        break;
      case 'cancel':
        updatedTrade = await cancelTrade(tradeId, authUser.id, message);
        break;
      case 'approve':
        if (!authUser.is_admin) {
          return NextResponse.json({ success: false, error: 'Only admins can approve trades' }, { status: 403 });
        }
        updatedTrade = await approveTrade(tradeId, authUser.id, message);
        break;
      case 'reject':
        if (!authUser.is_admin) {
          return NextResponse.json({ success: false, error: 'Only admins can reject trades' }, { status: 403 });
        }
        updatedTrade = await rejectTrade(tradeId, authUser.id, message);
        break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: updatedTrade });
  } catch (error: any) {
    console.error('Trades PATCH error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to update trade' }, { status: 500 });
  }
}

