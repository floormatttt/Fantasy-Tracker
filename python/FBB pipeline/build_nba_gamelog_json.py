#!/usr/bin/env python3
"""
Convert NBA game log CSV files to JSON format for the Player View page.
Output: frontend/public/nba_gamelog/nba_gamelog_YYYY-YY.json
Format: { "PLAYER_ID": [{game}, ...], ... }

Run from any directory; paths are resolved relative to repo root.
"""

import csv
import json
from pathlib import Path


def safe_int(val):
    try:
        return int(float(val)) if val not in ("", None) else None
    except (ValueError, TypeError):
        return None


def safe_float(val):
    try:
        return round(float(val), 2) if val not in ("", None) else None
    except (ValueError, TypeError):
        return None


def build_season(csv_path):
    """Return {player_id: [game, ...]} for a single season CSV."""
    by_player = {}
    with open(csv_path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            pid = row.get("PLAYER_ID", "").strip()
            if not pid:
                continue
            game = {
                "date": row.get("GAME_DATE", ""),
                "matchup": row.get("MATCHUP", ""),
                "team": row.get("TEAM_ABBREVIATION", ""),
                "wl": row.get("WL", ""),
                "min": safe_float(row.get("MIN")),
                "fgm": safe_int(row.get("FGM")),
                "fga": safe_int(row.get("FGA")),
                "fg3m": safe_int(row.get("FG3M")),
                "fg3a": safe_int(row.get("FG3A")),
                "ftm": safe_int(row.get("FTM")),
                "fta": safe_int(row.get("FTA")),
                "reb": safe_int(row.get("REB")),
                "ast": safe_int(row.get("AST")),
                "stl": safe_int(row.get("STL")),
                "blk": safe_int(row.get("BLK")),
                "tov": safe_int(row.get("TOV")),
                "pts": safe_int(row.get("PTS")),
                "pm": safe_int(row.get("PLUS_MINUS")),
                "fpts": safe_float(row.get("FANTASY_PTS")),
            }
            by_player.setdefault(pid, []).append(game)
    return by_player


def main():
    root = Path(__file__).resolve().parents[2]
    src_dir = root / "Past FBB Gamelog"
    out_dir = root / "frontend" / "public" / "nba_gamelog"
    out_dir.mkdir(parents=True, exist_ok=True)

    seasons = []
    for csv_path in sorted(src_dir.glob("nba_gamelog_*.csv")):
        season = csv_path.stem.replace("nba_gamelog_", "")
        seasons.append(season)
        print(f"  {csv_path.name} ...", end=" ", flush=True)

        data = build_season(csv_path)
        out_path = out_dir / f"nba_gamelog_{season}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(data, f, separators=(",", ":"))

        kb = out_path.stat().st_size / 1024
        print(f"{len(data)} players, {kb:.0f} KB")

    manifest = {"seasons": sorted(seasons, reverse=True)}
    with open(out_dir / "manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"\nDone: {len(seasons)} seasons -> {out_dir}")


if __name__ == "__main__":
    main()
