import { formatNumber } from '../utils/dataLoader';

const SORTABLE_COLUMNS = [
  { key: 'player', label: 'Player', minWidth: '180px' },
  { key: 'season', label: 'Season', className: 'num' },
  { key: 'team', label: 'Team' },
  { key: 'position', label: 'Pos' },
  { key: 'gp', label: 'GP', className: 'num' },
  { key: 'avg', label: 'AVG', className: 'num' },
  { key: 'ttl', label: 'TTL', className: 'num' },
  { key: 'war', label: 'WAR', className: 'num' },
];

function sortIndicator(sortKey, sortDirection, columnKey) {
  if (sortKey !== columnKey) return '';
  return sortDirection === 'asc' ? ' ↑' : ' ↓';
}

function getPositionClass(position) {
  if (position === 'QB') return 'pill-red';
  if (position === 'RB') return 'pill-green';
  if (position === 'WR') return 'pill-blue';
  if (position === 'TE') return 'pill-orange';
  return 'pill-amber';
}

export default function FootballTable({
  data,
  startIndex = 0,
  sortKey = 'war',
  sortDirection = 'desc',
  onSortChange = null,
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th className="num" style={{ width: '40px' }}>#</th>
            {SORTABLE_COLUMNS.map((column) => (
              <th
                key={column.key}
                className={`${column.className || ''} ${sortKey === column.key ? 'sorted' : ''}`.trim()}
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
                <td className="player-cell">{player.player}</td>
                <td className="num">{player.season}</td>
                <td>{player.team}</td>
                <td>
                  <span className={`pill ${getPositionClass(player.position)}`}>{player.position}</span>
                </td>
                <td className="num">{player.gp}</td>
                <td className="num" style={{ fontWeight: '700', color: 'var(--accent)' }}>
                  {formatNumber(player.avg, 1)}
                </td>
                <td className="num" style={{ fontWeight: '700' }}>
                  {formatNumber(player.ttl, 1)}
                </td>
                <td className="num" style={{ fontWeight: '700', color: 'var(--blue)' }}>
                  {formatNumber(player.war, 3)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
