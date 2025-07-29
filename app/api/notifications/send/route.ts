import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { dbQueries, getNotificationQueries } from '@/lib/database';
import { NotificationService } from '@/lib/email';
import Database from 'better-sqlite3';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication (admin only)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse request body
    const {
      type,
      userId,
      data
    } = await request.json();

    if (!type || !userId || !data) {
      return NextResponse.json({ error: 'Missing required fields: type, userId, data' }, { status: 400 });
    }

    // Connect to database
    const dbPath = path.join(process.cwd(), 'PFL_2025.db');
    const db = new Database(dbPath);

    // Get user information
    const user = dbQueries.getUserById.get(userId) as any;
    if (!user) {
      db.close();
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's notification preferences
    const notificationQueries = getNotificationQueries();
    let preferences = null;
    
    if (notificationQueries) {
      preferences = notificationQueries.getNotificationPreferences.get(userId) as any;
    }

    // Check if user has email notifications enabled
    if (preferences && !preferences.email_notifications) {
      db.close();
      return NextResponse.json({ message: 'Email notifications disabled for this user' });
    }

    // Send notification based on type
    let success = false;
    let error = '';

    try {
      switch (type) {
        case 'welcome':
          success = await NotificationService.sendWelcomeEmail(
            user.email,
            user.username,
            user.team_name || user.username
          );
          break;

        case 'weeklyRecap':
          success = await NotificationService.sendWeeklyRecap(
            user.email,
            user.username,
            user.team_name || user.username,
            data.week,
            data.record,
            data.points,
            data.rank
          );
          break;

        case 'tradeOffer':
          success = await NotificationService.sendTradeOffer(
            user.email,
            user.username,
            data.fromTeam,
            data.players
          );
          break;

        case 'matchupReminder':
          success = await NotificationService.sendMatchupReminder(
            user.email,
            user.username,
            user.team_name || user.username,
            data.opponent,
            data.week
          );
          break;

        case 'injuryAlert':
          success = await NotificationService.sendInjuryAlert(
            user.email,
            user.username,
            data.playerName,
            data.team,
            data.injury
          );
          break;

        case 'passwordReset':
          success = await NotificationService.sendPasswordReset(
            user.email,
            user.username,
            data.resetLink
          );
          break;

        case 'test':
          success = await NotificationService.sendTestEmail(
            user.email,
            user.username
          );
          break;

        default:
          error = `Unknown notification type: ${type}`;
          break;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to send notification';
    }

    db.close();

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({
      message: success ? 'Notification sent successfully' : 'Failed to send notification',
      success
    });

  } catch (error) {
    console.error('Send notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 