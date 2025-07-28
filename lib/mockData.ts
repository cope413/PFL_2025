import { Player, Team, League, Matchup, NewsItem, User } from './types';

// Mock Players Data
export const mockPlayers: Player[] = [
  {
    id: 'p1',
    name: 'Josh Allen',
    position: 'QB',
    team: 'BUF',
    nflTeam: 'Buffalo Bills',
    stats: {
      passingYards: 328,
      passingTDs: 3,
      passingInts: 1,
      rushingYards: 42,
      rushingTDs: 0,
      fantasyPoints: 32.4
    }
  },
  {
    id: 'p2',
    name: 'Justin Jefferson',
    position: 'WR',
    team: 'MIN',
    nflTeam: 'Minnesota Vikings',
    stats: {
      receptions: 11,
      receivingYards: 187,
      receivingTDs: 1,
      fantasyPoints: 28.7
    }
  },
  {
    id: 'p3',
    name: 'Christian McCaffrey',
    position: 'RB',
    team: 'SF',
    nflTeam: 'San Francisco 49ers',
    stats: {
      rushingYards: 118,
      rushingTDs: 1,
      receptions: 5,
      receivingYards: 42,
      fantasyPoints: 26.2
    }
  },
  {
    id: 'p4',
    name: 'Travis Kelce',
    position: 'TE',
    team: 'KC',
    nflTeam: 'Kansas City Chiefs',
    stats: {
      receptions: 8,
      receivingYards: 95,
      receivingTDs: 1,
      fantasyPoints: 22.5
    }
  },
  {
    id: 'p5',
    name: 'Patrick Mahomes',
    position: 'QB',
    team: 'KC',
    nflTeam: 'Kansas City Chiefs',
    stats: {
      passingYards: 298,
      passingTDs: 2,
      passingInts: 0,
      rushingYards: 15,
      fantasyPoints: 24.8
    }
  },
  {
    id: 'p6',
    name: 'Tyreek Hill',
    position: 'WR',
    team: 'MIA',
    nflTeam: 'Miami Dolphins',
    stats: {
      receptions: 9,
      receivingYards: 157,
      receivingTDs: 1,
      fantasyPoints: 25.7
    }
  },
  {
    id: 'p7',
    name: 'Austin Ekeler',
    position: 'RB',
    team: 'LAC',
    nflTeam: 'Los Angeles Chargers',
    stats: {
      rushingYards: 89,
      rushingTDs: 1,
      receptions: 7,
      receivingYards: 55,
      fantasyPoints: 23.4
    }
  },
  {
    id: 'p8',
    name: 'Justin Tucker',
    position: 'K',
    team: 'BAL',
    nflTeam: 'Baltimore Ravens',
    stats: {
      fieldGoals: 3,
      extraPoints: 2,
      fantasyPoints: 11.0
    }
  },
  {
    id: 'p9',
    name: 'San Francisco 49ers',
    position: 'DEF',
    team: 'SF',
    nflTeam: 'San Francisco 49ers',
    stats: {
      sacks: 4,
      interceptions: 2,
      fumbleRecoveries: 1,
      defensiveTDs: 0,
      pointsAllowed: 14,
      fantasyPoints: 18.0
    }
  },
  {
    id: 'p10',
    name: 'Saquon Barkley',
    position: 'RB',
    team: 'NYG',
    nflTeam: 'New York Giants',
    stats: {
      rushingYards: 76,
      rushingTDs: 1,
      receptions: 3,
      receivingYards: 28,
      fantasyPoints: 19.4
    }
  }
];

// Mock Teams Data
export const mockTeams: Team[] = [
  {
    id: 't1',
    name: 'The Touchdown Titans',
    owner: 'John Doe',
    leagueId: 'l1',
    players: ['p1', 'p2', 'p3', 'p4', 'p8'],
    record: { wins: 2, losses: 0, ties: 0 },
    pointsFor: 248.6,
    pointsAgainst: 224.2
  },
  {
    id: 't2',
    name: 'Gridiron Giants',
    owner: 'Jane Smith',
    leagueId: 'l1',
    players: ['p5', 'p6', 'p7', 'p9', 'p10'],
    record: { wins: 1, losses: 1, ties: 0 },
    pointsFor: 235.8,
    pointsAgainst: 242.1
  },
  {
    id: 't3',
    name: 'End Zone Warriors',
    owner: 'Mike Johnson',
    leagueId: 'l1',
    players: ['p1', 'p6', 'p7', 'p8', 'p9'],
    record: { wins: 2, losses: 0, ties: 0 },
    pointsFor: 252.3,
    pointsAgainst: 218.7
  },
  {
    id: 't4',
    name: 'Hail Mary Heroes',
    owner: 'Sarah Wilson',
    leagueId: 'l1',
    players: ['p5', 'p2', 'p3', 'p4', 'p10'],
    record: { wins: 0, losses: 2, ties: 0 },
    pointsFor: 198.4,
    pointsAgainst: 245.6
  }
];

