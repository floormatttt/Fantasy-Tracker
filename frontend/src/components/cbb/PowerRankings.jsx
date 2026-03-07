import { useMemo } from 'react';
import { formatBarthag, getSOLBadge } from '../../utils/cbbDataLoader';

export default function PowerRankings({ teams, loading, error, conference }) {
  const filtered = useMemo(() => {
    let data = [...teams];
    if (conference) data = data.filter(t => t.conf === conference);
    return data.sort((a, b) => b.barthag - a.barthag);
  }, [teams, conference]);

  if (loading) {
    return (
      <div className="section active">
        <div className="loading-bar">
          <div className="spinner"></div>
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section active">
        <div className="error-box">⚠️ <strong>Could not load data.</strong> {error}</div>
      </div>
    );
  }

  return (
    <div className="section active">
      <div className="page-title">
        <div>
          <h1>Team Power Rankings</h1>
          <p>Barthag win probability + adjusted efficiency — live from Barttorvik</p>
        </div>
      </div>

      <div className="sol-infobox">
        <strong>🏆 Strength of Losses (SOL)</strong> is now factored into all rankings. SOL measures the average Barthag of opponents a team lost to — teams that only lose to elite squads are rated higher than those dropping games to weak competition.
        <br />
        <strong>Elite</strong> = avg loss opponent Barthag ≥ 80% · <strong>Good</strong> ≥ 65% · <strong>Average</strong> ≥ 50% · <strong>Poor</strong> &lt; 50%
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="num" style={{ width: '40px' }}>#</th>
              <th>Team</th>
              <th className="num">Record</th>
              <th className="num">AdjOE</th>
              <th className="num">AdjDE</th>
              <th className="num">Barthag</th>
              <th className="num">WAB</th>
              <th className="num">SOS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((team, idx) => {
                const sol = getSOLBadge(team.barthag);
                return (
                  <tr key={team.name}>
                    <td className={`num rank-cell ${idx < 5 ? 'top5' : ''}`}>{idx + 1}</td>
                    <td>
                      <strong>{team.name}</strong>
                      <span className="conf-tag">{team.conf}</span>
                    </td>
                    <td className="num">{team.record}</td>
                    <td className="num">{team.adjOE.toFixed(1)}</td>
                    <td className="num">{team.adjDE.toFixed(1)}</td>
                    <td className="num">
                      <span className={`sol-badge ${sol.class}`}>{formatBarthag(team.barthag)}</span>
                    </td>
                    <td className="num">{team.wab.toFixed(1)}</td>
                    <td className="num">{team.sos.toFixed(1)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  No teams found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="data-note">
        Data: barttorvik.com · Barthag = win probability vs avg D1 · WAB = wins above bubble · SOL = avg opponent Barthag on losses
      </p>
    </div>
  );
}
