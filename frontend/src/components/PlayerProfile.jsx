import SeasonTotalsTable from './SeasonTotalsTable';
import ExpandableGameLog from './ExpandableGameLog';

function careerSpan(seasons) {
  if (!seasons.length) return '';
  const sorted = [...seasons].sort((a, b) => a.season.localeCompare(b.season));
  const first = sorted[0].season;
  const last = sorted[sorted.length - 1].season;
  const startYear = first.substring(0, 4);
  const endYear = String(parseInt(last.substring(0, 4)) + 1);
  return startYear === endYear ? startYear : `${startYear}–${endYear}`;
}

export default function PlayerProfile({ player, seasons, onRemove }) {
  const span = careerSpan(seasons);
  const mostRecentTeam = seasons[0]?.team || '';

  return (
    <div className="pv-card">
      <div className="pv-card-header">
        <div className="pv-card-header-info">
          <div className="pv-card-name">{player.name}</div>
          <div className="pv-card-meta">
            {mostRecentTeam && (
              <span className="pill pill-blue pv-card-team-pill">{mostRecentTeam}</span>
            )}
            <span>{span}</span>
            <span className="pv-meta-sep">·</span>
            <span>{seasons.length} season{seasons.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <button className="pv-card-remove" onClick={onRemove}>Remove</button>
      </div>

      <div className="pv-card-body">
        <div className="pv-section">
          <div className="pv-section-title">Season Totals</div>
          <SeasonTotalsTable seasons={seasons} />
        </div>

        <div className="pv-section">
          <div className="pv-section-title">Game Logs</div>
          <div className="pv-gamelogs-list">
            {seasons.map(s => (
              <ExpandableGameLog
                key={s.season}
                season={s.season}
                playerId={player.playerId}
                seasonStats={s}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
