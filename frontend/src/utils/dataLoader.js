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

export async function loadFootballAllTimeData() {
  try {
    const res = await fetch('./ff_data/player_points_above_cutoff.json');
    if (!res.ok) throw new Error('Could not load football points-above-cutoff data');
    const data = await res.json();
    return data.map(parseFootballPlayer).filter(p => p.player && p.gp > 0);
  } catch (err) {
    console.error('Error loading football all-time data:', err);
    throw err;
  }
}

export async function loadWeeklyLineupDistributionData() {
  try {
    const res = await fetch('./ff_data/weekly_lineup_distribution_summary.json');
    if (!res.ok) throw new Error('Could not load weekly lineup distribution summary data');
    const data = await res.json();
    return data.map(parseWeeklyLineupDistributionRow).filter(row => row.season && row.week > 0);
  } catch (err) {
    console.error('Error loading weekly lineup distribution data:', err);
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

export function parseFootballPlayer(row) {
  return {
    player: String(row.Player || ''),
    season: String(row.season || ''),
    position: String(row.Pos || ''),
    team: String(row.Team || ''),
    gp: parseInt(row.GP) || 0,
    avg: parseFloat(row.AVG) || 0,
    ttl: parseFloat(row.TTL) || 0,
  };
}

export function parseWeeklyLineupDistributionRow(row) {
  return {
    season: String(row.season || ''),
    week: parseInt(row.week) || 0,
    eligibleQb: parseInt(row.eligible_qb) || 0,
    eligibleRb: parseInt(row.eligible_rb) || 0,
    eligibleWr: parseInt(row.eligible_wr) || 0,
    eligibleTe: parseInt(row.eligible_te) || 0,
    samples: parseInt(row.samples) || 0,
    mean: parseFloat(row.mean) || 0,
    stdev: parseFloat(row.stdev) || 0,
    min: parseFloat(row.min) || 0,
    p05: parseFloat(row.p05) || 0,
    p10: parseFloat(row.p10) || 0,
    p25: parseFloat(row.p25) || 0,
    p50: parseFloat(row.p50) || 0,
    p75: parseFloat(row.p75) || 0,
    p90: parseFloat(row.p90) || 0,
    p95: parseFloat(row.p95) || 0,
    max: parseFloat(row.max) || 0,
    scoreGe100Rate: parseFloat(row.score_ge_100_rate) || 0,
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

export function sortFootballData(data, sortKey) {
  const sorted = [...data];

  if (sortKey === 'avg') sorted.sort((a, b) => b.avg - a.avg);
  else if (sortKey === 'ttl') sorted.sort((a, b) => b.ttl - a.ttl);
  else if (sortKey === 'gp') sorted.sort((a, b) => b.gp - a.gp);
  else if (sortKey === 'season') sorted.sort((a, b) => parseInt(b.season) - parseInt(a.season));

  return sorted;
}
