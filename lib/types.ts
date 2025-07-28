// Fantasy Football Data Types

export interface Player {
  id: string;
  name: string;
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF';
  team: string;
  nflTeam: string;
  stats: PlayerStats;
  image?: string;
}

export interface PlayerStats {
  passingYards?: number;
  passingTDs?: number;
  passingInts?: number;
  rushingYards?: number;
  rushingTDs?: number;
  receptions?: number;
  receivingYards?: number;
  receivingTDs?: number;
  fumbles?: number;
  fieldGoals?: number;
  extraPoints?: number;
  sacks?: number;
  interceptions?: number;
  fumbleRecoveries?: number;
  defensiveTDs?: number;
  pointsAllowed?: number;
  fantasyPoints: number;
}

export interface Team {
  id: string;
  name: string;
  owner: string;
  leagueId: string;
  players: string[]; // Player IDs
  record: {
    wins: number;
    losses: number;
    ties: number;
  };
  pointsFor: number;
  pointsAgainst: number;
  logo?: string;
}

export interface League {
  id: string;
  name: string;
  type: 'Standard' | 'PPR' | 'Half PPR' | 'Dynasty' | 'Keeper';
  teams: string[]; // Team IDs
  settings: LeagueSettings;
  currentWeek: number;
  season: number;
  isActive: boolean;
}

export interface LeagueSettings {
  maxTeams: number;
  scoringType: 'Standard' | 'PPR' | 'Half PPR';
  playoffTeams: number;
  tradeDeadline: string;
  waiverType: 'Standard' | 'FAAB';
  faabBudget?: number;
}

export interface Matchup {
  id: string;
  leagueId: string;
  week: number;
  team1Id: string;
  team2Id: string;
  team1Score: number;
  team2Score: number;
  team1Projected: number;
  team2Projected: number;
  isComplete: boolean;
  date: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  teams: string[]; // Team IDs
  leagues: string[]; // League IDs
  avatar?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  type: 'Injury' | 'Trade' | 'Breaking News' | 'Strategy' | 'General';
  playerId?: string;
  timestamp: string;
  source: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LeagueStandings {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  rank: number;
}

export interface TeamRoster {
  teamId: string;
  players: Player[];
  starters: string[]; // Player IDs
  bench: string[]; // Player IDs
  ir: string[]; // Player IDs
} 