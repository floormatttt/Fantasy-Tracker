import json, datetime

with open('teams_raw.json') as f:
    teams = json.load(f)

with open('players_raw.json') as f:
    players = json.load(f)

out = {
    'teams': teams,
    'players': players,
    'updated': datetime.datetime.utcnow().isoformat()
}

with open('data.json', 'w') as f:
    json.dump(out, f)
