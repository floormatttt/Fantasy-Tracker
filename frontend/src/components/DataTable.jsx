import { formatNumber } from '../utils/dataLoader';

export default function DataTable({ data, includeAllSeasonColumn = false }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th className="num" style={{ width: '40px' }}>#</th>
            <th style={{ minWidth: '160px' }}>Player</th>
            {includeAllSeasonColumn && <th className="num">Season</th>}
            <th className="num">GP</th>
            <th className="num">PTS</th>
            <th className="num">REB</th>
            <th className="num">AST</th>
            <th className="num">FG3M</th>
            <th className="num">STL</th>
            <th className="num">BLK</th>
            <th className="num">TOV</th>
            <th className="num">FP</th>
            <th className="num">FP/G</th>
          </tr>
        </thead>
        <tbody>
          {data.map((player, idx) => (
            <tr key={`${player.player}-${player.season}-${idx}`} className={idx < 10 ? 'highlight-row' : ''}>
              <td className={`num rank-cell ${idx < 5 ? 'top5' : ''}`}>{idx + 1}</td>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
