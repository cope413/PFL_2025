import { useState, useEffect } from 'react';

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  totalPoints: number;
  currentWeekPoints: number;
  avgPoints: number;
  byeWeek: number;
  owner_ID?: string;
  status: string;
  week_1: number;
  week_2: number;
  week_3: number;
  week_4: number;
  week_5: number;
  week_6: number;
  week_7: number;
  week_8: number;
  week_9: number;
  week_10: number;
  week_11: number;
  week_12: number;
  week_13: number;
  week_14: number;
  week_15: number;
  week_16: number;
  week_17: number;
  week_18: number;
}

interface UsePlayersReturn {
  players: Player[];
  isLoading: boolean;
  error: string | null;
  refreshPlayers: () => void;
}

export function usePlayers(): UsePlayersReturn {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/players');
      const result = await response.json();
      
      if (result.success) {
        setPlayers(result.data);
      } else {
        setError(result.error || 'Failed to fetch players');
      }
    } catch (err) {
      setError('Failed to fetch players');
      console.error('Error fetching players:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPlayers = () => {
    fetchPlayers();
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  return {
    players,
    isLoading,
    error,
    refreshPlayers
  };
}

