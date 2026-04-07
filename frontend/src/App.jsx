import { useState, useEffect } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import AllTimeLeaders from './components/AllTimeLeaders';
import BySeason from './components/BySeason';
import AllTimeFootball from './components/AllTimeFootball';
import FootballBySeason from './components/FootballBySeason';
import WeeklyLineupDistribution from './components/WeeklyLineupDistribution';
import {
  loadAllTimeData,
  loadFootballAllTimeData,
  loadManifest,
  loadSeasonData,
  loadWeeklyLineupDistributionData,
} from './utils/dataLoader';
import './App.css';
import "./firebase";

function App() {
  const [activeTab, setActiveTab] = useState('nba');
  const [nbaView, setNbaView] = useState('alltime');
  const [nflView, setNflView] = useState('alltime');
  const [theme, setTheme] = useState('light');
  const [allTimeData, setAllTimeData] = useState([]);
  const [footballData, setFootballData] = useState([]);
  const [weeklyLineupData, setWeeklyLineupData] = useState([]);
  const [seasonData, setSeasonData] = useState({});
  const [availableSeasons, setAvailableSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('fantasy-tracker-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
      return;
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('fantasy-tracker-theme', theme);
  }, [theme]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const fullData = await loadAllTimeData();
        setAllTimeData(fullData);

        const footballAllTimeData = await loadFootballAllTimeData();
        setFootballData(footballAllTimeData);

        const weeklyDistributionData = await loadWeeklyLineupDistributionData();
        setWeeklyLineupData(weeklyDistributionData);

        const seasons = await loadManifest();
        setAvailableSeasons(seasons);

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

    loadData();
  }, []);

  return (
    <>
      <Header theme={theme} onThemeToggle={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))} />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main key={activeTab}>
        {activeTab === 'nba' && (
          <>
            <div className="subnav">
              <button
                className={`subnav-tab ${nbaView === 'alltime' ? 'active' : ''}`}
                onClick={() => setNbaView('alltime')}
              >
                All Time Leaders
              </button>
              <button
                className={`subnav-tab ${nbaView === 'byseason' ? 'active' : ''}`}
                onClick={() => setNbaView('byseason')}
              >
                By Season
              </button>
            </div>
            {nbaView === 'alltime' && (
              <AllTimeLeaders key="alltime" data={allTimeData} loading={loading} error={error} />
            )}
            {nbaView === 'byseason' && (
              <BySeason key="byseason" seasons={availableSeasons} seasonData={seasonData} loading={loading} error={error} />
            )}
          </>
        )}
        {activeTab === 'nfl' && (
          <>
            <div className="subnav">
              <button
                className={`subnav-tab ${nflView === 'alltime' ? 'active' : ''}`}
                onClick={() => setNflView('alltime')}
              >
                All Time Leaders
              </button>
              <button
                className={`subnav-tab ${nflView === 'byseason' ? 'active' : ''}`}
                onClick={() => setNflView('byseason')}
              >
                By Season
              </button>
              <button
                className={`subnav-tab ${nflView === 'weeklylineups' ? 'active' : ''}`}
                onClick={() => setNflView('weeklylineups')}
              >
                Weekly Lineups
              </button>
            </div>
            {nflView === 'alltime' && (
              <AllTimeFootball
                key="football"
                data={footballData}
                loading={loading}
                error={error}
              />
            )}
            {nflView === 'byseason' && (
              <FootballBySeason
                key="footballbyseason"
                data={footballData}
                loading={loading}
                error={error}
              />
            )}
            {nflView === 'weeklylineups' && (
              <WeeklyLineupDistribution
                key="weeklylineups"
                data={weeklyLineupData}
                loading={loading}
                error={error}
              />
            )}
          </>
        )}
      </main>
    </>
  );
}

export default App;
