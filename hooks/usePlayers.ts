import { useState, useEffect } from 'react';

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  adp: number;
  projectedPoints: number;
  bye: number;
  owner_ID?: string;
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
