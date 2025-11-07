"use client";

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/lib/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  refetch: () => Promise<void>;
  setData: (data: T) => void;
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await apiCall();
      setState({ data, loading: false, error: null });
    } catch (error) {
      const errorMessage = apiService.handleError(error);
      setState({ data: null, loading: false, error: errorMessage });
    }
  }, [apiCall]);

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  useEffect(() => {
    fetchData();
  }, dependencies);

  return {
    ...state,
    refetch: fetchData,
    setData,
  };
}

// Specific hooks for common API calls
export function useDashboard<T = any>() {
  return useApi<T>(() => apiService.getDashboard<T>());
}

export function useTeams(leagueId?: string) {
  return useApi(() => apiService.getTeams(leagueId), [leagueId]);
}

export function useTeam(teamId: string) {
  return useApi(() => apiService.getTeam(teamId), [teamId]);
}

export function usePlayers(filters?: { position?: string; team?: string }) {
  return useApi(() => apiService.getPlayers(filters), [filters]);
}

export function usePlayer(playerId: string) {
  return useApi(() => apiService.getPlayer(playerId), [playerId]);
}

export function useLeagues() {
  return useApi(() => apiService.getLeagues());
}

export function useLeague(leagueId: string) {
  return useApi(() => apiService.getLeague(leagueId), [leagueId]);
} 

export function useTrades(teamId?: string, enabled: boolean = true) {
  return useApi(() => {
    if (!enabled) {
      return Promise.resolve([] as any);
    }
    return apiService.getTrades(teamId);
  }, [teamId, enabled]);
}

export function useTrade(tradeId: string | null) {
  return useApi(() => {
    if (!tradeId) {
      return Promise.resolve(null as any);
    }
    return apiService.getTrade(tradeId);
  }, [tradeId]);
}