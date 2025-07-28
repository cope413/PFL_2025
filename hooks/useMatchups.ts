import { useState, useEffect } from 'react';

export interface Matchup {
  id: string;
  week: number;
  team1_id: string;
  team2_id: string;
  team1_name: string;
  team2_name: string;
  team1_score: number;
  team2_score: number;
  team1_projected: number;
  team2_projected: number;
  date: string;
  is_complete: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function useMatchups(week?: number, leagueId?: string) {
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('useMatchups hook called with:', { week, leagueId });
    
    const fetchMatchups = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (week) params.append('week', week.toString());
        if (leagueId) params.append('leagueId', leagueId);

        const url = `/api/leagues/matchups?${params}`;
        console.log('Fetching matchups from:', url);

        const response = await fetch(url);
        const result: ApiResponse<Matchup[]> = await response.json();

        console.log('Matchups API response:', result);

        if (result.success && result.data) {
          setMatchups(result.data);
        } else {
          setError(result.error || 'Failed to fetch matchups');
        }
      } catch (err) {
        setError('Failed to fetch matchups');
        console.error('Error fetching matchups:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchups();
  }, [week, leagueId]);

  return { matchups, loading, error };
} 