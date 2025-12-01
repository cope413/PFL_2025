#!/usr/bin/env node
/**
 * Test script to make a real HTTP request to the team roster API
 */

const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });

async function testHttpApi() {
  const db = createClient({
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    console.log('=== Testing HTTP API Request ===');

    // First, get a valid auth token for user cope413
    const user = await db.execute(`
      SELECT id, username, team, team_name, password
      FROM user 
      WHERE username = 'cope413'
    `);

    if (user.rows.length === 0) {
      console.log('User cope413 not found');
      return;
    }

    const userId = user.rows[0][0];
    const username = user.rows[0][1];
    const team = user.rows[0][2];
    const teamName = user.rows[0][3];
    const password = user.rows[0][4];

    console.log(`Found user: ${username} (ID: ${userId}, Team: ${team})`);

    // Try to make a request to the API
    console.log('\nMaking HTTP request to /api/team-roster...');
    
    try {
      const response = await fetch('http://localhost:3000/api/team-roster', {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(data, null, 2));

      if (data.success && data.data) {
        console.log('\n=== Players with Injury Status ===');
        data.data.forEach(player => {
          console.log(`${player.name} (${player.position}): ${player.status}`);
        });

        const questionablePlayers = data.data.filter(p => p.status === 'questionable');
        console.log(`\n=== Questionable Players ===`);
        questionablePlayers.forEach(player => {
          console.log(`${player.name} (${player.position}): ${player.status}`);
        });
      }

    } catch (fetchError) {
      console.error('HTTP request failed:', fetchError.message);
      console.log('This is expected since we need proper authentication');
    }

  } catch (error) {
    console.error('Error testing HTTP API:', error);
  } finally {
    await db.close();
  }
}

testHttpApi().catch(console.error);







