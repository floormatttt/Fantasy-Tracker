#!/usr/bin/env python3
"""
Create unique weekly fantasy football lineups from player_points_above_cutoff.csv.

A lineup contains:
- 1 QB
- 2 RB
- 2 WR
- 1 TE
- 2 FLEX (RB/WR/TE)

Lineups are treated as unique regardless of swapping players between same-position
slots and FLEX slots. For example, a lineup with the same QB and the same set of
RB/WR/TE players is written only once.

To avoid accidentally generating an unmanageable number of rows, the script
estimates the lineup count for each week and skips weeks above --max-lineups
unless --force is provided.
"""

from __future__ import annotations

import argparse
import csv
from itertools import combinations
from math import comb
from pathlib import Path
from typing import Iterable


ROOT_DIR = Path(__file__).resolve().parents[2]
INPUT_FILE = ROOT_DIR / "Past FF Data" / "player_points_above_cutoff.csv"
OUTPUT_DIR = ROOT_DIR / "Past FF Data" / "weekly_lineups"

WEEK_COLUMNS = [str(week) for week in range(1, 19)]
SKILL_PATTERNS = [
    (2, 2, 3),
    (2, 3, 2),
    (2, 4, 1),
    (3, 2, 2),
    (3, 3, 1),
    (4, 2, 1),
]

POSITION_RULES = {
    "QB": {"min_games": 7, "avg_threshold": -4.0, "week_threshold": -3.0},
    "RB": {"min_games": 5, "avg_threshold": -2.5, "week_threshold": -2.5},
    "WR": {"min_games": 4, "avg_threshold": -4.0, "week_threshold": -3.0},
    "TE": {"min_games": 4, "avg_threshold": -2.9, "week_threshold": -2.0},
}


def parse_float(value: str | None) -> float | None:
    if value is None:
        return None

    stripped = value.strip()
    if stripped in {"", "-", "BYE"}:
        return None
    return float(stripped)


def load_rows() -> list[dict]:
    with INPUT_FILE.open(newline="", encoding="utf-8-sig") as csv_file:
        return list(csv.DictReader(csv_file))


def player_label(row: dict) -> str:
    return f"{row['Player']} ({row['Team']})"


def sort_players(players: Iterable[dict]) -> list[dict]:
    return sorted(players, key=lambda row: (row["Player"], row["Team"]))


def is_eligible(row: dict, week: str) -> bool:
    position = row["Pos"]
    rules = POSITION_RULES[position]
    games_played = int(row["GP"]) if row["GP"] else 0
    average = parse_float(row["AVG"])
    week_value = parse_float(row[week])

    if week_value is None:
        return False

    meets_average_rule = (
        average is not None
        and games_played >= rules["min_games"]
        and average >= rules["avg_threshold"]
    )
    meets_week_rule = (
        week_value is not None and week_value >= rules["week_threshold"]
    )

    return meets_average_rule or meets_week_rule


def estimate_lineups(qb_count: int, rb_count: int, wr_count: int, te_count: int) -> int:
    total = 0
    for rb_needed, wr_needed, te_needed in SKILL_PATTERNS:
        if rb_count < rb_needed or wr_count < wr_needed or te_count < te_needed:
            continue
        total += (
            comb(rb_count, rb_needed)
            * comb(wr_count, wr_needed)
            * comb(te_count, te_needed)
        )
    return qb_count * total