// Mock Leagues Data
export const mockLeagues: League[] = [
  {
    id: 'l1',
    name: 'Friends & Family',
    type: 'Standard',
    teams: ['t1', 't2', 't3', 't4'],
    settings: {
      maxTeams: 12,
      scoringType: 'Standard',
      playoffTeams: 6,
      tradeDeadline: '2024-11-15',
      waiverType: 'Standard'
    },
    currentWeek: 3,
    season: 2024,
    isActive: true
  },
  {
    id: 'l2',
    name: 'Office League',
    type: 'PPR',
    teams: [],
    settings: {
      maxTeams: 10,
      scoringType: 'PPR',
      playoffTeams: 4,
      tradeDeadline: '2024-11-10',
      waiverType: 'FAAB',
      faabBudget: 100
    },
    currentWeek: 3,
    season: 2024,
    isActive: true
  }
];

// Mock Matchups Data
export const mockMatchups: Matchup[] = [
  {
    id: 'm1',
    leagueId: 'l1',
    week: 3,
    team1Id: 't1',
    team2Id: 't2',
    team1Score: 0,
    team2Score: 0,
    team1Projected: 118.4,
    team2Projected: 112.7,
    isComplete: false,
    date: '2024-09-22'
  },
  {
    id: 'm2',
    leagueId: 'l1',
    week: 3,
    team1Id: 't3',
    team2Id: 't4',
    team1Score: 0,
    team2Score: 0,
    team1Projected: 125.2,
    team2Projected: 98.6,
    isComplete: false,
    date: '2024-09-22'
  },
  {
    id: 'm3',
    leagueId: 'l1',
    week: 2,
    team1Id: 't1',
    team2Id: 't4',
    team1Score: 124.4,
    team2Score: 98.2,
    team1Projected: 118.4,
    team2Projected: 102.7,
    isComplete: true,
    date: '2024-09-15'
  },
  {
    id: 'm4',
    leagueId: 'l1',
    week: 2,
    team1Id: 't2',
    team2Id: 't3',
    team1Score: 111.5,
    team2Score: 127.8,
    team1Projected: 115.2,
    team2Projected: 122.1,
    isComplete: true,
    date: '2024-09-15'
  }
];

// Mock News Data
export const mockNews: NewsItem[] = [
  {
    id: 'n1',
    title: 'Injury Alert: Travis Kelce Questionable',
    content: 'Chiefs TE Travis Kelce (ankle) is listed as questionable for Sunday\'s game against the Falcons.',
    type: 'Injury',
    playerId: 'p4',
    timestamp: '2024-09-20T18:30:00Z',
    source: 'NFL Network'
  },
  {
    id: 'n2',
    title: 'Waiver Wire: Top Pickups for Week 3',
    content: 'Check out the top waiver wire targets to bolster your roster heading into Week 3.',
    type: 'Strategy',
    timestamp: '2024-09-20T15:00:00Z',
    source: 'FantasyPros'
  },
  {
    id: 'n3',
    title: 'Trade Alert: Johnson Traded to Eagles',
    content: 'The Lions have traded WR Jameson Johnson to the Eagles for a 2nd round pick.',
    type: 'Trade',
    timestamp: '2024-09-19T12:00:00Z',
    source: 'ESPN'
  }
];

// Mock Users Data
export const mockUsers: User[] = [
  {
    id: 'u1',
    username: 'johndoe',
    email: 'john@example.com',
    teams: ['t1'],
    leagues: ['l1']
  },
  {
    id: 'u2',
    username: 'janesmith',
    email: 'jane@example.com',
    teams: ['t2'],
    leagues: ['l1']
  }
];

// Helper function to get player by ID
export const getPlayerById = (id: string): Player | undefined => {
  return mockPlayers.find(player => player.id === id);
};

// Helper function to get team by ID
export const getTeamById = (id: string): Team | undefined => {
  return mockTeams.find(team => team.id === id);
};

// Helper function to get league by ID
export const getLeagueById = (id: string): League | undefined => {
  return mockLeagues.find(league => league.id === id);
}; 