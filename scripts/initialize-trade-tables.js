require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function initializeTradeTables() {
  try {
    console.log('Initializing trade tables...');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS Trades (
        id TEXT PRIMARY KEY,
        proposer_user_id TEXT NOT NULL,
        proposer_team_id TEXT NOT NULL,
        recipient_user_id TEXT NOT NULL,
        recipient_team_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        proposer_message TEXT,
        response_message TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        resolved_at TEXT,
        resolved_by_user_id TEXT
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS TradeItems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trade_id TEXT NOT NULL,
        player_id TEXT NOT NULL,
        from_team_id TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(trade_id) REFERENCES Trades(id)
      )
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_trades_status ON Trades(status)
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_trade_items_trade_id ON TradeItems(trade_id)
    `);

    console.log('Trade tables initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize trade tables:', error);
    throw error;
  }
}

if (require.main === module) {
  initializeTradeTables()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { initializeTradeTables };

