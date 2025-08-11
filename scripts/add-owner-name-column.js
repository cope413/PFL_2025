#!/usr/bin/env node
const { createClient } = require("@libsql/client");
require('dotenv').config({ path: '.env.local' });

const db = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function addOwnerNameColumn() {
  try {
    console.log('Adding owner_name column to user table...');
    
    // Check if the column already exists
    const checkColumn = await db.execute({ sql: "PRAGMA table_info(user)" });
    const hasOwnerName = checkColumn.rows.some(col => col.name === 'owner_name');
    
    if (hasOwnerName) {
      console.log('owner_name column already exists in user table');
      return;
    }
    
    // Add the column
    await db.execute({ sql: "ALTER TABLE user ADD COLUMN owner_name TEXT" });
    console.log('Successfully added owner_name column to user table');
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error adding owner_name column:', error);
    throw error;
  }
}

addOwnerNameColumn()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
