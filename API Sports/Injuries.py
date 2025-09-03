import requests
import json
from My_Team import my_team
from PFL_Weekly_Wrap import current_week


creds = rf'API_SPORTS_KEY.json'
with open(creds, 'r') as f:
    api_data = json.load(f)
    key = api_data['key']
    url = "https://v1.american-football.api-sports.io/injuries"


all_players = rf"Week{current_week}\All_players.json"
player_ids = {}


with open(all_players, 'r') as file:
    players = json.load(file)
    for line in players:
        for player in my_team:
            if player in line:
                player_ids.update({player: line[player]['id']})

all_ids = player_ids.values()
values = []
for line in all_ids:
    values.append(line)


def get_injuries(value):
    payload = {}
    headers = {
        'x-rapidapi-key': key,
        'x-rapidapi-host': 'v1.american-football.api-sports.io'
    }
    keys = {'player': value

    }
    response = requests.get(url, params=keys, headers=headers, data=payload)
    data = response.json()
    for line in data['response']:
        name = line['player']['name']
        status = line['status']
        description = line['description']
        print(f"{name}: {status} - {description}")


for x in values:
    get_injuries(x)
