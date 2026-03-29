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

function App() {
  const [activeTab, setActiveTab] = useState('alltime');
  const [allTimeData, setAllTimeData] = useState([]);
  const [footballData, setFootballData] = useState([]);
  const [weeklyLineupData, setWeeklyLineupData] = useState([]);
  const [seasonData, setSeasonData] = useState({});
  const [availableSeasons, setAvailableSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <Header />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main key={activeTab}>
        {activeTab === 'alltime' && (
          <AllTimeLeaders key="alltime" data={allTimeData} loading={loading} error={error} />
        )}
        {activeTab === 'byseason' && (
          <BySeason key="byseason" seasons={availableSeasons} seasonData={seasonData} loading={loading} error={error} />
        )}
        {activeTab === 'football' && (
          <AllTimeFootball key="football" data={footballData} loading={loading} error={error} />
        )}
        {activeTab === 'footballbyseason' && (
          <FootballBySeason key="footballbyseason" data={footballData} loading={loading} error={error} />
        )}
        {activeTab === 'weeklylineups' && (
          <WeeklyLineupDistribution
            key="weeklylineups"
            data={weeklyLineupData}
            loading={loading}
            error={error}
          />
        )}
      </main>
    </>
  );
}

export default App;
