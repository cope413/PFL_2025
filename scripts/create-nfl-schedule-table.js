#!/usr/bin/env node

const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });

async function createNFLScheduleTable() {
    const db = createClient({
        url: process.env.TURSO_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    try {
        console.log('Connected to Turso database successfully!');

        // First, let's see what tables exist
        console.log('\n=== Existing Tables ===');
        const tablesResult = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
        tablesResult.rows.forEach(row => {
            console.log(`  - ${row.name}`);
        });

        // Create the NFL_Schedule table
        console.log('\n=== Creating NFL_Schedule Table ===');
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS NFL_Schedule (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id INTEGER UNIQUE NOT NULL,
                week INTEGER NOT NULL,
                season INTEGER NOT NULL,
                game_date DATE NOT NULL,
                game_time_utc DATETIME NOT NULL,
                game_time_la DATETIME NOT NULL,
                home_team_id INTEGER NOT NULL,
                home_team_name TEXT NOT NULL,
                home_team_abbrev TEXT NOT NULL,
                away_team_id INTEGER NOT NULL,
                away_team_name TEXT NOT NULL,
                away_team_abbrev TEXT NOT NULL,
                venue TEXT,
                status TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await db.execute(createTableSQL);
        console.log('✓ NFL_Schedule table created successfully!');

        // Verify the table was created
        const verifyResult = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='NFL_Schedule'");
        if (verifyResult.rows.length > 0) {
            console.log('✓ Table verification successful');
        } else {
            console.log('✗ Table verification failed');
        }

        // Show the table structure
        console.log('\n=== Table Structure ===');
        const structureResult = await db.execute("PRAGMA table_info('NFL_Schedule')");
        structureResult.rows.forEach(row => {
            console.log(`  ${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : ''} ${row.pk ? 'PRIMARY KEY' : ''}`);
        });

        console.log('\n✓ NFL_Schedule table setup complete!');
        return true;

    } catch (error) {
        console.error('Error creating NFL_Schedule table:', error);
        return false;
    }
}

// Run the function if this script is executed directly
if (require.main === module) {
    createNFLScheduleTable()
        .then(success => {
            if (success) {
                console.log('\n🎉 NFL_Schedule table creation completed successfully!');
                process.exit(0);
            } else {
                console.log('\n❌ NFL_Schedule table creation failed!');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = { createNFLScheduleTable };
