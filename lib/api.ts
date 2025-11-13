import { ApiResponse } from './types';

const API_BASE = '/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  // Set authentication token
  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers as Record<string, string>,
    };

    // Add authorization header if token exists
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers,
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data: ApiResponse<T> = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }

    return data.data as T;
  }

  // Dashboard API
  async getDashboard<T = any>() {
    return this.fetchApi<T>('/dashboard');
  }

  // Teams API
  async getTeams(leagueId?: string) {
    const params = leagueId ? `?leagueId=${leagueId}` : '';
    return this.fetchApi(`/teams${params}`);
  }

  async getTeam(teamId: string) {
    return this.fetchApi(`/teams?teamId=${teamId}`);
  }

  async createTeam(teamData: { name: string; owner: string; leagueId: string; players?: string[] }) {
    return this.fetchApi('/teams', {
      method: 'POST',
      body: JSON.stringify(teamData)
    });
  }

  async updateTeam(teamId: string, teamData: Partial<{ name: string; owner: string; players: string[]; record: any; pointsFor: number; pointsAgainst: number }>) {
    return this.fetchApi(`/teams?teamId=${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(teamData)
    });
  }

  async deleteTeam(teamId: string) {
    return this.fetchApi(`/teams?teamId=${teamId}`, {
      method: 'DELETE'
    });
  }

  // Trades API
  async getTrades(teamId?: string) {
    const params = new URLSearchParams();
    if (teamId) {
      params.append('teamId', teamId);
    }
    const endpoint = params.toString() ? `/trades?${params.toString()}` : '/trades';
    return this.fetchApi(endpoint);
  }

  async getTrade(tradeId: string) {
    return this.fetchApi(`/trades?tradeId=${tradeId}`);
  }

  async proposeTrade(payload: {
    recipientTeamId: string;
    offeredPlayerIds: string[];
    requestedPlayerIds: string[];
    message?: string;
  }) {
    return this.fetchApi('/trades', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async updateTrade(tradeId: string, action: 'accept' | 'decline' | 'cancel' | 'approve' | 'reject', message?: string) {
    return this.fetchApi('/trades', {
      method: 'PATCH',
      body: JSON.stringify({ tradeId, action, message })
    });
  }

  // Players API
  async getPlayers(filters?: { position?: string; team?: string }) {
    const params = new URLSearchParams();
    if (filters?.position) params.append('position', filters.position);
    if (filters?.team) params.append('team', filters.team);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/players?${queryString}` : '/players';
    return this.fetchApi(endpoint);
  }

  async getPlayer(playerId: string) {
    return this.fetchApi(`/players?playerId=${playerId}`);
  }

  async createPlayer(playerData: { name: string; position: string; team: string; nflTeam: string; stats: any }) {
    return this.fetchApi('/players', {
      method: 'POST',
      body: JSON.stringify(playerData)
    });
  }

  async updatePlayer(playerId: string, playerData: Partial<{ name: string; position: string; team: string; nflTeam: string; stats: any }>) {
    return this.fetchApi(`/players?playerId=${playerId}`, {
      method: 'PUT',
      body: JSON.stringify(playerData)
    });
  }

  async deletePlayer(playerId: string) {
    return this.fetchApi(`/players?playerId=${playerId}`, {
      method: 'DELETE'
    });
  }

  // Leagues API
  async getLeagues() {
    return this.fetchApi('/leagues');
  }

  async getLeague(leagueId: string) {
    return this.fetchApi(`/leagues?leagueId=${leagueId}`);
  }

  // Authentication API
  async register(userData: { username: string; password: string; teamId: string }) {
    const result = await this.fetchApi<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    // Automatically set token after successful registration
    this.setToken(result.token);
    return result;
  }

  async login(credentials: { username: string; password: string }) {
    const result = await this.fetchApi<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    // Automatically set token after successful login
    this.setToken(result.token);
    return result;
  }

  async logout() {
    this.clearToken();
  }

  async getCurrentUser() {
    return this.fetchApi('/auth/me');
  }

  async updateProfile(updates: { username?: string; email?: string; team_name?: string; owner_name?: string }) {
    // Map the fields to match what the API expects
    const apiUpdates: any = {};
    if (updates.username !== undefined) apiUpdates.displayName = updates.username;
    if (updates.email !== undefined) apiUpdates.email = updates.email;
    if (updates.team_name !== undefined) apiUpdates.teamName = updates.team_name;
    if (updates.owner_name !== undefined) apiUpdates.ownerName = updates.owner_name;
    
    const result = await this.fetchApi('/auth/update-profile', {
      method: 'PUT',
      body: JSON.stringify(apiUpdates)
    });
    return result; // Return the updated user data directly
  }

  // Helper method for error handling
  handleError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }
}

export const apiService = new ApiService(); 