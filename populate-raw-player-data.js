#!/usr/bin/env node
/**
 * Script to populate the Raw Player Data table with NFL roster data
 */

const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Import the Python modules data (we'll need to recreate this in JS)
const teams = {
    1: 'Las Vegas Raiders',
    2: 'Jacksonville Jaguars',
    3: 'New England Patriots',
    4: 'New York Giants',
    5: 'Baltimore Ravens',
    6: 'Tennessee Titans',
    7: 'Detroit Lions',
    8: 'Atlanta Falcons',
    9: 'Cleveland Browns',
    10: 'Cincinnati Bengals',
    11: 'Arizona Cardinals',
    12: 'Philadelphia Eagles',
    13: 'New York Jets',
    14: 'San Francisco 49ers',
    15: 'Green Bay Packers',
    16: 'Chicago Bears',
    17: 'Kansas City Chiefs',
    18: 'Washington Commanders',
    19: 'Carolina Panthers',
    20: 'Buffalo Bills',
    21: 'Indianapolis Colts',
    22: 'Pittsburgh Steelers',
    23: 'Seattle Seahawks',
    24: 'Tampa Bay Buccaneers',
    25: 'Miami Dolphins',
    26: 'Houston Texans',
    27: 'New Orleans Saints',
    28: 'Denver Broncos',
    29: 'Dallas Cowboys',
    30: 'Los Angeles Chargers',
    31: 'Los Angeles Rams',
    32: 'Minnesota Vikings'
};

const team_abbreviations = {
    "Arizona Cardinals": "ARI",
    "Atlanta Falcons": "ATL",
    "Baltimore Ravens": "BAL",
    "Buffalo Bills": "BUF",
    "Carolina Panthers": "CAR",
    "Chicago Bears": "CHI",
    "Cincinnati Bengals": "CIN",
    "Cleveland Browns": "CLE",
    "Dallas Cowboys": "DAL",
    "Denver Broncos": "DEN",
    "Detroit Lions": "DET",
    "Green Bay Packers": "GB",
    "Houston Texans": "HOU",
    "Indianapolis Colts": "IND",
    "Jacksonville Jaguars": "JAC",
    "Kansas City Chiefs": "KC",
    "Las Vegas Raiders": "LV",
    "Los Angeles Chargers": "LAC",
    "Los Angeles Rams": "LAR",
    "Miami Dolphins": "MIA",
    "Minnesota Vikings": "MIN",
    "New England Patriots": "NE",
    "New Orleans Saints": "NO",
    "New York Giants": "NYG",
    "New York Jets": "NYJ",
    "Philadelphia Eagles": "PHI",
    "Pittsburgh Steelers": "PIT",
    "San Francisco 49ers": "SF",
    "Seattle Seahawks": "SEA",
    "Tampa Bay Buccaneers": "TB",
    "Tennessee Titans": "TEN",
    "Washington Commanders": "WAS"
};

const team_IDs = {
    "Arizona Cardinals": 99999,
    "Atlanta Falcons": 99998,
    "Baltimore Ravens": 99997,
    "Buffalo Bills": 99996,
    "Carolina Panthers": 99995,
    "Chicago Bears": 99994,
    "Cincinnati Bengals": 99993,
    "Cleveland Browns": 99992,
    "Dallas Cowboys": 99991,
    "Denver Broncos": 99990,
    "Detroit Lions": 99989,
    "Green Bay Packers": 99988,
    "Houston Texans": 99987,
    "Indianapolis Colts": 99986,
    "Jacksonville Jaguars": 99985,
    "Kansas City Chiefs": 99984,
    "Las Vegas Raiders": 99983,
    "Los Angeles Chargers": 99982,
    "Los Angeles Rams": 99981,
    "Miami Dolphins": 99980,
    "Minnesota Vikings": 99979,
    "New England Patriots": 99978,
    "New Orleans Saints": 99977,
    "New York Giants": 99976,
    "New York Jets": 99975,
    "Philadelphia Eagles": 99974,
    "Pittsburgh Steelers": 99973,
    "San Francisco 49ers": 99972,
    "Seattle Seahawks": 99971,
    "Tampa Bay Buccaneers": 99970,
    "Tennessee Titans": 99969,
    "Washington Commanders": 99968
};

function findPlayerDirectory() {
    const apiSportsDir = path.join(__dirname, 'API Sports');
    const rostersDir = path.join(apiSportsDir, 'Rosters');
    
    // Check if Rosters directory exists
    if (fs.existsSync(rostersDir)) {
        console.log(`Found players directory: ${rostersDir}`);
        return rostersDir;
    }
    
    // If Rosters doesn't exist, look for Week* directories
    const items = fs.readdirSync(apiSportsDir);
    for (const item of items) {
        if (item.startsWith('Week') && fs.statSync(path.join(apiSportsDir, item)).isDirectory()) {
            const playersDir = path.join(apiSportsDir, item, 'Players');
            if (fs.existsSync(playersDir)) {
                console.log(`Found players directory: ${playersDir}`);
                return playersDir;
            }
        }
    }
    
    // If no Week* directory found, look for any directory with Players subdirectory
    for (const item of items) {
        const fullPath = path.join(apiSportsDir, item);
        if (fs.statSync(fullPath).isDirectory()) {
            const playersDir = path.join(fullPath, 'Players');
            if (fs.existsSync(playersDir)) {
                console.log(`Found players directory: ${playersDir}`);
                return playersDir;
            }
        }
    }
    
    console.log(`Available directories in ${apiSportsDir}:`);
    for (const item of items) {
        if (fs.statSync(path.join(apiSportsDir, item)).isDirectory()) {
            console.log(`  - ${item}`);
        }
    }
    
    return null;
}

function processPlayerFiles() {
    const playerDirectory = findPlayerDirectory();
    
    if (!playerDirectory) {
        console.log('Error: Could not find player directory');
        return [];
    }
    
    console.log(`Processing player files from: ${playerDirectory}`);
    
    const allPlayers = [];
    const files = fs.readdirSync(playerDirectory);
    
    for (const filename of files) {
        if (filename.endsWith('.json')) {
            const filePath = path.join(playerDirectory, filename);
            console.log(`Processing: ${filename}`);
            
            try {
                const rosterData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                // Extract team name from filename
                const teamName = filename.replace('_players.json', '');
                
                // Find team ID
                let teamId = null;
                for (const [id, name] of Object.entries(teams)) {
                    if (name === teamName) {
                        teamId = parseInt(id);
                        break;
                    }
                }
                
                if (teamId === null) {
                    console.log(`Warning: Could not find team ID for ${teamName}`);
                    continue;
                }
                
                // Process each player in the roster
                for (const player of rosterData.response) {
                    const playerData = {
                        player_id: player.id,
                        player_name: player.name,
                        position: player.position,
                        team_name: teamName,
                        team_id: teamId,
                        team_abbrev: team_abbreviations[teamName] || '',
                        group_name: player.group,
                        api_data: JSON.stringify(player)
                    };
                    
                    allPlayers.push(playerData);
                }
                
            } catch (error) {
                console.log(`Error processing ${filename}: ${error.message}`);
            }
        }
    }
    
    // Add D/ST entries for each team
    for (const [teamId, teamName] of Object.entries(teams)) {
        allPlayers.push({
            player_id: team_IDs[teamName],
            player_name: teamName,
            position: 'D/ST',
            team_name: teamName,
            team_id: parseInt(teamId),
            team_abbrev: team_abbreviations[teamName] || '',
            group_name: 'D/ST',
            api_data: JSON.stringify({
                name: teamName,
                id: team_IDs[teamName],
                position: 'D/ST',
                group: 'D/ST'
            })
        });
    }
    
    console.log(`Total players found: ${allPlayers.length}`);
    return allPlayers;
}

async function populateRawPlayerDataTable() {
    const db = createClient({
        url: process.env.TURSO_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    try {
        console.log('Connected to Turso database successfully!');

        // Clear existing data
        console.log('Clearing existing data from Raw Player Data table...');
        await db.execute('DELETE FROM "Raw Player Data"');

        // Get all players data
        console.log('Processing NFL roster data...');
        const allPlayers = processPlayerFiles();

        if (allPlayers.length === 0) {
            console.log('No player data found!');
            return false;
        }

        // Insert players into the database
        console.log(`Inserting ${allPlayers.length} players into Raw Player Data table...`);

        const insertSql = `
            INSERT INTO "Raw Player Data" 
            (player_id, player_name, position, team_name, team_id, team_abbrev, group_name, api_data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        let insertedCount = 0;
        for (const player of allPlayers) {
            try {
                await db.execute(insertSql, [
                    player.player_id,
                    player.player_name,
                    player.position,
                    player.team_name,
                    player.team_id,
                    player.team_abbrev,
                    player.group_name,
                    player.api_data
                ]);
                insertedCount++;

                if (insertedCount % 100 === 0) {
                    console.log(`Inserted ${insertedCount} players...`);
                }

            } catch (error) {
                console.log(`Error inserting player ${player.player_name}: ${error.message}`);
            }
        }

        console.log(`Successfully inserted ${insertedCount} players into Raw Player Data table!`);

        // Verify the data
        const result = await db.execute('SELECT COUNT(*) as count FROM "Raw Player Data"');
        const count = result.rows[0].count;
        console.log(`Verification: ${count} players in Raw Player Data table`);

        return true;

    } catch (error) {
        console.error('Error populating table:', error);
        return false;
    } finally {
        await db.close();
    }
}

// Run the script
async function main() {
    console.log('=== Populating Raw Player Data Table ===');
    
    const success = await populateRawPlayerDataTable();
    
    if (success) {
        console.log('\n✓ Raw Player Data table populated successfully!');
    } else {
        console.log('\n✗ Failed to populate Raw Player Data table');
    }
}

main().catch(console.error);
