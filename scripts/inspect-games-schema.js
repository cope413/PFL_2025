#!/usr/bin/env node
// Inspect the Games table schema in Turso and print columns

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@libsql/client');

async function main() {
  const db = createClient({
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    console.log('Connected to Turso');
    const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='Games'");
    if (!tables.rows.length) {
      console.log('Games table not found. Existing tables:');
      const all = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
      console.log(all.rows.map(r => r.name).join(', '));
      return;
    }

    const info = await db.execute("PRAGMA table_info('Games')");
    console.log('\nGames schema:');
    info.rows.forEach(r => {
      console.log(`- ${r.cid}. ${r.name} ${r.type}${r.notnull ? ' NOT NULL' : ''}${r.pk ? ' PRIMARY KEY' : ''}${r.dflt_value ? ` DEFAULT ${r.dflt_value}` : ''}`);
    });
  } catch (e) {
    console.error('Error inspecting Games schema:', e);
  } finally {
    try { await db.close(); } catch {}
  }
}

main().catch(console.error);










