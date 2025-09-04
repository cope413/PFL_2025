#!/usr/bin/env node

/**
 * PFL Lineup Warning Script
 * 
 * This script checks for teams that don't have a saved lineup for the current week
 * and sends warning emails to those teams by Saturday at 5pm EST.
 * 
 * Usage:
 * node scripts/send-lineup-warnings.js [week]
 * 
 * If no week is provided, it will use the current week from the database.
 */

// Import required modules
const { createClient } = require('@libsql/client');
const nodemailer = require('nodemailer');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Database configuration
const db = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function getCurrentWeek() {
  try {
    const result = await db.execute({
      sql: "SELECT week FROM Weeks WHERE start <= date('now') AND end >= date('now')"
    });
    
    if (result.rows && result.rows.length > 0) {
      return result.rows[0].week;
    }
    
    // Fallback: if no current week found, return week 1
    console.log('No current week found in date ranges, defaulting to week 1');
    return 1;
  } catch (error) {
    console.error('Error getting current week:', error);
    return 1;
  }
}

async function getTeamsWithoutLineups(week) {
  try {
    const result = await db.execute({
      sql: `
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
      `,
      args: [week.toString()]
    });
    
    return result.rows || [];
  } catch (error) {
    console.error('Error getting teams without lineups:', error);
    return [];
  }
}

function createLineupWarningEmail(username, teamName, week) {
  return {
    subject: `⚠️ PFL Week ${week} Lineup Warning - ${teamName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626; text-align: center;">⚠️ Lineup Warning</h1>
        <p>Hello ${username},</p>
        <p><strong>Your team ${teamName} does not have a saved lineup for Week ${week}!</strong></p>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="margin-top: 0; color: #dc2626;">Action Required</h3>
          <p>You must save your lineup by Saturday at 5:00 PM EST to avoid forfeiting your matchup.</p>
          <p><strong>Current Status:</strong> No lineup saved</p>
          <p><strong>Deadline:</strong> Saturday at 5:00 PM EST</p>
        </div>

        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
          <h3 style="margin-top: 0; color: #0ea5e9;">How to Save Your Lineup</h3>
          <ol style="margin: 0; padding-left: 20px;">
            <li>Log into your PFL account</li>
            <li>Go to "Team Dashboard"</li>
            <li>Select Week ${week}</li>
            <li>Set your starting lineup</li>
            <li>Click "Save Lineup"</li>
            <li>Click "Submit Lineup" to finalize</li>
          </ol>
        </div>

        <p><strong>Important:</strong> If you don't save a lineup by the deadline, your team will forfeit the matchup and you'll receive a loss.</p>
        
        <p style="color: #6b7280; font-size: 14px;">- The PFL Team</p>
      </div>
    `
  };
}

async function sendLineupWarning(user, week) {
  try {
    const teamName = user.team_name || user.username;
    const username = user.owner_name || user.username;
    
    console.log(`Sending lineup warning to ${username} (${teamName}) for Week ${week}`);
    
    const emailTemplate = createLineupWarningEmail(username, teamName, week);
    
    const mailOptions = {
      from: `"PFL" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Warning sent successfully to ${user.email} (Message ID: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send warning to ${user.email}:`, error);
    return false;
  }
}

async function checkTimeRequirement() {
  const now = new Date();
  const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  
  // Check if it's Saturday
  if (estTime.getDay() !== 6) {
    console.log('❌ Not Saturday - warnings should only be sent on Saturdays');
    return false;
  }
  
  // Check if it's 5pm EST or later
  const hour = estTime.getHours();
  if (hour < 17) {
    console.log(`❌ Too early - it's ${hour}:${estTime.getMinutes().toString().padStart(2, '0')} EST, warnings should be sent at 5pm EST`);
    return false;
  }
  
  console.log(`✅ Time check passed - it's ${hour}:${estTime.getMinutes().toString().padStart(2, '0')} EST on Saturday`);
  return true;
}

async function main() {
  console.log('🚀 PFL Lineup Warning Script');
  console.log('================================');
  
  // Check environment variables
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ Email configuration missing. Please set SMTP_USER and SMTP_PASS environment variables.');
    process.exit(1);
  }
  
  // Get week from command line argument or current week
  const weekArg = process.argv[2];
  let week;
  
  if (weekArg) {
    week = parseInt(weekArg);
    console.log(`Using specified week: ${week}`);
  } else {
    week = await getCurrentWeek();
    console.log(`Using current week: ${week}`);
  }
  
  // Check if it's the right time to send warnings
  const shouldSend = await checkTimeRequirement();
  if (!shouldSend) {
    console.log('⏰ Skipping warning emails due to time requirements');
    console.log('💡 To override time check, run with --force flag');
    return;
  }
  
  console.log(`\n📊 Checking for teams without saved lineups for Week ${week}...`);
  
  // Get teams without lineups
  const teamsWithoutLineups = await getTeamsWithoutLineups(week);
  
  if (teamsWithoutLineups.length === 0) {
    console.log('✅ All teams have saved lineups! No warnings needed.');
    return;
  }
  
  console.log(`\n⚠️  Found ${teamsWithoutLineups.length} teams without saved lineups:`);
  teamsWithoutLineups.forEach(team => {
    const teamName = team.team_name || team.username;
    const username = team.owner_name || team.username;
    console.log(`   - ${username} (${team.team}) - ${team.email}`);
  });
  
  console.log(`\n📧 Sending warning emails...`);
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const team of teamsWithoutLineups) {
    const success = await sendLineupWarning(team, week);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
    
    // Add a small delay between emails to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n📈 Summary:`);
  console.log(`   ✅ Successful warnings: ${successCount}`);
  console.log(`   ❌ Failed warnings: ${failureCount}`);
  console.log(`   📧 Total teams notified: ${successCount}`);
  
  if (failureCount > 0) {
    console.log(`\n⚠️  Some warnings failed to send. Check the logs above for details.`);
  }
  
  console.log(`\n🎉 Lineup warning process completed!`);
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
PFL Lineup Warning Script

Usage:
  node scripts/send-lineup-warnings.js [week] [options]

Arguments:
  week                    Week number (optional, defaults to current week)

Options:
  --force                 Override time check (send warnings regardless of time)
  --help, -h              Show this help message

Examples:
  node scripts/send-lineup-warnings.js           # Send warnings for current week
  node scripts/send-lineup-warnings.js 5        # Send warnings for week 5
  node scripts/send-lineup-warnings.js --force  # Override time check

Environment Variables:
  SMTP_HOST               SMTP server host (default: smtp.gmail.com)
  SMTP_PORT               SMTP server port (default: 587)
  SMTP_USER               SMTP username (required)
  SMTP_PASS               SMTP password (required)
  TURSO_URL               Turso database URL (default: file:./PFL_2025.db)
  TURSO_AUTH_TOKEN        Turso auth token (if using remote database)

Notes:
  - Warnings are only sent on Saturdays at 5pm EST or later
  - Only teams without saved lineups receive warnings
  - Emails are sent to all team owners with valid email addresses
  `);
  process.exit(0);
}

// Check for force flag
if (process.argv.includes('--force')) {
  console.log('🔓 Force flag detected - bypassing time check');
  // Override the time check
  const originalCheckTimeRequirement = checkTimeRequirement;
  checkTimeRequirement = async () => {
    console.log('✅ Time check bypassed due to --force flag');
    return true;
  };
}

// Run the script
main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
