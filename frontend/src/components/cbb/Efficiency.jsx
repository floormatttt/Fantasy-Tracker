import { useMemo } from 'react';

export default function Efficiency({ teams, loading, error, conference }) {
  const filtered = useMemo(() => {
    let data = [...teams];
    if (conference) data = data.filter(t => t.conf === conference);
    return data.sort((a, b) => b.netEM - a.netEM);
  }, [teams, conference]);

  if (loading) {
    return (
      <div className="section">
        <div className="loading-bar">
          <div className="spinner"></div>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="page-title">
        <div>
          <h1>Offensive & Defensive Efficiency</h1>
          <p>Points per 100 possessions, adjusted for opponent strength</p>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: '20px' }}>
        {filtered.slice(0, 4).map((team) => (
          <div key={team.name + 'stat'} className="stat-card">
            <div className="stat-card-label">{team.name}</div>
            <div className="stat-card-value">{team.netEM.toFixed(1)}</div>
            <div className="stat-card-sub">Net Efficiency Margin</div>
          </div>
        ))}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="num" style={{ width: '40px' }}>#</th>
              <th>Team</th>
              <th className="num">AdjOE</th>
              <th className="num">AdjDE</th>
              <th className="num">Net EM</th>
              <th className="num">Opp O</th>
              <th className="num">Opp D</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((team, idx) => (
              <tr key={team.name}>
                <td className={`num rank-cell ${idx < 5 ? 'top5' : ''}`}>{idx + 1}</td>
                <td>
                  <strong>{team.name}</strong>
                  <span className="conf-tag">{team.conf}</span>
                </td>
                <td className="num">{team.adjOE.toFixed(1)}</td>
                <td className="num">{team.adjDE.toFixed(1)}</td>
                <td className="num" style={{ fontWeight: '700' }}>{team.netEM.toFixed(1)}</td>
                <td className="num">{team.oppO.toFixed(1)}</td>
                <td className="num">{team.oppD.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="data-note">
        Data: barttorvik.com · AdjOE/AdjDE = adjusted offensive/defensive efficiency · Opp O/D = opponent efficiency
      </p>
    </div>
  );
}
