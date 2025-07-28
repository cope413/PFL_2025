import { useState, useEffect } from 'react';

export interface Standing {
  id: string;
  teamName: string;
  teamField: string;
  division: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  rank: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function useStandings() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/standings');
        const result: ApiResponse<Standing[]> = await response.json();

        if (result.success && result.data) {
          setStandings(result.data);
        } else {
          setError(result.error || 'Failed to fetch standings');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch standings');
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, []);

  return { standings, loading, error };
} 