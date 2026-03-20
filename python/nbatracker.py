import argparse
import requests
import csv
import time
from pathlib import Path
from collections import defaultdict
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

def create_session():
    session = requests.Session()
    retries = Retry(
        total=5,
        backoff_factor=2,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"]
    )
    adapter = HTTPAdapter(max_retries=retries)
    session.mount("https://", adapter)
    return session


HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Referer": "https://www.nba.com/",
    "Origin": "https://www.nba.com",
    "Accept": "application/json, text/plain, */*"
}

def get_league_leaders(session, statcategory, season):
    url = "https://stats.nba.com/stats/leagueLeaders"
    params = {
        "LeagueID": "00",
        "PerMode": "Totals",
        "Season": season,
        "SeasonType": "Regular Season",
        "StatCategory": statcategory
    }
    response = session.get(url, headers=HEADERS, params=params, timeout=30)
    response.raise_for_status()
    return response.json()


def calculate_fantasy_points(row, headers_list, big_games=None):
    pts  = row[headers_list.index("PTS")]
    reb  = row[headers_list.index("REB")]
    ast  = row[headers_list.index("AST")]
    stl  = row[headers_list.index("STL")]
    blk  = row[headers_list.index("BLK")]
    tov  = row[headers_list.index("TOV")]
    gp   = row[headers_list.index("GP")]
    fg3m = row[headers_list.index("FG3M")]

    total_fp = (
        pts  * 0.5
        + reb  * 1.0
        + ast  * 1.0
        + stl  * 2.0
        + blk  * 2.0
        + fg3m * 0.5
        - tov  * 1.0
    )

    if big_games:
        total_fp += (
            big_games.get("40+", 0) * 1
            + big_games.get("50+", 0) * 1
            + big_games.get("DD",  0) * 1
            + big_games.get("TD",  0) * 2
        )

    fppg = total_fp / gp if gp != 0 else 0
    return total_fp, fppg


def build_fantasy_dict(data):
    headers_list = data["resultSet"]["headers"]
    players = data["resultSet"]["rowSet"]

    result = {}
    for row in players:
        name = row[headers_list.index("PLAYER")]
        result[name] = {
            "GP":       row[headers_list.index("GP")],
            "PTS":      row[headers_list.index("PTS")],
            "REB":      row[headers_list.index("REB")],
            "AST":      row[headers_list.index("AST")],
            "STL":      row[headers_list.index("STL")],
            "BLK":      row[headers_list.index("BLK")],
            "FG3M":     row[headers_list.index("FG3M")],
            "TOV":      row[headers_list.index("TOV")],
            "_row":     row,
            "_headers": headers_list,
        }
    return result

def fetch_league_gamelog(session, season):
    url = "https://stats.nba.com/stats/leaguegamelog"
    params = {
        "Season": season,
        "SeasonType": "Regular Season",
        "PlayerOrTeam": "P",
        "LeagueID": "00",
        "Direction": "DESC",
        "Sorter": "DATE"
    }
    print("Fetching league game logs...")
    response = session.get(url, headers=HEADERS, params=params, timeout=30)
    response.raise_for_status()
    return response.json()


def process_games(data):
    hdrs = data["resultSets"][0]["headers"]
    rows = data["resultSets"][0]["rowSet"]

    name_i = hdrs.index("PLAYER_NAME")
    pts_i  = hdrs.index("PTS")
    reb_i  = hdrs.index("REB")
    ast_i  = hdrs.index("AST")
    stl_i  = hdrs.index("STL")
    blk_i  = hdrs.index("BLK")

    players = defaultdict(lambda: {"40+": 0, "50+": 0, "DD": 0, "TD": 0})

    for row in rows:
        name = row[name_i]
        pts, reb, ast, stl, blk = (
            row[pts_i], row[reb_i], row[ast_i], row[stl_i], row[blk_i]
        )

        if pts >= 40:
            players[name]["40+"] += 1
        if pts >= 50:
            players[name]["50+"] += 1

        categories = sum([pts >= 10, reb >= 10, ast >= 10, stl >= 10, blk >= 10])
        if categories >= 2:
            players[name]["DD"] += 1
        if categories >= 3:
            players[name]["TD"] += 1

    return players

def save_combined_csv(fantasy_dict, big_games_dict, season, output_dir="."):
    all_players = set(fantasy_dict.keys()) | set(big_games_dict.keys())

    rows = []
    for name in all_players:
        f = fantasy_dict.get(name, {})
        b = big_games_dict.get(name, {"40+": 0, "50+": 0, "DD": 0, "TD": 0})

        if f and "_row" in f:
            total_fp, fppg = calculate_fantasy_points(f["_row"], f["_headers"], big_games=b)
            total_fp = round(total_fp, 2)
            fppg     = round(fppg, 2)
        else:
            total_fp = fppg = ""

        rows.append([
            name,
            f.get("GP",   ""),
            f.get("PTS",  ""),
            f.get("REB",  ""),
            f.get("AST",  ""),
            f.get("STL",  ""),
            f.get("BLK",  ""),
            f.get("FG3M", ""),
            f.get("TOV",  ""),
            b["40+"],
            b["50+"],
            b["DD"],
            b["TD"],
            total_fp,
            fppg,
        ])

    # Sort by Fantasy Points Per Game descending
    rows.sort(key=lambda x: x[14] if x[14] != "" else 0, reverse=True)

    output_path = Path(output_dir) / f"nba_stats_{season}.csv"
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "Player", "GP", "PTS", "REB", "AST", "STL", "BLK", "FG3M", "TOV",
            "40-Point Games", "50-Point Games", "Double Doubles", "Triple Doubles",
            "Total Fantasy Points", "Fantasy Points Per Game"
        ])
        writer.writerows(rows)

    print(f"Combined stats saved to {output_path}")
    return output_path

def parse_args():
    parser = argparse.ArgumentParser(description="Fetch NBA fantasy stats for a season.")
    parser.add_argument(
        "--end-year",
        type=int,
        help="Season end year, for example 2026 for the 2025-26 season.",
    )
    parser.add_argument(
        "--season",
        help="Explicit season string such as 2025-26. Overrides --end-year if provided.",
    )
    parser.add_argument(
        "--output-dir",
        default=".",
        help="Directory where the generated CSV should be written.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    if args.season:
        season = args.season
    elif args.end_year:
        season = f"{args.end_year - 1}-{str(args.end_year)[-2:]}"
    else:
        year = int(input("Enter season end year (e.g. 2025 for 2024-25): "))
        season = f"{year - 1}-{str(year)[-2:]}"

    session = create_session()
    start_time = time.time()

    print("\n--- Fetching Fantasy Leaders ---")
    leaders_data = get_league_leaders(session, "PTS", season)
    fantasy_dict = build_fantasy_dict(leaders_data)

    print("\n--- Fetching Big Games ---")
    gamelog_data = fetch_league_gamelog(session, season)
    big_games_dict = process_games(gamelog_data)

    save_combined_csv(fantasy_dict, big_games_dict, season, output_dir=args.output_dir)

    print(f"\nAll done in {round(time.time() - start_time, 2)} seconds.")


if __name__ == "__main__":
    main()

