import { useState, useEffect, useRef, useMemo } from 'react';

function careerSpan(player) {
  const start = player.firstSeason ? player.firstSeason.substring(0, 4) : '?';
  const endYear = player.lastSeason
    ? String(parseInt(player.lastSeason.substring(0, 4)) + 1)
    : '?';
  return `${start}–${endYear}`;
}

function rankPlayers(players, query) {
  if (!query) return [];
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results = [];
  for (const p of players) {
    const name = p.name.toLowerCase();
    let score = 0;
    if (name === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else {
      const parts = name.split(' ');
      if (parts.some(part => part.startsWith(q))) score = 60;
      else if (name.includes(q)) score = 40;
      else continue;
    }
    results.push({ ...p, _score: score });
  }

  return results
    .sort((a, b) => b._score - a._score || a.name.localeCompare(b.name))
    .slice(0, 12);
}

export default function PlayerSearchBar({ players, selectedPlayers, onSelect }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const suggestions = useMemo(
    () => rankPlayers(players, debouncedQuery),
    [players, debouncedQuery]
  );

  useEffect(() => {
    setOpen(suggestions.length > 0 && query.trim().length > 0);
    setActiveIndex(-1);
  }, [suggestions, query]);

  useEffect(() => {
    function onClickOutside(e) {
      if (
        !dropdownRef.current?.contains(e.target) &&
        !inputRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function isAdded(playerId) {
    return selectedPlayers.some(p => p.playerId === playerId);
  }

  function handleSelect(player) {
    if (isAdded(player.playerId)) return;
    onSelect(player);
    setQuery('');
    setDebouncedQuery('');
    setOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="pv-search-wrap">
      <div className="pv-search-input-wrap">
        <span className="pv-search-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
            <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        <input
          ref={inputRef}
          className="pv-search-input"
          type="text"
          value={query}
          placeholder="Search NBA players…"
          onChange={e => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck="false"
        />
        {query && (
          <button
            className="pv-search-clear"
            onClick={() => { setQuery(''); setDebouncedQuery(''); setOpen(false); }}
            tabIndex={-1}
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <div className="pv-dropdown" ref={dropdownRef}>
          {suggestions.map((p, i) => {
            const added = isAdded(p.playerId);
            return (
              <div
                key={p.playerId}
                className={`pv-dropdown-item${i === activeIndex ? ' selected' : ''}${added ? ' already-added' : ''}`}
                onMouseDown={() => handleSelect(p)}
              >
                <div>
                  <div className="pv-dropdown-name">{p.name}</div>
                  <div className="pv-dropdown-meta">{p.team || '—'}</div>
                </div>
                <div className="pv-dropdown-right">
                  <div className="pv-dropdown-years">{careerSpan(p)}</div>
                  {added && <div className="pv-dropdown-added">Added</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
