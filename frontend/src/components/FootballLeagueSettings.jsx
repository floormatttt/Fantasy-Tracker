export default function FootballLeagueSettings({ settings, onChange }) {
  const updateSetting = (key, value) => {
    onChange({
      ...settings,
      [key]: parseInt(value, 10),
    });
  };

  return (
    <div className="filters filters-compact">
      <div className="filter-card filter-card-min">
        <label>Teams</label>
        <select value={settings.teams} onChange={(e) => updateSetting('teams', e.target.value)}>
          {[8, 10, 12, 14, 16].map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      </div>

      <div className="filter-card filter-card-min">
        <label>Start QB</label>
        <select value={settings.qb} onChange={(e) => updateSetting('qb', e.target.value)}>
          {[1, 2].map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      </div>

      <div className="filter-card filter-card-min">
        <label>Start RB</label>
        <select value={settings.rb} onChange={(e) => updateSetting('rb', e.target.value)}>
          {[1, 2, 3].map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      </div>

      <div className="filter-card filter-card-min">
        <label>Start WR</label>
        <select value={settings.wr} onChange={(e) => updateSetting('wr', e.target.value)}>
          {[1, 2, 3].map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      </div>

      <div className="filter-card filter-card-min">
        <label>Start TE</label>
        <select value={settings.te} onChange={(e) => updateSetting('te', e.target.value)}>
          {[0, 1, 2].map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      </div>

      <div className="filter-card filter-card-min">
        <label>Flex</label>
        <select value={settings.flex} onChange={(e) => updateSetting('flex', e.target.value)}>
          {[0, 1, 2, 3].map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
