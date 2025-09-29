import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getUserById, getLineup, getPlayerById, isPlayerGameLocked } from '@/lib/database';
import { NotificationService } from '@/lib/email';

export async function POST(request: NextRequest) {
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

    // Get the user's full data from the database to get their team and email
    const userData = await getUserById(user.id) as any;

    if (!userData) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const body = await request.json();
    const { week, lineup } = body;

    if (!week || !lineup) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: week, lineup'
      }, { status: 400 });
    }

    console.log('Submitting lineup for user:', userData.team, 'week:', week);
    console.log('Lineup data:', lineup);

    // Check if any players in the lineup have games that have started
    const lineupPlayers = [
      lineup.QB,
      lineup.RB_1,
      lineup.WR_1,
      lineup.FLEX_1,
      lineup.FLEX_2,
      lineup.TE,
      lineup.K,
      lineup.DEF
    ].filter(Boolean); // Remove empty values

    const lockedPlayers = [];
    for (const playerId of lineupPlayers) {
      const isLocked = await isPlayerGameLocked(playerId, parseInt(week));
      if (isLocked) {
        lockedPlayers.push(playerId);
      }
    }

    // Note: We allow the lineup submit to proceed even with locked players
    // The frontend should handle displaying locked players appropriately

    // Verify that the lineup exists in the database (must be saved first)
    try {
      const savedLineup = await getLineup(userData.team, parseInt(week));
      
      if (!savedLineup) {
        return NextResponse.json({
          success: false,
          error: 'No saved lineup found. Please save your lineup first.'
        }, { status: 400 });
      }

      // Create submission timestamp
      const submissionTime = new Date().toISOString();

      // Get player names for the email
      const lineupWithNames = {
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
        if (playerId) {
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

      // Send confirmation email with lineup details
      const emailSent = await NotificationService.sendLineupSubmission(
        userData.email,
        userData.username || userData.team,
        userData.team,
        parseInt(week),
        lineupWithNames,
        submissionTime
      );

      if (!emailSent) {
        console.warn('Failed to send confirmation email, but lineup submission recorded');
      }

      console.log('Lineup submitted successfully with email confirmation');

      return NextResponse.json({
        success: true,
        message: 'Lineup submitted successfully',
        submissionTime: submissionTime,
        emailSent: emailSent,
        lockedPlayers: lockedPlayers.length > 0 ? lockedPlayers : undefined,
        warning: lockedPlayers.length > 0 ? `${lockedPlayers.length} player(s) have games that have already started and cannot be changed` : undefined
      });
    } catch (error) {
      console.error('Error submitting lineup:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to submit lineup'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in lineup submission API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to submit lineup'
    }, { status: 500 });
  }
}
