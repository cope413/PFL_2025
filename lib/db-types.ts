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
  nflTeam: string;
  points: number;
  projectedPoints: number;
  isStarter: boolean;
  positionSlot: string;
  opponentInfo?: {
    opponent: string;
    isHomeTeam: boolean;
    gameTime: string;
    venue: string;
    status: string;
    displayText: string;
    kickoffTime: string;
  } | null;
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

// Waiver System Types
export interface WaiverPlayer {
  player_id: string;
  team_id: string;
  waiver_order: number;
  waived_at: string;
  status: 'available' | 'drafted';
  player_name: string;
  position: string;
  nfl_team: string;
  team_name?: string;
  owner_name?: string;
}

export interface WaiverDraft {
  id: string;
  week: number;
  scheduled_date: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface WaiverDraftOrder {
  team_id: string;
  draft_order: number;
  team_name?: string;
  owner_name?: string;
}

export interface WaiverPick {
  pick_number: number;
  team_id: string;
  player_id: string;
  picked_at: string;
  player_name: string;
  position: string;
  nfl_team: string;
  team_name?: string;
  owner_name?: string;
}

export interface WaiverDraftInfo {
  draft: WaiverDraft;
  draftOrder: WaiverDraftOrder[];
  waivedPlayers: WaiverPlayer[];
  picks: WaiverPick[];
  currentPick: number;
  isActive: boolean;
}

export type TradeStatus = 'pending' | 'accepted' | 'approved' | 'declined' | 'cancelled' | 'rejected';

export interface TradePlayerItem {
  id: number;
  tradeId: string;
  playerId: string;
  fromTeamId: string;
  playerName?: string;
  position?: string;
  nflTeam?: string;
  currentOwnerId?: string;
}

export interface Trade {
  id: string;
  proposerUserId: string;
  proposerTeamId: string;
  recipientUserId: string;
  recipientTeamId: string;
  status: TradeStatus;
  proposerMessage?: string | null;
  responseMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  resolvedByUserId?: string | null;
  proposerUsername?: string | null;
  proposerTeamName?: string | null;
  recipientUsername?: string | null;
  recipientTeamName?: string | null;
  items: TradePlayerItem[];
  offeredPlayers: TradePlayerItem[];
  requestedPlayers: TradePlayerItem[];
}

