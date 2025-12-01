#!/usr/bin/env node
/**
 * Test script to check what the team roster API returns
 */

const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });

async function testApiResponse() {
  const db = createClient({
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    console.log('=== Testing Team Roster API Response ===');

    // Simulate the exact query that the API uses
    const result = await db.execute(`
      SELECT
        p.player_ID as id,
        p.player_name as name,
        p.position,
        p.team_name as nflTeam,
        p.owner_ID as team,
        p.team_id,
        COALESCE(p.injury_status, 'healthy') as injury_status,
        COALESCE(n.bye, 0) as byeWeek,
        COALESCE(pts.week_1, 0) as week_1,
        COALESCE(pts.week_2, 0) as week_2,
        COALESCE(pts.week_3, 0) as week_3,
        COALESCE(pts.week_4, 0) as week_4,
        COALESCE(pts.week_5, 0) as week_5,
        COALESCE(pts.week_6, 0) as week_6,
        COALESCE(pts.week_7, 0) as week_7,
        COALESCE(pts.week_8, 0) as week_8,
        COALESCE(pts.week_9, 0) as week_9,
        COALESCE(pts.week_10, 0) as week_10,
        COALESCE(pts.week_11, 0) as week_11,
        COALESCE(pts.week_12, 0) as week_12,
        COALESCE(pts.week_13, 0) as week_13,
        COALESCE(pts.week_14, 0) as week_14
      FROM Players p
      LEFT JOIN NFL_Teams n ON p.team_id = n.team_id
      LEFT JOIN Points pts ON p.player_ID = pts.player_ID
      WHERE p.owner_ID = 'C2'
      ORDER BY p.position, p.player_name
    `);

    console.log(`Found ${result.rows.length} players for team C2`);

    // Transform the data exactly like the API does
    const transformedPlayers = result.rows.map((player) => {
      // Calculate average points from weeks 1-14
      const weekPoints = [
        Number(player[9]), Number(player[10]), Number(player[11]), Number(player[12]),
        Number(player[13]), Number(player[14]), Number(player[15]), Number(player[16]),
        Number(player[17]), Number(player[18]), Number(player[19]), Number(player[20]),
        Number(player[21]), Number(player[22])
      ];

      // Filter out zero/null values and calculate average
      const validPoints = weekPoints.filter(point => point > 0);

      const averagePoints = validPoints.length > 0
        ? Math.round((validPoints.reduce((sum, point) => sum + point, 0) / validPoints.length) * 100) / 100
        : 0;

      // Use real injury status from database, fallback to 'healthy' if not set
      const injuryStatus = player[6] || 'healthy';

      return {
        id: player[0].toString(),
        name: player[1],
        position: player[2],
        team: player[3],
        nflTeam: player[4],
        projectedPoints: 0, // Set to 0 since no real data exists
        status: injuryStatus,
        byeWeek: player[7] || undefined,
        teamId: player[5],
        ownerId: player[3],
        recentPerformance: [averagePoints] // Use calculated average points
      };
    });

    console.log('\n=== Transformed Player Data ===');
    transformedPlayers.forEach(player => {
      console.log(`${player.name} (${player.position}): ${player.status}`);
    });

    // Check specifically for the questionable players
    const questionablePlayers = transformedPlayers.filter(p => p.status === 'questionable');
    console.log(`\n=== Questionable Players ===`);
    questionablePlayers.forEach(player => {
      console.log(`${player.name} (${player.position}): ${player.status}`);
    });

  } catch (error) {
    console.error('Error testing API response:', error);
  } finally {
    await db.close();
  }
}

testApiResponse().catch(console.error);







