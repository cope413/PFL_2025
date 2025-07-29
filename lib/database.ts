// Database connection
import Database from 'better-sqlite3';
import path from 'path';

// Initialize database with better error handling
let db: Database.Database | null = null;

function getDatabase(): Database.Database {
  if (!db) {
    try {
      const dbPath = path.join(process.cwd(), 'PFL_2025.db');
      console.log('Connecting to database at:', dbPath);
      db = new Database(dbPath);
      console.log('Database connection established successfully');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }
  return db;
}

// Temporary mock database for development
// TODO: Install better-sqlite3 package for production

// Mock database data
const mockData = {
  users: [
    { id: 'u1', username: 'admin', email: 'admin@example.com', avatar: null }
  ],
  players: [],
  teams: [],
  leagues: []
};

// Enable foreign keys
getDatabase().pragma('foreign_keys = ON');

// Database initialization
export function initializeDatabase() {
  try {
    console.log('Initializing database...');
    console.log('Database already exists with user table, skipping initialization');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Database queries with error handling
export const dbQueries = {
  // User queries (using the 'user' table that exists)
  getUsers: getDatabase().prepare('SELECT * FROM user ORDER BY username'),
  getUserById: getDatabase().prepare('SELECT * FROM user WHERE id = ?'),
  getUserByUsername: getDatabase().prepare('SELECT * FROM user WHERE username = ?'),
  createUser: getDatabase().prepare(`
    INSERT INTO user (username, password, team, team_name)
    VALUES (?, ?, ?, ?)
  `),
  updateUser: getDatabase().prepare(`
    UPDATE user 
    SET username = ?, email = ?
    WHERE id = ?
  `),
  deleteUser: getDatabase().prepare('DELETE FROM user WHERE id = ?'),

  // Standings queries (using the 'Standings' table that exists)
  getStandings: getDatabase().prepare('SELECT * FROM Standings'),
  getStandingsByTeam: getDatabase().prepare('SELECT * FROM Standings WHERE Team_ID = ?'),

  // FinalStandings queries (using the 'FinalStandings' table that exists)
  getFinalStandings: getDatabase().prepare('SELECT * FROM FinalStandings'),

  // Players queries (using the 'Players' table that exists)
  getPlayers: getDatabase().prepare('SELECT * FROM Players'),
  getPlayersByOwner: getDatabase().prepare('SELECT * FROM Players WHERE owner_ID = ?'),
  getPlayerById: getDatabase().prepare('SELECT * FROM Players WHERE player_ID = ?'),

  // Lineup queries (using the 'Lineups' table that exists)
  saveLineup: getDatabase().prepare(`
    INSERT OR REPLACE INTO Lineups (owner_ID, week, QB, RB_1, WR_1, FLEX_1, FLEX_2, TE, K, DEF)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  getLineup: getDatabase().prepare('SELECT * FROM Lineups WHERE owner_ID = ? AND week = ?'),
};

// Helper functions
export function generateId(prefix: string): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function parseJsonField(field: string | null): any {
  if (!field) return null;
  try {
    return JSON.parse(field);
  } catch {
    return null;
  }
}

export function stringifyJsonField(data: any): string {
  return JSON.stringify(data);
}

// Initialize database on import
initializeDatabase();

export default getDatabase(); 