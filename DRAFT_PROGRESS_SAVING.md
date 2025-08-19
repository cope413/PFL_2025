# Draft Progress Saving Feature

## Overview
The PFL draft room now automatically saves draft progress to the database, allowing users to close and reopen the draft room without losing their progress. The system automatically restores the draft state and resumes from the last made pick.

## Database Schema

### Draft Table
```sql
CREATE TABLE Draft (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    round INTEGER NOT NULL,
    pick INTEGER NOT NULL,
    team_id TEXT NOT NULL,
    player_id TEXT,
    player_name TEXT,
    position TEXT,
    team TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(round, pick)
);
```

**Fields:**
- `id`: Unique identifier for each record
- `round`: Draft round (1-16)
- `pick`: Pick number within the round (1-16)
- `team_id`: Team making the pick (e.g., "A1", "B2")
- `player_id`: ID of the drafted player
- `player_name`: Name of the drafted player
- `position`: Player position (QB, RB, WR, TE, K, DEF)
- `team`: NFL team abbreviation
- `timestamp`: When the pick was made

## API Endpoints

### GET /api/draft
Retrieves all draft picks and current progress.

**Response:**
```json
{
  "success": true,
  "data": {
    "picks": [...],
    "progress": {
      "currentRound": 1,
      "currentPick": 1,
      "totalPicks": 0
    }
  }
}
```

### POST /api/draft
Saves draft picks or performs other draft operations.

**Actions:**
- `savePick`: Saves a single draft pick
- `clearDraft`: Clears all draft data

**Example savePick payload:**
```json
{
  "action": "savePick",
  "round": 1,
  "pick": 1,
  "team_id": "A1",
  "player_id": "1",
  "player_name": "Christian McCaffrey",
  "position": "RB",
  "team": "SF"
}
```

## Implementation Details

### 1. Database Functions (`lib/database.ts`)
- `saveDraftPick()`: Saves or updates a draft pick
- `getDraftPicks()`: Retrieves all draft picks
- `getDraftProgress()`: Calculates current draft progress
- `clearDraft()`: Removes all draft data

### 2. Custom Hook (`hooks/useDraft.ts`)
- Manages draft state and API calls
- Provides functions for saving picks and clearing draft
- Handles loading states and error handling

### 3. DraftRoom Component Updates
- Automatically loads draft progress on mount
- Saves picks to database when made
- Restores draft state from database
- Shows loading and error states
- Provides admin controls for clearing draft

## Features

### Auto-Save
- Every pick is automatically saved to the database
- No manual save button required
- Real-time synchronization

### Progress Restoration
- Draft room automatically restores previous state
- Resumes from the last made pick
- Maintains all player selections and team rosters

### Admin Controls
- Clear draft functionality for administrators
- Undo last pick (also updates database)
- Refresh draft data manually

### Error Handling
- Graceful fallback if database operations fail
- User-friendly error messages
- Loading states during operations

## Usage

### For Users
1. Open the draft room
2. Make picks as normal
3. Close the draft room when needed
4. Reopen to continue from where you left off

### For Administrators
1. Access additional controls (Clear Draft, Undo)
2. Monitor draft progress and sync status
3. Manage draft state and troubleshooting

## Technical Notes

- Uses SQLite with Turso for database operations
- Implements optimistic updates for better UX
- Handles concurrent access safely
- Maintains data integrity with unique constraints
- Provides real-time feedback on database operations

## Future Enhancements

- Draft history and analytics
- Export draft results
- Backup and restore functionality
- Multi-draft support for different seasons
- Draft timer persistence



