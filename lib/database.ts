// Database connection
import Database from 'better-sqlite3';
import path from 'path';

// Initialize database
const dbPath = path.join(process.cwd(), 'PFL_2025.db');
const db = new Database(dbPath);

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
db.pragma('foreign_keys = ON');

// Database initialization
export function initializeDatabase() {
  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS leagues (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      current_week INTEGER DEFAULT 1,
      season INTEGER DEFAULT 2024,
      is_active BOOLEAN DEFAULT 1,
      settings TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner TEXT NOT NULL,
      league_id TEXT NOT NULL,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      ties INTEGER DEFAULT 0,
      points_for REAL DEFAULT 0,
      points_against REAL DEFAULT 0,
      logo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (league_id) REFERENCES leagues (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      position TEXT NOT NULL,
      team TEXT NOT NULL,
      nfl_team TEXT NOT NULL,
      image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS player_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT NOT NULL,
      week INTEGER NOT NULL,
      season INTEGER NOT NULL,
      passing_yards INTEGER DEFAULT 0,
      passing_tds INTEGER DEFAULT 0,
      passing_ints INTEGER DEFAULT 0,
      rushing_yards INTEGER DEFAULT 0,
      rushing_tds INTEGER DEFAULT 0,
      receptions INTEGER DEFAULT 0,
      receiving_yards INTEGER DEFAULT 0,
      receiving_tds INTEGER DEFAULT 0,
      fumbles INTEGER DEFAULT 0,
      field_goals INTEGER DEFAULT 0,
      extra_points INTEGER DEFAULT 0,
      sacks INTEGER DEFAULT 0,
      interceptions INTEGER DEFAULT 0,
      fumble_recoveries INTEGER DEFAULT 0,
      defensive_tds INTEGER DEFAULT 0,
      points_allowed INTEGER DEFAULT 0,
      fantasy_points REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
      UNIQUE(player_id, week, season)
    );

    CREATE TABLE IF NOT EXISTS team_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id TEXT NOT NULL,
      player_id TEXT NOT NULL,
      is_starter BOOLEAN DEFAULT 0,
      position_slot TEXT,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
      UNIQUE(team_id, player_id)
    );

    CREATE TABLE IF NOT EXISTS matchups (
      id TEXT PRIMARY KEY,
      league_id TEXT NOT NULL,
      week INTEGER NOT NULL,
      team1_id TEXT NOT NULL,
      team2_id TEXT NOT NULL,
      team1_score REAL DEFAULT 0,
      team2_score REAL DEFAULT 0,
      team1_projected REAL DEFAULT 0,
      team2_projected REAL DEFAULT 0,
      is_complete BOOLEAN DEFAULT 0,
      date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (league_id) REFERENCES leagues (id) ON DELETE CASCADE,
      FOREIGN KEY (team1_id) REFERENCES teams (id) ON DELETE CASCADE,
      FOREIGN KEY (team2_id) REFERENCES teams (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS news (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL,
      player_id TEXT,
      timestamp TEXT NOT NULL,
      source TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Database queries
export const dbQueries = {
  // User queries (using the 'user' table that exists)
  getUsers: db.prepare('SELECT * FROM user ORDER BY username'),
  getUserById: db.prepare('SELECT * FROM user WHERE id = ?'),
  getUserByUsername: db.prepare('SELECT * FROM user WHERE username = ?'),
  getUserByEmail: db.prepare('SELECT * FROM user WHERE email = ?'),
  createUser: db.prepare(`
    INSERT INTO user (id, username, email, avatar)
    VALUES (?, ?, ?, ?)
  `),
  updateUser: db.prepare(`
    UPDATE user 
    SET username = ?, email = ?, avatar = ?
    WHERE id = ?
  `),
  deleteUser: db.prepare('DELETE FROM user WHERE id = ?'),

  // Player queries (using the 'Players' table that exists)
  getPlayers: db.prepare('SELECT * FROM Players ORDER BY name'),
  getPlayersByPosition: db.prepare('SELECT * FROM Players WHERE position = ? ORDER BY name'),
  getPlayersByTeam: db.prepare('SELECT * FROM Players WHERE team = ? ORDER BY name'),
  getPlayerById: db.prepare('SELECT * FROM Players WHERE id = ?'),
  createPlayer: db.prepare(`
    INSERT INTO Players (id, name, position, team, nfl_team, image)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  updatePlayer: db.prepare(`
    UPDATE Players 
    SET name = ?, position = ?, team = ?, nfl_team = ?, image = ?
    WHERE id = ?
  `),
  deletePlayer: db.prepare('DELETE FROM Players WHERE id = ?'),

  // Matchup queries (using the 'Matchups' table that exists)
  getMatchups: db.prepare('SELECT * FROM Matchups ORDER BY week DESC, date DESC'),
  getMatchupsByLeague: db.prepare('SELECT * FROM Matchups WHERE league_id = ? ORDER BY week DESC, date DESC'),
  getMatchupsByWeek: db.prepare('SELECT * FROM Matchups WHERE league_id = ? AND week = ?'),
  createMatchup: db.prepare(`
    INSERT INTO Matchups (id, league_id, week, team1_id, team2_id, team1_projected, team2_projected, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  updateMatchup: db.prepare(`
    UPDATE Matchups 
    SET team1_score = ?, team2_score = ?, team1_projected = ?, team2_projected = ?, is_complete = ?
    WHERE id = ?
  `),

  // Standings queries (using the 'Standings' table that exists)
  getStandings: db.prepare('SELECT * FROM Standings ORDER BY Rank ASC'),
  getStandingsByLeague: db.prepare('SELECT * FROM Standings WHERE League_ID = ? ORDER BY Rank ASC'),
  getStandingsByTeam: db.prepare('SELECT * FROM Standings WHERE Team_ID = ?'),

  // Points queries (using the 'Points' table that exists)
  getPoints: db.prepare('SELECT * FROM Points ORDER BY week DESC'),
  getPointsByPlayer: db.prepare('SELECT * FROM Points WHERE player_id = ? ORDER BY week DESC'),
  getPointsByWeek: db.prepare('SELECT * FROM Points WHERE week = ? ORDER BY points DESC'),

  // WeeklyResults queries (using the 'WeeklyResults' table that exists)
  getWeeklyResults: db.prepare('SELECT * FROM WeeklyResults ORDER BY week DESC'),
  getWeeklyResultsByWeek: db.prepare('SELECT * FROM WeeklyResults WHERE week = ?'),

  // FinalStandings queries (using the 'FinalStandings' table that exists)
  getFinalStandings: db.prepare('SELECT * FROM FinalStandings ORDER BY Rank ASC'),
  getFinalStandingsByLeague: db.prepare('SELECT * FROM FinalStandings WHERE League_ID = ? ORDER BY Rank ASC'),

  // NFL_Teams queries (using the 'NFL_Teams' table that exists)
  getNFLTeams: db.prepare('SELECT * FROM NFL_Teams ORDER BY name'),
  getNFLTeamById: db.prepare('SELECT * FROM NFL_Teams WHERE id = ?'),

  // Owners queries (using the 'Owners' table that exists)
  getOwners: db.prepare('SELECT * FROM Owners ORDER BY name'),
  getOwnerById: db.prepare('SELECT * FROM Owners WHERE id = ?'),

  // Lineups queries (using the 'Lineups' table that exists)
  getLineups: db.prepare('SELECT * FROM Lineups ORDER BY week DESC'),
  getLineupsByTeam: db.prepare('SELECT * FROM Lineups WHERE team_id = ? ORDER BY week DESC'),
  getLineupsByWeek: db.prepare('SELECT * FROM Lineups WHERE week = ?'),

  // Byes queries (using the 'Byes' table that exists)
  getByes: db.prepare('SELECT * FROM Byes ORDER BY week'),
  getByesByWeek: db.prepare('SELECT * FROM Byes WHERE week = ?'),

  // NFL_Schedule queries (using the 'NFL_Schedule' table that exists)
  getNFLSchedule: db.prepare('SELECT * FROM NFL_Schedule ORDER BY week, date'),
  getNFLScheduleByWeek: db.prepare('SELECT * FROM NFL_Schedule WHERE week = ? ORDER BY date'),

  // OvertimePlayers queries (using the 'OvertimePlayers' table that exists)
  getOvertimePlayers: db.prepare('SELECT * FROM OvertimePlayers ORDER BY week DESC'),
  getOvertimePlayersByWeek: db.prepare('SELECT * FROM OvertimePlayers WHERE week = ?'),

  // WeeklyMatchups queries (using the 'WeeklyMatchups' table that exists)
  getWeeklyMatchups: db.prepare('SELECT * FROM WeeklyMatchups ORDER BY Week DESC'),
  getWeeklyMatchupsByWeek: db.prepare('SELECT * FROM WeeklyMatchups WHERE Week = ?'),

  // Users queries (using the 'users' table that exists)
  getAllUsers: db.prepare('SELECT * FROM users ORDER BY created_at DESC'),
  getUserByIdFromUsers: db.prepare('SELECT * FROM users WHERE id = ?'),
  getUserByUsernameFromUsers: db.prepare('SELECT * FROM users WHERE username = ?'),
  getUserByEmailFromUsers: db.prepare('SELECT * FROM users WHERE email = ?'),
  createUserInUsers: db.prepare(`
    INSERT INTO users (id, username, email, avatar)
    VALUES (?, ?, ?, ?)
  `),
  updateUserInUsers: db.prepare(`
    UPDATE users 
    SET username = ?, email = ?, avatar = ?
    WHERE id = ?
  `),
  deleteUserFromUsers: db.prepare('DELETE FROM users WHERE id = ?')
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

export default db; 