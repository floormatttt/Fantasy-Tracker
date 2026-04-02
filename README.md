# Fantasy Tracker

A local sports analytics dashboard for NBA and NFL data.

The current app is a React frontend with two grouped sections:
- `NBA`
  - `All Time Leaders`
  - `By Season`
- `NFL`
  - `All Time Leaders`
  - `By Season`
  - `Weekly Lineups`

The project uses CSV files as source data, generates JSON files for the frontend, and serves the built app locally.

## What This Repo Contains

### Frontend
- `frontend/`
  - React + Vite app
  - reads generated JSON from `frontend/public/nba_data/` and `frontend/public/ff_data/`

### NBA data
- `Past FBB Data/`
  - season CSVs like `nba_stats_2025-26.csv`
  - combined file `nba_stats_full.csv`
- `python/FBB pipeline/`
  - `nbatracker.py`
    - fetches NBA stats and writes season CSVs
  - `update_nba_daily.py`
    - regenerates the active season, rebuilds the full CSV, refreshes NBA JSON
  - `build_nba_json.py`
    - converts NBA CSVs to frontend JSON
  - `run_update_nba_daily.cmd`
    - helper wrapper for scheduled runs

### NFL data
- `Past FF Data/`
  - yearly source CSVs like `2013QB.csv`, `2024WR.csv`
  - derived outputs like `player_points_above_cutoff.csv` and `player_weekly_war.csv`
  - weekly simulation output `weekly_lineup_distribution_summary.csv`
- `python/FF pipeline/`
  - `build_ff_points_above_cutoff.py`
    - builds football points-above-replacement CSV
    - also writes a separate weekly WAR CSV with season WAR
  - `estimate_weekly_ff_lineup_distribution.py`
    - simulates weekly lineup distributions
    - includes replacement-team score, percentile, and win rate
  - `build_ff_json.py`
    - converts football CSV outputs to frontend JSON
  - `build_weekly_ff_lineups.py`
    - optional utility for explicit weekly lineup generation

### Local server
- `python/serve_frontend_dist.py`
  - serves `frontend/dist` on `http://localhost:4174`
  - disables cache so updated JSON shows up immediately

## Quick Start

## 1. Install frontend dependencies

From the repo root:

```powershell
cd frontend
npm install
cd ..
```

## 2. Build the frontend

```powershell
cd frontend
npm run build
cd ..
```

## 3. Start the local server

```powershell
python python\serve_frontend_dist.py
```

Open:

`http://localhost:4174/`

## Data refresh commands

### NBA

Refresh the active NBA season, rebuild the full NBA CSV, and regenerate NBA JSON:

```powershell
python "python\FBB pipeline\update_nba_daily.py"
```

If you only need to rebuild NBA JSON from existing CSVs:

```powershell
python "python\FBB pipeline\build_nba_json.py"
```

### NFL

Rebuild football player outputs, including separate points-above-cutoff and weekly WAR files:

```powershell
python "python\FF pipeline\build_ff_points_above_cutoff.py"
```

Recompute weekly lineup distribution summaries:

```powershell
python "python\FF pipeline\estimate_weekly_ff_lineup_distribution.py"
```

Rebuild football JSON for the frontend:

```powershell
python "python\FF pipeline\build_ff_json.py"
```

### Typical NFL full refresh

```powershell
python "python\FF pipeline\build_ff_points_above_cutoff.py"
python "python\FF pipeline\estimate_weekly_ff_lineup_distribution.py"
python "python\FF pipeline\build_ff_json.py"
```

## Frontend behavior

The app currently includes:
- grouped top-level navigation for `NBA` and `NFL`
- dark mode toggle
- sortable tables
- search and filter controls
- football WAR data
- weekly lineup distribution charts with replacement-team overlays

## Data flow

### NBA flow

`stats.nba.com` -> `nbatracker.py` -> `Past FBB Data/*.csv` -> `build_nba_json.py` -> `frontend/public/nba_data/*.json` -> React app

### NFL flow

`Past FF Data/* position csvs` -> `build_ff_points_above_cutoff.py` -> `player_points_above_cutoff.csv` + `player_weekly_war.csv`

then:

`player_points_above_cutoff.csv` + yearly source CSVs -> `estimate_weekly_ff_lineup_distribution.py` -> `weekly_lineup_distribution_summary.csv`

then:

`build_ff_json.py` -> `frontend/public/ff_data/*.json` -> React app

## Important files

- `frontend/src/App.jsx`
  - top-level app shell and NBA/NFL grouping
- `frontend/src/components/`
  - page components and tables
- `frontend/src/utils/dataLoader.js`
  - frontend JSON loaders and parsers
- `frontend/src/App.css`
  - app styling
- `frontend/src/index.css`
  - theme variables

## Notes

- The current live frontend uses the React app, not the older standalone HTML pages.
- The browser reads generated JSON files, not the source CSVs directly.
- If you update CSV data, rebuild the matching JSON before expecting the site to reflect the change.
- `python/serve_frontend_dist.py` is the main local server for the current workflow.

## Local workflow summary

When data changes:

1. Run the relevant Python pipeline script(s)
2. Regenerate JSON
3. Rebuild the frontend
4. Run `python python\serve_frontend_dist.py`

## License

Internal sports analytics project.
