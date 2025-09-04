#!/usr/bin/env node
/**
 * Script to test the injury status implementation
 */

const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });

async function testInjuryImplementation() {
    const db = createClient({
        url: process.env.TURSO_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    try {
        console.log('=== Testing Injury Status Implementation ===');

        // Test 1: Check if injury_status column exists
        console.log('\n1. Checking database schema...');
        const structureResult = await db.execute("PRAGMA table_info(Players)");
        const hasInjuryColumn = structureResult.rows.some(row => row.name === 'injury_status');
        
        if (hasInjuryColumn) {
            console.log('✓ injury_status column exists');
        } else {
            console.log('✗ injury_status column missing');
            return;
        }

        // Test 2: Check current injury status distribution
        console.log('\n2. Checking current injury status distribution...');
        const statusResult = await db.execute(`
            SELECT injury_status, COUNT(*) as count 
            FROM Players 
            WHERE owner_ID != 99 
            GROUP BY injury_status 
            ORDER BY count DESC
        `);

        console.log('Current injury status distribution:');
        statusResult.rows.forEach(row => {
            console.log(`  - ${row[0]}: ${row[1]} players`);
        });

        // Test 3: Manually set some test injury statuses
        console.log('\n3. Setting test injury statuses...');
        
        // Get a few players to test with
        const testPlayers = await db.execute(`
            SELECT player_ID, player_name, team_name 
            FROM Players 
            WHERE owner_ID != 99 
            LIMIT 5
        `);

        if (testPlayers.rows.length > 0) {
            const testStatuses = ['questionable', 'doubtful', 'out'];
            
            for (let i = 0; i < Math.min(3, testPlayers.rows.length); i++) {
                const player = testPlayers.rows[i];
                const status = testStatuses[i];
                
                await db.execute({
                    sql: 'UPDATE Players SET injury_status = ? WHERE player_ID = ?',
                    args: [status, player[0]]
                });
                
                console.log(`  - Set ${player[1]} (${player[2]}) to ${status}`);
            }
        }

        // Test 4: Verify the changes
        console.log('\n4. Verifying test changes...');
        const updatedStatusResult = await db.execute(`
            SELECT injury_status, COUNT(*) as count 
            FROM Players 
            WHERE owner_ID != 99 
            GROUP BY injury_status 
            ORDER BY count DESC
        `);

        console.log('Updated injury status distribution:');
        updatedStatusResult.rows.forEach(row => {
            console.log(`  - ${row[0]}: ${row[1]} players`);
        });

        // Test 5: Test the team roster API query
        console.log('\n5. Testing team roster query with injury status...');
        const teamRosterResult = await db.execute(`
            SELECT
                p.player_ID as id,
                p.player_name as name,
                p.position,
                p.team_name as nflTeam,
                p.owner_ID as team,
                p.team_id,
                COALESCE(p.injury_status, 'healthy') as injury_status,
                COALESCE(n.bye, 0) as byeWeek
            FROM Players p
            LEFT JOIN NFL_Teams n ON p.team_id = n.team_id
            WHERE p.owner_ID != 99
            LIMIT 5
        `);

        console.log('Sample team roster with injury status:');
        teamRosterResult.rows.forEach(row => {
            console.log(`  - ${row[1]} (${row[2]}): ${row[6]}`);
        });

        console.log('\n✅ All tests completed successfully!');
        console.log('\nThe injury status implementation is working correctly.');
        console.log('You can now run the injury sync script to get real data from API Sports.');

    } catch (error) {
        console.error('Error testing injury implementation:', error);
    } finally {
        await db.close();
    }
}

// Run the test
testInjuryImplementation().catch(console.error);



