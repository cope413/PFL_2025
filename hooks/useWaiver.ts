import { useState, useEffect } from 'react';
import { WaiverDraftInfo, WaiverPlayer } from '@/lib/db-types';

interface UseWaiverReturn {
  waiverDrafts: any[];
  waivedPlayers: WaiverPlayer[];
  currentWaiverDraft: WaiverDraftInfo | null;
  isLoading: boolean;
  error: string | null;
  refreshWaiverData: () => Promise<void>;
  waivePlayer: (playerId: string, teamId: string, waiverOrder: number) => Promise<boolean>;
  removeWaivedPlayer: (playerId: string, teamId: string) => Promise<boolean>;
  makeWaiverPick: (draftId: string, teamId: string, playerId: string, pickNumber: number) => Promise<boolean>;
  autoPick: (draftId: string, teamId: string, pickNumber: number) => Promise<any>;
  startWaiverDraft: (draftId: string) => Promise<boolean>;
  completeWaiverDraft: (draftId: string) => Promise<boolean>;
  undoLastPick: (draftId: string) => Promise<boolean>;
  clearDraft: (draftId: string) => Promise<boolean>;
}

export function useWaiver(): UseWaiverReturn {
  const [waiverDrafts, setWaiverDrafts] = useState<any[]>([]);
  const [waivedPlayers, setWaivedPlayers] = useState<WaiverPlayer[]>([]);
  const [currentWaiverDraft, setCurrentWaiverDraft] = useState<WaiverDraftInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshWaiverData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch waiver drafts
      const draftsResponse = await fetch('/api/waiver?action=waiver-drafts');
      const draftsData = await draftsResponse.json();
      
      if (draftsData.success) {
        setWaiverDrafts(draftsData.data);
      }

      // Fetch waived players
      const playersResponse = await fetch('/api/waiver?action=waived-players');
      const playersData = await playersResponse.json();
      
      if (playersData.success) {
        setWaivedPlayers(playersData.data);
      }

    } catch (err) {
      console.error('Error refreshing waiver data:', err);
      setError('Failed to refresh waiver data');
    } finally {
      setIsLoading(false);
    }
  };

  const waivePlayer = async (playerId: string, teamId: string, waiverOrder: number): Promise<boolean> => {
    try {
      const response = await fetch('/api/waiver/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          action: 'waive-player',
          playerId,
          teamId,
          waiverOrder
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await refreshWaiverData();
        return true;
      } else {
        setError(data.error || 'Failed to waive player');
        return false;
      }
    } catch (err) {
      console.error('Error waiving player:', err);
      setError('Failed to waive player');
      return false;
    }
  };

  const removeWaivedPlayer = async (playerId: string, teamId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/waiver/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          action: 'remove-waived-player',
          playerId,
          teamId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await refreshWaiverData();
        return true;
      } else {
        setError(data.error || 'Failed to remove player from waiver list');
        return false;
      }
    } catch (err) {
      console.error('Error removing waived player:', err);
      setError('Failed to remove player from waiver list');
      return false;
    }
  };

  const makeWaiverPick = async (draftId: string, teamId: string, playerId: string, pickNumber: number): Promise<boolean> => {
    try {
      const response = await fetch('/api/waiver/picks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          action: 'make-pick',
          draftId,
          teamId,
          playerId,
          pickNumber
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await refreshWaiverData();
        return true;
      } else {
        setError(data.error || 'Failed to make waiver pick');
        return false;
      }
    } catch (err) {
      console.error('Error making waiver pick:', err);
      setError('Failed to make waiver pick');
      return false;
    }
  };

  const autoPick = async (draftId: string, teamId: string, pickNumber: number): Promise<any> => {
    try {
      const response = await fetch('/api/waiver/picks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          action: 'auto-pick',
          draftId,
          teamId,
          pickNumber
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await refreshWaiverData();
        return data.data;
      } else {
        setError(data.error || 'Failed to auto-pick');
        return null;
      }
    } catch (err) {
      console.error('Error auto-picking:', err);
      setError('Failed to auto-pick');
      return null;
    }
  };

  const startWaiverDraft = async (draftId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/waiver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          action: 'start-waiver-draft',
          draftId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await refreshWaiverData();
        return true;
      } else {
        setError(data.error || 'Failed to start waiver draft');
        return false;
      }
    } catch (err) {
      console.error('Error starting waiver draft:', err);
      setError('Failed to start waiver draft');
      return false;
    }
  };

  const completeWaiverDraft = async (draftId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/waiver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          action: 'complete-waiver-draft',
          draftId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await refreshWaiverData();
        return true;
      } else {
        setError(data.error || 'Failed to complete waiver draft');
        return false;
      }
    } catch (err) {
      console.error('Error completing waiver draft:', err);
      setError('Failed to complete waiver draft');
      return false;
    }
  };

  const loadWaiverDraft = async (week: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/waiver?action=waiver-draft&week=${week}`);
      const data = await response.json();
      
      if (data.success) {
        setCurrentWaiverDraft(data.data);
      } else {
        setError(data.error || 'Failed to load waiver draft');
      }
    } catch (err) {
      console.error('Error loading waiver draft:', err);
      setError('Failed to load waiver draft');
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    refreshWaiverData();
  }, []);

  const undoLastPick = async (draftId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/waiver/picks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          action: 'undo-last-pick',
          draftId
        })
      });

      const data = await response.json();
      if (data.success) {
        await refreshWaiverData();
      }
      return data.success;
    } catch (error) {
      console.error('Error undoing last pick:', error);
      return false;
    }
  };

  const clearDraft = async (draftId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/waiver/picks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          action: 'clear-draft',
          draftId
        })
      });

      const data = await response.json();
      if (data.success) {
        await refreshWaiverData();
      }
      return data.success;
    } catch (error) {
      console.error('Error clearing draft:', error);
      return false;
    }
  };

  return {
    waiverDrafts,
    waivedPlayers,
    currentWaiverDraft,
    isLoading,
    error,
    refreshWaiverData,
    waivePlayer,
    removeWaivedPlayer,
    makeWaiverPick,
    autoPick,
    startWaiverDraft,
    completeWaiverDraft,
    undoLastPick,
    clearDraft
  };
}
