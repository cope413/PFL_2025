import { useState, useEffect } from 'react';

export interface Award {
  teamId: string;
  teamName: string;
  value: number;
  week?: number;
  tiedTeams?: string[]; // Array of tied team names for display
}

export interface AwardsData {
  firstHalf: {
    highGameScore: Award;
    highLosingScore: Award;
    toughestSchedule: Award;
    bestLoser: Award;
  };
  secondHalf: {
    highGameScore: Award;
    highLosingScore: Award;
    toughestSchedule: Award;
    bestLoser: Award;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function useAwards() {
  const [awards, setAwards] = useState<AwardsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAwards = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/awards', {
          headers: {
            'Content-Type': 'application/json'
          },
          // Add cache control to prevent unnecessary requests
          cache: 'default'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: ApiResponse<AwardsData> = await response.json();

        if (result.success && result.data) {
          setAwards(result.data);
        } else {
          setError(result.error || 'Failed to fetch awards');
        }
      } catch (err) {
        setError('Failed to fetch awards');
        console.error('Error fetching awards:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAwards();
  }, []);

  return { 
    awards, 
    loading, 
    error 
  };
}
