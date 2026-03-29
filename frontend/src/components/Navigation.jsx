export default function Navigation({ activeTab, onTabChange }) {
  const tabs = ['alltime', 'byseason', 'football', 'footballbyseason', 'weeklylineups'];
  const labels = {
    alltime: 'All Time Leaders 🏀',
    byseason: 'By Season 🏀',
    football: 'All Time Leaders 🏈',
    footballbyseason: 'By Season 🏈',
    weeklylineups: 'Weekly Lineups 📈',
  };

  return (
    <nav>
      <div className="nav-inner">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => onTabChange(tab)}
          >
            {labels[tab]}
          </button>
        ))}
      </div>
    </nav>
  );
}
