import { formatNumber } from '../utils/dataLoader';

const COLS = [
  { key: 'season', label: 'Season', left: true, fmt: v => v },
  { key: 'team', label: 'Tm', left: true, fmt: v => v || '—' },
  { key: 'gp', label: 'GP', fmt: v => v },
  { key: 'pts', label: 'PTS', fmt: v => v },
  { key: 'reb', label: 'REB', fmt: v => v },
  { key: 'ast', label: 'AST', fmt: v => v },
  { key: 'stl', label: 'STL', fmt: v => v },
  { key: 'blk', label: 'BLK', fmt: v => v },
  { key: 'fg3m', label: '3PM', fmt: v => v },
  { key: 'tov', label: 'TOV', fmt: v => v },
  { key: 'fpg', label: 'FP/G', fmt: v => formatNumber(v, 1) },
  { key: 'tfp', label: 'FPTS', fmt: v => formatNumber(v, 1) },
];

export default function SeasonTotalsTable({ seasons }) {
  if (!seasons || seasons.length === 0) {
    return <p className="pv-empty-msg">No season data available.</p>;
  }

  return (
    <div className="pv-season-table-wrap">
      <table className="pv-season-table">
        <thead>
          <tr>
            {COLS.map(c => (
              <th key={c.key} className={c.left ? '' : 'pv-num'}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {seasons.map((s, i) => (
            <tr key={i}>
              {COLS.map(c => (
                <td key={c.key} className={c.left ? '' : 'pv-num'}>
                  {c.fmt(s[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
