import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getLineup, getTeamNameMap, getUserById } from '@/lib/database';
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

    if (!weekStr) {
      return NextResponse.json({
        success: false,
        error: 'Week parameter is required'
      }, { status: 400 });
    }

    console.log('Getting matchup details for user:', userData.team, 'week:', weekStr);

    const week = parseInt(weekStr);
    const teamNameMap = await getTeamNameMap();

    // Generate mock opponent for this week
    const opponents = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4'];
    const opponent = opponents[(week - 1) % opponents.length];
    const opponentName = teamNameMap.get(opponent) || opponent;

    // Get user's lineup for this week
    const userLineup = await getLineup(userData.team, week);

    // Get opponent's lineup for this week (mock data)
    const opponentLineup = {
      QB: 'opp_qb_1',
      RB_1: 'opp_rb_1',
      WR_1: 'opp_wr_1',
      FLEX_1: 'opp_flex_1',
      FLEX_2: 'opp_flex_2',
      TE: 'opp_te_1',
      K: 'opp_k_1',
      DEF: 'opp_def_1'
    };

    // Generate mock player scores for user's team
    const generatePlayerScores = (teamId: string, lineup: any, isUserTeam: boolean): PlayerScore[] => {
      const players: PlayerScore[] = [];
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

      const mockPlayerNames = {
        QB: ['Patrick Mahomes', 'Josh Allen', 'Lamar Jackson', 'Jalen Hurts'],
        RB: ['Christian McCaffrey', 'Saquon Barkley', 'Derrick Henry', 'Nick Chubb'],
        WR: ['Tyreek Hill', 'Stefon Diggs', 'Davante Adams', 'Justin Jefferson'],
        TE: ['Travis Kelce', 'Mark Andrews', 'George Kittle', 'T.J. Hockenson'],
        K: ['Justin Tucker', 'Harrison Butker', 'Evan McPherson', 'Daniel Carlson'],
        DEF: ['San Francisco 49ers', 'Dallas Cowboys', 'Buffalo Bills', 'New England Patriots']
      };

      const mockNFLTeams = {
        QB: ['KC', 'BUF', 'BAL', 'PHI'],
        RB: ['SF', 'NYG', 'TEN', 'CLE'],
        WR: ['MIA', 'BUF', 'LV', 'MIN'],
        TE: ['KC', 'BAL', 'SF', 'DET'],
        K: ['BAL', 'KC', 'CIN', 'LV'],
        DEF: ['SF', 'DAL', 'BUF', 'NE']
      };

      positions.forEach((pos, index) => {
        const playerId = lineup[pos.slot];
        if (playerId) {
          const positionType = pos.slot === 'QB' ? 'QB' :
                             pos.slot === 'RB_1' ? 'RB' :
                             pos.slot === 'WR_1' ? 'WR' :
                             pos.slot === 'TE' ? 'TE' :
                             pos.slot === 'K' ? 'K' :
                             pos.slot === 'DEF' ? 'DEF' : 'FLEX';

          const nameIndex = index % 4;
          const playerName = isUserTeam ?
            mockPlayerNames[positionType as keyof typeof mockPlayerNames]?.[nameIndex] || `Player ${index + 1}` :
            `Opponent ${positionType} ${index + 1}`;

          const nflTeam = isUserTeam ?
            mockNFLTeams[positionType as keyof typeof mockNFLTeams]?.[nameIndex] || 'NFL' :
            'OPP';

          // Generate realistic scores based on position
          let basePoints = 0;
          switch (positionType) {
            case 'QB':
              basePoints = Math.floor(Math.random() * 15) + 15; // 15-30 points
              break;
            case 'RB':
              basePoints = Math.floor(Math.random() * 12) + 8; // 8-20 points
              break;
            case 'WR':
              basePoints = Math.floor(Math.random() * 10) + 6; // 6-16 points
              break;
            case 'TE':
              basePoints = Math.floor(Math.random() * 8) + 4; // 4-12 points
              break;
            case 'K':
              basePoints = Math.floor(Math.random() * 6) + 6; // 6-12 points
              break;
            case 'DEF':
              basePoints = Math.floor(Math.random() * 8) + 8; // 8-16 points
              break;
            default:
              basePoints = Math.floor(Math.random() * 10) + 5; // 5-15 points
          }

          const projectedPoints = basePoints + Math.floor(Math.random() * 6) - 3; // ±3 from actual

          players.push({
            playerId: playerId,
            playerName: playerName,
            position: positionType,
            nflTeam: nflTeam,
            points: basePoints,
            projectedPoints: Math.max(0, projectedPoints),
            isStarter: true,
            positionSlot: pos.name
          });
        }
      });

      return players;
    };

    const userPlayers = generatePlayerScores(userData.team, userLineup || {}, true);
    const opponentPlayers = generatePlayerScores(opponent, opponentLineup, false);

    const userTotalScore = userPlayers.reduce((sum, p) => sum + p.points, 0);
    const opponentTotalScore = opponentPlayers.reduce((sum, p) => sum + p.points, 0);
    const userProjectedScore = userPlayers.reduce((sum, p) => sum + p.projectedPoints, 0);
    const opponentProjectedScore = opponentPlayers.reduce((sum, p) => sum + p.projectedPoints, 0);

    // Determine result
    let result: 'W' | 'L' | 'T' = 'L';
    if (userTotalScore > opponentTotalScore) result = 'W';
    else if (userTotalScore === opponentTotalScore) result = 'T';

    const matchupDetails: MatchupDetails = {
      week,
      team1: {
        teamId: userData.team,
        teamName: teamNameMap.get(userData.team) || userData.team,
        totalScore: userTotalScore,
        projectedScore: userProjectedScore,
        players: userPlayers
      },
      team2: {
        teamId: opponent,
        teamName: opponentName,
        totalScore: opponentTotalScore,
        projectedScore: opponentProjectedScore,
        players: opponentPlayers
      },
      result,
      date: `2024-09-${String(week + 20).padStart(2, '0')}`,
      isComplete: week < 5 // Assume weeks 1-4 are complete
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