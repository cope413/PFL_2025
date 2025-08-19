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

// Function to determine current week based on date ranges
export async function getCurrentWeek(): Promise<number> {
  try {
    const currentDate = new Date();
    const currentDateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log('Current date:', currentDateStr);

    // First, let's see what's in the Weeks table
    const allWeeks = await getResults('SELECT * FROM Weeks ORDER BY week');
    console.log('All weeks in database:', allWeeks);

    // Check each week individually to see which one matches
    for (const weekRow of allWeeks) {
      const startDate = (weekRow as any).start;
      const endDate = (weekRow as any).end;
      const weekNum = (weekRow as any).week;

      console.log(`Checking week ${weekNum}: ${startDate} to ${endDate}`);
      console.log(`Current date ${currentDateStr} between ${startDate} and ${endDate}? ${currentDateStr >= startDate && currentDateStr <= endDate}`);

      if (currentDateStr >= startDate && currentDateStr <= endDate) {
        console.log(`Found matching week: ${weekNum}`);
        return weekNum;
      }
    }

    console.log('No current week found in date ranges');

    // If no current week found, check if we're in the offseason
    if (allWeeks.length > 0) {
      const firstWeek = allWeeks[0] as any;
      const lastWeek = allWeeks[allWeeks.length - 1] as any;

      console.log(`First week starts: ${firstWeek.start}, Last week ends: ${lastWeek.end}`);

      // If current date is before the season starts, return week 1
      if (currentDateStr < firstWeek.start) {
        console.log('Current date is before season starts, returning week 1');
        return 1;
      }

      // If current date is after the season ends, return the last week
      if (currentDateStr > lastWeek.end) {
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

export async function getTeamRoster(teamId: string) {
  return await getResults({
    sql: `
      SELECT
        p.player_ID as id,
        p.player_name as name,
        p.position,
        p.team_name as nflTeam,
        p.owner_ID as team,
        p.team_id,
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
        COALESCE(pts.week_14, 0) as week_14
      FROM Players p
      LEFT JOIN NFL_Teams n ON p.team_id = n.team_id
      LEFT JOIN Points pts ON p.player_ID = pts.player_ID
      WHERE p.owner_ID = ?
      ORDER BY p.position, p.player_name
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
  const players = await getResults("SELECT player_ID, player_name as name, position, team_id, team_name as nfl_team, owner_ID FROM Players ORDER BY player_name");
  
  // Get all player stats for weeks 1-14 from Points table
  const stats = await getResults("SELECT player_ID, week_1, week_2, week_3, week_4, week_5, week_6, week_7, week_8, week_9, week_10, week_11, week_12, week_13, week_14 FROM Points ORDER BY player_ID");
  
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
  return await db.execute({
    sql: "DELETE FROM Draft"
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
