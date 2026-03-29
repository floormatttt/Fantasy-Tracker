#!/usr/bin/env python3
"""
Build a CSV in the same wide format as the source fantasy football files,
but with each weekly cell replaced by the number of points above that week's
positional cutoff, plus weekly and season-long WAR values.

Cutoffs:
- QB: 11th-highest scorer each week
- RB/WR/TE: the score of the player after the top 20 RBs, top 20 WRs,
  top 10 TEs, and top 20 remaining flex-eligible RB/WR/TE players
"""

from __future__ import annotations

import csv
import math
from pathlib import Path
from statistics import NormalDist
from typing import Dict, List


ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT_DIR / "Past FF Data"
OUTPUT_FILE = DATA_DIR / "player_points_above_cutoff.csv"
WEEKLY_DISTRIBUTION_FILE = DATA_DIR / "weekly_lineup_distribution_summary.csv"

QB_CUTOFF_RANK = 11
FLEX_STARTER_COUNTS = {
    "RB": 20,
    "WR": 20,
    "TE": 10,
}
FLEX_BENCH_OFFSET = 20

WEEK_COLUMNS = [str(week) for week in range(1, 19)]
WAR_WEEK_COLUMNS = [f"week {week} WAR" for week in WEEK_COLUMNS]
STANDARD_NORMAL = NormalDist()


def parse_points(raw_value: str | None) -> float | None:
    if raw_value is None:
        return None

    value = raw_value.strip()
    if value in {"", "-", "BYE"}:
        return None
    return float(value)


def format_points(value: float) -> str:
    formatted = f"{value:.1f}"
    if formatted.endswith(".0"):
        return formatted[:-2]
    return formatted


def format_war(value: float) -> str:
    return f"{value:.4f}"


def load_rows(file_path: Path) -> List[dict]:
    with file_path.open(newline="", encoding="utf-8-sig") as csv_file:
        rows = []
        for row in csv.DictReader(csv_file):
            player = (row.get("Player") or "").strip()
            if player:
                rows.append(row)
        return rows


def load_weekly_distribution_context() -> Dict[tuple[str, str], dict[str, float]]:
    context: Dict[tuple[str, str], dict[str, float]] = {}

    with WEEKLY_DISTRIBUTION_FILE.open(newline="", encoding="utf-8-sig") as csv_file:
        for row in csv.DictReader(csv_file):
            season = (row.get("season") or "").strip()
            week = (row.get("week") or "").strip()
            replacement_win_rate = parse_points(row.get("replacement_win_rate"))
            stdev = parse_points(row.get("stdev"))

            if not season or not week or replacement_win_rate is None or stdev is None or stdev <= 0:
                continue

            context[(season, week)] = {
                "replacement_win_rate": replacement_win_rate,
                "sigma_d": stdev * math.sqrt(2),
            }

    return context


def collect_weekly_scores(rows: List[dict]) -> Dict[str, List[float]]:
    weekly_scores: Dict[str, List[float]] = {week: [] for week in WEEK_COLUMNS}

    for row in rows:
        for week in WEEK_COLUMNS:
            points = parse_points(row.get(week))
            if points is not None:
                weekly_scores[week].append(points)

    for scores in weekly_scores.values():
        scores.sort(reverse=True)

    return weekly_scores


def cutoff_for_week(scores: List[float], rank: int) -> float | None:
    if not scores:
        return None
    if len(scores) < rank:
        return scores[-1]
    return scores[rank - 1]


def score_after_top(scores: List[float], count: int) -> float | None:
    if not scores:
        return None
    if len(scores) <= count:
        return scores[-1]
    return scores[count]


def season_from_name(file_path: Path) -> str:
    return file_path.stem[:4]


def position_from_name(file_path: Path) -> str:
    return file_path.stem[4:].upper()


def player_key(row: dict) -> tuple[str, str, str]:
    return (
        (row.get("Player") or "").strip(),
        (row.get("Team") or "").strip(),
        (row.get("Pos") or "").strip(),
    )


def build_weekly_cutoffs_for_season(
    season_rows_by_position: Dict[str, List[dict]],
) -> Dict[str, Dict[str, float | None]]:
    weekly_cutoffs = {
        "QB": {week: None for week in WEEK_COLUMNS},
        "RB": {week: None for week in WEEK_COLUMNS},
        "WR": {week: None for week in WEEK_COLUMNS},
        "TE": {week: None for week in WEEK_COLUMNS},
    }

    qb_scores_by_week = collect_weekly_scores(season_rows_by_position.get("QB", []))
    for week, scores in qb_scores_by_week.items():
        weekly_cutoffs["QB"][week] = cutoff_for_week(scores, QB_CUTOFF_RANK)

    for week in WEEK_COLUMNS:
        selected_keys = set()
        remaining_entries = []

        for position, starter_count in FLEX_STARTER_COUNTS.items():
            position_entries = []
            for row in season_rows_by_position.get(position, []):
                points = parse_points(row.get(week))
                if points is None:
                    continue
                position_entries.append((player_key(row), points))

            position_entries.sort(key=lambda entry: entry[1], reverse=True)
            selected_keys.update(key for key, _ in position_entries[:starter_count])
            remaining_entries.extend(
                (key, points) for key, points in position_entries[starter_count:]
            )

        remaining_scores = sorted(
            [points for key, points in remaining_entries if key not in selected_keys],
            reverse=True,
        )
        flex_cutoff = score_after_top(remaining_scores, FLEX_BENCH_OFFSET)

        weekly_cutoffs["RB"][week] = flex_cutoff
        weekly_cutoffs["WR"][week] = flex_cutoff
        weekly_cutoffs["TE"][week] = flex_cutoff

    return weekly_cutoffs


