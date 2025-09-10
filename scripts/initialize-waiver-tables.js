require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function initializeWaiverTables() {
  try {
    console.log('Initializing waiver system tables...');

    // Create WaiverPlayers table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS WaiverPlayers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id TEXT NOT NULL,
        team_id TEXT NOT NULL,
        waiver_order INTEGER NOT NULL,
        waived_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'available' CHECK (status IN ('available', 'drafted')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create WaiverDrafts table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS WaiverDrafts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week INTEGER NOT NULL UNIQUE,
        scheduled_date TEXT NOT NULL,
        status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME,
        completed_at DATETIME,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create WaiverDraftOrder table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS WaiverDraftOrder (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        draft_id TEXT NOT NULL,
        team_id TEXT NOT NULL,
        draft_order INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(draft_id, team_id),
        UNIQUE(draft_id, draft_order)
      )
    `);

    // Create WaiverPicks table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS WaiverPicks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        draft_id TEXT NOT NULL,
        team_id TEXT NOT NULL,
        player_id TEXT NOT NULL,
        pick_number INTEGER NOT NULL,
        picked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(draft_id, pick_number),
        UNIQUE(draft_id, player_id)
      )
    `);

    // Create indexes for better performance
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_waiver_players_status ON WaiverPlayers(status)
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_waiver_players_team ON WaiverPlayers(team_id)
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_waiver_drafts_week ON WaiverDrafts(week)
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_waiver_drafts_status ON WaiverDrafts(status)
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_waiver_draft_order_draft ON WaiverDraftOrder(draft_id)
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_waiver_picks_draft ON WaiverPicks(draft_id)
    `);

    console.log('Waiver system tables initialized successfully!');
    
    // Create initial waiver drafts for the season
    const waiverWeeks = [2, 5, 8, 11];
    const scheduledDates = [
      '2025-09-17 20:00:00', // Week 2-3 waiver draft
      '2025-10-08 20:00:00', // Week 5-6 waiver draft  
      '2025-10-29 20:00:00', // Week 8-9 waiver draft
      '2025-11-19 20:00:00'  // Week 11-12 waiver draft
    ];

    for (let i = 0; i < waiverWeeks.length; i++) {
      const week = waiverWeeks[i];
      const scheduledDate = scheduledDates[i];
      
      try {
        await db.execute(`
          INSERT INTO WaiverDrafts (week, scheduled_date, status)
          VALUES (?, ?, 'scheduled')
        `, [week, scheduledDate]);
        
        console.log(`Created waiver draft for week ${week}`);
      } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
          console.log(`Waiver draft for week ${week} already exists`);
        } else {
          throw error;
        }
      }
    }

    console.log('Initial waiver drafts created successfully!');
    
  } catch (error) {
    console.error('Error initializing waiver tables:', error);
    throw error;
  }
}

// Run the initialization
if (require.main === module) {
  initializeWaiverTables()
    .then(() => {
      console.log('Waiver system initialization complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to initialize waiver system:', error);
      process.exit(1);
    });
}

module.exports = { initializeWaiverTables };
