import json, datetime, urllib.request

# Fetch team data from Barttorvik
req = urllib.request.Request(
    'https://barttorvik.com/2026_team_results.json',
    headers={'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache'}
)
with urllib.request.urlopen(req) as r:
    teams = json.loads(r.read().decode())

print(f"Total teams: {len(teams)}")

# Fetch player data from cbbstat.com (free, no auth)
player_urls = [
    'https://cbbstat.com/api/players?season=2025-26&per_page=500',
    'https://api.cbbstat.com/players?year=2026',
]

players = []
for url in player_urls:
    try:
        req2 = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req2, timeout=20) as r:
            content = r.read().decode().strip()
            print(f"Response from {url}: {content[:300]}")
            data = json.loads(content)
            if isinstance(data, list):
                players = data
            elif isinstance(data, dict):
                players = data.get('data', data.get('players', data.get('results', [])))
            if players:
                print(f"Got {len(players)} players!")
                break
    except Exception as e:
        print(f"Failed {url}: {e}")

print(f"Total players: {len(players)}")

out = {
    'teams': teams,
    'players': players,
    'updated': datetime.datetime.now(datetime.timezone.utc).isoformat()
}

with open('data.json', 'w') as f:
    json.dump(out, f)

print("Done!")
