import { useState, useEffect, useRef } from 'react';

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
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    
    const fetchMatchups = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (week) params.append('week', week.toString());
        if (leagueId) params.append('leagueId', leagueId);

        const url = `/api/leagues/matchups?${params}`;

        const response = await fetch(url, {
          signal: abortControllerRef.current.signal
        });
        const result: ApiResponse<Matchup[]> = await response.json();

        if (result.success && result.data) {
          setMatchups(result.data);
        } else {
          setError(result.error || 'Failed to fetch matchups');
        }
      } catch (err: any) {
        // Ignore abort errors
        if (err.name === 'AbortError') {
          return;
        }
        setError('Failed to fetch matchups');
        console.error('Error fetching matchups:', err);
      } finally {
        // Only update loading state if request wasn't aborted
        if (!abortControllerRef.current.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchMatchups();

    // Cleanup: abort request on unmount or dependency change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [week, leagueId]);

  return { matchups, loading, error };
} 