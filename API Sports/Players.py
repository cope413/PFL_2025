import requests
import json
import os
from Team_IDs import teams, team_IDs, team_names, team_numbers, team_abbreviations
from PFL_Weekly_Wrap import current_week
from name_correction import replace_names
from icecream import ic
import sqlite3


creds = rf'API_SPORTS_KEY.json'
with open(creds, 'r') as f:
    api_data = json.load(f)
    key = api_data['key']
    url = api_data['players']


def create_all_players_json():
    """take rosters from specified directory and create single All_players.json"""
    player_directory = "Rosters"
    all_nfl_players = []
    skill_players = []
    skill_and_kickers = []
    for filename in os.listdir(player_directory):
        if filename.endswith('.json'):
            file_path = os.path.join(player_directory, filename)
            with open(file_path, 'r') as file:
                roster_data = json.load(file)
                team = teams[int(roster_data['parameters']['team'])]

            for line in roster_data['response']:
                player_name = replace_names(line['name'])
                player_id = line['id']
                group = line['group']
                position = line['position']
                team_id = team_numbers[team]
                team_abbrev = team_abbreviations[team]
                all_nfl_players.append({player_name: {'team': team, 'team_id': team_id, 'team_abbrev': team_abbrev,
                                                      'group': group, 'position': position,
                                                      'id': player_id}})
                if (position != "PK" and group != 'Defense' and position != 'G' and position != "OT" and position != "C"
                        and position != "P" and position != "LS" and position != "D/ST" and position is not None and group != 'Practice Squad' and group != "Injured Reserve Or O"):
                    skill_players.append({player_name: {'team': team, 'team_id': team_id, 'team_abbrev': team_abbrev,
                                                        'group': group, 'position': position,
                                                        'id': player_id}})
                if (group != 'Defense' and position != 'G' and position != "OT" and position != "C"
                        and position != "P" and position != "LS" and position != "D/ST" and position is not None and group != "Injured Reserve Or O" and group != 'Practice Squad'):
                    skill_and_kickers.append({player_name: {'team': team, 'team_id': team_id,
                                                            'team_abbrev': team_abbrev, 'group': group,
                                                            'position': position,
                                                            'id': player_id}})
    for team_id in teams:
        all_nfl_players.append({teams[team_id]: {'team': teams[team_id], 'group': 'D/ST', 'position': 'D/ST',
                                                 'id': team_IDs[teams[team_id]]}})
        skill_players.append({teams[team_id]: {'team': teams[team_id], 'group': 'D/ST', 'position': 'D/ST',
                                               'id': team_IDs[teams[team_id]]}})
        skill_and_kickers.append({teams[team_id]: {'team': teams[team_id], 'group': 'D/ST', 'position': 'D/ST',
                                                   'id': team_IDs[teams[team_id]]}})

    with open(rf"Week{current_week}\All_players.json", 'w') as output_file:
        json.dump(all_nfl_players, output_file)

    with open(rf"Week{current_week}\Skill_players.json", 'w') as output_file:
        json.dump(skill_players, output_file)
    with open(rf"Week{current_week}\Skill_and_kickers.json", 'w') as output_file:
        json.dump(skill_and_kickers, output_file)

    print(f"All Players written to Week{current_week}\\All_players.json")


def get_roster(team_id):
    """API Request: Get roster for specified team_id"""
    values = {
        "team": f"{team_id}",
        "season": "2025"
    }
    payload = {
    }
    headers = {
        'x-rapidapi-key': key,
        'x-rapidapi-host': 'v1.american-football.api-sports.io'
    }
    response = requests.get(url, params=values, headers=headers)
    player_stats = response.json()
    
    # Create Rosters directory if it doesn't exist
    rosters_dir = "Rosters"
    if not os.path.exists(rosters_dir):
        os.makedirs(rosters_dir)
    
    stats_path = os.path.join(rosters_dir, f"{teams[team_id]}_players.json")
    with open(stats_path, 'w') as file:
        json.dump(player_stats, file)
        ic(f"{teams[team_id]} players dumped successfully")


for team in team_names:
    rosters_dir = "Rosters"
    if not os.path.exists(rosters_dir):
        os.makedirs(rosters_dir)
    
    roster_file = os.path.join(rosters_dir, f"{team}_players.json")
    if not os.path.exists(roster_file):
        get_roster(team_numbers[team])


def add_players_to_db():
    with open(r'All_players.json', 'r') as file:
        all_players = json.load(file)

    added_players = []

    conn = sqlite3.connect('PFL_2024_test.db')
    cursor = conn.cursor()

    for player in all_players:
        for player_name, player_data in player.items():
            player_id = player_data['id']  # Extract the player ID from the nested dictionary

            # Check if player exists in the Players table
            cursor.execute('''
                SELECT player_ID FROM Players WHERE player_ID = ? AND player_name = ?
            ''', (player_id, replace_names(player_name)))

            result = cursor.fetchone()

            # If player is not found, add the new player to the table
            if result is None:
                cursor.execute('''
                    INSERT INTO Players (player_ID, player_name, position, team_id, team_name, owner_ID)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (player_id, replace_names(player_name), player_data['position'], team_numbers[player_data['team']], player_data['team'], 99))

                # Add player to added_players list
                added_players.append({
                    'player_name': player_name,
                    'id': player_data['id'],
                    'position': player_data['position'],
                    'team': player_data['team'],
                    'team_id': team_numbers[player_data['team']]
                })

    # Commit the changes and close the database connection
    conn.commit()
    conn.close()

    # Write added players to added_players.json
    with open('added_players.json', 'a') as file:
        json.dump(added_players, file, indent=4)

    print("Players from all_players.json have been checked, added if missing, and recorded in added_players.json.")


add_players_to_db()
# for x in range(1,33):
#     get_roster(x)
# create_all_players_json()
