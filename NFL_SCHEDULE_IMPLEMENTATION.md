# NFL Schedule Implementation

This document describes the implementation of the NFL schedule data fetching and storage system for the PFL 2025 application.

## Overview

The system successfully fetches the complete NFL regular season schedule for 2025 (weeks 1-18) from the API Sports games endpoint and stores it in the Turso database with Los Angeles timezone conversion.

## Components

### 1. Database Table
- **Table**: `NFL_Schedule`
- **Location**: Turso remote database [[memory:6645071]]
- **Structure**:
  ```sql
  CREATE TABLE NFL_Schedule (
      Week INTEGER,
      Home_Team TEXT,
      Away_Team TEXT,
      season INTEGER,
      game_date DATE,
      game_time_utc DATETIME,
      game_time_la DATETIME,
      home_team_id INTEGER,
      home_team_name TEXT,
      home_team_abbrev TEXT,
      away_team_id INTEGER,
      away_team_name TEXT,
      away_team_abbrev TEXT,
      venue TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  ```

### 2. Data Fetching Script
- **File**: `scripts/fetch-nfl-schedule.js`
- **Purpose**: Fetches NFL schedule from API Sports and stores in database
- **Features**:
  - Fetches complete season data from API Sports
  - Filters for Regular Season games only (weeks 1-18)
  - Converts UTC times to Los Angeles timezone
  - Stores comprehensive game data including teams, venues, and times
  - Provides detailed logging and error handling

### 3. Table Creation Script
- **File**: `scripts/create-nfl-schedule-table.js`
- **Purpose**: Creates and modifies the NFL_Schedule table structure
- **Features**:
  - Creates table with proper schema
  - Adds necessary columns to existing table
  - Verifies table structure

### 4. Query Tool
- **File**: `scripts/query-nfl-schedule.js`
- **Purpose**: Query and display NFL schedule data
- **Features**:
  - Query games by week
  - Query games by team
  - Query games by date range
  - Display season summary
  - CLI interface for easy access

### 5. API Testing Script
- **File**: `scripts/test-nfl-schedule-api.js`
- **Purpose**: Test API Sports integration and response format
- **Features**:
  - Tests API connectivity
  - Displays response structure
  - Validates data format

## Data Retrieved

### 2025 NFL Regular Season
- **Total Games**: 272 games
- **Weeks**: 1-18 (Regular Season only)
- **Time Zone**: All times converted to Los Angeles (Pacific) time
- **Data Source**: API Sports games endpoint (season=2025, league=1)

### Games by Week
- Week 1: 16 games
- Week 2: 16 games
- Week 3: 16 games
- Week 4: 16 games
- Week 5: 14 games
- Week 6: 15 games
- Week 7: 15 games
- Week 8: 13 games
- Week 9: 14 games
- Week 10: 14 games
- Week 11: 15 games
- Week 12: 14 games
- Week 13: 16 games
- Week 14: 14 games
- Week 15: 16 games
- Week 16: 16 games
- Week 17: 16 games
- Week 18: 16 games

## Usage

### 1. Fetch and Store Schedule
```bash
# Fetch complete 2025 NFL schedule and store in database
node scripts/fetch-nfl-schedule.js
```

### 2. Query Schedule Data
```bash
# Get season summary
node scripts/query-nfl-schedule.js summary

# Get games for specific week
node scripts/query-nfl-schedule.js week 1

# Get games for specific team
node scripts/query-nfl-schedule.js team "Kansas City Chiefs"

# Get games for date range
node scripts/query-nfl-schedule.js range 2025-09-07 2025-09-08
```

### 3. Create/Modify Table
```bash
# Create or modify NFL_Schedule table
node scripts/create-nfl-schedule-table.js
```

### 4. Test API
```bash
# Test API Sports integration
node scripts/test-nfl-schedule-api.js
```

## API Sports Integration

### Configuration
- API key loaded from `API Sports/API_SPORTS_KEY.json`
- Base URL: `https://v1.american-football.api-sports.io`
- Endpoint: `/games`
- Parameters: `season=2025`, `league=1`

### Data Processing
1. Fetches all games for the season
2. Filters for `stage: "Regular Season"`
3. Extracts week numbers from `"Week X"` format
4. Filters for weeks 1-18
5. Converts UTC times to Los Angeles timezone
6. Stores comprehensive game data

### Time Zone Conversion
All game times are converted from UTC to Los Angeles timezone using JavaScript's built-in timezone handling:
```javascript
const laDate = new Date(utcDate.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
```

## Sample Data

### Week 1 Games (Sample)
- Dallas Cowboys @ Philadelphia Eagles - Thu, Sep 4, 4:20 PM LA time
- Kansas City Chiefs @ Los Angeles Chargers - Fri, Sep 5, 4:00 PM LA time
- Tampa Bay Buccaneers @ Atlanta Falcons - Sun, Sep 7, 9:00 AM LA time
- ... (16 total games for Week 1)

### Team Schedule (Kansas City Chiefs Sample)
- Week 1: @ Los Angeles Chargers - Fri, Sep 5, 4:00 PM LA time
- Week 2: vs Philadelphia Eagles - Sun, Sep 14, 12:25 PM LA time
- Week 3: @ New York Giants - Sun, Sep 21, 4:20 PM LA time
- ... (17 total games)

## Technical Details

### Database Operations
- Uses Turso (remote SQLite) database
- Implements proper error handling
- Supports batch operations
- Maintains data integrity

### Error Handling
- API connectivity issues
- Data parsing errors
- Database operation failures
- Comprehensive logging

### Performance
- Single API call for complete season
- Efficient filtering and processing
- Batch database operations
- Minimal memory usage

## Future Enhancements

1. **Automated Updates**: Schedule regular updates to keep data current
2. **Caching**: Implement caching for frequently accessed data
3. **API Integration**: Add endpoints to the main application
4. **Notifications**: Alert users of schedule changes
5. **Export Features**: Export schedule data in various formats

## Files Created/Modified

- `scripts/fetch-nfl-schedule.js` - Main data fetching script
- `scripts/create-nfl-schedule-table.js` - Table creation script
- `scripts/query-nfl-schedule.js` - Query tool
- `scripts/test-nfl-schedule-api.js` - API testing script
- `NFL_SCHEDULE_IMPLEMENTATION.md` - This documentation

## Success Metrics

✅ **Complete Data Retrieval**: 272 games successfully fetched and stored  
✅ **Proper Filtering**: Only Regular Season weeks 1-18 included  
✅ **Timezone Conversion**: All times converted to Los Angeles timezone  
✅ **Database Storage**: Data properly stored in Turso database  
✅ **Query Functionality**: Multiple query options available  
✅ **Error Handling**: Robust error handling and logging  
✅ **Documentation**: Comprehensive documentation provided  

The NFL schedule implementation is now complete and ready for use in the PFL 2025 application.
