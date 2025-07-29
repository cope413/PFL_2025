import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { dbQueries, getNotificationQueries } from '@/lib/database';
import Database from 'better-sqlite3';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Connect to database
    const dbPath = path.join(process.cwd(), 'PFL_2025.db');
    const db = new Database(dbPath);

    // Get user's notification preferences
    const notificationQueries = getNotificationQueries();
    if (!notificationQueries) {
      // Return default preferences if table doesn't exist
      return NextResponse.json({
        email_notifications: true,
        push_notifications: true,
        weekly_recaps: true,
        trade_alerts: true,
        matchup_reminders: true,
        injury_alerts: true,
      });
    }
    
    const preferences = notificationQueries.getNotificationPreferences.get(decoded.id) as any;

    db.close();

    if (!preferences) {
      // Return default preferences if none exist
      return NextResponse.json({
        email_notifications: true,
        push_notifications: true,
        weekly_recaps: true,
        trade_alerts: true,
        matchup_reminders: true,
        injury_alerts: true,
      });
    }

    return NextResponse.json({
      email_notifications: Boolean(preferences.email_notifications),
      push_notifications: Boolean(preferences.push_notifications),
      weekly_recaps: Boolean(preferences.weekly_recaps),
      trade_alerts: Boolean(preferences.trade_alerts),
      matchup_reminders: Boolean(preferences.matchup_reminders),
      injury_alerts: Boolean(preferences.injury_alerts),
    });

  } catch (error) {
    console.error('Get notification preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
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
      email_notifications,
      push_notifications,
      weekly_recaps,
      trade_alerts,
      matchup_reminders,
      injury_alerts,
    } = await request.json();

    // Connect to database
    const dbPath = path.join(process.cwd(), 'PFL_2025.db');
    const db = new Database(dbPath);

    // Check if preferences exist
    const notificationQueries = getNotificationQueries();
    if (!notificationQueries) {
      return NextResponse.json({ error: 'Notification preferences not available' }, { status: 503 });
    }

    const existingPreferences = notificationQueries.getNotificationPreferences.get(decoded.id);

    if (existingPreferences) {
      // Update existing preferences
      notificationQueries.updateNotificationPreferences.run(
        email_notifications ? 1 : 0,
        push_notifications ? 1 : 0,
        weekly_recaps ? 1 : 0,
        trade_alerts ? 1 : 0,
        matchup_reminders ? 1 : 0,
        injury_alerts ? 1 : 0,
        decoded.id
      );
    } else {
      // Create new preferences
      notificationQueries.createNotificationPreferences.run(
        decoded.id,
        email_notifications ? 1 : 0,
        push_notifications ? 1 : 0,
        weekly_recaps ? 1 : 0,
        trade_alerts ? 1 : 0,
        matchup_reminders ? 1 : 0,
        injury_alerts ? 1 : 0
      );
    }

    db.close();

    return NextResponse.json({
      message: 'Notification preferences updated successfully',
      preferences: {
        email_notifications: Boolean(email_notifications),
        push_notifications: Boolean(push_notifications),
        weekly_recaps: Boolean(weekly_recaps),
        trade_alerts: Boolean(trade_alerts),
        matchup_reminders: Boolean(matchup_reminders),
        injury_alerts: Boolean(injury_alerts),
      },
    });

  } catch (error) {
    console.error('Update notification preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 