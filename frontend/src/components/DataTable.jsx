import { formatNumber } from '../utils/dataLoader';

const SORTABLE_COLUMNS = [
  { key: 'player', label: 'Player', className: '', minWidth: '160px' },
  { key: 'season', label: 'Season', className: 'num' },
  { key: 'gp', label: 'GP', className: 'num' },
  { key: 'pts', label: 'PTS', className: 'num' },
  { key: 'reb', label: 'REB', className: 'num' },
  { key: 'ast', label: 'AST', className: 'num' },
  { key: 'fg3m', label: 'FG3M', className: 'num' },
  { key: 'stl', label: 'STL', className: 'num' },
  { key: 'blk', label: 'BLK', className: 'num' },
  { key: 'tov', label: 'TOV', className: 'num' },
  { key: 'tfp', label: 'FP', className: 'num' },
  { key: 'fpg', label: 'FP/G', className: 'num' },
];

function sortIndicator(sortKey, sortDirection, columnKey) {
  if (sortKey !== columnKey) return '';
  return sortDirection === 'asc' ? ' ↑' : ' ↓';
}

export default function DataTable({
  data,
  includeAllSeasonColumn = false,
  startIndex = 0,
  sortKey = 'fpg',
  sortDirection = 'desc',
  onSortChange = null,
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th className="num" style={{ width: '40px' }}>#</th>
            {SORTABLE_COLUMNS.filter((column) => includeAllSeasonColumn || column.key !== 'season').map((column) => (
              <th
                key={column.key}
                className={`${column.className} ${sortKey === column.key ? 'sorted' : ''}`.trim()}
                style={column.minWidth ? { minWidth: column.minWidth } : undefined}
                onClick={() => onSortChange?.(column.key)}
              >
                {column.label}
                {sortIndicator(sortKey, sortDirection, column.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((player, idx) => {
            const rowNumber = startIndex + idx + 1;

            return (
            <tr key={`${player.player}-${player.season}-${idx}`} className={rowNumber <= 10 ? 'highlight-row' : ''}>
              <td className={`num rank-cell ${rowNumber <= 5 ? 'top5' : ''}`}>{rowNumber}</td>
              <td className="player-cell">
                {player.player}
                {includeAllSeasonColumn && <span className="season-tag">{player.season}</span>}
              </td>
              {includeAllSeasonColumn && <td className="num">{player.season}</td>}
              <td className="num">{player.gp}</td>
              <td className="num">{player.pts}</td>
              <td className="num">{player.reb}</td>
              <td className="num">{player.ast}</td>
              <td className="num">{player.fg3m}</td>
              <td className="num">{player.stl}</td>
              <td className="num">{player.blk}</td>
              <td className="num">{player.tov}</td>
              <td className="num" style={{ fontWeight: '700' }}>{formatNumber(player.tfp, 1)}</td>
              <td className="num" style={{ fontWeight: '700', color: 'var(--accent)' }}>
                {formatNumber(player.fpg, 2)}
              </td>
            </tr>
          )})}
        </tbody>
      </table>
    </div>
  );
}
