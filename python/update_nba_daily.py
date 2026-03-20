#!/usr/bin/env python3
"""
Generate the latest NBA season CSV, rebuild the full historical file, and
refresh the frontend JSON assets. Intended to be run daily for the active season.
"""

import csv
from pathlib import Path

import build_nba_json
from nbatracker import (
    build_fantasy_dict,
    create_session,
    fetch_league_gamelog,
    get_league_leaders,
    process_games,
    save_combined_csv,
)


ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "Past FBB Data"
TARGET_SEASON = "2025-26"
FULL_HEADERS = [
    "Player",
    "Season",
    "GP",
    "PTS",
    "REB",
    "AST",
    "STL",
    "BLK",
    "FG3M",
    "TOV",
    "40-Point Games",
    "50-Point Games",
    "Double Doubles",
    "Triple Doubles",
    "Total Fantasy Points",
    "Fantasy Points Per Game",
]


def generate_season_csv(season: str) -> Path:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    session = create_session()

    print(f"Fetching league leaders for {season}...")
    leaders_data = get_league_leaders(session, "PTS", season)
    fantasy_dict = build_fantasy_dict(leaders_data)

    print(f"Fetching game logs for {season}...")
    gamelog_data = fetch_league_gamelog(session, season)
    big_games_dict = process_games(gamelog_data)

    return save_combined_csv(fantasy_dict, big_games_dict, season, output_dir=DATA_DIR)


def rebuild_full_csv() -> Path:
    full_csv_path = DATA_DIR / "nba_stats_full.csv"
    season_files = sorted(
        csv_file
        for csv_file in DATA_DIR.glob("nba_stats_*.csv")
        if csv_file.name != "nba_stats_full.csv"
    )

    with open(full_csv_path, "w", newline="", encoding="utf-8") as outfile:
        writer = csv.DictWriter(outfile, fieldnames=FULL_HEADERS)
        writer.writeheader()

        for season_file in season_files:
            season = season_file.stem.replace("nba_stats_", "")
            with open(season_file, "r", newline="", encoding="utf-8") as infile:
                reader = csv.DictReader(infile)
                for row in reader:
                    writer.writerow(
                        {
                            "Player": row["Player"],
                            "Season": season,
                            "GP": row["GP"],
                            "PTS": row["PTS"],
                            "REB": row["REB"],
                            "AST": row["AST"],
                            "STL": row["STL"],
                            "BLK": row["BLK"],
                            "FG3M": row["FG3M"],
                            "TOV": row["TOV"],
                            "40-Point Games": row["40-Point Games"],
                            "50-Point Games": row["50-Point Games"],
                            "Double Doubles": row["Double Doubles"],
                            "Triple Doubles": row["Triple Doubles"],
                            "Total Fantasy Points": row["Total Fantasy Points"],
                            "Fantasy Points Per Game": row["Fantasy Points Per Game"],
                        }
                    )

    print(f"Rebuilt {full_csv_path}")
    return full_csv_path


def main():
    generate_season_csv(TARGET_SEASON)
    rebuild_full_csv()
    build_nba_json.main()
    print(f"Daily NBA refresh complete for {TARGET_SEASON}.")


if __name__ == "__main__":
    main()
