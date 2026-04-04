#!/usr/bin/env python3
"""
Convert NBA stats CSV files to JSON format for the HTML dashboard.
Run this script to generate JSON files that the nba_stats.html page will load.
"""

import csv
import json
from pathlib import Path


def csv_to_json(csv_file):
    """Convert a CSV file to a list of dictionaries."""
    data = []
    try:
        with open(csv_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                data.append(row)
    except Exception as e:
        print(f"Error reading {csv_file}: {e}")
    return data


def write_json(data, output_path):
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    return output_path


def main():
    root_dir = Path(__file__).resolve().parents[2]
    candidate_data_dirs = [
        root_dir / "Past FBB Data",
        root_dir / "Past Fantasy Data",
    ]
    data_dir = next((path for path in candidate_data_dirs if path.exists()), candidate_data_dirs[0])
    output_dir = root_dir / "frontend" / "public" / "nba_data"
    output_dir.mkdir(parents=True, exist_ok=True)

    full_csv = data_dir / "nba_stats_full.csv"
    if full_csv.exists():
        full_data = csv_to_json(full_csv)
        output_file = write_json(full_data, output_dir / "nba_stats_full.json")
        print(f"Created {output_file} ({len(full_data)} records)")
    else:
        print(f"File not found: {full_csv}")

    seasons = []
    for csv_file in sorted(data_dir.glob("nba_stats_*.csv")):
        if "full" in csv_file.name:
            continue
        season = csv_file.stem.replace("nba_stats_", "")
        seasons.append(season)

        data = csv_to_json(csv_file)
        output_file = write_json(data, output_dir / f"nba_stats_{season}.json")
        print(f"Created {output_file} ({len(data)} records)")

    manifest = {
        "years": sorted(seasons, reverse=True),
        "last_updated": str(full_csv.stat().st_mtime) if full_csv.exists() else None,
    }
    manifest_file = write_json(manifest, output_dir / "manifest.json")
    print(f"\nCreated {manifest_file}")
    print(f"Available seasons: {', '.join(manifest['years'])}")


if __name__ == "__main__":
    main()
