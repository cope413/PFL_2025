# Lineup Warnings Implementation

## Overview

The PFL lineup warnings system automatically sends email notifications to team owners who haven't saved their lineups by Saturday at 5pm EST. This ensures all teams are aware of the deadline and can avoid forfeiting their matchups.

## Features

### Email Notifications
- **Timing**: Sent every Saturday at 5pm EST (10pm UTC)
- **Recipients**: Only teams without saved lineups for the current week
- **Content**: Clear warning with instructions on how to save lineups
- **Deadline**: Saturday at 5:00 PM EST
- **BCC**: All lineup-related emails are BCC'd to taylor@landryfam.com

### BCC Functionality
- **Lineup Submissions**: Every lineup submission email includes taylor@landryfam.com as BCC
- **Lineup Warnings**: Every lineup warning email includes taylor@landryfam.com as BCC
- **Purpose**: Allows league administrator to monitor all lineup activity
- **Privacy**: BCC recipients are not visible to primary recipients

### Email Template
The warning email includes:
- **Subject**: `⚠️ PFL Week X Lineup Warning - TeamName`
- **Warning Message**: Clear indication that no lineup is saved
- **Action Required**: Step-by-step instructions to save lineup
- **Deadline Information**: Saturday at 5:00 PM EST
- **Consequences**: Warning about forfeiting if no lineup is saved
- **BCC**: All lineup-related emails are BCC'd to taylor@landryfam.com

## Implementation

### 1. Email Template (`lib/email.ts`)
- Added `lineupWarning` email template
- Added `sendLineupWarning` method to `NotificationService`
- Updated `NotificationType` to include `lineupWarning`
- Updated `sendEmail` function to support BCC functionality
- All lineup submission emails are BCC'd to taylor@landryfam.com

### 2. Notification API (`app/api/notifications/send/route.ts`)
- Added `lineupWarning` case to handle sending warnings
- Integrates with existing notification system

### 3. Warning Script (`scripts/send-lineup-warnings.js`)
- **Purpose**: Check for teams without saved lineups and send warnings
- **Database Query**: Finds teams without lineups for specified week
- **Time Validation**: Only runs on Saturdays at 5pm EST or later
- **Email Sending**: Uses nodemailer to send warnings
- **Logging**: Comprehensive logging of the process

### 4. Cron Job Setup (`scripts/setup-lineup-warnings-cron.sh`)
- **Purpose**: Automatically set up cron job for weekly warnings
- **Schedule**: Every Saturday at 5pm EST (10pm UTC)
- **Logging**: Output saved to `logs/lineup-warnings.log`

## Usage

### Manual Testing
```bash
# Test with current week (will check time requirements)
node scripts/send-lineup-warnings.js

# Test with specific week (will check time requirements)
node scripts/send-lineup-warnings.js 5

# Force run (bypass time check)
node scripts/send-lineup-warnings.js --force

# Show help
node scripts/send-lineup-warnings.js --help
```

### Automated Setup
```bash
# Set up cron job for automatic weekly warnings
./scripts/setup-lineup-warnings-cron.sh
```

### View Logs
```bash
# View recent warning logs
tail -f logs/lineup-warnings.log

# View all warning logs
cat logs/lineup-warnings.log
```

## Environment Variables

### Required
- `SMTP_USER`: Email username (e.g., your-email@gmail.com)
- `SMTP_PASS`: Email password or app password

### Optional
- `SMTP_HOST`: SMTP server host (default: smtp.gmail.com)
- `SMTP_PORT`: SMTP server port (default: 587)
- `TURSO_URL`: Database URL (default: file:./PFL_2025.db)
- `TURSO_AUTH_TOKEN`: Database auth token (if using remote database)

## Database Queries

### Find Teams Without Lineups
```sql
SELECT 
  u.id,
  u.username,
  u.email,
  u.team,
  u.team_name,
  u.owner_name
FROM user u
LEFT JOIN Lineups l ON u.team = l.owner_ID AND l.week = ?
WHERE l.owner_ID IS NULL
  AND u.email IS NOT NULL 
  AND u.email != ''
ORDER BY u.team
```

### Get Current Week
```sql
SELECT week FROM Weeks 
WHERE start <= date('now') AND end >= date('now')
```

## Cron Job Details

### Schedule
- **Frequency**: Every Saturday
- **Time**: 5:00 PM EST (10:00 PM UTC)
- **Command**: `cd /path/to/PFL_2025 && node scripts/send-lineup-warnings.js`

