# PFL (Prehistoric Football League) API Usage Guide

## 🚀 Overview

Your PFL backend now supports full CRUD operations (Create, Read, Update, Delete) for teams, players, and leagues. This guide shows you how to use the API to manage your fantasy football data.

## 📋 API Endpoints

### Teams API (`/api/teams`)

#### GET - Read Teams
```javascript
// Get all teams
const teams = await apiService.getTeams();

// Get teams for a specific league
const leagueTeams = await apiService.getTeams('l1');

// Get a specific team with roster
const team = await apiService.getTeam('t1');
```

#### POST - Create Team
```javascript
const newTeam = await apiService.createTeam({
  name: "Dynasty Warriors",
  owner: "John Smith",
  leagueId: "l1",
  players: ["p1", "p2", "p3"] // Optional: player IDs
});
```

#### PUT - Update Team
```javascript
const updatedTeam = await apiService.updateTeam('t1', {
  name: "Updated Team Name",
  pointsFor: 250.5,
  record: { wins: 3, losses: 0, ties: 0 }
});
```

#### DELETE - Delete Team
```javascript
await apiService.deleteTeam('t1');
```

### Players API (`/api/players`)

#### GET - Read Players
```javascript
// Get all players
const players = await apiService.getPlayers();

// Get players by position
const qbs = await apiService.getPlayers({ position: 'QB' });

// Get players by team
const billsPlayers = await apiService.getPlayers({ team: 'BUF' });

// Get specific player
const player = await apiService.getPlayer('p1');
```

#### POST - Create Player
```javascript
const newPlayer = await apiService.createPlayer({
  name: "Tom Brady",
  position: "QB",
  team: "TB",
  nflTeam: "Tampa Bay Buccaneers",
  stats: {
    passingYards: 350,
    passingTDs: 3,
    passingInts: 0,
    fantasyPoints: 28.5
  }
});
```

#### PUT - Update Player
```javascript
const updatedPlayer = await apiService.updatePlayer('p1', {
  stats: {
    passingYards: 400,
    passingTDs: 4,
    fantasyPoints: 32.0
  }
});
```

#### DELETE - Delete Player
```javascript
await apiService.deletePlayer('p1');
```

### Leagues API (`/api/leagues`)

#### GET - Read Leagues
```javascript
// Get all leagues
const leagues = await apiService.getLeagues();

// Get specific league with details
const league = await apiService.getLeague('l1');
```

## 🛠️ Frontend Usage Examples

### Using React Hooks

```javascript
import { useTeams, usePlayers, useLeagues } from '@/hooks/useApi';

function MyComponent() {
  const { data: teams, loading, error, refetch } = useTeams();
  const { data: players } = usePlayers({ position: 'QB' });
  const { data: leagues } = useLeagues();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Teams ({teams?.length})</h2>
      {teams?.map(team => (
        <div key={team.id}>{team.name}</div>
      ))}
    </div>
  );
}
```

### Direct API Service Usage

```javascript
import { apiService } from '@/lib/api';

async function handleCreateTeam() {
  try {
    const newTeam = await apiService.createTeam({
      name: "My New Team",
      owner: "My Name",
      leagueId: "l1"
    });
    console.log('Team created:', newTeam);
  } catch (error) {
    console.error('Error creating team:', error);
  }
}
```

## 📊 Data Structure Examples

### Team Object
```javascript
{
  id: "t1",
  name: "The Touchdown Titans",
  owner: "John Doe",
  leagueId: "l1",
  players: ["p1", "p2", "p3"],
  record: { wins: 2, losses: 0, ties: 0 },
  pointsFor: 248.6,
  pointsAgainst: 224.2
}
```

### Player Object
```javascript
{
  id: "p1",
  name: "Josh Allen",
  position: "QB",
  team: "BUF",
  nflTeam: "Buffalo Bills",
  stats: {
    passingYards: 328,
    passingTDs: 3,
    passingInts: 1,
    rushingYards: 42,
    fantasyPoints: 32.4
  }
}
```

### League Object
```javascript
{
  id: "l1",
  name: "Friends & Family",
  type: "Standard",
  teams: ["t1", "t2", "t3", "t4"],
  settings: {
    maxTeams: 12,
    scoringType: "Standard",
    playoffTeams: 6,
    tradeDeadline: "2024-11-15",
    waiverType: "Standard"
  },
  currentWeek: 3,
  season: 2024,
  isActive: true
}
```

## 🔧 Error Handling

All API methods return consistent error responses:

```javascript
// Success Response
{
  success: true,
  data: { /* your data */ },
  message: "Operation completed successfully"
}

// Error Response
{
  success: false,
  error: "Error message here"
}
```

## 🎯 Common Use Cases

### 1. Creating a New Team
```javascript
const createNewTeam = async () => {
  const team = await apiService.createTeam({
    name: "Fantasy Champions",
    owner: "Your Name",
    leagueId: "l1"
  });
  console.log('New team created:', team);
};
```

### 2. Adding Players to a Team
```javascript
const addPlayerToTeam = async (teamId, playerId) => {
  const team = await apiService.getTeam(teamId);
  const updatedPlayers = [...team.players, playerId];
  
  await apiService.updateTeam(teamId, {
    players: updatedPlayers
  });
};
```

### 3. Updating Player Stats
```javascript
const updatePlayerStats = async (playerId, newStats) => {
  await apiService.updatePlayer(playerId, {
    stats: {
      ...newStats,
      fantasyPoints: calculateFantasyPoints(newStats)
    }
  });
};
```

### 4. Managing League Standings
```javascript
const updateTeamRecord = async (teamId, wins, losses, ties) => {
  await apiService.updateTeam(teamId, {
    record: { wins, losses, ties }
  });
};
```

## 🚀 Testing Your API

You can test the API endpoints directly in your browser or using tools like Postman:

- **GET** `http://localhost:3000/api/teams` - Get all teams
- **POST** `http://localhost:3000/api/teams` - Create a team
- **PUT** `http://localhost:3000/api/teams?teamId=t1` - Update a team
- **DELETE** `http://localhost:3000/api/teams?teamId=t1` - Delete a team

## 📝 Notes

- **In-Memory Storage**: Currently using in-memory storage. Data will reset when you restart the server.
- **ID Generation**: Simple timestamp-based IDs are generated automatically.
- **Validation**: Basic validation is included for required fields.
- **Error Handling**: Comprehensive error handling with meaningful messages.

## 🔄 Next Steps

1. **Add a Database**: Replace in-memory storage with PostgreSQL or MongoDB
2. **Add Authentication**: Implement user authentication and authorization
3. **Add Real-time Updates**: Use WebSockets for live scoring updates
4. **Add Data Validation**: Implement more robust validation rules
5. **Add Caching**: Implement Redis for better performance

Your PFL API is now fully functional for managing fantasy football data! 🏈 