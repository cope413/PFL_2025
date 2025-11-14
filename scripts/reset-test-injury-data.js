#!/usr/bin/env node
/**
 * Script to reset test injury data back to healthy
 */

const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });

async function resetTestInjuryData() {
    const db = createClient({
        url: process.env.TURSO_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    try {
        console.log('=== Resetting Test Injury Data ===');

        // Reset all players to healthy status
        const result = await db.execute({
            sql: 'UPDATE Players SET injury_status = ? WHERE owner_ID != 99',
            args: ['healthy']
        });

        console.log(`✓ Reset ${result.rowsAffected} players to healthy status`);

        // Verify the reset
        const statusResult = await db.execute(`
            SELECT injury_status, COUNT(*) as count 
            FROM Players 
            WHERE owner_ID != 99 
            GROUP BY injury_status 
            ORDER BY count DESC
        `);

        console.log('\nUpdated injury status distribution:');
        statusResult.rows.forEach(row => {
            console.log(`  - ${row[0]}: ${row[1]} players`);
        });

        console.log('\n✅ All players reset to healthy status!');

    } catch (error) {
        console.error('Error resetting injury data:', error);
    } finally {
        await db.close();
    }
}

// Run the reset
resetTestInjuryData().catch(console.error);






