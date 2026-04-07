#!/usr/bin/env python3
"""
Convert football points-above-cutoff CSV data to JSON for the frontend.
"""

import csv
import json
from pathlib import Path


WEEK_COLUMNS = [str(week) for week in range(1, 19)]
RAW_POSITIONS = {"QB", "RB", "WR", "TE"}


def build_raw_weekly_rows(data_dir: Path) -> list[dict]:
    rows = []

    for csv_path in sorted(data_dir.glob("20*.csv")):
        stem = csv_path.stem
        season = stem[:4]
        position = stem[4:].upper()

        if position not in RAW_POSITIONS:
            continue

        with csv_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
            for row in csv.DictReader(csv_file):
                player = (row.get("Player") or "").strip()
                if not player:
                    continue

                raw_row = {
                    "season": season,
                    "#": (row.get("#") or "").strip(),
                    "Player": player,
                    "Pos": position,
                    "Team": (row.get("Team") or "").strip(),
                    "GP": (row.get("GP") or "").strip(),
                    "AVG": (row.get("AVG") or "").strip(),
                    "TTL": (row.get("TTL") or "").strip(),
                }

                for week in WEEK_COLUMNS:
                    raw_row[week] = (row.get(week) or "").strip()

                rows.append(raw_row)

    return rows


def write_csv(rows: list[dict], output_path: Path) -> None:
    if not rows:
        return

    with output_path.open("w", encoding="utf-8", newline="") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def main():
    root_dir = Path(__file__).resolve().parents[2]
    data_dir = root_dir / "Past FF Data"
    output_dir = root_dir / "frontend" / "public" / "ff_data"
    output_dir.mkdir(parents=True, exist_ok=True)

    datasets = [
        ("player_points_above_cutoff.csv", "player_points_above_cutoff.json"),
        ("player_weekly_war.csv", "player_weekly_war.json"),
        ("player_points_above_cutoff_consistency.csv", "player_points_above_cutoff_consistency.json"),
        ("player_weekly_war_consistency.csv", "player_weekly_war_consistency.json"),
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

    raw_weekly_rows = build_raw_weekly_rows(data_dir)
    raw_csv_output_path = data_dir / "player_weekly_raw.csv"
    write_csv(raw_weekly_rows, raw_csv_output_path)
    print(f"Created {raw_csv_output_path} ({len(raw_weekly_rows)} records)")

    raw_output_path = output_dir / "player_weekly_raw.json"
    with raw_output_path.open("w", encoding="utf-8") as json_file:
        json.dump(raw_weekly_rows, json_file, indent=2)

    print(f"Created {raw_output_path} ({len(raw_weekly_rows)} records)")


if __name__ == "__main__":
    main()
