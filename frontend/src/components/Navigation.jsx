export default function Navigation({ activeTab, onTabChange }) {
  const tabs = ['nba', 'nfl'];
  const labels = {
    nba: 'NBA 🏀',
    nfl: 'NFL 🏈',
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
