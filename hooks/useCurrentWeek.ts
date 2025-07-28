import { useState, useEffect } from 'react';

export function useCurrentWeek() {
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentWeek = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/current-week');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch current week: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success) {
          setCurrentWeek(result.data.currentWeek);
        } else {
          setError(result.error || 'Failed to fetch current week');
        }
      } catch (err) {
        console.error('Error fetching current week:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch current week');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentWeek();
  }, []);

  return { currentWeek, loading, error };
} 