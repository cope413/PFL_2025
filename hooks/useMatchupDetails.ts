import { useState, useEffect } from 'react';

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
  team1: {
    teamId: string;
    teamName: string;
    totalScore: number;
    projectedScore: number;
    players: PlayerScore[];
    overtimePlayers?: PlayerScore[];
  };
  team2: {
    teamId: string;
    teamName: string;
    totalScore: number;
    projectedScore: number;
    players: PlayerScore[];
    overtimePlayers?: PlayerScore[];
  };
  result: 'W' | 'L' | 'T';
  date: string;
  isComplete: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function useMatchupDetails(week?: number, teamIds?: { team1Id: string; team2Id: string } | null) {
  const [matchupDetails, setMatchupDetails] = useState<MatchupDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatchupDetails = async (weekNumber: number, teamIds?: { team1Id: string; team2Id: string } | null) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      let url = `/api/matchup-details?week=${weekNumber}&t=${Date.now()}`;
      if (teamIds) {
        url += `&team1Id=${teamIds.team1Id}&team2Id=${teamIds.team2Id}`;
      }
      console.log('Fetching matchup details from:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result: ApiResponse<MatchupDetails> = await response.json();

      console.log('Matchup details API response:', result);

      if (result.success && result.data) {
        setMatchupDetails(result.data);
      } else {
        setError(result.error || 'Failed to fetch matchup details');
      }
    } catch (err) {
      setError('Failed to fetch matchup details');
      console.error('Error fetching matchup details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (week) {
      fetchMatchupDetails(week, teamIds);
    }
  }, [week, teamIds]);

  return { 
    matchupDetails, 
    loading, 
    error,
    fetchMatchupDetails 
  };
} 