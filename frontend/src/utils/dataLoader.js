/**
 * Utility functions for loading and parsing NBA stats data
 */

export async function loadAllTimeData() {
  try {
    const res = await fetch('./nba_data/nba_stats_full.json');
    if (!res.ok) throw new Error('Could not load full stats');
    const data = await res.json();
    return data.map(row => parsePlayer(row)).filter(p => p.player && p.gp > 0);
  } catch (err) {
    console.error('Error loading all-time data:', err);
    throw err;
  }
}

export async function loadManifest() {
  try {
    const res = await fetch('./nba_data/manifest.json');
    if (res.ok) {
      const manifest = await res.json();
      return manifest.years || [];
    }
    return [];
  } catch (err) {
    console.error('Error loading manifest:', err);
    return [];
  }
}

export async function loadSeasonData(season) {
  try {
    const res = await fetch(`./nba_data/nba_stats_${season}.json`);
    if (res.ok) {
      const data = await res.json();
      return data.map(row => parsePlayer(row, season)).filter(p => p.player && p.gp > 0);
    }
    return [];
  } catch (err) {
    console.error(`Error loading season ${season}:`, err);
    return [];
  }
}

export function parsePlayer(row, season = null) {
  return {
    player: String(row.Player || ''),
    season: season || String(row.Season || ''),
    gp: parseInt(row.GP) || 0,
    pts: parseInt(row.PTS) || 0,
    reb: parseInt(row.REB) || 0,
    ast: parseInt(row.AST) || 0,
    stl: parseInt(row.STL) || 0,
    blk: parseInt(row.BLK) || 0,
    fg3m: parseInt(row.FG3M) || 0,
    tov: parseInt(row.TOV) || 0,
    tfp: parseFloat(row['Total Fantasy Points']) || 0,
    fpg: parseFloat(row['Fantasy Points Per Game']) || 0,
  };
}

export function formatNumber(n, decimals = 0) {
  return typeof n === 'number' ? n.toFixed(decimals) : '—';
}

export function sortData(data, sortKey) {
  const sorted = [...data];
  if (sortKey === 'fpg') sorted.sort((a, b) => b.fpg - a.fpg);
  else if (sortKey === 'tfp') sorted.sort((a, b) => b.tfp - a.tfp);
  else if (sortKey === 'pts') sorted.sort((a, b) => b.pts - a.pts);
  else if (sortKey === 'reb') sorted.sort((a, b) => b.reb - a.reb);
  else if (sortKey === 'ast') sorted.sort((a, b) => b.ast - a.ast);
  return sorted;
}
