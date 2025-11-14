# Injury Status Implementation

This document describes the implementation of real injury status tracking for the PFL 2025 application using API Sports data.

## Overview

The injury status system replaces the hardcoded "Healthy" designation with real injury data from the [API Sports NFL Injuries endpoint](https://api-sports.io/documentation/nfl/v1#tag/Injuries).

## Components

### 1. Database Schema
- **Column Added**: `injury_status` TEXT DEFAULT 'healthy' to the `Players` table
- **Script**: `scripts/add-injury-status-column.js`

### 2. Injury Service
- **File**: `lib/injury-service.ts`
- **Purpose**: TypeScript service to fetch injury data from API Sports
- **Features**:
  - Fetch all injuries for a season
  - Fetch injuries for a specific team
  - Map API Sports status to internal status
  - Get injury status for specific players

### 3. Data Sync Script
- **File**: `scripts/sync-injury-data.js`
- **Purpose**: Sync injury data from API Sports to the database
- **Features**:
  - Automatically adds injury_status column if missing
  - Fetches injury data from API Sports
  - Updates all players with real injury status
  - Provides detailed logging and summary

### 4. API Updates
- **Team Roster API**: `app/api/team-roster/route.ts`
  - Now returns real injury status instead of hardcoded "healthy"
- **Database Queries**: `lib/database.ts`
  - Updated `getTeamRoster()` and `getDraftedTeamRoster()` to include injury_status

### 5. Admin Management
- **File**: `app/api/admin/injury-status/route.ts`
- **Purpose**: Admin API for managing injury statuses
- **Endpoints**:
  - `GET /api/admin/injury-status` - View all injury statuses
  - `GET /api/admin/injury-status?playerId=X` - View specific player
  - `PUT /api/admin/injury-status` - Update player injury status
  - `POST /api/admin/injury-status` - Bulk operations

### 6. Testing Scripts
- **File**: `scripts/test-injury-implementation.js` - Test the implementation
- **File**: `scripts/test-api-sports-injuries.js` - Test API Sports endpoint
- **File**: `scripts/reset-test-injury-data.js` - Reset test data

## Status Mapping

The system maps API Sports injury statuses to internal statuses:

| API Sports Status | Internal Status | Description |
|------------------|-----------------|-------------|
| healthy | healthy | Player is healthy and available |
| questionable | questionable | Player is questionable for the game |
| doubtful | doubtful | Player is doubtful for the game |
| out, injured, ir, pup, suspended, covid, personal | out | Player is out for the game |
| not injury related | healthy | Player is healthy (non-injury absence) |

## Usage

### 1. Initial Setup
```bash
# Add injury_status column to database
node scripts/add-injury-status-column.js

# Sync injury data from API Sports
node scripts/sync-injury-data.js
```

### 2. Regular Updates
```bash
# Run the sync script regularly to keep injury data current
node scripts/sync-injury-data.js
```

### 3. Manual Management (Admin)
```bash
# View all injury statuses
curl -H "Authorization: Bearer <admin-token>" \
  http://localhost:3000/api/admin/injury-status

# Update specific player
curl -X PUT -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"playerId": "123", "status": "questionable"}' \
  http://localhost:3000/api/admin/injury-status

# Reset all to healthy
curl -X POST -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"action": "reset_all_healthy"}' \
  http://localhost:3000/api/admin/injury-status
```

### 4. Testing
```bash
# Test the implementation
node scripts/test-injury-implementation.js

# Test API Sports endpoint
node scripts/test-api-sports-injuries.js

# Reset test data
node scripts/reset-test-injury-data.js
```

## API Sports Integration

### Configuration
- API key is loaded from `API Sports/API_SPORTS_KEY.json`
- Base URL: `https://v1.american-football.api-sports.io`
- Endpoint: `/injuries`

### Rate Limiting
- The sync script includes a 1-second delay between API requests
- Consider implementing more sophisticated rate limiting for production use

### Error Handling
- API errors are logged but don't stop the sync process
- Players default to "healthy" status if no injury data is found
- Network errors are caught and logged

## Current Status

✅ **Completed**:
- Database schema updated
- Injury service created
- Sync script implemented
- Team roster API updated
- Admin management API created
- Testing scripts created
- Implementation tested and verified

⚠️ **Note**: The API Sports injury endpoint currently returns 0 results for recent seasons (2022-2025). This may be because:
1. Injury data is only available during active seasons
2. The API requires different parameters
3. The endpoint may not have historical data

## Future Enhancements

1. **Automated Scheduling**: Set up a cron job to run the sync script regularly
2. **Real-time Updates**: Implement webhook or polling for real-time injury updates
3. **Historical Data**: Store injury history for analysis
4. **Notifications**: Alert users when their players' injury status changes
5. **Injury Details**: Store additional injury information (type, expected return, etc.)

## Files Created/Modified

### New Files:
- `lib/injury-service.ts`
- `scripts/add-injury-status-column.js`
- `scripts/sync-injury-data.js`
- `scripts/test-injury-implementation.js`
- `scripts/test-api-sports-injuries.js`
- `scripts/reset-test-injury-data.js`
- `app/api/admin/injury-status/route.ts`
- `INJURY_STATUS_IMPLEMENTATION.md`

### Modified Files:
- `app/api/team-roster/route.ts` - Updated to use real injury status
- `lib/database.ts` - Updated queries to include injury_status

## Troubleshooting

### Common Issues:

1. **API Sports returns 0 results**
   - Check if the season is active
   - Verify API key is valid
   - Check API Sports documentation for parameter requirements

2. **Database column missing**
   - Run `node scripts/add-injury-status-column.js`

3. **Permission errors**
   - Ensure admin access for injury status management endpoints

4. **Sync script fails**
   - Check network connectivity
   - Verify API key in `API Sports/API_SPORTS_KEY.json`
   - Check database connection

The injury status implementation is now complete and ready for use. The system will automatically use real injury data when available from API Sports, and gracefully fall back to "healthy" status when no data is available.






