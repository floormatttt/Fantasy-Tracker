import json, datetime, urllib.request

# Fetch team data from Barttorvik
req = urllib.request.Request(
    'https://barttorvik.com/2026_team_results.json',
    headers={'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache'}
)
with urllib.request.urlopen(req) as r:
    teams = json.loads(r.read().decode())

print(f"Total teams: {len(teams)}")

# Fetch player data from BallDontLie
API_KEY = '12b6df1f-9367-4d0e-ac75-c6c06678560c'
players = []
page = 1

while True:
    url = f'https://api.balldontlie.io/ncaab/v1/season_averages?season=2025&per_page=100&page={page}'
    req2 = urllib.request.Request(url, headers={'Authorization': API_KEY})
    with urllib.request.urlopen(req2) as r:
        data = json.loads(r.read().decode())
    
    batch = data.get('data', [])
    if not batch:
        break
    players.extend(batch)
    print(f"Got {len(players)} players so far...")
    
    meta = data.get('meta', {})
    if page >= meta.get('total_pages', 1):
        break
    page += 1

print(f"Total players: {len(players)}")

out = {
    'teams': teams,
    'players': players,
    'updated': datetime.datetime.now(datetime.timezone.utc).isoformat()
}

with open('data.json', 'w') as f:
    json.dump(out, f)

print("Done!")