### Cron Expression
```
0 22 * * 6 cd /path/to/PFL_2025 && node scripts/send-lineup-warnings.js >> logs/lineup-warnings.log 2>&1
```

### Log File
- **Location**: `logs/lineup-warnings.log`
- **Content**: Script output, success/failure counts, email delivery status

## Email Content

### Subject Line
`⚠️ PFL Week X Lineup Warning - TeamName`

### Body Structure
1. **Warning Header**: Clear indication of the issue
2. **Action Required Section**: Red background with deadline information
3. **Instructions Section**: Blue background with step-by-step guide
4. **Consequences**: Warning about forfeiting if no action taken

### Sample Email
```
⚠️ Lineup Warning

Hello [Username],

Your team [TeamName] does not have a saved lineup for Week X!

Action Required
- You must save your lineup by Saturday at 5:00 PM EST
- Current Status: No lineup saved
- Deadline: Saturday at 5:00 PM EST

How to Save Your Lineup
1. Log into your PFL account
2. Go to "Team Dashboard"
3. Select Week X
4. Set your starting lineup
5. Click "Save Lineup"
6. Click "Submit Lineup" to finalize

Important: If you don't save a lineup by the deadline, your team will forfeit the matchup and you'll receive a loss.

- The PFL Team
```

## Error Handling

### Time Validation
- Script only runs on Saturdays at 5pm EST or later
- Can be bypassed with `--force` flag for testing
- Prevents accidental warnings at wrong times

### Email Validation
- Checks for required SMTP configuration
- Validates email addresses before sending
- Logs success/failure for each email

### Database Validation
- Handles database connection errors gracefully
- Falls back to week 1 if current week not found
- Logs database query errors

## Monitoring

### Log Analysis
```bash
# Count successful warnings
grep "✅ Warning sent successfully" logs/lineup-warnings.log | wc -l

# Count failed warnings
grep "❌ Failed to send warning" logs/lineup-warnings.log | wc -l

# View recent activity
tail -20 logs/lineup-warnings.log
```

### Cron Job Status
```bash
# Check if cron job is active
crontab -l | grep lineup-warnings

# View cron job logs
grep CRON /var/log/syslog | grep lineup-warnings
```

## Troubleshooting

### Common Issues

1. **Email Not Sending**
   - Check SMTP_USER and SMTP_PASS environment variables
   - Verify email server settings
   - Check firewall/network connectivity

2. **Script Not Running**
   - Verify cron job is installed: `crontab -l`
   - Check cron service is running: `systemctl status cron`
   - Review cron logs: `grep CRON /var/log/syslog`

3. **Wrong Teams Getting Warnings**
   - Verify database connection
   - Check lineup data integrity
   - Review SQL query logic

4. **Time Zone Issues**
   - Script uses EST timezone for validation
   - Cron job uses UTC time (10pm UTC = 5pm EST)
   - Adjust cron time if needed for daylight saving

### Debug Mode
```bash
# Run with verbose logging
DEBUG=1 node scripts/send-lineup-warnings.js --force

# Test email configuration
node -e "console.log('SMTP_USER:', process.env.SMTP_USER); console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT SET');"
```

## Future Enhancements

1. **Multiple Reminders**: Send warnings on Thursday and Saturday
2. **Customizable Deadlines**: Allow different deadlines per league
3. **SMS Notifications**: Add text message warnings
4. **Admin Dashboard**: Web interface to manage warnings
5. **Warning History**: Track which teams received warnings
6. **Auto-Lineup**: Automatically set lineups for inactive teams

## Files Created/Modified

### New Files
- `scripts/send-lineup-warnings.js` - Main warning script
- `scripts/setup-lineup-warnings-cron.sh` - Cron job setup script
- `LINEUP_WARNINGS_IMPLEMENTATION.md` - This documentation

### Modified Files
- `lib/email.ts` - Added lineup warning template and method
- `app/api/notifications/send/route.ts` - Added lineupWarning case

## Security Considerations

1. **Email Credentials**: Store SMTP credentials securely in environment variables
2. **Database Access**: Script uses read-only database queries
3. **Rate Limiting**: 1-second delay between emails to avoid spam filters
4. **Logging**: Sensitive information not logged (email addresses partially masked)

## Compliance

1. **CAN-SPAM**: Emails include proper headers and unsubscribe information
2. **GDPR**: Only sends to users who have provided email addresses
3. **Opt-out**: Users can disable email notifications in settings
4. **Frequency**: Limited to once per week per team
