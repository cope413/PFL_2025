#!/usr/bin/env python3
"""
Script to populate the Raw Player Data table in Turso database with NFL roster data
"""

import os
import json
import asyncio
from libsql_client import create_client
from dotenv import load_dotenv
import sys

# Add the API Sports directory to the path
sys.path.append('API Sports')

from Team_IDs import teams, team_IDs, team_names, team_numbers, team_abbreviations
from PFL_Weekly_Wrap import current_week
from name_correction import replace_names

# Load environment variables
load_dotenv('.env.local')

# Database connection details
TURSO_URL = os.getenv('TURSO_URL')
TURSO_AUTH_TOKEN = os.getenv('TURSO_AUTH_TOKEN')

async def create_all_players_json():
    """Create All_players.json from the individual team roster files"""
    player_directory = f"Week{current_week}/Players"
    all_nfl_players = []
    
    print(f"Looking for player files in: {player_directory}")
    
    # Check if the directory exists
    if not os.path.exists(player_directory):
        print(f"Directory {player_directory} does not exist. Looking for alternative directories...")
        # Look for any Week* directories
        for item in os.listdir('.'):
            if item.startswith('Week') and os.path.isdir(item):
                potential_dir = os.path.join(item, 'Players')
                if os.path.exists(potential_dir):
                    player_directory = potential_dir
                    print(f"Found player directory: {player_directory}")
                    break
    
    if not os.path.exists(player_directory):
        print(f"Error: Could not find player directory. Available directories:")
        for item in os.listdir('.'):
            if os.path.isdir(item):
                print(f"  - {item}")
        return []
    
    for filename in os.listdir(player_directory):
        if filename.endswith('.json'):
            file_path = os.path.join(player_directory, filename)
            print(f"Processing: {filename}")
            
            with open(file_path, 'r') as file:
                roster_data = json.load(file)
                
                # Extract team name from filename (remove '_players.json')
                team_name = filename.replace('_players.json', '')
                
                # Find the team ID for this team name
                team_id = None
                for tid, tname in teams.items():
                    if tname == team_name:
                        team_id = tid
                        break
                
                if team_id is None:
                    print(f"Warning: Could not find team ID for {team_name}")
                    continue
                
                for line in roster_data['response']:
                    player_name = replace_names(line['name'])
                    player_id = line['id']
                    group = line['group']
                    position = line['position']
                    team_abbrev = team_abbreviations.get(team_name, '')
                    
                    all_nfl_players.append({
                        'player_name': player_name,
                        'player_id': player_id,
                        'position': position,
                        'team_name': team_name,
                        'team_id': team_id,
                        'team_abbrev': team_abbrev,
                        'group_name': group,
                        'api_data': json.dumps(line)  # Store the full API response
                    })
    
    # Add D/ST entries for each team
    for team_id in teams:
        team_name = teams[team_id]
        team_abbrev = team_abbreviations.get(team_name, '')
        
        all_nfl_players.append({
            'player_name': team_name,
            'player_id': team_IDs[team_name],
            'position': 'D/ST',
            'team_name': team_name,
            'team_id': team_id,
            'team_abbrev': team_abbrev,
            'group_name': 'D/ST',
            'api_data': json.dumps({'name': team_name, 'id': team_IDs[team_name], 'position': 'D/ST', 'group': 'D/ST'})
        })
    
    print(f"Total players found: {len(all_nfl_players)}")
    return all_nfl_players

async def populate_raw_player_data_table():
    """Populate the Raw Player Data table with NFL roster data"""
    
    if not TURSO_URL or not TURSO_AUTH_TOKEN:
        print("Error: TURSO_URL and TURSO_AUTH_TOKEN must be set in .env.local")
        return False
    
    try:
        # Create database client
        client = create_client(
            url=TURSO_URL,
            auth_token=TURSO_AUTH_TOKEN
        )
        
        print("Connected to Turso database successfully!")
        
        # Clear existing data
        print("Clearing existing data from Raw Player Data table...")
        await client.execute("DELETE FROM \"Raw Player Data\"")
        
        # Get all players data
        print("Fetching NFL roster data...")
        all_players = await create_all_players_json()
        
        if not all_players:
            print("No player data found!")
            return False
        
        # Insert players into the database
        print(f"Inserting {len(all_players)} players into Raw Player Data table...")
        
        insert_sql = """
        INSERT INTO "Raw Player Data" 
        (player_id, player_name, position, team_name, team_id, team_abbrev, group_name, api_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        inserted_count = 0
        for player in all_players:
            try:
                await client.execute(insert_sql, [
                    player['player_id'],
                    player['player_name'],
                    player['position'],
                    player['team_name'],
                    player['team_id'],
                    player['team_abbrev'],
                    player['group_name'],
                    player['api_data']
                ])
                inserted_count += 1
                
                if inserted_count % 100 == 0:
                    print(f"Inserted {inserted_count} players...")
                    
            except Exception as e:
                print(f"Error inserting player {player['player_name']}: {e}")
        
        print(f"Successfully inserted {inserted_count} players into Raw Player Data table!")
        
        # Verify the data
        result = await client.execute("SELECT COUNT(*) as count FROM \"Raw Player Data\"")
        count = result.rows[0][0]
        print(f"Verification: {count} players in Raw Player Data table")
        
        await client.close()
        return True
        
    except Exception as e:
        print(f"Error populating table: {e}")
        return False

async def main():
    print("=== Populating Raw Player Data Table ===")
    
    success = await populate_raw_player_data_table()
    
    if success:
        print("\n✓ Raw Player Data table populated successfully!")
    else:
        print("\n✗ Failed to populate Raw Player Data table")

if __name__ == "__main__":
    asyncio.run(main())
