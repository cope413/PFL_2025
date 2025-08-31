#!/usr/bin/env node
/**
 * Script to check which players from missing_rankings_players.json now exist in Players table
 */

const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function loadMissingRankingsPlayers() {
    console.log('Loading missing rankings players from JSON file...');
    
    try {
        const jsonPath = path.join('API Sports', 'missing_rankings_players.json');
        const jsonData = fs.readFileSync(jsonPath, 'utf8');
        const players = JSON.parse(jsonData);
        console.log(`Loaded ${players.length} players from missing_rankings_players.json`);
        return players;
    } catch (error) {
        console.error('Error loading missing rankings players:', error.message);
        return [];
    }
}

async function checkPlayersAgainstDatabase(missingPlayers, db) {
    console.log('Checking which missing rankings players now exist in Players table...');
    
    const nowFound = [];
    const stillMissing = [];
    const batchSize = 50;
    
    for (let i = 0; i < missingPlayers.length; i += batchSize) {
        const batch = missingPlayers.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(missingPlayers.length/batchSize)}`);
        
        // Create a batch query to find matches
        const placeholders = batch.map(() => '?').join(',');
        const names = batch.map(p => p.name);
        
        const query = `
            SELECT player_name, player_ID, position, team_name
            FROM Players 
            WHERE player_name IN (${placeholders})
        `;
        
        try {
            const result = await db.execute({ sql: query, args: names });
            const foundNames = new Set(result.rows.map(row => row.player_name));
            
            for (const missingPlayer of batch) {
                if (foundNames.has(missingPlayer.name)) {
                    const dbPlayer = result.rows.find(row => row.player_name === missingPlayer.name);
                    nowFound.push({
                        ...missingPlayer,
                        dbInfo: {
                            player_ID: dbPlayer.player_ID,
                            position: dbPlayer.position,
                            team_name: dbPlayer.team_name
                        }
                    });
                } else {
                    stillMissing.push(missingPlayer);
                }
            }
        } catch (error) {
            console.error(`Error processing batch ${Math.floor(i/batchSize) + 1}:`, error.message);
        }
    }
    
    return { nowFound, stillMissing };
}

async function main() {
    const db = createClient({
        url: process.env.TURSO_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    try {
        console.log('=== Checking Missing Rankings Players Against Players Table ===\n');
        
        // Step 1: Load missing rankings players
        const missingPlayers = await loadMissingRankingsPlayers();
        if (missingPlayers.length === 0) {
            console.log('No missing rankings players found. Exiting.');
            return;
        }
        
        // Step 2: Check against Players table
        const { nowFound, stillMissing } = await checkPlayersAgainstDatabase(missingPlayers, db);
        
        console.log(`\n=== Results ===`);
        console.log(`Total players from missing_rankings_players.json: ${missingPlayers.length}`);
        console.log(`Players now found in Players table: ${nowFound.length}`);
        console.log(`Players still missing from Players table: ${stillMissing.length}`);
        
        if (nowFound.length > 0) {
            console.log(`\n=== Players Now Found in Players Table ===`);
            nowFound.forEach((player, index) => {
                console.log(`${index + 1}. ${player.name} (${player.team}) - Rank ${player.rank}`);
                console.log(`   Database: ID ${player.dbInfo.player_ID}, ${player.dbInfo.position}, ${player.dbInfo.team_name}`);
            });
        }
        
        if (stillMissing.length > 0) {
            console.log(`\n=== Players Still Missing from Players Table ===`);
            stillMissing.forEach((player, index) => {
                console.log(`${index + 1}. Rank ${player.rank}: ${player.name} (${player.team}) - Bye: ${player.bye}`);
            });
            
            // Save still missing players to a new file
            const outputFile = 'API Sports/still_missing_rankings_players.json';
            fs.writeFileSync(outputFile, JSON.stringify(stillMissing, null, 2));
            console.log(`\nStill missing players saved to: ${outputFile}`);
        } else {
            console.log('\n🎉 All players from the missing rankings list are now in the Players table!');
        }
        
    } catch (error) {
        console.error('Error in main process:', error);
    }
}

main();
