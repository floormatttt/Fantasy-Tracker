# Sports Analytics Dashboard

A modern, responsive web dashboard for tracking college basketball rankings and NBA player fantasy statistics.

## Features

### 📊 CBB Rankings (`cbb-rankings.html`)
Comprehensive college basketball analytics including:
- **Power Rankings** - Team Barthag win probability + adjusted efficiency
- **Efficiency Metrics** - Offensive & defensive efficiency analysis
- **Schedule Strength** - Strength of schedule analysis
- **Game Predictor** - Simulate matchups between teams
- **Bubble Tracker** - NCAA tournament bubble status
- **Momentum Tracker** - Teams trending up or down
- **Head-to-Head** - Side-by-side team comparison
- **Upset Alerts** - High-probability upset opportunities
- **Conference Strength** - Conference rankings
- **Cinderella Watch** - Teams likely for tournament upsets
- **NBA Draft Board** - 2026 NBA draft projections

**Data Source:** [Barttorvik.com](https://barttorvik.com)

### 🏀 NBA Stats Tracker (`nba_stats.html`)
Historical NBA player fantasy statistics with two views:
- **All-Time Leaders** - Career fantasy point leaders across all seasons
  - Filter by minimum games played
  - Sort by: Fantasy Points/Game, Total Fantasy Points, Points, Rebounds, or Assists
  - Top 100 leaders highlighted
  
- **By Season** - Year-by-year leader boards
  - Toggle between 26 seasons (2000-01 to 2025-26)
  - Season-specific sorting and filtering
  - Track player performance across different eras

**Fantasy Score Formula:**
```
FP = PTS + (0.5 × REB) + (1.5 × AST) - (0.25 × TOV) + (2 × STL) + (2 × BLK) + (3 × FG3M)
```

## Quick Start

### 1. Generate NBA Data Files
First, convert the CSV files to JSON (required for the web interface):

```bash
python build_nba_json.py
```

This creates the `frontend/public/nba_data/` directory with all necessary JSON files.

### 2. Start the Local Server
Launch the development server:

```bash
python serve.py
```

Output:
```
🚀 Server running at http://localhost:8000
📊 Open http://localhost:8000/nba_stats.html in your browser
   Press Ctrl+C to stop the server
```

### 3. Open in Browser
Visit these URLs:
- **NBA Stats:** http://localhost:8000/nba_stats.html
- **CBB Rankings:** http://localhost:8000/cbb-rankings.html

## File Structure

```
rimjob-sports/
├── nba_stats.html              # NBA stats dashboard
├── cbb-rankings.html           # College basketball dashboard
├── frontend/public/nba_data/   # Generated JSON data files
│   ├── nba_stats_full.json     # All-time stats
│   ├── nba_stats_YYYY-YY.json  # Season-specific stats
│   └── manifest.json           # Available seasons
├── Past Fantasy Data/          # Source CSV files
│   ├── nba_stats_full.csv     # Full historical data
│   ├── nba_stats_YYYY-YY.csv  # Season-specific CSV files
├── build_nba_json.py           # CSV → JSON converter
├── serve.py                    # Local development server
├── merge.py                    # Data processing utility
└── nbatracker.py              # Player tracking utility
```

## Data Management

### Updating NBA Stats
If you update the CSV files in `Past Fantasy Data/`:

```bash
python build_nba_json.py
```

This will regenerate all JSON files from the current CSV data.

### Daily 2025-26 Refresh
To regenerate the current `2025-26` season file, replace that season in
`nba_stats_full.csv`, and refresh the frontend JSON in one step:

```bash
python python/update_nba_daily.py
```

This command writes the latest season CSV to `Past FBB Data/nba_stats_2025-26.csv`,
rebuilds `Past FBB Data/nba_stats_full.csv` with a correct `Season` column for every
row, and then regenerates `frontend/public/nba_data/*.json`.

### Adding New Seasons
1. Add `nba_stats_YYYY-YY.csv` to the `Past Fantasy Data/` folder
2. Run `python build_nba_json.py`
3. The new season will automatically appear in the dashboard

## Design System

Both dashboards use a consistent design language:

### Color Palette
- **Accent (Red):** #c0392b - Primary CTAs and highlights
- **Green:** #27ae60 - Positive/good performance
- **Blue:** #2471a3 - Alternative highlights
- **Amber:** #d68910 - Warnings/neutral
- **Purple:** #7d3c98 - Secondary info

### Typography
- **Serif:** Source Serif 4 - Headlines and emphasis
- **Sans-serif:** Libre Franklin - Body text and labels

### Components
- Sortable tables with hover states
- Responsive grid layouts
- Smooth transitions and animations
- Accessible color coding for stats

## Browser Support

- ✅ Chrome/Edge (90+)
- ✅ Firefox (88+)
- ✅ Safari (14+)
- ✅ Mobile browsers

## Notes

- Data is loaded from local JSON files (generated from CSVs)
- All processing is done client-side in the browser
- No external API calls required after JSON generation
- Fully responsive design for all screen sizes

## License

Created for sports analytics tracking.
