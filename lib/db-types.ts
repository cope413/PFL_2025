// Database-related types for PFL 2025

export interface Standing {
  Team_ID: string;
  Wins: number;
  Losses: number;
  Ties: number;
  PF: number;
  PA: number;
  Division: string;
}

export interface PlayerScore {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  fantasyPoints: number;
  passingYards?: number;
  passingTds?: number;
  rushingYards?: number;
  rushingTds?: number;
  receptions?: number;
  receivingYards?: number;
  receivingTds?: number;
}

export interface MatchupDetails {
  week: number;
  team1Id: string;
  team1Name: string;
  team1Score: number;
  team2Id: string;
  team2Name: string;
  team2Score: number;
  team1Players: PlayerScore[];
  team2Players: PlayerScore[];
  result: 'W' | 'L' | 'T';
  isComplete: boolean;
}

export interface Matchup {
  week: number;
  team1Id: string;
  team1Name: string;
  team1Score: number;
  team2Id: string;
  team2Name: string;
  team2Score: number;
  isComplete: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface TeamWeeklyResult {
  week: number;
  opponent: string;
  opponentName: string;
  teamScore: number;
  opponentScore: number;
  teamProjected: number;
  opponentProjected: number;
  result: 'W' | 'L' | 'T';
  date: string;
  isComplete: boolean;
}

export interface TeamInfo {
  teamId: string;
  teamName: string;
  record: {
    wins: number;
    losses: number;
    ties: number;
  };
  pointsFor: number;
  pointsAgainst: number;
  rank: number;
  division: string;
}

export interface Lineup {
  owner_ID: string;
  week: string;
  QB: string;
  RB_1: string;
  WR_1: string;
  FLEX_1: string;
  FLEX_2: string;
  TE: string;
  K: string;
  DEF: string;
}

export interface NotificationPreferences {
  id: number;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  weekly_recaps: boolean;
  trade_alerts: boolean;
  matchup_reminders: boolean;
  injury_alerts: boolean;
  created_at: string;
  updated_at: string;
}

