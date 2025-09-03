import fs from 'fs';
import path from 'path';

interface ApiSportsKey {
  key: string;
  url: string;
  players: string;
}

interface InjuryData {
  id: number;
  name: string;
  position: string;
  team: string;
  status: string;
  date: string;
  type: string;
  details?: string;
}

interface ApiSportsInjuryResponse {
  get: string;
  parameters: {
    season: string;
    team?: string;
  };
  errors: any[];
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: InjuryData[];
}

class InjuryService {
  private apiKey: string;
  private baseUrl = 'https://v1.american-football.api-sports.io';

  constructor() {
    // Load API key from the existing API_SPORTS_KEY.json file
    const keyPath = path.join(process.cwd(), 'API Sports', 'API_SPORTS_KEY.json');
    try {
      const keyData = fs.readFileSync(keyPath, 'utf8');
      const apiData: ApiSportsKey = JSON.parse(keyData);
      this.apiKey = apiData.key;
    } catch (error) {
      console.error('Error loading API Sports key:', error);
      throw new Error('Failed to load API Sports key');
    }
  }

  /**
   * Fetch injury data for a specific player by player ID
   */
  async fetchPlayerInjury(playerId: string): Promise<InjuryData | null> {
    const url = `${this.baseUrl}/injuries`;
    const headers = {
      'x-rapidapi-key': this.apiKey,
      'x-rapidapi-host': 'v1.american-football.api-sports.io'
    };

    try {
      const response = await fetch(`${url}?player=${playerId}`, { headers });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: ApiSportsInjuryResponse = await response.json();
      
      if (data.errors && data.errors.length > 0) {
        console.warn(`API returned errors for player ${playerId}:`, data.errors);
      }

      if (data.results > 0 && data.response && data.response.length > 0) {
        return data.response[0]; // Return the first (and likely only) injury record
      }

      return null; // No injury data found

    } catch (error) {
      console.error(`Error fetching injury data for player ${playerId}:`, error);
      return null;
    }
  }

  /**
   * Fetch injury data for a specific team
   */
  async fetchTeamInjuries(teamId: string, season: string = '2025'): Promise<InjuryData[]> {
    const url = `${this.baseUrl}/injuries`;
    const headers = {
      'x-rapidapi-key': this.apiKey,
      'x-rapidapi-host': 'v1.american-football.api-sports.io'
    };

    try {
      console.log(`Fetching injury data for team ${teamId} in season ${season}...`);
      
      const response = await fetch(`${url}?season=${season}&team=${teamId}`, { headers });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: ApiSportsInjuryResponse = await response.json();
      
      if (data.errors && data.errors.length > 0) {
        console.warn('API returned errors:', data.errors);
      }

      console.log(`Fetched ${data.results} injury records for team ${teamId}`);
      return data.response || [];

    } catch (error) {
      console.error(`Error fetching injury data for team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Map API Sports injury status to our internal status
   */
  mapInjuryStatus(apiStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'healthy': 'healthy',
      'questionable': 'questionable',
      'doubtful': 'doubtful',
      'out': 'out',
      'injured': 'out',
      'ir': 'out',
      'pup': 'out',
      'suspended': 'out',
      'covid': 'out',
      'personal': 'out',
      'not injury related': 'healthy'
    };

    const normalizedStatus = apiStatus.toLowerCase().trim();
    return statusMap[normalizedStatus] || 'healthy';
  }

  /**
   * Get injury status for a specific player by name and team
   */
  async getPlayerInjuryStatus(playerName: string, teamName: string, season: string = '2025'): Promise<string> {
    try {
      const allInjuries = await this.fetchAllInjuries(season);
      
      // Find injury record for this player
      const playerInjury = allInjuries.find(injury => 
        injury.name.toLowerCase() === playerName.toLowerCase() &&
        injury.team.toLowerCase() === teamName.toLowerCase()
      );

      if (playerInjury) {
        return this.mapInjuryStatus(playerInjury.status);
      }

      return 'healthy'; // Default to healthy if no injury record found

    } catch (error) {
      console.error(`Error getting injury status for ${playerName}:`, error);
      return 'healthy'; // Default to healthy on error
    }
  }
}

export default InjuryService;
export type { InjuryData, ApiSportsInjuryResponse };
