#!/usr/bin/env node

const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });

async function updateWaiverPlayersOwnership() {
    const db = createClient({
        url: process.env.TURSO_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    try {
        console.log('=== Updating Owner_ID for WaiverPlayers ===\n');

        // First, let's see what players are currently in the WaiverPlayers table
        console.log('1. Checking current WaiverPlayers...');
        const waiverPlayers = await db.execute(`
            SELECT 
                wp.player_id,
                wp.team_id,
                wp.waiver_order,
                wp.status,
                p.player_name,
                p.position,
                p.owner_ID as current_owner_id
            FROM WaiverPlayers wp
            LEFT JOIN Players p ON wp.player_id = p.player_ID
            ORDER BY wp.waiver_order
        `);

        console.log(`Found ${waiverPlayers.rows.length} players in WaiverPlayers table:`);
        waiverPlayers.rows.forEach((player, index) => {
            console.log(`  ${index + 1}. ${player.player_name} (${player.position}) - Current Owner: ${player.current_owner_id}`);
        });

        if (waiverPlayers.rows.length === 0) {
            console.log('No players found in WaiverPlayers table. Nothing to update.');
            return;
        }

        // Get all unique player_ids from WaiverPlayers
        const playerIds = waiverPlayers.rows.map(row => row.player_id);
        console.log(`\n2. Updating owner_ID to 99 for ${playerIds.length} players...`);

        // Update owner_ID to 99 for all players in WaiverPlayers
        const updateResult = await db.execute({
            sql: `
                UPDATE Players 
                SET owner_ID = '99' 
                WHERE player_ID IN (${playerIds.map(() => '?').join(',')})
            `,
            args: playerIds
        });

        console.log(`✓ Updated ${updateResult.rowsAffected} players' owner_ID to 99`);

        // Verify the updates
        console.log('\n3. Verifying updates...');
        const verifyResult = await db.execute(`
            SELECT 
                wp.player_id,
                wp.team_id,
                wp.waiver_order,
                wp.status,
                p.player_name,
                p.position,
                p.owner_ID as new_owner_id
            FROM WaiverPlayers wp
            LEFT JOIN Players p ON wp.player_id = p.player_ID
            ORDER BY wp.waiver_order
        `);

        console.log('Updated players:');
        verifyResult.rows.forEach((player, index) => {
            console.log(`  ${index + 1}. ${player.player_name} (${player.position}) - New Owner: ${player.new_owner_id}`);
        });

        // Check if any players still don't have owner_ID = 99
        const notUpdated = verifyResult.rows.filter(row => row.new_owner_id !== '99');
        if (notUpdated.length > 0) {
            console.log('\n⚠️  Warning: Some players were not updated:');
            notUpdated.forEach(player => {
                console.log(`  - ${player.player_name}: owner_ID = ${player.new_owner_id}`);
            });
        } else {
            console.log('\n✅ All players in WaiverPlayers now have owner_ID = 99');
        }

        console.log('\n=== Update Complete ===');

    } catch (error) {
        console.error('Error updating waiver players ownership:', error);
        throw error;
    } finally {
        await db.close();
    }
}

// Run the script
if (require.main === module) {
    updateWaiverPlayersOwnership()
        .then(() => {
            console.log('Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Script failed:', error);
            process.exit(1);
        });
}

module.exports = { updateWaiverPlayersOwnership };


