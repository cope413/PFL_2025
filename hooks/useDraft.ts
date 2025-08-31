import { useState, useEffect, useCallback } from 'react';

interface DraftPick {
  id?: number;
  round: number;
  pick: number;
  team_id: string;
  player_id?: string;
  player_name?: string;
  position?: string;
  team?: string;
  timestamp?: string;
}

interface DraftProgress {
  currentRound: number;
  currentPick: number;
  totalPicks: number;
  lastPick?: DraftPick;
}

interface UseDraftReturn {
  draftPicks: DraftPick[];
  progress: DraftProgress;
  isLoading: boolean;
  error: string | null;
  savePick: (pick: Omit<DraftPick, 'id' | 'timestamp'>) => Promise<void>;
  undoPick: (round: number, pick: number) => Promise<void>;
  clearDraft: () => Promise<void>;
  refreshDraft: () => Promise<void>;
}

export function useDraft(): UseDraftReturn {
  const [draftPicks, setDraftPicks] = useState<DraftPick[]>([]);
  const [progress, setProgress] = useState<DraftProgress>({
    currentRound: 1,
    currentPick: 1,
    totalPicks: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDraftData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/draft');
      const result = await response.json();
      
      if (result.success) {
        setDraftPicks(result.data.picks);
        setProgress(result.data.progress);
      } else {
        setError(result.error || 'Failed to fetch draft data');
      }
    } catch (err) {
      setError('Failed to fetch draft data');
      console.error('Error fetching draft data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const savePick = useCallback(async (pick: Omit<DraftPick, 'id' | 'timestamp'>) => {
    try {
      setError(null);
      
      const response = await fetch('/api/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'savePick',
          ...pick
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh draft data after saving
        await fetchDraftData();
      } else {
        setError(result.error || 'Failed to save pick');
      }
    } catch (err) {
      setError('Failed to save pick');
      console.error('Error saving pick:', err);
    }
  }, [fetchDraftData]);

  const undoPick = useCallback(async (round: number, pick: number) => {
    try {
      setError(null);
      
      const response = await fetch('/api/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'undoPick',
          round,
          pick
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh draft data after undoing
        await fetchDraftData();
      } else {
        setError(result.error || 'Failed to undo pick');
      }
    } catch (err) {
      setError('Failed to undo pick');
      console.error('Error undoing pick:', err);
    }
  }, [fetchDraftData]);

  const clearDraft = useCallback(async () => {
    try {
      setError(null);
      
      const response = await fetch('/api/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'clearDraft'
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh draft data after clearing
        await fetchDraftData();
      } else {
        setError(result.error || 'Failed to clear draft');
      }
    } catch (err) {
      setError('Failed to clear draft');
      console.error('Error clearing draft:', err);
    }
  }, [fetchDraftData]);

  const refreshDraft = useCallback(async () => {
    await fetchDraftData();
  }, [fetchDraftData]);

  // Load draft data on mount
  useEffect(() => {
    fetchDraftData();
  }, [fetchDraftData]);

  return {
    draftPicks,
    progress,
    isLoading,
    error,
    savePick,
    undoPick,
    clearDraft,
    refreshDraft,
  };
}



