#!/usr/bin/env python3
"""
Script to create Raw Player Data table in Turso database and populate it with NFL roster data
"""

import os
import json
import asyncio
from libsql_client import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

# Database connection details
TURSO_URL = os.getenv('TURSO_URL')
TURSO_AUTH_TOKEN = os.getenv('TURSO_AUTH_TOKEN')

async def create_raw_player_data_table():
    """Create the Raw Player Data table in Turso database"""
    
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
        
        # Create the Raw Player Data table
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS "Raw Player Data" (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER NOT NULL,
            player_name TEXT NOT NULL,
            position TEXT,
            team_name TEXT NOT NULL,
            team_id INTEGER NOT NULL,
            team_abbrev TEXT,
            group_name TEXT,
            api_data TEXT,  -- Store the full API response as JSON
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
        
        result = await client.execute(create_table_sql)
        print("Raw Player Data table created successfully!")
        
        # Check if table was created
        check_table_sql = "SELECT name FROM sqlite_master WHERE type='table' AND name='Raw Player Data'"
        result = await client.execute(check_table_sql)
        
        if result.rows:
            print("✓ Raw Player Data table exists in database")
        else:
            print("✗ Failed to create Raw Player Data table")
            return False
            
        await client.close()
        return True
        
    except Exception as e:
        print(f"Error creating table: {e}")
        return False

async def get_existing_tables():
    """Get list of existing tables in the database"""
    
    try:
        client = create_client(
            url=TURSO_URL,
            auth_token=TURSO_AUTH_TOKEN
        )
        
        result = await client.execute("SELECT name FROM sqlite_master WHERE type='table'")
        
        print("Existing tables in database:")
        for row in result.rows:
            print(f"  - {row[0]}")
            
        await client.close()
        
    except Exception as e:
        print(f"Error getting tables: {e}")

if __name__ == "__main__":
    print("=== Creating Raw Player Data Table ===")
    
    # First, show existing tables
    asyncio.run(get_existing_tables())
    
    # Create the new table
    success = asyncio.run(create_raw_player_data_table())
    
    if success:
        print("\n✓ Raw Player Data table created successfully!")
        print("Next step: Run the Players.py script to populate the table")
    else:
        print("\n✗ Failed to create Raw Player Data table")
