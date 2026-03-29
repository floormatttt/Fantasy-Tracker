#!/usr/bin/env python3
"""
Estimate weekly lineup score distributions using Monte Carlo sampling.

Eligibility is based on player_points_above_cutoff.csv, while lineup scores are
calculated from the original weekly fantasy-point CSVs in Past FF Data.
"""

from __future__ import annotations

import argparse
import csv
import random
import statistics
from math import comb
from pathlib import Path

from build_ff_points_above_cutoff import (
    build_weekly_cutoffs_for_season,
    load_rows as load_source_rows,
    position_from_name,
    season_from_name,
)
from build_weekly_ff_lineups import INPUT_FILE, POSITION_RULES, SKILL_PATTERNS, parse_float


ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT_DIR / "Past FF Data"
OUTPUT_FILE = ROOT_DIR / "Past FF Data" / "weekly_lineup_distribution_summary.csv"
WEEK_COLUMNS = [str(week) for week in range(1, 19)]


def load_rows() -> list[dict]:
    with INPUT_FILE.open(newline="", encoding="utf-8-sig") as csv_file:
        return list(csv.DictReader(csv_file))


def load_actual_points() -> dict[tuple[str, str, str, str], dict[str, float]]:
    actual_points: dict[tuple[str, str, str, str], dict[str, float]] = {}

    for file_path in sorted(DATA_DIR.glob("20*.csv")):
        stem = file_path.stem
        season = stem[:4]
        position = stem[4:].upper()
        if position not in {"QB", "RB", "WR", "TE"}:
            continue

        with file_path.open(newline="", encoding="utf-8-sig") as csv_file:
            for row in csv.DictReader(csv_file):
                player = (row.get("Player") or "").strip()
                team = (row.get("Team") or "").strip()
                if not player:
                    continue

                key = (season, player, team, position)
                weekly_points = {}
                for week in WEEK_COLUMNS:
                    value = parse_float(row.get(week))
                    if value is not None:
                        weekly_points[week] = value
                actual_points[key] = weekly_points

    return actual_points


def load_weekly_cutoffs() -> dict[str, dict[str, dict[str, float | None]]]:
    season_rows_by_position: dict[str, dict[str, list[dict]]] = {}

    for file_path in sorted(DATA_DIR.glob("20*.csv")):
        position = position_from_name(file_path)
        if position not in {"QB", "RB", "WR", "TE"}:
            continue

        season = season_from_name(file_path)
        season_rows_by_position.setdefault(season, {})[position] = load_source_rows(file_path)

    return {
        season: build_weekly_cutoffs_for_season(rows_by_position)
        for season, rows_by_position in season_rows_by_position.items()
    }


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
    meets_week_rule = week_value is not None and week_value >= rules["week_threshold"]
    return meets_average_rule or meets_week_rule


def eligible_players_by_position(rows: list[dict], season: str, week: str) -> dict[str, list[dict]]:
    grouped = {"QB": [], "RB": [], "WR": [], "TE": []}
    for row in rows:
        if row["season"] != season:
            continue
        if is_eligible(row, week):
            grouped[row["Pos"]].append(row)
    return grouped


def pattern_weights(grouped: dict[str, list[dict]]) -> tuple[list[tuple[int, int, int]], list[int]]:
    patterns = []
    weights = []
    rb_count = len(grouped["RB"])
    wr_count = len(grouped["WR"])
    te_count = len(grouped["TE"])

    for rb_needed, wr_needed, te_needed in SKILL_PATTERNS:
        if rb_count < rb_needed or wr_count < wr_needed or te_count < te_needed:
            continue
        patterns.append((rb_needed, wr_needed, te_needed))
        weights.append(
            comb(rb_count, rb_needed)
            * comb(wr_count, wr_needed)
            * comb(te_count, te_needed)
        )

    return patterns, weights


def sample_lineup_score(
    rng: random.Random,
    grouped: dict[str, list[dict]],
    week: str,
    patterns: list[tuple[int, int, int]],
    weights: list[int],
    actual_points: dict[tuple[str, str, str, str], dict[str, float]],
) -> float:
    qb = rng.choice(grouped["QB"])

    total_weight = sum(weights)
    draw = rng.randrange(total_weight)
    cumulative = 0
    selected_pattern = patterns[0]
    for pattern, weight in zip(patterns, weights):
        cumulative += weight
        if draw < cumulative:
            selected_pattern = pattern
            break

    rb_needed, wr_needed, te_needed = selected_pattern
    rb_group = rng.sample(grouped["RB"], rb_needed)
    wr_group = rng.sample(grouped["WR"], wr_needed)
    te_group = rng.sample(grouped["TE"], te_needed)

    players = [qb, *rb_group, *wr_group, *te_group]
    total = 0.0
    for player in players:
        key = (
            player["season"],
            player["Player"],
            player["Team"],
            player["Pos"],
        )
        total += actual_points.get(key, {}).get(week, 0.0)
    return total


def percentile(sorted_values: list[float], q: float) -> float:
    if not sorted_values:
        return 0.0
    if len(sorted_values) == 1:
        return sorted_values[0]

    index = (len(sorted_values) - 1) * q
    lower = int(index)
    upper = min(lower + 1, len(sorted_values) - 1)
    fraction = index - lower
    return sorted_values[lower] + (sorted_values[upper] - sorted_values[lower]) * fraction


