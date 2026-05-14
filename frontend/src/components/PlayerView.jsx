import { useState, useMemo, useCallback } from 'react';
import PlayerSearchBar from './PlayerSearchBar';
import PlayerProfile from './PlayerProfile';

function buildPlayerIndex(allTimeData) {
  const map = new Map();
  for (const row of allTimeData) {
    const pid = row.playerId;
    if (!pid || !row.player) continue;

    if (!map.has(pid)) {
      map.set(pid, {
        playerId: pid,
        name: row.player,
        firstSeason: row.season,
        lastSeason: row.season,
        team: row.team,
      });
    } else {
      const p = map.get(pid);
      if (row.season < p.firstSeason) p.firstSeason = row.season;
      if (row.season > p.lastSeason) {
        p.lastSeason = row.season;
        p.team = row.team;
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export default function PlayerView({ allTimeData, loading, error }) {
  const [selectedPlayers, setSelectedPlayers] = useState([]);

  const playerIndex = useMemo(() => buildPlayerIndex(allTimeData), [allTimeData]);

  const getPlayerSeasons = useCallback(
    playerId =>
      allTimeData
        .filter(row => row.playerId === playerId)
        .sort((a, b) => b.season.localeCompare(a.season)),
    [allTimeData]
  );

  const handleSelect = useCallback(player => {
    setSelectedPlayers(prev =>
      prev.some(p => p.playerId === player.playerId) ? prev : [...prev, player]
    );
  }, []);

  const handleRemove = useCallback(playerId => {
    setSelectedPlayers(prev => prev.filter(p => p.playerId !== playerId));
  }, []);

  if (loading) {
    return (
      <div className="pv-loading">
        <div className="spinner" />
        <p>Loading player data…</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-box">Failed to load player data: {error}</div>;
  }

  const hasPlayers = selectedPlayers.length > 0;
  const colClass =
    selectedPlayers.length === 1
      ? 'pv-count-1'
      : selectedPlayers.length === 2
      ? 'pv-count-2'
      : 'pv-count-3';

  return (
    <div className="pv-root">
      <div className={`pv-search-section${hasPlayers ? ' pv-search-compact' : ''}`}>
        {!hasPlayers && (
          <div className="pv-hero">
            <h1 className="pv-hero-title">Player Explorer</h1>
            <p className="pv-hero-sub">
              Search any NBA player to view career stats and game logs
            </p>
          </div>
        )}
        <PlayerSearchBar
          players={playerIndex}
          selectedPlayers={selectedPlayers}
          onSelect={handleSelect}
        />
        {hasPlayers && (
          <p className="pv-search-hint">
            Add another player to compare side by side
          </p>
        )}
      </div>

      {hasPlayers && (
        <div className={`pv-comparison ${colClass}`}>
          {selectedPlayers.map(player => (
            <PlayerProfile
              key={player.playerId}
              player={player}
              seasons={getPlayerSeasons(player.playerId)}
              onRemove={() => handleRemove(player.playerId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
