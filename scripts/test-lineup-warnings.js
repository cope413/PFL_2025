#!/usr/bin/env node

/**
 * Test script for lineup warnings
 * This script tests the database connection and checks for teams without lineups
 * without actually sending any emails.
 */

const { createClient } = require('@libsql/client');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Database configuration
const db = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function getCurrentWeek() {
  try {
    const result = await db.execute({
      sql: "SELECT week FROM Weeks WHERE start <= date('now') AND end >= date('now')"
    });
    
    if (result.rows && result.rows.length > 0) {
      return result.rows[0].week;
    }
    
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

async function getAllUsers() {
  try {
    const result = await db.execute({
      sql: `
        SELECT 
          id,
          username,
          email,
          team,
          team_name,
          owner_name
        FROM user
        WHERE email IS NOT NULL AND email != ''
        ORDER BY username
      `
    });
    
    return result.rows || [];
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
}

async function main() {
  console.log('🧪 PFL Lineup Warnings Test Script');
  console.log('===================================');
  
  // Test database connection
  console.log('\n📊 Testing database connection...');
  try {
    const users = await getAllUsers();
    console.log(`✅ Database connection successful - found ${users.length} users`);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return;
  }
  
  // Get current week
  const week = await getCurrentWeek();
  console.log(`📅 Current week: ${week}`);
  
  // Get teams without lineups
  console.log(`\n🔍 Checking for teams without saved lineups for Week ${week}...`);
  const teamsWithoutLineups = await getTeamsWithoutLineups(week);
  
  if (teamsWithoutLineups.length === 0) {
    console.log('✅ All teams have saved lineups! No warnings would be sent.');
  } else {
    console.log(`⚠️  Found ${teamsWithoutLineups.length} teams without saved lineups:`);
    teamsWithoutLineups.forEach(team => {
      const teamName = team.team_name || team.username;
      const username = team.owner_name || team.username;
      console.log(`   - ${username} (${team.team}) - ${team.email}`);
    });
    
    console.log(`\n📧 If this were a real run, ${teamsWithoutLineups.length} warning emails would be sent.`);
  }
  
  // Show all users for reference
  console.log(`\n👥 All users in system:`);
  const allUsers = await getAllUsers();
  allUsers.forEach(user => {
    const teamName = user.team_name || user.username;
    const username = user.owner_name || user.username;
    console.log(`   - ${username} (${user.team}) - ${user.email}`);
  });
  
  console.log(`\n🎉 Test completed successfully!`);
}

// Run the test
main().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
