import json, datetime

with open('teams_raw.json') as f:
    teams = json.load(f)

with open('players_raw.json') as f:
    content = f.read().strip()
    # Handle cases where Barttorvik wraps data differently
    if content.startswith('['):
        players = json.loads(content)
    else:
        try:
            players = json.loads(content)
            if isinstance(players, dict):
                players = players.get('data', players.get('players', []))
        except:
            players = []

out = {
    'teams': teams,
    'players': players,
    'updated': datetime.datetime.utcnow().isoformat()
}

with open('data.json', 'w') as f:
    json.dump(out, f)

print(f"Done! {len(teams)} teams, {len(players)} players")
