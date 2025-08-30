#!/usr/bin/env node
/**
 * Script to create Raw Player Data table in Turso database
 */

const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });

async function createRawPlayerDataTable() {
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

        // Create the Raw Player Data table
        console.log('\n=== Creating Raw Player Data Table ===');
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS "Raw Player Data" (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_id INTEGER NOT NULL,
                player_name TEXT NOT NULL,
                position TEXT,
                team_name TEXT NOT NULL,
                team_id INTEGER NOT NULL,
                team_abbrev TEXT,
                group_name TEXT,
                api_data TEXT,  -- Store the full API response as JSON
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await db.execute(createTableSQL);
        console.log('✓ Raw Player Data table created successfully!');

        // Verify the table was created
        const verifyResult = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='Raw Player Data'");
        if (verifyResult.rows.length > 0) {
            console.log('✓ Table verification successful');
        } else {
            console.log('✗ Table verification failed');
        }

        // Show the table structure
        console.log('\n=== Table Structure ===');
        const structureResult = await db.execute("PRAGMA table_info('Raw Player Data')");
        structureResult.rows.forEach(row => {
            console.log(`  ${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : ''} ${row.pk ? 'PRIMARY KEY' : ''}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await db.close();
    }
}

// Run the script
createRawPlayerDataTable().catch(console.error);
