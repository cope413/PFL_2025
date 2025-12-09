import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getLineup, getTeamNameMap, getUserById, getTeamRoster, getResults, getCurrentWeek, getNFLTeamOpponentInfo } from '@/lib/database';
import { PlayerScore, MatchupDetails } from '@/lib/db-types';

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

    // Get the user's full data from the database to get their team
    const userData = await getUserById(user.id);

    if (!userData) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const weekStr = searchParams.get('week');
    const team1Id = searchParams.get('team1Id');
    const team2Id = searchParams.get('team2Id');

    if (!weekStr) {
      return NextResponse.json({
        success: false,
        error: 'Week parameter is required'
      }, { status: 400 });
    }

    const week = parseInt(weekStr);
    // Validate week parameter to prevent SQL injection
    if (isNaN(week) || week < 1 || week > 18) {
      return NextResponse.json({
        success: false,
        error: 'Invalid week parameter. Must be a number between 1 and 18.'
      }, { status: 400 });
    }
    const teamNameMap = await getTeamNameMap();
    const currentWeek = await getCurrentWeek();

    // Determine which teams to show matchup for
    let team1, team2;
    
    if (team1Id && team2Id) {
      // Show specific matchup between two teams
      team1 = team1Id;
      team2 = team2Id;
      console.log('Getting matchup details for specific teams:', team1, 'vs', team2, 'week:', week);
    } else {
      // Show user's matchup (original behavior)
      team1 = userData.team;
      console.log('Getting matchup details for user:', userData.team, 'week:', weekStr);

      // Get the real opponent from WeeklyMatchups table
      let opponent = null;
      try {
        const matchupsData = await getResults({
          sql: 'SELECT * FROM WeeklyMatchups WHERE Week = ?',
          args: [week]
        });

        if (matchupsData && matchupsData.length > 0) {
          const weekRow = matchupsData[0];
          
          // Find which team slot this user's team is in and get their opponent
          for (let i = 1; i <= 16; i++) {
            if (weekRow[`Team_${i}`] === userData.team) {
              if (i % 2 === 1) {
                // Odd number, opponent is the next team
                opponent = weekRow[`Team_${i + 1}`];
              } else {
                // Even number, opponent is the previous team
                opponent = weekRow[`Team_${i - 1}`];
              }
              break;
            }
          }
        }
      } catch (error) {
        console.error('Error fetching matchup data:', error);
      }

      // Fallback to mock opponent if no real matchup found
      if (!opponent) {
        const opponents = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4'];
        opponent = opponents[(week - 1) % opponents.length];
      }
      
      team2 = opponent;
    }

    const team1Name = teamNameMap.get(team1) || team1;
    const team2Name = teamNameMap.get(team2) || team2;

    // Get lineups for both teams
    const team1Lineup = await getLineup(team1, week);
    const team2Lineup = await getLineup(team2, week);

    // Generate real player scores from database
    const generatePlayerScores = async (teamId: string, lineup: any): Promise<PlayerScore[]> => {
      // Validate week to prevent SQL injection (already validated above, but double-check)
      if (week < 1 || week > 18 || !Number.isInteger(week)) {
        throw new Error(`Invalid week number: ${week}`);
      }

      const players: PlayerScore[] = [];
      
      if (!lineup) {
        return players;
      }

      const positions = [
        { slot: 'QB', name: 'Quarterback', count: 1 },
        { slot: 'RB_1', name: 'Running Back', count: 1 },
        { slot: 'WR_1', name: 'Wide Receiver', count: 1 },
        { slot: 'FLEX_1', name: 'Flex 1', count: 1 },
        { slot: 'FLEX_2', name: 'Flex 2', count: 1 },
        { slot: 'TE', name: 'Tight End', count: 1 },
        { slot: 'K', name: 'Kicker', count: 1 },
        { slot: 'DEF', name: 'Defense', count: 1 }
      ];

      for (const pos of positions) {
        const playerId = lineup[pos.slot];
        if (playerId) {
          try {
            // Get real player data from database
            // Note: Column names cannot be parameterized, so we validate week above
            const playerData = await getResults({
              sql: `
                SELECT 
                  p.player_ID as id,
                  p.player_name as name,
                  p.position,
                  p.team_name as nflTeam,
                  COALESCE(pts.week_${week.toString()}, 0) as points,
                  COALESCE(pts.week_${week.toString()}, 0) as projectedPoints
                FROM Players p
                LEFT JOIN Points pts ON p.player_ID = pts.player_ID
                WHERE p.player_ID = ?
              `,
              args: [playerId]
            });

            if (playerData && playerData.length > 0) {
              const player = playerData[0];
              
              // Get opponent information for this player's NFL team
              let opponentInfo = null;
              try {
                opponentInfo = await getNFLTeamOpponentInfo(player.nflTeam || 'NFL', week);
              } catch (error) {
                console.error(`Error fetching opponent info for ${player.nflTeam}:`, error);
              }
              
              // Generate realistic projected points if we don't have actual data
              let projectedPoints = player.projectedPoints || 0;
              if (projectedPoints === 0) {
                // Generate based on position
                switch (player.position) {
                  case 'QB':
                    projectedPoints = Math.floor(Math.random() * 15) + 15; // 15-30 points
                    break;
                  case 'RB':
                    projectedPoints = Math.floor(Math.random() * 12) + 8; // 8-20 points
                    break;
                  case 'WR':
                    projectedPoints = Math.floor(Math.random() * 10) + 6; // 6-16 points
                    break;
                  case 'TE':
                    projectedPoints = Math.floor(Math.random() * 8) + 4; // 4-12 points
                    break;
                  case 'PK':
                    projectedPoints = Math.floor(Math.random() * 6) + 6; // 6-12 points
                    break;
                  case 'D/ST':
                    projectedPoints = Math.floor(Math.random() * 8) + 8; // 8-16 points
                    break;
                  default:
                    projectedPoints = Math.floor(Math.random() * 10) + 5; // 5-15 points
                }
              }

              // Use actual points if available, otherwise use projected points
              const actualPoints = Math.floor(player.points || 0);

              players.push({
                playerId: player.id,
                playerName: player.name,
                position: player.position,
                nflTeam: player.nflTeam || 'NFL',
                points: actualPoints,
                projectedPoints: projectedPoints,
                isStarter: true,
                positionSlot: pos.name,
                opponentInfo: opponentInfo
              });
            } else {
              // Fallback for missing player data
              players.push({
                playerId: playerId,
                playerName: `Unknown Player`,
                position: pos.slot.includes('FLEX') ? 'FLEX' : pos.slot.replace('_1', ''),
                nflTeam: 'NFL',
                points: 0,
                projectedPoints: 0,
                isStarter: true,
                positionSlot: pos.name,
                opponentInfo: null
              });
            }
          } catch (error) {
            console.error('Error fetching player data for', playerId, error);
            // Fallback for error cases
            players.push({
              playerId: playerId,
              playerName: `Player ${playerId}`,
              position: pos.slot.includes('FLEX') ? 'FLEX' : pos.slot.replace('_1', ''),
              nflTeam: 'NFL',
              points: 0,
              projectedPoints: 0,
              isStarter: true,
              positionSlot: pos.name,
              opponentInfo: null
            });
          }
        }
      }

      return players;
    };

    const team1Players = await generatePlayerScores(team1, team1Lineup || {});
    const team2Players = await generatePlayerScores(team2, team2Lineup || {});

    const team1TotalScore = Math.floor(team1Players.reduce((sum, p) => sum + (p.points || 0), 0));
    const team2TotalScore = Math.floor(team2Players.reduce((sum, p) => sum + (p.points || 0), 0));

    // Determine result (from team1's perspective)
    let result: 'W' | 'L' | 'T' = 'L';
    if (team1TotalScore > team2TotalScore) result = 'W';
    else if (team1TotalScore === team2TotalScore) result = 'T';

    const matchupDetails: MatchupDetails = {
      week,
      team1: {
        teamId: team1,
        teamName: team1Name,
        totalScore: team1TotalScore,
        projectedScore: Math.floor(team1Players.reduce((sum, p) => sum + p.projectedPoints, 0)),
        players: team1Players
      },
      team2: {
        teamId: team2,
        teamName: team2Name,
        totalScore: team2TotalScore,
        projectedScore: Math.floor(team2Players.reduce((sum, p) => sum + p.projectedPoints, 0)),
        players: team2Players
      },
      result,
      isComplete: week < currentWeek
    };

    return NextResponse.json({
      success: true,
      data: matchupDetails
    });

  } catch (error) {
    console.error('Error fetching matchup details:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch matchup details'
    }, { status: 500 });
  }
}