import json, datetime, urllib.request, urllib.parse

# Fetch team data from Barttorvik
req = urllib.request.Request(
    'https://barttorvik.com/2026_team_results.json',
    headers={'User-Agent': 'Mozilla/5.0'}
)
with urllib.request.urlopen(req) as r:
    teams = json.loads(r.read().decode())
print(f"Total teams: {len(teams)}")

# Fetch player stats from NCAA stats site
players = []
try:
    url = 'https://stats.ncaa.org/rankings/change_sport_year_div?sport_code=MBB&academic_year=2026&division=1&ranking_period=113&team_individual=I&stat_seq=145'
    req2 = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json, text/javascript, */*',
        'X-Requested-With': 'XMLHttpRequest'
    })
    with urllib.request.urlopen(req2, timeout=30) as r:
        content = r.read().decode()
        print(f"NCAA response preview: {content[:300]}")
except Exception as e:
    print(f"NCAA failed: {e}")

out = {
    'teams': teams,
    'players': players,
    'updated': datetime.datetime.now(datetime.timezone.utc).isoformat()
}

with open('data.json', 'w') as f:
    json.dump(out, f)
print("Done!")
