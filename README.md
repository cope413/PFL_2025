# PFL 2025 - Fantasy Football League Management System

## Overview

PFL 2025 is a comprehensive fantasy football league management system built with Next.js, TypeScript, and Tailwind CSS. The system provides tools for managing teams, players, drafts, lineups, and league standings.

## Features

### Core Functionality
- **User Management**: Registration, authentication, and profile management
- **Team Management**: Create and manage fantasy teams
- **Player Database**: Comprehensive player management with weekly statistics
- **Draft System**: Live draft room with real-time updates
- **Lineup Management**: Set weekly lineups and track performance
- **Standings**: Automated standings calculation and updates
- **Admin Dashboard**: Comprehensive administrative tools

### Weekly Management
- **Week Finalization**: Admin-controlled weekly score finalization
- **Automatic Standings Updates**: Real-time standings updates after week finalization
- **Score Calculation**: Automated team score calculation based on player statistics
- **Historical Data**: Complete weekly score history and team performance tracking

## Weekly Finalization Process

### Overview
At the end of each week, an admin user can finalize the week's scores, which will:
1. Calculate final team scores based on player statistics
2. Determine matchup winners and losers
3. Update league standings automatically
4. Store weekly results for historical reference
5. Mark the week as finalized (cannot be undone)

### How to Finalize a Week

1. **Access Admin Dashboard**: Navigate to `/admin` and ensure you have admin privileges
2. **Go to Weekly Management Tab**: Click on the "Weekly Management" tab
3. **Review Week Status**: Check which weeks are available for finalization
4. **Finalize Week**: Click "Finalize Week X" for the desired week
5. **Confirm Action**: Review the confirmation dialog and confirm the action
6. **Monitor Progress**: Watch for the success message indicating completion

### Important Notes
- Only weeks that are current or past can be finalized
- Week finalization cannot be undone once completed
- Ensure all player statistics are entered before finalizing
- The system automatically creates necessary database tables if they don't exist

### Database Tables Created
- **WeekStatus**: Tracks which weeks have been finalized
- **WeeklyScores**: Stores historical weekly team scores

## API Endpoints

### Weekly Management
- `POST /api/admin/finalize-week` - Finalize a specific week
- `GET /api/admin/week-status` - Get status of all weeks

### Authentication Required
- All weekly management endpoints require admin authentication
- Include `Authorization: Bearer <token>` header in requests

## Technical Implementation

### Score Calculation
Team scores are calculated by summing the weekly statistics of all players on each team's roster. The system:
- Retrieves all players for each team
- Sums their weekly point totals
- Compares scores to determine matchup results
- Updates standings with wins, losses, and ties

### Standings Updates
Standings are automatically updated with:
- Win/Loss/Tie records
- Points For (PF) and Points Against (PA)
- Division assignments based on team IDs

### Error Handling
The system includes comprehensive error handling for:
- Invalid week numbers
- Missing matchup data
- Database connection issues
- Authorization failures

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Turso database access

### Installation
```bash
npm install
npm run dev
```

### Environment Variables
```env
TURSO_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token
```

## Development

### Building
```bash
npm run build
```

### Type Checking
```bash
npx tsc --noEmit
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
