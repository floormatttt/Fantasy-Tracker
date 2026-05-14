import { useState, useCallback } from 'react';
import { formatNumber } from '../utils/dataLoader';

// Module-level promise cache: one fetch per season regardless of how many
// players expand that season simultaneously.
const seasonFetches = {};

function loadSeasonGameLog(season) {
  if (!seasonFetches[season]) {
    seasonFetches[season] = fetch(`./nba_gamelog/nba_gamelog_${season}.json`)
      .then(res => (res.ok ? res.json() : null))
      .catch(() => null);
  }
  return seasonFetches[season];
}

const COLS = [
  { key: 'date', label: 'Date', left: true },
  { key: 'matchup', label: 'Matchup', left: true },
  { key: 'wl', label: 'W/L', left: true, render: v => (
    v ? <span className={v === 'W' ? 'pv-wl-w' : 'pv-wl-l'}>{v}</span> : '—'
  )},
  { key: 'min', label: 'MIN', fmt: v => (v != null ? formatNumber(v, 0) : '—') },
  { key: 'pts', label: 'PTS', fmt: v => (v ?? '—') },
  { key: 'reb', label: 'REB', fmt: v => (v ?? '—') },
  { key: 'ast', label: 'AST', fmt: v => (v ?? '—') },
  { key: 'stl', label: 'STL', fmt: v => (v ?? '—') },
  { key: 'blk', label: 'BLK', fmt: v => (v ?? '—') },
  { key: 'fg3m', label: '3PM', fmt: v => (v ?? '—') },
  { key: 'tov', label: 'TOV', fmt: v => (v ?? '—') },
  { key: 'fgm', label: 'FGM', fmt: v => (v ?? '—') },
  { key: 'fga', label: 'FGA', fmt: v => (v ?? '—') },
  { key: 'ftm', label: 'FTM', fmt: v => (v ?? '—') },
  { key: 'pm', label: '+/−', fmt: v => (v != null ? (v > 0 ? `+${v}` : v) : '—') },
  { key: 'fpts', label: 'FPTS', fmt: v => (v != null ? formatNumber(v, 1) : '—') },
];

export default function ExpandableGameLog({ season, playerId, seasonStats }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | loaded | error
  const [games, setGames] = useState([]);

  const toggle = useCallback(async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (status !== 'idle') return;

    setStatus('loading');
    try {
      const seasonData = await loadSeasonGameLog(season);
      const playerGames = seasonData?.[playerId] ?? [];
      setGames(playerGames);
      setStatus('loaded');
    } catch {
      setStatus('error');
    }
  }, [open, status, season, playerId]);

  return (
    <div className="pv-gamelog">
      <div className="pv-gamelog-header" onClick={toggle} role="button" tabIndex={0}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggle()}>
        <div className="pv-gamelog-season-label">
          <span className={`pv-gamelog-arrow${open ? ' open' : ''}`}>▶</span>
          <span>{season}</span>
          {seasonStats?.team && (
            <span className="pill pill-blue pv-gamelog-team-pill">{seasonStats.team}</span>
          )}
        </div>
        <div className="pv-gamelog-summary">
          {seasonStats
            ? `${seasonStats.gp} GP · ${formatNumber(seasonStats.fpg, 1)} FP/G · ${formatNumber(seasonStats.tfp, 0)} FPTS`
            : ''}
        </div>
      </div>

      {open && (
        <div className="pv-gamelog-body">
          {status === 'loading' && (
            <div className="pv-gamelog-status">
              <div className="spinner pv-spinner-sm" />
              <span>Loading game logs…</span>
            </div>
          )}
          {status === 'error' && (
            <div className="pv-gamelog-status">Game log unavailable for this season.</div>
          )}
          {status === 'loaded' && games.length === 0 && (
            <div className="pv-gamelog-status">No games found for this player in {season}.</div>
          )}
          {status === 'loaded' && games.length > 0 && (
            <div className="pv-gamelog-table-wrap">
              <table className="pv-gamelog-table">
                <thead>
                  <tr>
                    {COLS.map(c => (
                      <th key={c.key} className={c.left ? '' : 'pv-num'}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {games.map((g, i) => (
                    <tr key={i}>
                      {COLS.map(c => (
                        <td key={c.key} className={c.left ? '' : 'pv-num'}>
                          {c.render
                            ? c.render(g[c.key])
                            : c.fmt
                            ? c.fmt(g[c.key])
                            : (g[c.key] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
