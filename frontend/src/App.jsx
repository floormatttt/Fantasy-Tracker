import { useState, useEffect } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import AllTimeLeaders from './components/AllTimeLeaders';
import BySeason from './components/BySeason';
import CBBAnalytics from './components/CBBAnalytics';
import { loadAllTimeData, loadManifest, loadSeasonData } from './utils/dataLoader';
import './App.css';

function App() {
  const [currentApp, setCurrentApp] = useState('nba'); // 'nba' or 'cbb'
  const [activeTab, setActiveTab] = useState('alltime');
  const [allTimeData, setAllTimeData] = useState([]);
  const [seasonData, setSeasonData] = useState({});
  const [availableSeasons, setAvailableSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentApp === 'nba') {
      loadNBAData();
    }
  }, [currentApp]);

  const loadNBAData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all-time data
      const fullData = await loadAllTimeData();
      setAllTimeData(fullData);

      // Load available seasons
      const seasons = await loadManifest();
      setAvailableSeasons(seasons);

      // Load seasonal data
      const seasonalData = {};
      for (const season of seasons) {
        try {
          const data = await loadSeasonData(season);
          if (data.length > 0) {
            seasonalData[season] = data;
          }
        } catch (err) {
          console.error(`Failed to load season ${season}:`, err);
        }
      }
      setSeasonData(seasonalData);

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (currentApp === 'cbb') {
    return <CBBAnalytics />;
  }

  return (
    <>
      <Header />
      <nav>
        <div className="nav-inner">
          <div style={{ display: 'flex' }}>
            <button
              className={`nav-tab ${activeTab === 'alltime' ? 'active' : ''}`}
              onClick={() => setActiveTab('alltime')}
            >
              All Time Leaders
            </button>
            <button
              className={`nav-tab ${activeTab === 'byseason' ? 'active' : ''}`}
              onClick={() => setActiveTab('byseason')}
            >
              By Season
            </button>
          </div>
          <button
            className="nav-tab"
            onClick={() => setCurrentApp('cbb')}
          >
            CBB Analytics →
          </button>
        </div>
      </nav>
      <main>
        {activeTab === 'alltime' && (
          <AllTimeLeaders data={allTimeData} loading={loading} error={error} />
        )}
        {activeTab === 'byseason' && (
          <BySeason seasons={availableSeasons} seasonData={seasonData} loading={loading} error={error} />
        )}
      </main>
    </>
  );
}

export default App;
