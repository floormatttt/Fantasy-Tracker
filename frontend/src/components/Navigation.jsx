export default function Navigation({ activeTab, onTabChange }) {
  const tabs = ['alltime', 'byseason'];
  const labels = {
    alltime: 'All Time Leaders',
    byseason: 'By Season'
  };

  return (
    <nav>
      <div className="nav-inner">
        {tabs.map(tab => (
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