def build_lineup_row(
    season: str,
    week: str,
    qb: dict,
    rb_group: tuple[dict, ...],
    wr_group: tuple[dict, ...],
    te_group: tuple[dict, ...],
) -> dict:
    sorted_rbs = sort_players(rb_group)
    sorted_wrs = sort_players(wr_group)
    sorted_tes = sort_players(te_group)

    base_rbs = sorted_rbs[:2]
    base_wrs = sorted_wrs[:2]
    base_te = sorted_tes[:1]
    flex_pool = sort_players(sorted_rbs[2:] + sorted_wrs[2:] + sorted_tes[1:])

    skill_players = sort_players(list(rb_group) + list(wr_group) + list(te_group))
    lineup_key = " | ".join([player_label(qb)] + [player_label(row) for row in skill_players])

    return {
        "season": season,
        "week": week,
        "qb": player_label(qb),
        "rb1": player_label(base_rbs[0]),
        "rb2": player_label(base_rbs[1]),
        "wr1": player_label(base_wrs[0]),
        "wr2": player_label(base_wrs[1]),
        "te1": player_label(base_te[0]),
        "flex1": player_label(flex_pool[0]),
        "flex2": player_label(flex_pool[1]),
        "rb_count": str(len(rb_group)),
        "wr_count": str(len(wr_group)),
        "te_count": str(len(te_group)),
        "lineup_key": lineup_key,
    }


def write_weekly_lineups(
    rows: list[dict],
    season: str,
    week: str,
    max_lineups: int,
    force: bool,
) -> None:
    eligible_by_position = {"QB": [], "RB": [], "WR": [], "TE": []}
    for row in rows:
        if row["season"] != season:
            continue
        if is_eligible(row, week):
            eligible_by_position[row["Pos"]].append(row)

    qb_players = sort_players(eligible_by_position["QB"])
    rb_players = sort_players(eligible_by_position["RB"])
    wr_players = sort_players(eligible_by_position["WR"])
    te_players = sort_players(eligible_by_position["TE"])

    estimate = estimate_lineups(
        len(qb_players), len(rb_players), len(wr_players), len(te_players)
    )
    output_path = OUTPUT_DIR / f"{season}_week_{int(week):02d}_lineups.csv"

    print(
        f"{season} week {week}: QB={len(qb_players)} RB={len(rb_players)} "
        f"WR={len(wr_players)} TE={len(te_players)} estimated_lineups={estimate}"
    )

    if not qb_players or len(rb_players) < 2 or len(wr_players) < 2 or len(te_players) < 1:
        print(f"Skipping {season} week {week}: not enough eligible players")
        return

    if estimate > max_lineups and not force:
        print(
            f"Skipping {season} week {week}: estimate {estimate} exceeds "
            f"--max-lineups {max_lineups}. Re-run with --force to generate it."
        )
        return

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "season",
        "week",
        "qb",
        "rb1",
        "rb2",
        "wr1",
        "wr2",
        "te1",
        "flex1",
        "flex2",
        "rb_count",
        "wr_count",
        "te_count",
        "lineup_key",
    ]

    lineup_count = 0
    with output_path.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()

        for qb in qb_players:
            for rb_needed, wr_needed, te_needed in SKILL_PATTERNS:
                if len(rb_players) < rb_needed or len(wr_players) < wr_needed or len(te_players) < te_needed:
                    continue

                for rb_group in combinations(rb_players, rb_needed):
                    for wr_group in combinations(wr_players, wr_needed):
                        for te_group in combinations(te_players, te_needed):
                            writer.writerow(
                                build_lineup_row(season, week, qb, rb_group, wr_group, te_group)
                            )
                            lineup_count += 1

    print(f"Wrote {lineup_count} lineups to {output_path}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--season", help="Only generate lineups for one season")
    parser.add_argument("--week", help="Only generate lineups for one week (1-18)")
    parser.add_argument(
        "--max-lineups",
        type=int,
        default=2_000_000,
        help="Skip weeks estimated above this count unless --force is used",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Generate even if the estimated lineup count is above --max-lineups",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    rows = load_rows()

    seasons = sorted({row["season"] for row in rows})
    target_seasons = [args.season] if args.season else seasons
    target_weeks = [str(int(args.week))] if args.week else WEEK_COLUMNS

    for season in target_seasons:
        for week in target_weeks:
            write_weekly_lineups(rows, season, week, args.max_lineups, args.force)


if __name__ == "__main__":
    main()
