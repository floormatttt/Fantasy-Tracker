export default function Header({ theme, onThemeToggle }) {
  const themeIcon = theme === 'dark' ? '🌙' : '☀️';
  const themeLabel = theme === 'dark' ? 'Light' : 'Dark';

  return (
    <header>
      <div className="header-inner">
        <div className="logo">
          Fantasy<span>Tracker</span>
        </div>
        <div className="header-meta">
          <div>
            Fantasy Points & Player Stats
            <br />
            <span>Updated Daily</span>
          </div>
          <button className="theme-toggle" onClick={onThemeToggle}>
            <span className="theme-toggle-icon" aria-hidden="true">{themeIcon}</span>
            <span>{themeLabel}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