def summarize_scores(scores: list[float]) -> dict[str, str]:
    sorted_scores = sorted(scores)
    mean = statistics.fmean(scores)
    stdev = statistics.pstdev(scores) if len(scores) > 1 else 0.0

    return {
        "samples": str(len(scores)),
        "mean": f"{mean:.3f}",
        "stdev": f"{stdev:.3f}",
        "min": f"{sorted_scores[0]:.3f}",
        "p05": f"{percentile(sorted_scores, 0.05):.3f}",
        "p10": f"{percentile(sorted_scores, 0.10):.3f}",
        "p25": f"{percentile(sorted_scores, 0.25):.3f}",
        "p50": f"{percentile(sorted_scores, 0.50):.3f}",
        "p75": f"{percentile(sorted_scores, 0.75):.3f}",
        "p90": f"{percentile(sorted_scores, 0.90):.3f}",
        "p95": f"{percentile(sorted_scores, 0.95):.3f}",
        "max": f"{sorted_scores[-1]:.3f}",
        "score_ge_100_rate": f"{sum(score >= 100 for score in scores) / len(scores):.4f}",
    }


def percentile_rank(scores: list[float], target: float) -> float:
    below = sum(score < target for score in scores)
    equal = sum(score == target for score in scores)
    return (below + (0.5 * equal)) / len(scores)


def estimate_week(
    rows: list[dict],
    actual_points: dict[tuple[str, str, str, str], dict[str, float]],
    weekly_cutoffs: dict[str, dict[str, dict[str, float | None]]],
    season: str,
    week: str,
    samples: int,
    seed: int,
) -> dict[str, str] | None:
    grouped = eligible_players_by_position(rows, season, week)
    if len(grouped["QB"]) < 1 or len(grouped["RB"]) < 2 or len(grouped["WR"]) < 2 or len(grouped["TE"]) < 1:
        return None

    patterns, weights = pattern_weights(grouped)
    if not patterns:
        return None

    rng = random.Random((seed * 10_000) + (int(season) * 100) + int(week))
    scores = [
        sample_lineup_score(rng, grouped, week, patterns, weights, actual_points)
        for _ in range(samples)
    ]
    season_cutoffs = weekly_cutoffs.get(season, {})
    qb_cutoff = season_cutoffs.get("QB", {}).get(week)
    flex_cutoff = season_cutoffs.get("RB", {}).get(week)
    replacement_score = None
    replacement_percentile = None
    replacement_win_rate = None
    if qb_cutoff is not None and flex_cutoff is not None:
        # A full replacement lineup is 1 QB plus 7 skill-position starters
        # valued at that week's replacement-level skill cutoff.
        replacement_score = qb_cutoff + (7 * flex_cutoff)
        replacement_percentile = percentile_rank(scores, replacement_score)
        replacement_win_rate = replacement_percentile

    summary = summarize_scores(scores)
    summary.update(
        {
            "season": season,
            "week": week,
            "eligible_qb": str(len(grouped["QB"])),
            "eligible_rb": str(len(grouped["RB"])),
            "eligible_wr": str(len(grouped["WR"])),
            "eligible_te": str(len(grouped["TE"])),
            "replacement_score": "" if replacement_score is None else f"{replacement_score:.3f}",
            "replacement_percentile": "" if replacement_percentile is None else f"{replacement_percentile:.4f}",
            "replacement_win_rate": "" if replacement_win_rate is None else f"{replacement_win_rate:.4f}",
        }
    )
    return summary


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--season", help="Only estimate one season")
    parser.add_argument("--week", help="Only estimate one week (1-18)")
    parser.add_argument("--samples", type=int, default=20000, help="Monte Carlo samples per week")
    parser.add_argument("--seed", type=int, default=7, help="Random seed")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    rows = load_rows()
    actual_points = load_actual_points()
    weekly_cutoffs = load_weekly_cutoffs()
    seasons = [args.season] if args.season else sorted({row["season"] for row in rows})
    weeks = [str(int(args.week))] if args.week else WEEK_COLUMNS

    output_rows = []
    for season in seasons:
        for week in weeks:
            summary = estimate_week(
                rows,
                actual_points,
                weekly_cutoffs,
                season,
                week,
                args.samples,
                args.seed,
            )
            if summary is None:
                print(f"Skipping {season} week {week}: not enough eligible players")
                continue
            output_rows.append(summary)
            print(
                f"{season} week {week}: mean={summary['mean']} p50={summary['p50']} "
                f"p90={summary['p90']} samples={summary['samples']}"
            )

    fieldnames = [
        "season",
        "week",
        "eligible_qb",
        "eligible_rb",
        "eligible_wr",
        "eligible_te",
        "samples",
        "mean",
        "stdev",
        "min",
        "p05",
        "p10",
        "p25",
        "p50",
        "p75",
        "p90",
        "p95",
        "max",
        "score_ge_100_rate",
        "replacement_score",
        "replacement_percentile",
        "replacement_win_rate",
    ]

    with OUTPUT_FILE.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(output_rows)

    print(f"Wrote {len(output_rows)} summaries to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
