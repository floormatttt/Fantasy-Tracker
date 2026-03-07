import { useState, useEffect } from 'react';
import PowerRankings from './cbb/PowerRankings';
import Efficiency from './cbb/Efficiency';
import DraftBoard from './cbb/DraftBoard';
import { loadCBBData, getConferences } from '../utils/cbbDataLoader';

export default function CBBAnalytics() {
  const [activeTab, setActiveTab] = useState('power');
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conferences, setConf] = useState([]);
  const [selectedConf, setSelectedConf] = useState('');
  const [draftPosFilter, setDraftPosFilter] = useState('');
  const [draftRoundFilter, setDraftRoundFilter] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await loadCBBData();
        setTeams(data.teams);
        setConf(getConferences(data.teams));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const tabs = [
    { id: 'power', label: 'Power Rankings' },
    { id: 'efficiency', label: 'Efficiency' },
    { id: 'draft', label: '🏀 NBA Draft Board' }
  ];

  return (
    <>
      <header>
        <div className="header-inner">
          <div className="logo">
            CBB<span>Analytics</span>
          </div>
          <div className="header-meta">
            2025–26 Season
            <br />
            <span>Live · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </header>

      <nav>
        <div className="nav-inner">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main>
        {activeTab === 'power' && (
          <>
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

            <div className="filters">
              <label>Conference</label>
              <select value={selectedConf} onChange={(e) => setSelectedConf(e.target.value)}>
                <option value="">All Conferences</option>
                {conferences.map(conf => (
                  <option key={conf} value={conf}>
                    {conf}
                  </option>
                ))}
              </select>
              <div className="filter-spacer"></div>
              <span className="last-updated">As of today</span>
            </div>

            <PowerRankings teams={teams} loading={loading} error={error} conference={selectedConf} />
            <p className="data-note">
              Data: barttorvik.com · Barthag = win probability vs avg D1 · WAB = wins above bubble · SOL = avg opponent Barthag on losses
            </p>
          </>
        )}

        {activeTab === 'efficiency' && (
          <>
            <div className="page-title">
              <div>
                <h1>Offensive & Defensive Efficiency</h1>
                <p>Points per 100 possessions, adjusted for opponent strength</p>
              </div>
            </div>

            <div className="filters">
              <label>Conference</label>
              <select value={selectedConf} onChange={(e) => setSelectedConf(e.target.value)}>
                <option value="">All Conferences</option>
                {conferences.map(conf => (
                  <option key={conf} value={conf}>
                    {conf}
                  </option>
                ))}
              </select>
            </div>

            <Efficiency teams={teams} loading={loading} error={error} conference={selectedConf} />
          </>
        )}

        {activeTab === 'draft' && (
          <>
            <div className="filters">
              <label>Filter</label>
              <select value={draftPosFilter} onChange={(e) => setDraftPosFilter(e.target.value)}>
                <option value="">All Positions</option>
                <option value="PG">Point Guard</option>
                <option value="SG">Shooting Guard</option>
                <option value="SF">Small Forward</option>
                <option value="PF">Power Forward</option>
                <option value="C">Center</option>
              </select>
              <label>Round</label>
              <select value={draftRoundFilter} onChange={(e) => setDraftRoundFilter(e.target.value)}>
                <option value="">All Picks</option>
                <option value="lottery">Lottery (1-14)</option>
                <option value="first">Full 1st Round</option>
              </select>
            </div>

            <DraftBoard posFilter={draftPosFilter} roundFilter={draftRoundFilter} />
          </>
        )}
      </main>
    </>
  );
}
