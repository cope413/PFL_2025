import { createClient } from "@libsql/client";
import { User } from "./types";


export const db = createClient({
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
) {
  return await db.execute({
    sql:
      "INSERT INTO user (username, password, team, team_name) VALUES (?, ?, ?, ?)",
    args: [username, password, team, teamName],
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
    args: [ownerId, week],
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
