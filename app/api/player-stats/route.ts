import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getResults } from '@/lib/database';

// Mapping from team names to team numbers (from Team_IDs.py team_numbers dictionary)
const teamNumbers: { [key: string]: number } = {
  'Las Vegas Raiders': 1,
  'Jacksonville Jaguars': 2,
  'New England Patriots': 3,
  'New York Giants': 4,
  'Baltimore Ravens': 5,
  'Tennessee Titans': 6,
  'Detroit Lions': 7,
  'Atlanta Falcons': 8,
  'Cleveland Browns': 9,
  'Cincinnati Bengals': 10,
  'Arizona Cardinals': 11,
  'Philadelphia Eagles': 12,
  'New York Jets': 13,
  'San Francisco 49ers': 14,
  'Green Bay Packers': 15,
  'Chicago Bears': 16,
  'Kansas City Chiefs': 17,
  'Washington Commanders': 18,
  'Carolina Panthers': 19,
  'Buffalo Bills': 20,
  'Indianapolis Colts': 21,
  'Pittsburgh Steelers': 22,
  'Seattle Seahawks': 23,
  'Tampa Bay Buccaneers': 24,
  'Miami Dolphins': 25,
  'Houston Texans': 26,
  'New Orleans Saints': 27,
  'Denver Broncos': 28,
  'Dallas Cowboys': 29,
  'Los Angeles Chargers': 30,
  'Los Angeles Rams': 31,
  'Minnesota Vikings': 32
};

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'No authorization token provided'
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired token'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    const week = searchParams.get('week');
    const debug = searchParams.get('debug');

    if (!playerId || !week) {
      return NextResponse.json({
        success: false,
        error: 'Player ID and week parameters are required'
      }, { status: 400 });
    }

    const weekNum = parseInt(week);
    if (isNaN(weekNum)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid week parameter'
      }, { status: 400 });
    }

    // First, check if this is a D/ST player
    const playerInfo = await getResults({
      sql: `
        SELECT player_ID, player_name, position, team_id, team_name
        FROM Players
        WHERE player_ID = ?
      `,
      args: [playerId]
    });

    if (!playerInfo || playerInfo.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Player not found'
      }, { status: 404 });
    }

    const player = playerInfo[0];
    const isDst = player.position === 'D/ST';

    if (isDst) {
      // Optional: Inspect Games table schema when debug is set
      if (debug === '1') {
        try {
          const pragma = await getResults({ sql: `PRAGMA table_info(Games)` });
          console.log('Games table columns:', pragma.map((r: any) => `${r.name}:${r.type}`).join(', '));
        } catch (e: any) {
          console.error('Failed to read Games schema via PRAGMA:', e?.message || e);
        }
      }
      // For D/ST players, player_name is the team name (e.g., "Buffalo Bills")
      // We need to map that to team_number (1-32) to query Games table
      const teamName = player.player_name || player.team_name;
      console.log(`D/ST player lookup - player_ID: ${playerId}, player_name: ${player.player_name}, team_name: ${player.team_name}`);
      
      const teamNumber = teamNumbers[teamName];
      
      if (!teamNumber) {
        console.error(`Team name "${teamName}" not found in teamNumbers mapping. Available keys:`, Object.keys(teamNumbers).slice(0, 5));
        return NextResponse.json({
          success: false,
          error: `Could not find team number for D/ST player: ${teamName}. Available team names: ${Object.keys(teamNumbers).join(', ')}`
        }, { status: 404 });
      }

      console.log(`Found team_number ${teamNumber} for ${teamName}, querying Games table for week ${weekNum}`);

      // Fetch D/ST stats from Games table using team_number
      // Find the game where the team is either home or away for the given week
      const gameStats = await getResults({
        sql: `
          SELECT 
            week as week,
            home_team_id,
            away_team_id,
            CASE 
              WHEN home_team_id = ? THEN COALESCE(home_team_yards_allowed, 0)
              WHEN away_team_id = ? THEN COALESCE(away_team_yards_allowed, 0)
              ELSE 0
            END as yards_allowed,
            CASE 
              WHEN home_team_id = ? THEN COALESCE(home_team_sacks, 0)
              WHEN away_team_id = ? THEN COALESCE(away_team_sacks, 0)
              ELSE 0
            END as sacks,
            CASE 
              WHEN home_team_id = ? THEN COALESCE(home_team_takeaways, 0)
              WHEN away_team_id = ? THEN COALESCE(away_team_takeaways, 0)
              ELSE 0
            END as turnovers,
            CASE 
              WHEN home_team_id = ? THEN COALESCE(home_team_safeties, 0)
              WHEN away_team_id = ? THEN COALESCE(away_team_safeties, 0)
              ELSE 0
            END as safeties,
            -- Quarter points: Home team gets points based on away team's quarter scores
            CASE 
              WHEN home_team_id = ? THEN COALESCE(away_qtr1, 0)
              WHEN away_team_id = ? THEN COALESCE(home_qtr1, 0)
              ELSE 0
            END as qtr1,
            CASE 
              WHEN home_team_id = ? THEN COALESCE(away_qtr2, 0)
              WHEN away_team_id = ? THEN COALESCE(home_qtr2, 0)
              ELSE 0
            END as qtr2,
            CASE 
              WHEN home_team_id = ? THEN COALESCE(away_qtr3, 0)
              WHEN away_team_id = ? THEN COALESCE(home_qtr3, 0)
              ELSE 0
            END as qtr3,
            CASE 
              WHEN home_team_id = ? THEN COALESCE(away_qtr4, 0)
              WHEN away_team_id = ? THEN COALESCE(home_qtr4, 0)
              ELSE 0
            END as qtr4,
            -- Overtime points
            CASE 
              WHEN home_team_id = ? THEN COALESCE(away_overtime, 0)
              WHEN away_team_id = ? THEN COALESCE(home_overtime, 0)
              ELSE 0
            END as overtime,
            -- Defensive TD distances: Home team gets their TD distances, away team gets their TD distances
            CASE 
              WHEN home_team_id = ? THEN home_team_TD_distances
              WHEN away_team_id = ? THEN away_team_TD_distances
              ELSE NULL
            END as defensive_td_distances
          FROM Games
          WHERE week = ?
            AND (home_team_id = ? OR away_team_id = ?)
          LIMIT 1
        `,
        args: [
          teamNumber, teamNumber, // yards_allowed
          teamNumber, teamNumber, // sacks
          teamNumber, teamNumber, // turnovers
          teamNumber, teamNumber, // safeties
          teamNumber, teamNumber, // qtr1
          teamNumber, teamNumber, // qtr2
          teamNumber, teamNumber, // qtr3
          teamNumber, teamNumber, // qtr4
          teamNumber, teamNumber, // overtime
          teamNumber, teamNumber, // defensive_td_distances
          weekNum, // Week filter
          teamNumber, teamNumber  // team_id check (home or away)
        ]
      });

      if (!gameStats || gameStats.length === 0) {
        console.error(`No game found in Games table for team_number ${teamNumber} (${teamName}) in week ${weekNum}`);
        // Try to see if there are any games for this week at all
        const weekGamesCheck = await getResults({
          sql: `SELECT COUNT(*) as count FROM Games WHERE week = ?`,
          args: [weekNum]
        });
        console.log(`Total games in week ${weekNum}:`, weekGamesCheck[0]?.count || 0);
        
        return NextResponse.json({
          success: false,
          error: `No game stats found for D/ST player ${teamName} (team_number: ${teamNumber}) for week ${weekNum}. Total games in week: ${weekGamesCheck[0]?.count || 0}`
        }, { status: 404 });
      }

      console.log(`Found game stats for ${teamName}:`, gameStats[0]);

      const stats = gameStats[0];
      // Calculate total points allowed for display
      const totalPointsAllowed = (stats.qtr1 || 0) + (stats.qtr2 || 0) + (stats.qtr3 || 0) + (stats.qtr4 || 0) + (stats.overtime || 0);
      
      return NextResponse.json({
        success: true,
        data: {
          player_id: parseInt(playerId),
          player_name: player.player_name,
          team_id: player.team_id,
          week: weekNum,
          game_id: null,
          // D/ST specific stats (limited to existing columns)
          sacks: stats.sacks || 0,
          turnovers: stats.turnovers || 0,
          safeties: stats.safeties || 0,
          two_point_returns: 0,
          yards_allowed: stats.yards_allowed || 0,
          defensive_tds: 0, // Will be calculated from distances if available
          defensive_td_distances: stats.defensive_td_distances || null,
          points_allowed: totalPointsAllowed,
          // Quarter points for points allowed scoring
          qtr1_points: stats.qtr1 || 0,
          qtr2_points: stats.qtr2 || 0,
          qtr3_points: stats.qtr3 || 0,
          qtr4_points: stats.qtr4 || 0,
          overtime_points: stats.overtime || 0,
          position: 'D/ST'
        }
      });
    } else {
      // Fetch regular player stats from the player_stats table
      const playerStats = await getResults({
        sql: `
          SELECT 
            player_id,
            player_name,
            team_id,
            season_id,
            game_id,
            week,
            pass_yards,
            pass_touchdowns,
            pass_two_pt,
            total_rushes,
            rush_yards,
            rush_touchdowns,
            rush_two_pt,
            receptions,
            receiving_yards,
            rec_touchdowns,
            rec_two_pt,
            extra_point,
            two_point_conversions,
            pass_td_distances,
            rush_td_distances,
            rec_td_distances,
            FG_length
          FROM player_stats 
          WHERE player_id = ? AND week = ?
          ORDER BY game_id DESC
          LIMIT 1
        `,
        args: [parseInt(playerId), weekNum]
      });

      if (!playerStats || playerStats.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No stats found for this player and week'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: playerStats[0]
      });
    }

  } catch (error) {
    console.error('Error fetching player stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch player stats'
    }, { status: 500 });
  }
}
