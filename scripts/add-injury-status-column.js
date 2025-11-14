#!/usr/bin/env node
/**
 * Script to add injury_status column to Players table
 */

const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });

async function addInjuryStatusColumn() {
    const db = createClient({
        url: process.env.TURSO_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    try {
        console.log('Connected to Turso database successfully!');

        // Check if injury_status column already exists
        console.log('\n=== Checking Current Players Table Structure ===');
        const structureResult = await db.execute("PRAGMA table_info(Players)");
        const existingColumns = structureResult.rows.map(row => row.name);
        
        if (existingColumns.includes('injury_status')) {
            console.log('✓ injury_status column already exists in Players table');
            return;
        }

        console.log('Current Players table columns:');
        structureResult.rows.forEach(row => {
            console.log(`  - ${row.name}: ${row.type}`);
        });

        // Add injury_status column
        console.log('\n=== Adding injury_status Column ===');
        const addColumnSQL = `
            ALTER TABLE Players 
            ADD COLUMN injury_status TEXT DEFAULT 'healthy'
        `;

        await db.execute(addColumnSQL);
        console.log('✓ injury_status column added successfully!');

        // Verify the column was added
        console.log('\n=== Verifying Column Addition ===');
        const newStructureResult = await db.execute("PRAGMA table_info(Players)");
        const newColumns = newStructureResult.rows.map(row => row.name);
        
        if (newColumns.includes('injury_status')) {
            console.log('✓ injury_status column verified in Players table');
        } else {
            console.log('✗ Failed to add injury_status column');
        }

        // Show updated table structure
        console.log('\n=== Updated Players Table Structure ===');
        newStructureResult.rows.forEach(row => {
            console.log(`  - ${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : ''} ${row.pk ? 'PRIMARY KEY' : ''} ${row.dflt_value ? `DEFAULT ${row.dflt_value}` : ''}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await db.close();
    }
}

// Run the script
addInjuryStatusColumn().catch(console.error);






