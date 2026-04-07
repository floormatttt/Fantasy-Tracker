import { useMemo, useState } from 'react';
import FootballTable from './FootballTable';
import Pagination from './Pagination';
import { sortFootballData } from '../utils/dataLoader';

const POSITION_OPTIONS = ['ALL', 'QB', 'RB', 'WR', 'TE'];

export default function AllTimeFootball({ data, loading, error }) {
  const [position, setPosition] = useState('ALL');
  const [sortBy, setSortBy] = useState('war');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [minGp, setMinGp] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAndSorted = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filtered = data.filter((player) => {
      const matchesPosition = position === 'ALL' || player.position === position;
      const matchesSearch = normalizedQuery === '' || player.player.toLowerCase().includes(normalizedQuery);
      return matchesPosition && matchesSearch && player.gp >= minGp;
    });

    return sortFootballData(filtered, sortBy, sortDirection);
  }, [data, position, sortBy, sortDirection, minGp, searchQuery]);

  const totalPages = Math.ceil(filteredAndSorted.length / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const displayData = filteredAndSorted.slice(startIdx, startIdx + rowsPerPage);

  const resetPage = () => setCurrentPage(1);
  const handleSortChange = (nextSortKey) => {
    if (nextSortKey === sortBy) {
      setSortDirection((currentDirection) => (currentDirection === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(nextSortKey);
      setSortDirection(nextSortKey === 'player' || nextSortKey === 'team' || nextSortKey === 'position' ? 'asc' : 'desc');
    }
    resetPage();
  };

  if (error) {
    return (
      <div className="section active">
        <div className="error-box">
          Could not load football data. {error}
          <br />
          Make sure to run <code>python "python/FF pipeline/build_ff_json.py"</code> to generate the football JSON file.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="section active">
        <div className="loading-bar">
          <div className="spinner"></div>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="section active">
      <div className="page-title">
        <div>
          <h1>All-Time Leaders 🏈</h1>
          <p>All-time football value leaders across all available seasons</p>
        </div>
      </div>

      <div className="filters filters-compact">
        <div className="filter-card filter-card-player">
          <label>Player</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              resetPage();
            }}
            placeholder="Search player"
          />
        </div>

        <div className="filter-card filter-card-position">
          <label>Position</label>
          <select
            value={position}
            onChange={(e) => {
              setPosition(e.target.value);
              resetPage();
            }}
          >
            {POSITION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === 'ALL' ? 'All Positions' : option}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-card filter-card-sort">
          <label>Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setSortDirection(e.target.value === 'player' || e.target.value === 'team' || e.target.value === 'position' ? 'asc' : 'desc');
              resetPage();
            }}
          >
            <option value="player">Player</option>
            <option value="team">Team</option>
            <option value="position">Position</option>
            <option value="avg">Average Above Replacement</option>
            <option value="ttl">Total Above Replacement</option>
            <option value="war">Wins Above Replacement</option>
            <option value="consistencyScore">Consistency Score</option>
            <option value="improvementScore">Improvement Score</option>
            <option value="gp">Games Played</option>
            <option value="season">Season</option>
          </select>
        </div>

        <div className="filter-card filter-card-min">
          <label>Min Games</label>
          <select
            value={minGp}
            onChange={(e) => {
              setMinGp(parseInt(e.target.value));
              resetPage();
            }}
          >
            <option value="0">All</option>
            <option value="5">5+</option>
            <option value="10">10+</option>
            <option value="15">15+</option>
          </select>
        </div>
      </div>

      <FootballTable
        data={displayData}
        startIndex={startIdx}
        sortKey={sortBy}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={filteredAndSorted.length}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value);
          resetPage();
        }}
      />
    </div>
  );
}