def build_player_row(
    season: str,
    position: str,
    source_row: dict,
    weekly_cutoffs: Dict[str, float | None],
    weekly_distribution_context: Dict[tuple[str, str], dict[str, float]],
) -> dict:
    numeric_diffs: List[float] = []
    numeric_wars: List[float] = []
    player_row = {
        "season": season,
        "#": "",
        "Player": (source_row.get("Player") or "").strip(),
        "Pos": position,
        "Team": (source_row.get("Team") or "").strip(),
        "GP": (source_row.get("GP") or "").strip(),
    }

    for week in WEEK_COLUMNS:
        raw_value = (source_row.get(week) or "").strip()
        points = parse_points(raw_value)
        cutoff_points = weekly_cutoffs[week]

        if points is None or cutoff_points is None:
            player_row[week] = raw_value
            player_row[f"week {week} WAR"] = ""
            continue

        diff = points - cutoff_points
        numeric_diffs.append(diff)
        player_row[week] = format_points(diff)

        context = weekly_distribution_context.get((season, week))
        if context is None:
            player_row[f"week {week} WAR"] = ""
            continue

        replacement_win_rate = min(
            max(context["replacement_win_rate"], 1e-9),
            1 - 1e-9,
        )
        sigma_d = context["sigma_d"]
        weekly_war = (
            STANDARD_NORMAL.cdf(
                STANDARD_NORMAL.inv_cdf(replacement_win_rate) + (diff / sigma_d)
            )
            - context["replacement_win_rate"]
        )
        numeric_wars.append(weekly_war)
        player_row[f"week {week} WAR"] = format_war(weekly_war)

    total = sum(numeric_diffs)
    average = total / len(numeric_diffs) if numeric_diffs else 0.0
    player_row["AVG"] = format_points(average)
    player_row["TTL"] = format_points(total)
    player_row["WAR"] = format_war(sum(numeric_wars))

    return player_row


def played_game_count(row: dict) -> int:
    return sum(1 for week in WEEK_COLUMNS if parse_points(row.get(week)) is not None)


def best_week_value(row: dict) -> float | None:
    values = []
    for week in WEEK_COLUMNS:
        value = parse_points(row.get(week))
        if value is not None:
            values.append(value)
    if not values:
        return None
    return max(values)


def should_keep_row(row: dict) -> bool:
    position = row["Pos"]
    games_played = played_game_count(row)
    best_week = best_week_value(row)

    if best_week is None:
        return False

    if position == "RB":
        if games_played <= 4 and best_week <= -5:
            return False
        return True

    if position == "TE":
        if games_played <= 5 and best_week <= -4:
            return False
        return True

    if position == "WR":
        if best_week <= -8:
            return False
        if games_played <= 5 and best_week <= -4:
            return False
        return True

    if position == "QB":
        if games_played <= 5 and best_week <= -6:
            return False
        return True

    return True


def build_output_rows() -> List[dict]:
    output_rows: List[dict] = []
    weekly_distribution_context = load_weekly_distribution_context()

    season_rows_by_position: Dict[str, Dict[str, List[dict]]] = {}

    for file_path in sorted(DATA_DIR.glob("*.csv")):
        position = position_from_name(file_path)
        if position not in {"QB", "RB", "WR", "TE"}:
            continue

        season = season_from_name(file_path)
        season_rows_by_position.setdefault(season, {})[position] = load_rows(file_path)

    for season in sorted(season_rows_by_position):
        rows_by_position = season_rows_by_position[season]
        weekly_cutoffs_by_position = build_weekly_cutoffs_for_season(rows_by_position)

        for position in ["QB", "RB", "WR", "TE"]:
            source_rows = rows_by_position.get(position, [])
            file_rows = [
                build_player_row(
                    season,
                    position,
                    source_row,
                    weekly_cutoffs_by_position[position],
                    weekly_distribution_context,
                )
                for source_row in source_rows
            ]
            file_rows = [row for row in file_rows if should_keep_row(row)]

            file_rows.sort(
                key=lambda row: (
                    row["season"],
                    row["Pos"],
                    -float(row["AVG"]),
                    row["Player"],
                )
            )

            for index, row in enumerate(file_rows, start=1):
                row["#"] = str(index)

            output_rows.extend(file_rows)

    return output_rows


def write_output(rows: List[dict]) -> None:
    fieldnames = [
        "season",
        "#",
        "Player",
        "Pos",
        "Team",
        "GP",
        *WEEK_COLUMNS,
        *WAR_WEEK_COLUMNS,
        "AVG",
        "TTL",
        "WAR",
    ]

    with OUTPUT_FILE.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    rows = build_output_rows()
    write_output(rows)
    print(f"Wrote {len(rows)} player rows to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
