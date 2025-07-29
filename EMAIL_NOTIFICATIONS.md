# PFL Email Notification System

The PFL (Prehistoric Football League) now includes a comprehensive email notification system that allows users to receive email notifications for various events and updates.

## Features

### Notification Types

1. **Welcome Email** - Sent when users register for the first time
2. **Weekly Recap** - Weekly performance summaries with standings and stats
3. **Trade Offer** - Notifications when users receive trade offers
4. **Matchup Reminder** - Reminders to set lineups before games
5. **Injury Alert** - Important injury news for players on user's roster
6. **Password Reset** - Password reset confirmation emails

### User Preferences

Users can control their notification preferences through the Settings page:
- Email Notifications (on/off)
- Push Notifications (on/off)
- Weekly Recaps (on/off)
- Trade Alerts (on/off)
- Matchup Reminders (on/off)
- Injury Alerts (on/off)

## Setup

### 1. Environment Variables

Add the following environment variables to your `.env.local` file:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 2. Gmail Setup (Recommended)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. Use the generated password as `SMTP_PASS`

### 3. Database Setup

The notification system automatically creates the required database table:

```sql
CREATE TABLE notification_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  email_notifications BOOLEAN DEFAULT 1,
  push_notifications BOOLEAN DEFAULT 1,
  weekly_recaps BOOLEAN DEFAULT 1,
  trade_alerts BOOLEAN DEFAULT 1,
  matchup_reminders BOOLEAN DEFAULT 1,
  injury_alerts BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(id)
)
```

## API Endpoints

### Get Notification Preferences
```
GET /api/notifications/preferences
Authorization: Bearer <token>
```

### Update Notification Preferences
```
PUT /api/notifications/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "email_notifications": true,
  "push_notifications": true,
  "weekly_recaps": true,
  "trade_alerts": true,
  "matchup_reminders": true,
  "injury_alerts": true
}
```

### Send Notification
```
POST /api/notifications/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "welcome",
  "userId": "user123",
  "data": {
    // Notification-specific data
  }
}
```

## Usage Examples

### Sending a Welcome Email
```javascript
const response = await fetch('/api/notifications/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    type: 'welcome',
    userId: 'user123',
    data: {}
  })
});
```

### Sending a Weekly Recap
```javascript
const response = await fetch('/api/notifications/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    type: 'weeklyRecap',
    userId: 'user123',
    data: {
      week: 5,
      record: "3-2",
      points: 125.5,
      rank: 4
    }
  })
});
```

### Sending a Trade Offer
```javascript
const response = await fetch('/api/notifications/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    type: 'tradeOffer',
    userId: 'user123',
    data: {
      fromTeam: "Dino Destroyers",
      players: ["Patrick Mahomes", "Christian McCaffrey"]
    }
  })
});
```

## Email Templates

All email templates are HTML-formatted and include:
- Professional styling with PFL branding
- Responsive design
- Clear call-to-action buttons
- Consistent footer with PFL branding

### Template Structure
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #1f2937; text-align: center;">🏈 Welcome to PFL!</h1>
  <!-- Email content -->
  <p style="color: #6b7280; font-size: 14px;">- The PFL Team</p>
</div>
```

## Testing

### Test Page
Visit `/test-notifications` to send test emails:
1. Select notification type
2. Enter target user ID
3. Click "Send Test Notification"

### Manual Testing
```bash
# Test with curl
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "welcome",
    "userId": "user123",
    "data": {}
  }'
```

## Error Handling

The system includes comprehensive error handling:
- Invalid SMTP configuration
- User not found
- Email sending failures
- Authentication errors
- Database errors

All errors are logged and appropriate HTTP status codes are returned.

## Security Considerations

1. **Authentication Required** - All notification endpoints require valid authentication
2. **User Preferences Respected** - Emails are only sent if the user has enabled email notifications
3. **Rate Limiting** - Consider implementing rate limiting for production use
4. **Email Validation** - Ensure email addresses are valid before sending

## Production Deployment

### Environment Setup
1. Use a production SMTP service (SendGrid, Mailgun, etc.)
2. Set up proper DNS records (SPF, DKIM, DMARC)
3. Monitor email delivery rates
4. Implement email queue system for high volume

### Monitoring
- Track email open rates
- Monitor bounce rates
- Set up alerts for failed sends
- Log all notification attempts

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check SMTP configuration
   - Verify environment variables
   - Check user email preferences

2. **Authentication errors**
   - Ensure valid JWT token
   - Check token expiration

3. **Database errors**
   - Verify database connection
   - Check table exists

### Debug Mode
Enable debug logging by setting:
```env
DEBUG_EMAILS=true
```

This will log all email attempts to the console.

## Future Enhancements

1. **Email Queue System** - For high-volume sending
2. **Template Editor** - Admin interface for editing email templates
3. **Analytics Dashboard** - Track email performance
4. **SMS Notifications** - Add SMS support
5. **Push Notifications** - Web push notifications
6. **Scheduled Notifications** - Automated weekly recaps
7. **Custom Templates** - User-customizable email templates 