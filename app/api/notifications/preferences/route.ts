import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { createNotificationPreferences, getNotificationPreferences, updateNotificationPreferences } from '@/lib/database';

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

    const preferences = await getNotificationPreferences(decoded.id) as any;

    // If no preferences exist, return default values
    if (!preferences) {
      return NextResponse.json({
        email_notifications: false,
        push_notifications: false,
        weekly_recaps: false,
        trade_alerts: false,
        matchup_reminders: false,
        injury_alerts: false,
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

    // Convert to boolean values to ensure proper data types
    const emailNotifications = Boolean(email_notifications);
    const pushNotifications = Boolean(push_notifications);
    const weeklyRecaps = Boolean(weekly_recaps);
    const tradeAlerts = Boolean(trade_alerts);
    const matchupReminders = Boolean(matchup_reminders);
    const injuryAlerts = Boolean(injury_alerts);

    const existingPreferences = await getNotificationPreferences(decoded.id);

    if (existingPreferences) {
      // Update existing preferences
      await updateNotificationPreferences(
        emailNotifications,
        pushNotifications,
        weeklyRecaps,
        tradeAlerts,
        matchupReminders,
        injuryAlerts,
        decoded.id
      );
    } else {
      // Create new preferences
      await createNotificationPreferences(
        decoded.id,
        emailNotifications,
        pushNotifications,
        weeklyRecaps,
        tradeAlerts,
        matchupReminders,
        injuryAlerts
      );
    }

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