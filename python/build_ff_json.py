#!/usr/bin/env python3
"""
Convert football points-above-cutoff CSV data to JSON for the frontend.
"""

import csv
import json
from pathlib import Path


def main():
    root_dir = Path(__file__).resolve().parent.parent
    data_dir = root_dir / "Past FF Data"
    output_dir = root_dir / "frontend" / "public" / "ff_data"
    output_dir.mkdir(parents=True, exist_ok=True)

    datasets = [
        ("player_points_above_cutoff.csv", "player_points_above_cutoff.json"),
        ("weekly_lineup_distribution_summary.csv", "weekly_lineup_distribution_summary.json"),
    ]

    for csv_name, json_name in datasets:
        csv_path = data_dir / csv_name
        with csv_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
            rows = list(csv.DictReader(csv_file))

        output_path = output_dir / json_name
        with output_path.open("w", encoding="utf-8") as json_file:
            json.dump(rows, json_file, indent=2)

        print(f"Created {output_path} ({len(rows)} records)")


if __name__ == "__main__":
    main()
