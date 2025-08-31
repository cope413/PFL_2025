#!/usr/bin/env node
/**
 * Script to update the Players table with data from the Raw Player Data table
 * Updates player_name, team_name, and team_id for matching player_IDs
 */

const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });

async function updatePlayersFromRawData() {
    const db = createClient({
        url: process.env.TURSO_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    try {
        console.log('=== Updating Players Table from Raw Player Data ===');

        // First, let's see how many players exist in both tables
        const overlapQuery = `
            SELECT COUNT(*) as count
            FROM Players p
            INNER JOIN "Raw Player Data" r ON p.player_ID = r.player_id
        `;
        const overlapResult = await db.execute(overlapQuery);
        const overlapCount = overlapResult.rows[0].count;
        console.log(`Players that exist in both tables: ${overlapCount}`);

        // Get all players that exist in both tables with their current and new data
        const comparisonQuery = `
            SELECT 
                p.player_ID,
                p.player_name as current_name,
                p.team_name as current_team,
                p.team_id as current_team_id,
                r.player_name as new_name,
                r.team_name as new_team,
                r.team_id as new_team_id
            FROM Players p
            INNER JOIN "Raw Player Data" r ON p.player_ID = r.player_id
            ORDER BY p.player_ID
        `;
        const comparisonResult = await db.execute(comparisonQuery);
        
        console.log(`\nFound ${comparisonResult.rows.length} players to potentially update`);
        
        let updateCount = 0;
        let skipCount = 0;
        
        // Process each player
        for (const row of comparisonResult.rows) {
            const playerId = row.player_ID;
            const currentName = row.current_name;
            const currentTeam = row.current_team;
            const currentTeamId = row.current_team_id;
            const newName = row.new_name;
            const newTeam = row.new_team;
            const newTeamId = row.new_team_id;
            
            // Check if any data needs updating
            const needsUpdate = (
                currentName !== newName ||
                currentTeam !== newTeam ||
                currentTeamId !== newTeamId
            );
            
            if (needsUpdate) {
                console.log(`\nUpdating Player ID ${playerId}:`);
                console.log(`  Name: "${currentName}" → "${newName}"`);
                console.log(`  Team: "${currentTeam}" → "${newTeam}"`);
                console.log(`  Team ID: ${currentTeamId} → ${newTeamId}`);
                
                // Update the player
                const updateQuery = `
                    UPDATE Players 
                    SET player_name = ?, team_name = ?, team_id = ?
                    WHERE player_ID = ?
                `;
                
                await db.execute(updateQuery, [newName, newTeam, newTeamId, playerId]);
                updateCount++;
            } else {
                skipCount++;
            }
        }
        
        console.log(`\n=== Update Summary ===`);
        console.log(`Players updated: ${updateCount}`);
        console.log(`Players skipped (no changes needed): ${skipCount}`);
        console.log(`Total players processed: ${comparisonResult.rows.length}`);
        
        // Show some examples of updated players
        if (updateCount > 0) {
            console.log(`\n=== Sample of Updated Players ===`);
            const sampleQuery = `
                SELECT 
                    p.player_ID,
                    p.player_name,
                    p.team_name,
                    p.team_id
                FROM Players p
                INNER JOIN "Raw Player Data" r ON p.player_ID = r.player_id
                WHERE p.player_name = r.player_name 
                  AND p.team_name = r.team_name 
                  AND p.team_id = r.team_id
                ORDER BY p.player_ID
                LIMIT 10
            `;
            const sampleResult = await db.execute(sampleQuery);
            sampleResult.rows.forEach(row => {
                console.log(`  ID: ${row.player_ID}, Name: ${row.player_name}, Team: ${row.team_name} (${row.team_id})`);
            });
        }
        
        return true;

    } catch (error) {
        console.error('Error updating players:', error);
        return false;
    } finally {
        await db.close();
    }
}

// Run the script
async function main() {
    console.log('Starting Players table update...');
    
    const success = await updatePlayersFromRawData();
    
    if (success) {
        console.log('\n✓ Players table update completed successfully!');
    } else {
        console.log('\n✗ Failed to update Players table');
    }
}

main().catch(console.error);
