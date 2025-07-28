import { useState, useEffect } from 'react';

export interface WeeklyResult {
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

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function useTeamWeeklyResults(week?: number) {
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [weeklyResults, setWeeklyResults] = useState<WeeklyResult[]>([]);
  const [weeklyResult, setWeeklyResult] = useState<WeeklyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeeklyResults = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('auth_token');
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        const params = new URLSearchParams();
        if (week) params.append('week', week.toString());

        const url = `/api/team-weekly-results?${params}`;
        console.log('Fetching team weekly results from:', url);

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const result: ApiResponse<any> = await response.json();

        console.log('Team weekly results API response:', result);

        if (result.success && result.data) {
          setTeamInfo(result.data.teamInfo);
          
          if (week) {
            // Single week result
            setWeeklyResult(result.data.weeklyResult);
            setWeeklyResults([]);
          } else {
            // All weekly results
            setWeeklyResults(result.data.weeklyResults);
            setWeeklyResult(null);
          }
        } else {
          setError(result.error || 'Failed to fetch team weekly results');
        }
      } catch (err) {
        setError('Failed to fetch team weekly results');
        console.error('Error fetching team weekly results:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyResults();
  }, [week]);

  return { 
    teamInfo, 
    weeklyResults, 
    weeklyResult, 
    loading, 
    error 
  };
} 