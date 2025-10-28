import { createClient } from "@libsql/client";
import { User } from "./types";


const db = createClient({
  url: process.env.TURSO_URL as string,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

function mapToUser(row: any): User {
  return {
    id: row.id,
    // TODO: Get rid of password interface member?
    password: row.password,
    username: row.username,
    email: row.email,
    team: row.team,
    team_name: row.team_name,
    owner_name: row.owner_name,
    is_admin: row.is_admin === 1,
  };
}

// Cache for current week to avoid repeated database calls
let currentWeekCache: { week: number; date: string; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Function to determine current week based on date ranges
export async function getCurrentWeek(): Promise<number> {
  try {
    const currentDate = new Date();
    const currentDateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Check cache first
    if (currentWeekCache && 
        currentWeekCache.date === currentDateStr && 
        (Date.now() - currentWeekCache.timestamp) < CACHE_TTL) {
      console.log('Using cached current week:', currentWeekCache.week);
      return currentWeekCache.week;
    }

    console.log('Current date:', currentDateStr);

    // First, let's see what's in the Weeks table
    const allWeeks = await getResults('SELECT * FROM Weeks ORDER BY week');
    console.log('All weeks in database:', allWeeks);

    // Check each week individually to see which one matches
    for (const weekRow of allWeeks) {
      const startDate = (weekRow as any).start;
      const endDate = (weekRow as any).end;
      const weekNum = (weekRow as any).week;

      // Convert M/D/YY format to YYYY-MM-DD for proper comparison
      const convertDate = (dateStr: string) => {
        const [month, day, year] = dateStr.split('/');
        const fullYear = year.length === 2 ? `20${year}` : year;
        return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      };

      const startDateConverted = convertDate(startDate);
      const endDateConverted = convertDate(endDate);

      console.log(`Checking week ${weekNum}: ${startDate} (${startDateConverted}) to ${endDate} (${endDateConverted})`);
      console.log(`Current date ${currentDateStr} between ${startDateConverted} and ${endDateConverted}? ${currentDateStr >= startDateConverted && currentDateStr <= endDateConverted}`);

      if (currentDateStr >= startDateConverted && currentDateStr <= endDateConverted) {
        console.log(`Found matching week: ${weekNum}`);
        
        // Cache the result
        currentWeekCache = {
          week: weekNum,
          date: currentDateStr,
          timestamp: Date.now()
        };
        
        return weekNum;
      }
    }

    console.log('No current week found in date ranges');

    // If no current week found, check if we're in the offseason
    if (allWeeks.length > 0) {
      const firstWeek = allWeeks[0] as any;
      const lastWeek = allWeeks[allWeeks.length - 1] as any;

      // Convert dates for comparison
      const convertDate = (dateStr: string) => {
        const [month, day, year] = dateStr.split('/');
        const fullYear = year.length === 2 ? `20${year}` : year;
        return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      };

      const firstWeekStart = convertDate(firstWeek.start);
      const lastWeekEnd = convertDate(lastWeek.end);

      console.log(`First week starts: ${firstWeek.start} (${firstWeekStart}), Last week ends: ${lastWeek.end} (${lastWeekEnd})`);

      // If current date is before the season starts, return week 1
      if (currentDateStr < firstWeekStart) {
        console.log('Current date is before season starts, returning week 1');
        return 1;
      }

      // If current date is after the season ends, return the last week
      if (currentDateStr > lastWeekEnd) {
        console.log(`Current date is after season ends, returning last week: ${lastWeek.week}`);
        return lastWeek.week;
      }
    }

    // If no weeks found in Weeks table, default to week 1
    console.log('No weeks found in Weeks table, defaulting to week 1');
    return 1;
  } catch (error) {
    console.error('Error determining current week:', error);
    return 1; // Default fallback
  }
}

// Get results or empty array
export async function getResults(
  queryArgs: any,
  mapper: ((row: any) => any) | null = null,
) {
  try {
    const result = await db.execute(queryArgs);
    if (mapper) {
      return result.rows.map(mapper);
    } else {
      return result.rows;
    }
  } catch (error) {
    console.error("Error fetching query:", queryArgs, error);
    return [];
  }
}

export async function getFirstResult(
  queryArgs: any,
  mapper: ((row: any) => any) | null = null,
) {
  try {
    const result = await db.execute(queryArgs);
    if (result.rows.length > 0) {
      return mapper ? mapper(result.rows[0]) : result.rows[0];
    }
    return null;
  } catch (error) {
    console.error("Error fetching first result:", queryArgs, error);
    return null;
  }
}

// User queries
export async function getUsers() {
  return getResults({
    sql: "SELECT * FROM user ORDER BY username",
  }, mapToUser);
}

export async function getUserById(id: string) {
  return getFirstResult({
    sql: "SELECT * FROM user WHERE id = ?",
    args: [id],
  }, mapToUser);
}

export async function getUserByUsername(username: string) {
  return getFirstResult({
    sql: "SELECT * FROM user WHERE username = ?",
    args: [username],
  }, mapToUser);
}

export async function createUser(
  username: string,
  password: string,
  team: string,
  teamName: string,
  ownerName?: string,
) {
  return await db.execute({
    sql:
      "INSERT INTO user (username, password, team, team_name, owner_name) VALUES (?, ?, ?, ?, ?)",
    args: [username, password, team, teamName, ownerName || null],
  });
}

export async function updateUser(username: string, email: string, id: string) {
  return await db.execute({
    sql: "UPDATE user SET username = ?, email = ? WHERE id = ?",
    args: [username, email, id],
  });
}

async function deleteUser(id: string) {
  return await db.execute({
    sql: "DELETE FROM user WHERE id = ?",
    args: [id],
  });
}

// Standings queries
export async function getStandings() {
  return await getResults("SELECT * FROM Standings");
}

export async function getStandingsByTeam(id: string) {
  return await getResults({
    sql: "SELECT * FROM Standings WHERE Team_ID = ?",
    args: [id],
  });
}

// FinalStandings queries
export async function getFinalStandings() {
  return await getResults("SELECT * FROM FinalStandings");
}

// Players queries
export async function getPlayers() {
  return await getResults("SELECT * FROM Players");
}

export async function getPlayersWithBye() {
  return await getResults(`
    SELECT 
      p.player_ID,
      p.player_name,
      p.position,
      p.team_name,
      p.owner_ID,
      p.team_id,
      COALESCE(n.bye, 0) as bye
    FROM Players p
    LEFT JOIN NFL_Teams n ON p.team_id = n.team_id
    ORDER BY p.player_name
  `);
}

export async function getPlayersByOwner(id: string) {
  return await getResults({
    sql: "SELECT * FROM Players WHERE owner_ID = ?",
    args: [id],
  });
}

export async function getPlayerById(id: string) {
  return await getFirstResult({
    sql: "SELECT * FROM Players WHERE player_ID = ?",
    args: [id],
  });
}

export async function getPlayersByPosition(position: string) {
  return await getResults({
    sql: "SELECT * FROM Players WHERE position = ?",
    args: [position],
  });
}

export async function getPlayersByTeam(team: string) {
  return await getResults({
    sql: "SELECT * FROM Players WHERE team = ?",
    args: [team],
  });
}

export async function getPlayerStats(playerId: string, week: number, year: number) {
  return await getFirstResult({
    sql:
      "SELECT * FROM PlayerStats WHERE player_id = ? AND week = ? AND year = ?",
    args: [playerId, week, year],
  });
}

export async function getTeamNameMap() {
  // Dropping requestId for simplicity, but can be added back to each caller if needed
  // const requestId = Math.random().toString(36).substring(7);

  // Get team names from user table
  const teamNames = await getResults(`
      SELECT team, COALESCE(team_name, username) as display_name
      FROM user
      ORDER BY team
    `, (row) => {
      return {
        team: row.team,
        display_name: row.display_name
      };
    });

    //console.log(`[${requestId}] Team names from database:`, teamNames);
    console.log(`Team names from database:`, teamNames);

    // Create a map of team IDs to display names
    const teamNameMap = new Map<string, string>();
    teamNames.forEach(team => {
      teamNameMap.set(team.team, team.display_name);
    });

    console.log(`Team name map:`, Object.fromEntries(teamNameMap));

    return teamNameMap;
}

// Player management queries
export async function createPlayer(
  id: string,
  name: string,
  position: string,
  team: string,
  nflTeam: string,
  image?: string,
) {
  const result = await db.execute({
    sql:
      "INSERT INTO Players (player_ID, name, position, team, nfl_team, image) VALUES (?, ?, ?, ?, ?, ?)",
    args: [id, name, position, team, nflTeam, image || null],
  });
  return result;
}

// Admin function to create player with stats - matches API call signature
export async function createPlayerWithStats(
  name: string,
  position: string,
  team: string,
  nflTeam: string,
  ownerId: string,
  weeklyStats: { [key: string]: number }
) {
  // Generate a unique player ID
  const playerId = generateId('P');
  
  // Insert player basic info with correct column names
  await db.execute({
    sql: "INSERT INTO Players (player_ID, player_name, position, team_name, owner_ID) VALUES (?, ?, ?, ?, ?)",
    args: [playerId, name, position, nflTeam, ownerId]
  });
  
  // Insert initial weekly stats in the Points table
  await db.execute({
    sql: `INSERT INTO Points (player_ID, week_1, week_2, week_3, week_4, week_5, week_6, week_7, week_8, week_9, week_10, week_11, week_12, week_13, week_14) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      playerId,
      weeklyStats.week1 || 0,
      weeklyStats.week2 || 0,
      weeklyStats.week3 || 0,
      weeklyStats.week4 || 0,
      weeklyStats.week5 || 0,
      weeklyStats.week6 || 0,
      weeklyStats.week7 || 0,
      weeklyStats.week8 || 0,
      weeklyStats.week9 || 0,
      weeklyStats.week10 || 0,
      weeklyStats.week11 || 0,
      weeklyStats.week12 || 0,
      weeklyStats.week13 || 0,
      weeklyStats.week14 || 0
    ]
  });
  
  return playerId;
}

export async function updatePlayer(
  name: string,
  position: string,
  team: string,
  nflTeam: string,
  image: string,
  playerId: string,
) {
  return await db.execute({
    sql:
      "UPDATE Players SET name = ?, position = ?, team = ?, nfl_team = ?, image = ? WHERE player_ID = ?",
    args: [name, position, team, nflTeam, image, playerId],
  });
}

export async function deletePlayer(playerId: string) {
  return await db.execute({
    sql: "DELETE FROM Players WHERE player_ID = ?",
    args: [playerId],
  });
}

export async function createPlayerStats(
  playerId: string,
  week: number,
  year: number,
  fantasyPoints: number,
  passingYards?: number,
  passingTds?: number,
  rushingYards?: number,
  rushingTds?: number,
  receptions?: number,
  receivingYards?: number,
  receivingTds?: number,
) {
  return await db.execute({
    sql:
      `INSERT INTO PlayerStats (player_id, week, year, fantasy_points, passing_yards, passing_tds, rushing_yards, rushing_tds, receptions, receiving_yards, receiving_tds)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      playerId,
      week,
      year,
      fantasyPoints,
      passingYards || 0,
      passingTds || 0,
      rushingYards || 0,
      rushingTds || 0,
      receptions || 0,
      receivingYards || 0,
      receivingTds || 0,
    ],
  });
}

// Lineup queries
export async function saveLineup(
  ownerId: string,
  week: number,
  qb: string,
  rb1: string,
  wr1: string,
  flex1: string,
  flex2: string,
  te: string,
  k: string,
  def: string,
) {
  return await db.execute({
    sql:
      `INSERT OR REPLACE INTO Lineups (owner_ID, week, QB, RB_1, WR_1, FLEX_1, FLEX_2, TE, K, DEF)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [ownerId, week, qb, rb1, wr1, flex1, flex2, te, k, def],
  });
}

export async function getLineup(ownerId: string, week: number) {
  return await getFirstResult({
    sql: "SELECT * FROM Lineups WHERE owner_ID = ? AND week = ?",
    args: [ownerId, week.toString()],
  });
}

export async function getNotificationPreferences(userId: string) {
  const result = await db.execute({
    sql: "SELECT * FROM notification_preferences WHERE user_id = ?",
    args: [userId],
  });
  return result.rows[0] || null;
}

export async function createNotificationPreferences(
  userId: string,
  emailNotifications: boolean,
  pushNotifications: boolean,
  weeklyRecaps: boolean,
  tradeAlerts: boolean,
  matchupReminders: boolean,
  injuryAlerts: boolean,
) {
  return await db.execute({
    sql:
      `INSERT INTO notification_preferences (user_id, email_notifications, push_notifications, weekly_recaps, trade_alerts, matchup_reminders, injury_alerts)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      userId,
      emailNotifications,
      pushNotifications,
      weeklyRecaps,
      tradeAlerts,
      matchupReminders,
      injuryAlerts,
    ],
  });
}

export async function updateNotificationPreferences(
  emailNotifications: boolean,
  pushNotifications: boolean,
  weeklyRecaps: boolean,
  tradeAlerts: boolean,
  matchupReminders: boolean,
  injuryAlerts: boolean,
  userId: string,
) {
  return await db.execute({
    sql: `UPDATE notification_preferences
              SET email_notifications = ?, push_notifications = ?, weekly_recaps = ?, trade_alerts = ?, matchup_reminders = ?, injury_alerts = ?, updated_at = CURRENT_TIMESTAMP
              WHERE user_id = ?`,
    args: [
      emailNotifications,
      pushNotifications,
      weeklyRecaps,
      tradeAlerts,
      matchupReminders,
      injuryAlerts,
      userId,
    ],
  });
}

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

// Database operations for handlers
export async function updateUserPassword(userId: string, newPasswordHash: string) {
  return await db.execute({
    sql: 'UPDATE user SET password = ? WHERE id = ?',
    args: [newPasswordHash, userId]
  });
}

export async function getTeamStanding(teamId: string) {
  return await getFirstResult({
    sql: `
      SELECT
        s.Team_ID as teamId,
        COALESCE(u.team_name, u.username) as teamName,
        COALESCE(s.Wins, 0) as wins,
        COALESCE(s.Losses, 0) as losses,
        COALESCE(s.Ties, 0) as ties,
        COALESCE(s.PF, 0.0) as pointsFor,
        COALESCE(s.PA, 0.0) as pointsAgainst,
        COALESCE(s.Division, 'A') as division
      FROM Standings s
      LEFT JOIN user u ON s.Team_ID = u.team
      WHERE s.Team_ID = ?
    `,
    args: [teamId]
  });
}

export async function getAllStandings() {
  return await getResults({
    sql: `
      SELECT
        s.Team_ID,
        COALESCE(u.team_name, u.username) as teamName,
        COALESCE(s.Wins, 0) as wins,
        COALESCE(s.Losses, 0) as losses,
        COALESCE(s.Ties, 0) as ties,
        COALESCE(s.PF, 0.0) as pointsFor,
        COALESCE(s.PA, 0.0) as pointsAgainst
      FROM Standings s
      LEFT JOIN user u ON s.Team_ID = u.team
      ORDER BY s.Wins DESC, s.PF DESC
    `
  });
}

export async function getTeamNameByTeamId(teamId: string) {
  return await getFirstResult({
    sql: `
      SELECT COALESCE(team_name, username) as display_name
      FROM user
      WHERE team = ?
    `,
    args: [teamId]
  });
}

export async function updateUserProfile(userId: string, username: string, email: string, teamName?: string, ownerName?: string) {
  console.log('updateUserProfile called with:', { userId, username, email, teamName, ownerName });
  
  if (teamName !== undefined && teamName !== null) {
    console.log('Updating with team_name:', teamName);
    const result = await db.execute({
      sql: 'UPDATE user SET username = ?, email = ?, team_name = ?, owner_name = ? WHERE id = ?',
      args: [username, email, teamName, ownerName || null, userId]
    });
    console.log('Update result:', result);
    return result;
  } else {
    console.log('Updating without team_name');
    const result = await db.execute({
      sql: 'UPDATE user SET username = ?, email = ?, owner_name = ? WHERE id = ?',
      args: [username, email, ownerName || null, userId]
    });
    console.log('Update result:', result);
    return result;
  }
}

export async function getTeamRoster(teamId: string, currentWeek: number = 1) {
  return await getResults({
    sql: `
      SELECT
        p.player_ID as id,
        p.player_name as name,
        p.position,
        p.team_name as nflTeam,
        p.owner_ID as team,
        p.team_id,
        COALESCE(p.injury_status, 'healthy') as injury_status,
        COALESCE(n.bye, 0) as byeWeek,
        COALESCE(pts.week_1, 0) as week_1,
        COALESCE(pts.week_2, 0) as week_2,
        COALESCE(pts.week_3, 0) as week_3,
        COALESCE(pts.week_4, 0) as week_4,
        COALESCE(pts.week_5, 0) as week_5,
        COALESCE(pts.week_6, 0) as week_6,
        COALESCE(pts.week_7, 0) as week_7,
        COALESCE(pts.week_8, 0) as week_8,
        COALESCE(pts.week_9, 0) as week_9,
        COALESCE(pts.week_10, 0) as week_10,
        COALESCE(pts.week_11, 0) as week_11,
        COALESCE(pts.week_12, 0) as week_12,
        COALESCE(pts.week_13, 0) as week_13,
        COALESCE(pts.week_14, 0) as week_14,
        (COALESCE(pts.week_1, 0) + COALESCE(pts.week_2, 0) + COALESCE(pts.week_3, 0) + 
         COALESCE(pts.week_4, 0) + COALESCE(pts.week_5, 0) + COALESCE(pts.week_6, 0) + 
         COALESCE(pts.week_7, 0) + COALESCE(pts.week_8, 0) + COALESCE(pts.week_9, 0) + 
         COALESCE(pts.week_10, 0) + COALESCE(pts.week_11, 0) + COALESCE(pts.week_12, 0) + 
         COALESCE(pts.week_13, 0) + COALESCE(pts.week_14, 0)) as totalPoints,
        CASE 
          WHEN (COALESCE(pts.week_1, 0) + COALESCE(pts.week_2, 0) + COALESCE(pts.week_3, 0) + 
                COALESCE(pts.week_4, 0) + COALESCE(pts.week_5, 0) + COALESCE(pts.week_6, 0) + 
                COALESCE(pts.week_7, 0) + COALESCE(pts.week_8, 0) + COALESCE(pts.week_9, 0) + 
                COALESCE(pts.week_10, 0) + COALESCE(pts.week_11, 0) + COALESCE(pts.week_12, 0) + 
                COALESCE(pts.week_13, 0) + COALESCE(pts.week_14, 0)) > 0
          THEN ROUND((COALESCE(pts.week_1, 0) + COALESCE(pts.week_2, 0) + COALESCE(pts.week_3, 0) + 
                     COALESCE(pts.week_4, 0) + COALESCE(pts.week_5, 0) + COALESCE(pts.week_6, 0) + 
                     COALESCE(pts.week_7, 0) + COALESCE(pts.week_8, 0) + COALESCE(pts.week_9, 0) + 
                     COALESCE(pts.week_10, 0) + COALESCE(pts.week_11, 0) + COALESCE(pts.week_12, 0) + 
                     COALESCE(pts.week_13, 0) + COALESCE(pts.week_14, 0)) / ?, 2)
          ELSE 0.0
        END as avgPoints
      FROM Players p
      LEFT JOIN NFL_Teams n ON p.team_id = n.team_id
      LEFT JOIN Points pts ON p.player_ID = pts.player_ID
      WHERE p.owner_ID = ?
      ORDER BY 
        CASE p.position
          WHEN 'QB' THEN 1
          WHEN 'RB' THEN 2
          WHEN 'WR' THEN 3
          WHEN 'TE' THEN 4
          WHEN 'PK' THEN 5
          WHEN 'D/ST' THEN 6
          ELSE 7
        END,
        p.player_name
    `,
    args: [Math.max(1, currentWeek - 1), teamId]
  });
}

export async function getDraftedTeamRoster(teamId: string) {
  return await getResults({
    sql: `
      SELECT
        p.player_ID as id,
        p.player_name as name,
        p.position,
        p.team_name as nflTeam,
        d.team_id as team,
        p.team_id,
        COALESCE(p.injury_status, 'healthy') as injury_status,
        COALESCE(n.bye, 0) as byeWeek,
        COALESCE(pts.week_1, 0) as week_1,
        COALESCE(pts.week_2, 0) as week_2,
        COALESCE(pts.week_3, 0) as week_3,
        COALESCE(pts.week_4, 0) as week_4,
        COALESCE(pts.week_5, 0) as week_5,
        COALESCE(pts.week_6, 0) as week_6,
        COALESCE(pts.week_7, 0) as week_7,
        COALESCE(pts.week_8, 0) as week_8,
        COALESCE(pts.week_9, 0) as week_9,
        COALESCE(pts.week_10, 0) as week_10,
        COALESCE(pts.week_11, 0) as week_11,
        COALESCE(pts.week_12, 0) as week_12,
        COALESCE(pts.week_13, 0) as week_13,
        COALESCE(pts.week_14, 0) as week_14,
        d.round,
        d.pick
      FROM Draft d
      INNER JOIN Players p ON CAST(d.player_id AS INTEGER) = p.player_ID
      LEFT JOIN NFL_Teams n ON p.team_id = n.team_id
      LEFT JOIN Points pts ON p.player_ID = pts.player_ID
      WHERE d.team_id = ? AND d.player_id IS NOT NULL AND d.player_id != ''
      ORDER BY d.round, d.pick
    `,
    args: [teamId]
  });
}

// Admin-specific database functions
export async function getAllUsers() {
  return await getResults({
    sql: `
      SELECT 
        id,
        username,
        email,
        team,
        team_name,
        owner_name,
        is_admin
      FROM user
      ORDER BY username
    `
  }, mapToUser);
}

export async function updateUserAdminStatus(userId: string, isAdmin: boolean) {
  return await db.execute({
    sql: 'UPDATE user SET is_admin = ? WHERE id = ?',
    args: [isAdmin ? 1 : 0, userId]
  });
}

export async function deleteUserById(userId: string) {
  return await db.execute({
    sql: 'DELETE FROM user WHERE id = ?',
    args: [userId]
  });
}

export async function updateUserInfo(userId: string, username: string, team: string, email: string, ownerName?: string) {
  return await db.execute({
    sql: 'UPDATE user SET username = ?, team = ?, email = ?, owner_name = ? WHERE id = ?',
    args: [username, team, email, ownerName || null, userId]
  });
}

export async function getSystemStats() {
  const userCount = await getFirstResult({
    sql: 'SELECT COUNT(*) as count FROM user'
  });

  const playerCount = await getFirstResult({
    sql: 'SELECT COUNT(*) as count FROM Players'
  });

  const lineupCount = await getFirstResult({
    sql: 'SELECT COUNT(*) as count FROM Lineups'
  });

  const adminCount = await getFirstResult({
    sql: 'SELECT COUNT(*) as count FROM user WHERE is_admin = 1'
  });

  return {
    userCount: userCount?.count || 0,
    playerCount: playerCount?.count || 0,
    lineupCount: lineupCount?.count || 0,
    adminCount: adminCount?.count || 0
  };
}

export async function getAllPlayersWithStats() {
  // Get all players with proper column mapping
  const players = await getResults({
    sql: "SELECT player_ID, player_name as name, position, team_id, team_name as nfl_team, owner_ID FROM Players ORDER BY player_name",
    args: []
  });
  
  // Get all player stats for weeks 1-14 from Points table
  const stats = await getResults({
    sql: "SELECT player_ID, week_1, week_2, week_3, week_4, week_5, week_6, week_7, week_8, week_9, week_10, week_11, week_12, week_13, week_14 FROM Points ORDER BY player_ID",
    args: []
  });
  
  // Create a map of stats by player ID
  const statsByPlayer = new Map();
  stats.forEach(stat => {
    statsByPlayer.set(stat.player_ID, {
      week1: stat.week_1 || 0,
      week2: stat.week_2 || 0,
      week3: stat.week_3 || 0,
      week4: stat.week_4 || 0,
      week5: stat.week_5 || 0,
      week6: stat.week_6 || 0,
      week7: stat.week_7 || 0,
      week8: stat.week_8 || 0,
      week9: stat.week_9 || 0,
      week10: stat.week_10 || 0,
      week11: stat.week_11 || 0,
      week12: stat.week_12 || 0,
      week13: stat.week_13 || 0,
      week14: stat.week_14 || 0,
    });
  });
  
  // Combine players with their stats
  return players.map(player => ({
    ...player,
    team: player.team_id.toString(), // Map team_id to team
    week1: statsByPlayer.get(player.player_ID)?.week1 || 0,
    week2: statsByPlayer.get(player.player_ID)?.week2 || 0,
    week3: statsByPlayer.get(player.player_ID)?.week3 || 0,
    week4: statsByPlayer.get(player.player_ID)?.week4 || 0,
    week5: statsByPlayer.get(player.player_ID)?.week5 || 0,
    week6: statsByPlayer.get(player.player_ID)?.week6 || 0,
    week7: statsByPlayer.get(player.player_ID)?.week7 || 0,
    week8: statsByPlayer.get(player.player_ID)?.week8 || 0,
    week9: statsByPlayer.get(player.player_ID)?.week9 || 0,
    week10: statsByPlayer.get(player.player_ID)?.week10 || 0,
    week11: statsByPlayer.get(player.player_ID)?.week11 || 0,
    week12: statsByPlayer.get(player.player_ID)?.week12 || 0,
    week13: statsByPlayer.get(player.player_ID)?.week13 || 0,
    week14: statsByPlayer.get(player.player_ID)?.week14 || 0,
  }));
}

export async function updatePlayerWithStats(
  playerId: string,
  name: string,
  position: string,
  team: string,
  nflTeam: string,
  ownerId: string,
  weeklyStats: { [key: string]: number }
) {
  // Update player basic info with correct column names
  await db.execute({
    sql: "UPDATE Players SET player_name = ?, position = ?, team_name = ?, owner_ID = ? WHERE player_ID = ?",
    args: [name, position, nflTeam, ownerId, playerId]
  });
  
  // Update weekly stats in the Points table
  for (let week = 1; week <= 14; week++) {
    const weekKey = `week${week}`;
    if (weeklyStats[weekKey] !== undefined) {
      const points = weeklyStats[weekKey];
      const pointsColumn = `week_${week}`;
      
      // Update points for this week
      await db.execute({
        sql: `UPDATE Points SET ${pointsColumn} = ? WHERE player_ID = ?`,
        args: [points, playerId]
      });
    }
  }
}

// Draft-related database functions
export async function saveDraftPick(
  round: number,
  pick: number,
  team_id: string,
  player_id: string,
  player_name: string,
  position: string,
  team: string
) {
  return await db.execute({
    sql: `
      INSERT OR REPLACE INTO Draft (round, pick, team_id, player_id, player_name, position, team, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
    args: [round, pick, team_id, player_id, player_name, position, team]
  });
}

export async function getDraftPicks() {
  return await getResults({
    sql: "SELECT * FROM Draft ORDER BY round, pick"
  });
}

export async function getDraftPick(round: number, pick: number) {
  return await getFirstResult({
    sql: "SELECT * FROM Draft WHERE round = ? AND pick = ?",
    args: [round, pick]
  });
}

export async function getLastDraftPick() {
  return await getFirstResult({
    sql: "SELECT * FROM Draft WHERE player_id IS NOT NULL ORDER BY round DESC, pick DESC LIMIT 1"
  });
}

export async function clearDraft() {
  // Clear all draft picks
  await db.execute({
    sql: "DELETE FROM Draft"
  });
  
  // Reset all player ownership back to free agents (99)
  await db.execute({
    sql: "UPDATE Players SET owner_ID = '99' WHERE owner_ID IS NOT NULL AND owner_ID != '99'"
  });
}

export async function getDraftProgress() {
  const picks = await getDraftPicks();
  if (picks.length === 0) {
    return { currentRound: 1, currentPick: 1, totalPicks: 0 };
  }

  // Find the first pick that doesn't have a player (is empty)
  const firstEmptyPick = picks.find(p => !p.player_id || p.player_id.trim() === '');
  
  if (!firstEmptyPick) {
    // All picks are filled, draft is complete
    return { currentRound: 16, currentPick: 16, totalPicks: picks.length, lastPick: picks[picks.length - 1] };
  }

  // Count how many picks have been made
  const picksWithPlayers = picks.filter(p => p.player_id && p.player_id.trim() !== '');
  const totalPicks = picksWithPlayers.length;
  
  // Return the first empty pick as the current pick
  return {
    currentRound: firstEmptyPick.round,
    currentPick: firstEmptyPick.pick,
    totalPicks,
    lastPick: picksWithPlayers.length > 0 ? picksWithPlayers[picksWithPlayers.length - 1] : null
  };
}

// Update player ownership (for draft assignments)
export async function updatePlayerOwnership(playerId: string, teamId: string) {
  // Convert playerId from string format (e.g., "2.0") to integer (e.g., 2)
  const numericPlayerId = parseFloat(playerId).toString();
  
  return await db.execute({
    sql: "UPDATE Players SET owner_ID = ? WHERE player_ID = ?",
    args: [teamId, numericPlayerId]
  });
}

export async function initializeDraftSlots() {
  try {
    // Check if draft slots already exist
    const existingSlots = await getDraftPicks();
    if (existingSlots.length > 0) {
      return; // Already initialized
    }

    // Create the full 256-position draft order with proper snake pattern
    const baseOrder = [
      "A1", "B1", "C1", "D1", "D2", "C2", "B2", "A2",
      "A3", "B3", "C3", "D3", "D4", "C4", "B4", "A4"
    ];
    
    // Create the full draft order array (256 positions)
    const fullDraftOrder: string[] = [];
    
    for (let round = 1; round <= 16; round++) {
      if (round % 2 === 1) {
        // Odd rounds: forward order
        fullDraftOrder.push(...baseOrder);
      } else {
        // Even rounds: reverse order
        fullDraftOrder.push(...baseOrder.slice().reverse());
      }
    }

    // Create all 256 draft slots
    for (let i = 0; i < 256; i++) {
      const round = Math.floor(i / 16) + 1;
      const pick = (i % 16) + 1;
      const teamId = fullDraftOrder[i];
      
      await db.execute({
        sql: `
          INSERT INTO Draft (round, pick, team_id, player_id, player_name, position, team, timestamp)
          VALUES (?, ?, ?, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP)
        `,
        args: [round, pick, teamId]
      });
    }
    
    console.log('Draft slots initialized successfully with correct 256-position order');
  } catch (error) {
    console.error('Error initializing draft slots:', error);
    throw error;
  }
}

export async function updatePlayerInjuryStatus(playerId: string, status: string) {
  return await db.execute({
    sql: "UPDATE Players SET injury_status = ? WHERE player_ID = ?",
    args: [status, playerId]
  });
}

export async function resetAllPlayersToHealthy() {
  return await db.execute({
    sql: "UPDATE Players SET injury_status = ? WHERE owner_ID != 99",
    args: ['healthy']
  });
}

// NFL Schedule functions
export async function getNFLTeamOpponent(nflTeamName: string, week: number, season: number = 2025) {
  return await getFirstResult({
    sql: `
      SELECT 
        Week,
        Home_Team,
        Away_Team,
        game_time_utc,
        game_time_la,
        venue,
        status
      FROM NFL_Schedule 
      WHERE season = ? AND Week = ? AND (Home_Team = ? OR Away_Team = ?)
    `,
    args: [season, week, nflTeamName, nflTeamName]
  });
}

export async function getNFLTeamOpponentInfo(nflTeamName: string, week: number, season: number = 2025) {
  const game = await getNFLTeamOpponent(nflTeamName, week, season);
  
  if (!game) {
    return null;
  }
  
  const isHomeTeam = game.Home_Team === nflTeamName;
  const opponent = isHomeTeam ? game.Away_Team : game.Home_Team;
  
  // Use the UTC time and convert it properly to LA time
  const gameTime = new Date(game.game_time_utc).toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  return {
    opponent,
    isHomeTeam,
    gameTime,
    venue: game.venue,
    status: game.status,
    displayText: `${isHomeTeam ? 'vs' : '@'} ${opponent}`,
    kickoffTime: gameTime
  };
}

// Game lock functions for preventing lineup changes after games start
export async function getPlayerGameStartTime(playerId: string, week: number, season: number = 2025) {
  // First get the player's NFL team
  const player = await getFirstResult({
    sql: 'SELECT team_name FROM Players WHERE player_ID = ?',
    args: [playerId]
  });
  
  if (!player) {
    return null;
  }
  
  // Get the game for this team in this week
  const game = await getNFLTeamOpponent(player.team_name, week, season);
  
  if (!game) {
    return null;
  }
  
  return {
    gameTimeUTC: game.game_time_utc,
    gameTimeLA: game.game_time_la,
    status: game.status,
    hasStarted: new Date() >= new Date(game.game_time_utc)
  };
}

export async function isPlayerGameLocked(playerId: string, week: number, season: number = 2025): Promise<boolean> {
  const gameInfo = await getPlayerGameStartTime(playerId, week, season);
  
  if (!gameInfo) {
    return false; // If no game info, allow changes
  }
  
  // Game is locked if it has started
  return gameInfo.hasStarted;
}

export async function getLockedPlayersForWeek(week: number, season: number = 2025): Promise<string[]> {
  // Get all games for this week that have started
  const startedGames = await getResults({
    sql: `
      SELECT Home_Team, Away_Team 
      FROM NFL_Schedule 
      WHERE season = ? AND Week = ? AND datetime(game_time_utc) <= datetime('now')
    `,
    args: [season, week]
  });
  
  if (!startedGames || startedGames.length === 0) {
    return [];
  }
  
  // Get all players from teams that have started their games
  const teamNames = startedGames.flatMap(game => [game.Home_Team, game.Away_Team]);
  const placeholders = teamNames.map(() => '?').join(',');
  
  const lockedPlayers = await getResults({
    sql: `
      SELECT player_ID 
      FROM Players 
      WHERE team_name IN (${placeholders})
    `,
    args: teamNames
  });
  
  return lockedPlayers.map(player => player.player_ID);
}

// Waiver System Database Functions

// Waiver Players Table Functions
export async function waivePlayer(playerId: string, teamId: string, waiverOrder: number, currentWeek?: number) {
  // If currentWeek is provided, use the appropriate table
  if (currentWeek !== undefined) {
    const tableName = getWaiverTableForWeek(currentWeek);
    
    if (tableName === 'WaiverPlayers2') {
      return await waivePlayer2(playerId, teamId, waiverOrder);
    } else if (tableName === 'WaiverPlayers3') {
      return await waivePlayer3(playerId, teamId, waiverOrder);
    } else if (tableName === 'WaiverPlayers4') {
      return await waivePlayer4(playerId, teamId, waiverOrder);
    }
  }
  
  return await db.execute({
    sql: `
      INSERT INTO WaiverPlayers (player_id, team_id, waiver_order, waived_at, status)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'available')
    `,
    args: [playerId, teamId, waiverOrder]
  });
}

export async function getWaivedPlayers(currentWeek: number = 1) {
  const tableName = getWaiverTableForWeek(currentWeek);
  
  if (tableName === 'WaiverPlayers2') {
    return await getWaivedPlayers2(currentWeek);
  } else if (tableName === 'WaiverPlayers3') {
    return await getWaivedPlayers3(currentWeek);
  } else if (tableName === 'WaiverPlayers4') {
    return await getWaivedPlayers4(currentWeek);
  }
  
  return await getResults({
    sql: `
      SELECT 
        wp.player_id,
        wp.team_id,
        wp.waiver_order,
        wp.waived_at,
        wp.status,
        p.player_name,
        p.position,
        p.team_name as nfl_team,
        u.team_name as team_name,
        u.owner_name,
        (COALESCE(pts.week_1, 0) + COALESCE(pts.week_2, 0) + COALESCE(pts.week_3, 0) +
         COALESCE(pts.week_4, 0) + COALESCE(pts.week_5, 0) + COALESCE(pts.week_6, 0) +
         COALESCE(pts.week_7, 0) + COALESCE(pts.week_8, 0) + COALESCE(pts.week_9, 0) +
         COALESCE(pts.week_10, 0) + COALESCE(pts.week_11, 0) + COALESCE(pts.week_12, 0) +
         COALESCE(pts.week_13, 0) + COALESCE(pts.week_14, 0)) as total_points,
        CASE
          WHEN (COALESCE(pts.week_1, 0) + COALESCE(pts.week_2, 0) + COALESCE(pts.week_3, 0) +
                COALESCE(pts.week_4, 0) + COALESCE(pts.week_5, 0) + COALESCE(pts.week_6, 0) +
                COALESCE(pts.week_7, 0) + COALESCE(pts.week_8, 0) + COALESCE(pts.week_9, 0) +
                COALESCE(pts.week_10, 0) + COALESCE(pts.week_11, 0) + COALESCE(pts.week_12, 0) +
                COALESCE(pts.week_13, 0) + COALESCE(pts.week_14, 0)) > 0
          THEN ROUND((COALESCE(pts.week_1, 0) + COALESCE(pts.week_2, 0) + COALESCE(pts.week_3, 0) +
                     COALESCE(pts.week_4, 0) + COALESCE(pts.week_5, 0) + COALESCE(pts.week_6, 0) +
                     COALESCE(pts.week_7, 0) + COALESCE(pts.week_8, 0) + COALESCE(pts.week_9, 0) +
                     COALESCE(pts.week_10, 0) + COALESCE(pts.week_11, 0) + COALESCE(pts.week_12, 0) +
                     COALESCE(pts.week_13, 0) + COALESCE(pts.week_14, 0)) / ?, 2)
          ELSE 0.0
        END as avg_points
      FROM WaiverPlayers wp
      LEFT JOIN Players p ON wp.player_id = p.player_ID
      LEFT JOIN user u ON wp.team_id = u.team
      LEFT JOIN Points pts ON p.player_ID = pts.player_ID
      WHERE wp.status = 'available'
      ORDER BY wp.waiver_order
    `,
    args: [Math.max(1, currentWeek - 1)]
  });
}

// Get free agents (players with owner_id = 99) - only skill positions
export async function getFreeAgents(currentWeek: number = 1) {
  return await getResults({
    sql: `
      SELECT 
        p.player_ID as player_id,
        '99' as team_id,
        0 as waiver_order,
        NULL as waived_at,
        'available' as status,
        p.player_name,
        p.position,
        p.team_name as nfl_team,
        'Free Agent' as team_name,
        'Free Agent' as owner_name,
        (COALESCE(pts.week_1, 0) + COALESCE(pts.week_2, 0) + COALESCE(pts.week_3, 0) +
         COALESCE(pts.week_4, 0) + COALESCE(pts.week_5, 0) + COALESCE(pts.week_6, 0) +
         COALESCE(pts.week_7, 0) + COALESCE(pts.week_8, 0) + COALESCE(pts.week_9, 0) +
         COALESCE(pts.week_10, 0) + COALESCE(pts.week_11, 0) + COALESCE(pts.week_12, 0) +
         COALESCE(pts.week_13, 0) + COALESCE(pts.week_14, 0)) as total_points,
        CASE
          WHEN (COALESCE(pts.week_1, 0) + COALESCE(pts.week_2, 0) + COALESCE(pts.week_3, 0) +
                COALESCE(pts.week_4, 0) + COALESCE(pts.week_5, 0) + COALESCE(pts.week_6, 0) +
                COALESCE(pts.week_7, 0) + COALESCE(pts.week_8, 0) + COALESCE(pts.week_9, 0) +
                COALESCE(pts.week_10, 0) + COALESCE(pts.week_11, 0) + COALESCE(pts.week_12, 0) +
                COALESCE(pts.week_13, 0) + COALESCE(pts.week_14, 0)) > 0
          THEN ROUND((COALESCE(pts.week_1, 0) + COALESCE(pts.week_2, 0) + COALESCE(pts.week_3, 0) +
                     COALESCE(pts.week_4, 0) + COALESCE(pts.week_5, 0) + COALESCE(pts.week_6, 0) +
                     COALESCE(pts.week_7, 0) + COALESCE(pts.week_8, 0) + COALESCE(pts.week_9, 0) +
                     COALESCE(pts.week_10, 0) + COALESCE(pts.week_11, 0) + COALESCE(pts.week_12, 0) +
                     COALESCE(pts.week_13, 0) + COALESCE(pts.week_14, 0)) / ?, 2)
          ELSE 0.0
        END as avg_points
      FROM Players p
      LEFT JOIN Points pts ON p.player_ID = pts.player_ID
      WHERE p.owner_ID = 99 
        AND p.position IN ('QB', 'WR', 'TE', 'RB', 'PK')
      ORDER BY 
        CASE p.position
          WHEN 'QB' THEN 1
          WHEN 'RB' THEN 2
          WHEN 'WR' THEN 3
          WHEN 'TE' THEN 4
          WHEN 'PK' THEN 5
          WHEN 'D/ST' THEN 6
          ELSE 7
        END,
        p.player_name
    `,
    args: [Math.max(1, currentWeek - 1)]
  });
}

export async function getWaivedPlayersByTeam(teamId: string, currentWeek?: number) {
  // If currentWeek is provided, use the appropriate table
  if (currentWeek !== undefined) {
    const tableName = getWaiverTableForWeek(currentWeek);
    
    if (tableName === 'WaiverPlayers2') {
      return await getWaivedPlayersByTeam2(teamId);
    } else if (tableName === 'WaiverPlayers3') {
      return await getWaivedPlayersByTeam3(teamId);
    } else if (tableName === 'WaiverPlayers4') {
      return await getWaivedPlayersByTeam4(teamId);
    }
  }
  
  return await getResults({
    sql: `
      SELECT 
        wp.player_id,
        wp.team_id,
        wp.waiver_order,
        wp.waived_at,
        wp.status,
        p.player_name,
        p.position,
        p.team_name as nfl_team
      FROM WaiverPlayers wp
      LEFT JOIN Players p ON wp.player_id = p.player_ID
      WHERE wp.team_id = ? AND wp.status = 'available'
      ORDER BY wp.waiver_order
    `,
    args: [teamId]
  });
}

export async function removeWaivedPlayer(playerId: string, teamId: string, currentWeek?: number) {
  // If currentWeek is provided, use the appropriate table
  if (currentWeek !== undefined) {
    const tableName = getWaiverTableForWeek(currentWeek);
    
    if (tableName === 'WaiverPlayers2') {
      return await removeWaivedPlayer2(playerId, teamId);
    } else if (tableName === 'WaiverPlayers3') {
      return await removeWaivedPlayer3(playerId, teamId);
    } else if (tableName === 'WaiverPlayers4') {
      return await removeWaivedPlayer4(playerId, teamId);
    }
  }
  
  // First, get the player's current waiver order
  const waiverPlayer = await getResults({
    sql: 'SELECT waiver_order FROM WaiverPlayers WHERE player_id = ? AND team_id = ? AND status = ?',
    args: [playerId, teamId, 'available']
  });

  if (!waiverPlayer || waiverPlayer.length === 0) {
    throw new Error('Player not found in waiver list');
  }

  const waiverOrder = waiverPlayer[0].waiver_order;

  // Remove the player from the waiver list
  await db.execute({
    sql: 'DELETE FROM WaiverPlayers WHERE player_id = ? AND team_id = ? AND status = ?',
    args: [playerId, teamId, 'available']
  });

  // Update the waiver order for remaining players (decrement orders higher than the removed player)
  await db.execute({
    sql: 'UPDATE WaiverPlayers SET waiver_order = waiver_order - 1 WHERE team_id = ? AND waiver_order > ?',
    args: [teamId, waiverOrder]
  });

  // Return the player to the team's roster
  await db.execute({
    sql: 'UPDATE Players SET owner_ID = ? WHERE player_ID = ?',
    args: [teamId, playerId]
  });

  return true;
}

export async function getUserByTeamId(teamId: string) {
  return await getFirstResult({
    sql: 'SELECT * FROM user WHERE team = ?',
    args: [teamId]
  });
}


// Waiver Drafts Table Functions
export async function createWaiverDraft(week: number, scheduledDate: string, status: string = 'scheduled') {
  return await db.execute({
    sql: `
      INSERT INTO WaiverDrafts (week, scheduled_date, status, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `,
    args: [week, scheduledDate, status]
  });
}

export async function getWaiverDrafts() {
  return await getResults({
    sql: `
      SELECT 
        wd.id,
        wd.week,
        wd.scheduled_date,
        wd.status,
        wd.created_at,
        wd.started_at,
        wd.completed_at
      FROM WaiverDrafts wd
      ORDER BY wd.week
    `
  });
}

export async function getWaiverDraftByWeek(week: number) {
  return await getFirstResult({
    sql: `
      SELECT 
        wd.id,
        wd.week,
        wd.scheduled_date,
        wd.status,
        wd.created_at,
        wd.started_at,
        wd.completed_at
      FROM WaiverDrafts wd
      WHERE wd.week = ?
    `,
    args: [week]
  });
}

export async function updateWaiverDraftStatus(draftId: string, status: string) {
  const updateFields = ['status = ?'];
  const args = [status];
  
  if (status === 'in_progress') {
    updateFields.push('started_at = CURRENT_TIMESTAMP');
  } else if (status === 'completed') {
    updateFields.push('completed_at = CURRENT_TIMESTAMP');
  }
  
  return await db.execute({
    sql: `
      UPDATE WaiverDrafts 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `,
    args: [...args, draftId]
  });
}

// Waiver Draft Order Functions
export async function calculateWaiverDraftOrder(week: number) {
  // Get standings data to determine draft order
  const standings = await getResults({
    sql: `
      SELECT 
        s.Team_ID,
        COALESCE(s.Wins, 0) as wins,
        COALESCE(s.Losses, 0) as losses,
        COALESCE(s.Ties, 0) as ties,
        COALESCE(s.PF, 0.0) as pointsFor,
        u.team_name,
        u.owner_name
      FROM Standings s
      LEFT JOIN user u ON s.Team_ID = u.team
      ORDER BY 
        s.Wins ASC,
        s.PF ASC,
        s.Team_ID ASC
    `
  });
  
  return standings;
}

export async function saveWaiverDraftOrder(draftId: string, draftOrder: Array<{teamId: string, order: number}>) {
  // Clear existing order for this draft
  await db.execute({
    sql: 'DELETE FROM WaiverDraftOrder WHERE draft_id = ?',
    args: [draftId]
  });
  
  // Insert new order
  for (const team of draftOrder) {
    await db.execute({
      sql: `
        INSERT INTO WaiverDraftOrder (draft_id, team_id, draft_order)
        VALUES (?, ?, ?)
      `,
      args: [draftId, team.teamId, team.order]
    });
  }
}

export async function getWaiverDraftOrder(draftId: string) {
  return await getResults({
    sql: `
      SELECT 
        wdo.team_id,
        wdo.draft_order,
        u.team_name,
        u.owner_name
      FROM WaiverDraftOrder wdo
      LEFT JOIN user u ON wdo.team_id = u.team
      WHERE wdo.draft_id = ?
      ORDER BY wdo.draft_order
    `,
    args: [draftId]
  });
}

export async function getCustomDraftSequence(draftId: string) {
  return await getResults({
    sql: `
      SELECT 
        cds.pick_number,
        cds.team_id,
        cds.round_number,
        u.team_name,
        u.owner_name,
        u.username
      FROM CustomDraftSequence cds
      LEFT JOIN user u ON cds.team_id = u.team
      WHERE cds.draft_id = ?
      ORDER BY cds.pick_number
    `,
    args: [draftId]
  });
}

export async function getNextPickInfo(draftId: string) {
  // Check if there's a custom draft sequence
  const customSequence = await getCustomDraftSequence(draftId);
  
  if (customSequence && customSequence.length > 0) {
    // Use custom sequence
    const completedPicks = await getResults({
      sql: 'SELECT COUNT(*) as count FROM WaiverPicks WHERE draft_id = ?',
      args: [draftId]
    });
    
    const completedCount = completedPicks[0]?.count || 0;
    const nextPick = customSequence[completedCount];
    
    return {
      hasCustomSequence: true,
      nextPick: nextPick,
      totalPicks: customSequence.length,
      completedPicks: completedCount
    };
  } else {
    // Use standard cycling logic
    const draftOrder = await getWaiverDraftOrder(draftId);
    const completedPicks = await getResults({
      sql: 'SELECT COUNT(*) as count FROM WaiverPicks WHERE draft_id = ?',
      args: [draftId]
    });
    
    const completedCount = completedPicks[0]?.count || 0;
    const nextTeamIndex = completedCount % draftOrder.length;
    const nextTeam = draftOrder[nextTeamIndex];
    
    return {
      hasCustomSequence: false,
      nextPick: nextTeam,
      totalPicks: draftOrder.length,
      completedPicks: completedCount
    };
  }
}

// Waiver Picks Functions
export async function makeWaiverPick(draftId: string, teamId: string, playerId: string, pickNumber: number) {
  return await db.execute({
    sql: `
      INSERT INTO WaiverPicks (draft_id, team_id, player_id, pick_number, picked_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
    args: [draftId, teamId, playerId, pickNumber]
  });
}

export async function getWaiverPicks(draftId: string) {
  return await getResults({
    sql: `
      SELECT 
        wp.pick_number,
        wp.team_id,
        wp.player_id,
        wp.picked_at,
        p.player_name,
        p.position,
        p.team_name as nfl_team,
        u.team_name,
        u.owner_name
      FROM WaiverPicks wp
      LEFT JOIN Players p ON wp.player_id = p.player_ID
      LEFT JOIN user u ON wp.team_id = u.team
      WHERE wp.draft_id = ?
      ORDER BY wp.pick_number
    `,
    args: [draftId]
  });
}

export async function updatePlayerOwnershipAfterWaiver(playerId: string, newTeamId: string) {
  return await db.execute({
    sql: 'UPDATE Players SET owner_ID = ? WHERE player_ID = ?',
    args: [newTeamId, playerId]
  });
}

export async function markWaiverPlayerAsDrafted(playerId: string) {
  return await db.execute({
    sql: 'UPDATE WaiverPlayers SET status = ? WHERE player_id = ?',
    args: ['drafted', playerId]
  });
}


// WaiverPlayers2 Table Functions (for 2nd waiver draft)
export async function waivePlayer2(playerId: string, teamId: string, waiverOrder: number) {
  return await db.execute({
    sql: `
      INSERT INTO WaiverPlayers2 (player_id, team_id, waiver_order, waived_at, status)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'available')
    `,
    args: [playerId, teamId, waiverOrder]
  });
}

export async function getWaivedPlayers2(currentWeek: number = 1) {
  return await getResults({
    sql: `
      SELECT 
        wp.player_id,
        wp.team_id,
        wp.waiver_order,
        wp.waived_at,
        wp.status,
        p.player_name,
        p.position,
        p.team_name as nfl_team,
        u.team_name as team_name,
        u.owner_name,
        (COALESCE(pts.week_1, 0) + COALESCE(pts.week_2, 0) + COALESCE(pts.week_3, 0) +
         COALESCE(pts.week_4, 0) + COALESCE(pts.week_5, 0) + COALESCE(pts.week_6, 0) +
         COALESCE(pts.week_7, 0) + COALESCE(pts.week_8, 0) + COALESCE(pts.week_9, 0) +
         COALESCE(pts.week_10, 0) + COALESCE(pts.week_11, 0) + COALESCE(pts.week_12, 0) +
         COALESCE(pts.week_13, 0) + COALESCE(pts.week_14, 0)) as total_points,
        CASE
          WHEN (COALESCE(pts.week_1, 0) + COALESCE(pts.week_2, 0) + COALESCE(pts.week_3, 0) +
                COALESCE(pts.week_4, 0) + COALESCE(pts.week_5, 0) + COALESCE(pts.week_6, 0) +
                COALESCE(pts.week_7, 0) + COALESCE(pts.week_8, 0) + COALESCE(pts.week_9, 0) +
                COALESCE(pts.week_10, 0) + COALESCE(pts.week_11, 0) + COALESCE(pts.week_12, 0) +
                COALESCE(pts.week_13, 0) + COALESCE(pts.week_14, 0)) > 0
          THEN ROUND((COALESCE(pts.week_1, 0) + COALESCE(pts.week_2, 0) + COALESCE(pts.week_3, 0) +
                     COALESCE(pts.week_4, 0) + COALESCE(pts.week_5, 0) + COALESCE(pts.week_6, 0) +
                     COALESCE(pts.week_7, 0) + COALESCE(pts.week_8, 0) + COALESCE(pts.week_9, 0) +
                     COALESCE(pts.week_10, 0) + COALESCE(pts.week_11, 0) + COALESCE(pts.week_12, 0) +
                     COALESCE(pts.week_13, 0) + COALESCE(pts.week_14, 0)) / ?, 2)
          ELSE 0.0
        END as avg_points
      FROM WaiverPlayers2 wp
      LEFT JOIN Players p ON wp.player_id = p.player_ID
      LEFT JOIN user u ON wp.team_id = u.team
      LEFT JOIN Points pts ON p.player_ID = pts.player_ID
      WHERE wp.status = 'available'
      ORDER BY wp.waiver_order
    `,
    args: [Math.max(1, currentWeek - 1)]
  });
}

export async function getWaivedPlayersByTeam2(teamId: string) {
  return await getResults({
    sql: `
      SELECT 
        wp.player_id,
        wp.team_id,
        wp.waiver_order,
        wp.waived_at,
        wp.status,
        p.player_name,
        p.position,
        p.team_name as nfl_team
      FROM WaiverPlayers2 wp
      LEFT JOIN Players p ON wp.player_id = p.player_ID
      WHERE wp.team_id = ? AND wp.status = 'available'
      ORDER BY wp.waiver_order
    `,
    args: [teamId]
  });
}

export async function removeWaivedPlayer2(playerId: string, teamId: string) {
  // First, get the player's current waiver order
  const waiverPlayer = await getResults({
    sql: 'SELECT waiver_order FROM WaiverPlayers2 WHERE player_id = ? AND team_id = ? AND status = ?',
    args: [playerId, teamId, 'available']
  });

  if (!waiverPlayer || waiverPlayer.length === 0) {
    throw new Error('Player not found in waiver list');
  }

  const waiverOrder = waiverPlayer[0].waiver_order;

  // Remove the player from the waiver list
  await db.execute({
    sql: 'DELETE FROM WaiverPlayers2 WHERE player_id = ? AND team_id = ? AND status = ?',
    args: [playerId, teamId, 'available']
  });

  // Update the waiver order for remaining players (decrement orders higher than the removed player)
  await db.execute({
    sql: 'UPDATE WaiverPlayers2 SET waiver_order = waiver_order - 1 WHERE team_id = ? AND waiver_order > ?',
    args: [teamId, waiverOrder]
  });

  // Return the player to the team's roster
  await db.execute({
    sql: 'UPDATE Players SET owner_ID = ? WHERE player_ID = ?',
    args: [teamId, playerId]
  });

  return true;
}

// WaiverPlayers3 Table Functions (for 3rd waiver draft - week 8)
export async function waivePlayer3(playerId: string, teamId: string, waiverOrder: number) {
  return await db.execute({
    sql: `
      INSERT INTO WaiverPlayers3 (player_id, team_id, waiver_order, waived_at, status)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'available')
    `,
    args: [playerId, teamId, waiverOrder]
  });
}

export async function getWaivedPlayers3(currentWeek: number = 1) {
  return await getResults({
    sql: `
      SELECT 
        wp.player_id,
        wp.team_id,
        wp.waiver_order,
        wp.waived_at,
        wp.status,
        p.player_name,
        p.position,
        p.team_name as nfl_team,
        u.team_name as team_name,
        u.owner_name,
        (COALESCE(pts.week_1, 0) + COALESCE(pts.week_2, 0) + COALESCE(pts.week_3, 0) +
         COALESCE(pts.week_4, 0) + COALESCE(pts.week_5, 0) + COALESCE(pts.week_6, 0) +
         COALESCE(pts.week_7, 0) + COALESCE(pts.week_8, 0) + COALESCE(pts.week_9, 0) +
         COALESCE(pts.week_10, 0) + COALESCE(pts.week_11, 0) + COALESCE(pts.week_12, 0) +
         COALESCE(pts.week_13, 0) + COALESCE(pts.week_14, 0)) as total_points,
        CASE
          WHEN (COALESCE(pts.week_1, 0) + COALESCE(pts.week_2, 0) + COALESCE(pts.week_3, 0) +
                COALESCE(pts.week_4, 0) + COALESCE(pts.week_5, 0) + COALESCE(pts.week_6, 0) +
                COALESCE(pts.week_7, 0) + COALESCE(pts.week_8, 0) + COALESCE(pts.week_9, 0) +
                COALESCE(pts.week_10, 0) + COALESCE(pts.week_11, 0) + COALESCE(pts.week_12, 0) +
                COALESCE(pts.week_13, 0) + COALESCE(pts.week_14, 0)) > 0
          THEN ROUND((COALESCE(pts.week_1, 0) + COALESCE(pts.week_2, 0) + COALESCE(pts.week_3, 0) +
                     COALESCE(pts.week_4, 0) + COALESCE(pts.week_5, 0) + COALESCE(pts.week_6, 0) +
                     COALESCE(pts.week_7, 0) + COALESCE(pts.week_8, 0) + COALESCE(pts.week_9, 0) +
                     COALESCE(pts.week_10, 0) + COALESCE(pts.week_11, 0) + COALESCE(pts.week_12, 0) +
                     COALESCE(pts.week_13, 0) + COALESCE(pts.week_14, 0)) / ?, 2)
          ELSE 0.0
        END as avg_points
      FROM WaiverPlayers3 wp
      LEFT JOIN Players p ON wp.player_id = p.player_ID
      LEFT JOIN user u ON wp.team_id = u.team
      LEFT JOIN Points pts ON p.player_ID = pts.player_ID
      WHERE wp.status = 'available'
      ORDER BY wp.waiver_order
    `,
    args: [Math.max(1, currentWeek - 1)]
  });
}

export async function getWaivedPlayersByTeam3(teamId: string) {
  return await getResults({
    sql: `
      SELECT 
        wp.player_id,
        wp.team_id,
        wp.waiver_order,
        wp.waived_at,
        wp.status,
        p.player_name,
        p.position,
        p.team_name as nfl_team
      FROM WaiverPlayers3 wp
      LEFT JOIN Players p ON wp.player_id = p.player_ID
      WHERE wp.team_id = ? AND wp.status = 'available'
      ORDER BY wp.waiver_order
    `,
    args: [teamId]
  });
}

export async function removeWaivedPlayer3(playerId: string, teamId: string) {
  // First, get the player's current waiver order
  const waiverPlayer = await getResults({
    sql: 'SELECT waiver_order FROM WaiverPlayers3 WHERE player_id = ? AND team_id = ? AND status = ?',
    args: [playerId, teamId, 'available']
  });

  if (!waiverPlayer || waiverPlayer.length === 0) {
    throw new Error('Player not found in waiver list');
  }

  const waiverOrder = waiverPlayer[0].waiver_order;

  // Remove the player from the waiver list
  await db.execute({
    sql: 'DELETE FROM WaiverPlayers3 WHERE player_id = ? AND team_id = ? AND status = ?',
    args: [playerId, teamId, 'available']
  });

  // Update the waiver order for remaining players (decrement orders higher than the removed player)
  await db.execute({
    sql: 'UPDATE WaiverPlayers3 SET waiver_order = waiver_order - 1 WHERE team_id = ? AND waiver_order > ?',
    args: [teamId, waiverOrder]
  });

  // Return the player to the team's roster
  await db.execute({
    sql: 'UPDATE Players SET owner_ID = ? WHERE player_ID = ?',
    args: [teamId, playerId]
  });

  return true;
}

// WaiverPlayers4 Table Functions (for 4th waiver draft - week 11)
export async function waivePlayer4(playerId: string, teamId: string, waiverOrder: number) {
  return await db.execute({
    sql: `
      INSERT INTO WaiverPlayers4 (player_id, team_id, waiver_order, waived_at, status)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'available')
    `,
    args: [playerId, teamId, waiverOrder]
  });
}

export async function getWaivedPlayers4(currentWeek: number = 1) {
  return await getResults({
    sql: `
      SELECT 
        wp.player_id,
        wp.team_id,
        wp.waiver_order,
        wp.waived_at,
        wp.status,
        p.player_name,
        p.position,
        p.team_name as nfl_team,
        u.team_name as team_name,
        u.owner_name,
        (COALESCE(pts.week_1, 0) + COALESCE(pts.week_2, 0) + COALESCE(pts.week_3, 0) +
         COALESCE(pts.week_4, 0) + COALESCE(pts.week_5, 0) + COALESCE(pts.week_6, 0) +
         COALESCE(pts.week_7, 0) + COALESCE(pts.week_8, 0) + COALESCE(pts.week_9, 0) +
         COALESCE(pts.week_10, 0) + COALESCE(pts.week_11, 0) + COALESCE(pts.week_12, 0) +
         COALESCE(pts.week_13, 0) + COALESCE(pts.week_14, 0)) as total_points,
        CASE
          WHEN (COALESCE(pts.week_1, 0) + COALESCE(pts.week_2, 0) + COALESCE(pts.week_3, 0) +
                COALESCE(pts.week_4, 0) + COALESCE(pts.week_5, 0) + COALESCE(pts.week_6, 0) +
                COALESCE(pts.week_7, 0) + COALESCE(pts.week_8, 0) + COALESCE(pts.week_9, 0) +
                COALESCE(pts.week_10, 0) + COALESCE(pts.week_11, 0) + COALESCE(pts.week_12, 0) +
                COALESCE(pts.week_13, 0) + COALESCE(pts.week_14, 0)) > 0
          THEN ROUND((COALESCE(pts.week_1, 0) + COALESCE(pts.week_2, 0) + COALESCE(pts.week_3, 0) +
                     COALESCE(pts.week_4, 0) + COALESCE(pts.week_5, 0) + COALESCE(pts.week_6, 0) +
                     COALESCE(pts.week_7, 0) + COALESCE(pts.week_8, 0) + COALESCE(pts.week_9, 0) +
                     COALESCE(pts.week_10, 0) + COALESCE(pts.week_11, 0) + COALESCE(pts.week_12, 0) +
                     COALESCE(pts.week_13, 0) + COALESCE(pts.week_14, 0)) / ?, 2)
          ELSE 0.0
        END as avg_points
      FROM WaiverPlayers4 wp
      LEFT JOIN Players p ON wp.player_id = p.player_ID
      LEFT JOIN user u ON wp.team_id = u.team
      LEFT JOIN Points pts ON p.player_ID = pts.player_ID
      WHERE wp.status = 'available'
      ORDER BY wp.waiver_order
    `,
    args: [Math.max(1, currentWeek - 1)]
  });
}

export async function getWaivedPlayersByTeam4(teamId: string) {
  return await getResults({
    sql: `
      SELECT 
        wp.player_id,
        wp.team_id,
        wp.waiver_order,
        wp.waived_at,
        wp.status,
        p.player_name,
        p.position,
        p.team_name as nfl_team
      FROM WaiverPlayers4 wp
      LEFT JOIN Players p ON wp.player_id = p.player_ID
      WHERE wp.team_id = ? AND wp.status = 'available'
      ORDER BY wp.waiver_order
    `,
    args: [teamId]
  });
}

export async function removeWaivedPlayer4(playerId: string, teamId: string) {
  // First, get the player's current waiver order
  const waiverPlayer = await getResults({
    sql: 'SELECT waiver_order FROM WaiverPlayers4 WHERE player_id = ? AND team_id = ? AND status = ?',
    args: [playerId, teamId, 'available']
  });

  if (!waiverPlayer || waiverPlayer.length === 0) {
    throw new Error('Player not found in waiver list');
  }

  const waiverOrder = waiverPlayer[0].waiver_order;

  // Remove the player from the waiver list
  await db.execute({
    sql: 'DELETE FROM WaiverPlayers4 WHERE player_id = ? AND team_id = ? AND status = ?',
    args: [playerId, teamId, 'available']
  });

  // Update the waiver order for remaining players (decrement orders higher than the removed player)
  await db.execute({
    sql: 'UPDATE WaiverPlayers4 SET waiver_order = waiver_order - 1 WHERE team_id = ? AND waiver_order > ?',
    args: [teamId, waiverOrder]
  });

  // Return the player to the team's roster
  await db.execute({
    sql: 'UPDATE Players SET owner_ID = ? WHERE player_ID = ?',
    args: [teamId, playerId]
  });

  return true;
}

// Helper function to determine which waiver table to use based on current week
export function getWaiverTableForWeek(week: number): 'WaiverPlayers' | 'WaiverPlayers2' | 'WaiverPlayers3' | 'WaiverPlayers4' {
  // Weeks 2-3: WaiverPlayers (1st waiver draft)
  // Weeks 4-5: WaiverPlayers2 (2nd waiver draft)  
  // Weeks 7-9: WaiverPlayers3 (3rd waiver draft)
  // Weeks 10-11: WaiverPlayers4 (4th waiver draft)
  if (week >= 2 && week <= 3) {
    return 'WaiverPlayers';
  } else if (week >= 4 && week <= 5) {
    return 'WaiverPlayers2';
  } else if (week >= 7 && week <= 9) {
    return 'WaiverPlayers3';
  } else if (week >= 10 && week <= 11) {
    return 'WaiverPlayers4';
  } else {
    // Default to WaiverPlayers for non-waiver weeks
    return 'WaiverPlayers';
  }
}

// Helper function to check if it's a waiver week
export function isWaiverWeek(week: number): boolean {
  return (week >= 2 && week <= 3) || (week >= 4 && week <= 5) || (week >= 7 && week <= 9) || (week >= 10 && week <= 11);
}

// Helper function to get waiver deadline for a week
export async function getWaiverDeadline(week: number): Promise<Date | null> {
  try {
    // Determine which waiver draft week this period belongs to
    let waiverDraftWeek: number;
    
    if (week >= 2 && week <= 3) {
      waiverDraftWeek = 2; // Waiver 1: Weeks 2-3 -> Draft Week 2
    } else if (week >= 4 && week <= 5) {
      waiverDraftWeek = 5; // Waiver 2: Weeks 4-5 -> Draft Week 5
    } else if (week >= 7 && week <= 8) {
      waiverDraftWeek = 8; // Waiver 3: Weeks 7-8 -> Draft Week 8
    } else if (week >= 10 && week <= 11) {
      waiverDraftWeek = 11; // Waiver 4: Weeks 10-11 -> Draft Week 11
    } else {
      return null; // Not a waiver week
    }

    // Get the waiver draft for the correct week
    const waiverDraft = await getWaiverDraftByWeek(waiverDraftWeek);
    if (!waiverDraft) {
      return null;
    }

    // Parse the scheduled date
    const scheduledDate = new Date(waiverDraft.scheduled_date);
    
    // Calculate the Friday before the scheduled date
    const deadline = new Date(scheduledDate);
    
    // Find the Friday before the scheduled date
    // Friday is day 5 (0=Sunday, 1=Monday, ..., 5=Friday)
    // We want the Friday BEFORE the scheduled date
    const scheduledDay = scheduledDate.getDay(); // 0=Sunday, 1=Monday, etc.
    let daysToSubtract;
    
    if (scheduledDay === 0) { // Sunday
      daysToSubtract = 2; // Go back 2 days to Friday
    } else if (scheduledDay === 1) { // Monday
      daysToSubtract = 3; // Go back 3 days to Friday
    } else if (scheduledDay === 2) { // Tuesday
      daysToSubtract = 4; // Go back 4 days to Friday
    } else if (scheduledDay === 3) { // Wednesday
      daysToSubtract = 6; // Go back 6 days to Friday (Oct 8 -> Oct 3)
    } else if (scheduledDay === 4) { // Thursday
      daysToSubtract = 6; // Go back 6 days to Friday
    } else if (scheduledDay === 5) { // Friday
      daysToSubtract = 7; // Go back 7 days to previous Friday
    } else { // Saturday
      daysToSubtract = 1; // Go back 1 day to Friday
    }
    
    deadline.setDate(scheduledDate.getDate() - daysToSubtract);
    
    // Set time to 7:00 PM Pacific Time
    // Pacific Time is UTC-8 (or UTC-7 during daylight saving)
    // For simplicity, we'll use UTC-8 (PST)
    deadline.setUTCHours(19 + 8, 0, 0, 0); // 7:00 PM PST = 3:00 AM UTC next day
    
    return deadline;
  } catch (error) {
    console.error('Error calculating waiver deadline:', error);
    return null;
  }
}
