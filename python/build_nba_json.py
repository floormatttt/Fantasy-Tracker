#!/usr/bin/env python3
"""
Convert NBA stats CSV files to JSON format for the HTML dashboard.
Run this script to generate JSON files that the nba_stats.html page will load.
"""

import os
import csv
import json
from pathlib import Path

def csv_to_json(csv_file):
    """Convert a CSV file to a list of dictionaries."""
    data = []
    try:
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                data.append(row)
    except Exception as e:
        print(f"Error reading {csv_file}: {e}")
    return data

def main():
    data_dir = Path('./Past Fantasy Data')
    output_dir = Path('./nba_data')
    
    # Create output directory if it doesn't exist
    output_dir.mkdir(exist_ok=True)
    
    # Process full stats
    full_csv = data_dir / 'nba_stats_full.csv'
    if full_csv.exists():
        full_data = csv_to_json(full_csv)
        output_file = output_dir / 'nba_stats_full.json'
        with open(output_file, 'w') as f:
            json.dump(full_data, f)
        print(f"✓ Created {output_file} ({len(full_data)} records)")
    else:
        print(f"✗ File not found: {full_csv}")
    
    # Process season-by-season stats
    seasons = []
    for csv_file in sorted(data_dir.glob('nba_stats_*.csv')):
        if 'full' in csv_file.name:
            continue
        season = csv_file.stem.replace('nba_stats_', '')
        seasons.append(season)
        
        data = csv_to_json(csv_file)
        output_file = output_dir / f'nba_stats_{season}.json'
        with open(output_file, 'w') as f:
            json.dump(data, f)
        print(f"✓ Created {output_file} ({len(data)} records)")
    
    # Create a manifest file listing all available seasons
    manifest = {
        'years': sorted(seasons, reverse=True),
        'last_updated': str(Path(full_csv).stat().st_mtime) if full_csv.exists() else None
    }
    manifest_file = output_dir / 'manifest.json'
    with open(manifest_file, 'w') as f:
        json.dump(manifest, f, indent=2)
    print(f"\n✓ Created {manifest_file}")
    print(f"✓ Available seasons: {', '.join(manifest['years'])}")

if __name__ == '__main__':
    main()
