import { useState, useMemo } from 'react';
import DataTable from './DataTable';
import Pagination from './Pagination';
import { sortData } from '../utils/dataLoader';

const SORT_OPTIONS = [
  { value: 'fpg', label: 'Fantasy Points Per Game' },
  { value: 'tfp', label: 'Total Fantasy Points' },
  { value: 'pts', label: 'Total Points' },
  { value: 'reb', label: 'Rebounds' },
  { value: 'ast', label: 'Assists' },
  { value: 'fg3m', label: '3PT Made' },
  { value: 'stl', label: 'Steals' },
  { value: 'blk', label: 'Blocks' },
  { value: 'tov', label: 'Turnovers' },
  { value: 'gp', label: 'Games Played' },
  { value: 'player', label: 'Player Name' },
  { value: 'season', label: 'Season' },
];

export default function AllTimeLeaders({ data, loading, error }) {
  const [sortBy, setSortBy] = useState('fpg');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [minGp, setMinGp] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAndSorted = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    let filtered = data.filter((p) => {
      const matchesGp = p.gp >= minGp;
      const matchesSearch = normalizedQuery === '' || p.player.toLowerCase().includes(normalizedQuery);
      return matchesGp && matchesSearch;
    });
    return sortData(filtered, sortBy, sortDirection);
  }, [data, sortBy, sortDirection, minGp, searchQuery]);

  const totalPages = Math.ceil(filteredAndSorted.length / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const displayData = filteredAndSorted.slice(startIdx, startIdx + rowsPerPage);

  const handleSortChange = (value) => {
    setSortBy(value);
    setSortDirection(value === 'player' || value === 'season' ? 'asc' : 'desc');
    setCurrentPage(1);
  };

  const handleHeaderSort = (value) => {
    if (sortBy === value) {
      setSortDirection((current) => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(value);
      setSortDirection(value === 'player' || value === 'season' ? 'asc' : 'desc');
    }
    setCurrentPage(1);
  };

  const handleMinGpChange = (value) => {
    setMinGp(parseInt(value));
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleRowsPerPageChange = (value) => {
    setRowsPerPage(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (error) {
    return (
      <div className="section active">
        <div className="error-box">
          ⚠️ <strong>Could not load data.</strong> {error}
          <br />
          Make sure to run <code>python build_nba_json.py</code> first to generate JSON files.
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
          <h1>All-Time Fantasy Points Leaders</h1>
          <p>Complete historical data across all seasons</p>
        </div>
      </div>

      <div className="filters filters-compact">
        <div className="filter-card filter-card-player">
          <label>Player</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search player"
          />
        </div>

        <div className="filter-card filter-card-sort">
          <label>Sort By</label>
          <select value={sortBy} onChange={(e) => handleSortChange(e.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-card filter-card-min">
          <label>Min Games</label>
          <select value={minGp} onChange={(e) => handleMinGpChange(e.target.value)}>
            <option value="0">All</option>
            <option value="10">10+</option>
            <option value="25">25+</option>
            <option value="50">50+</option>
          </select>
        </div>
      </div>

      <DataTable
        data={displayData}
        includeAllSeasonColumn={true}
        startIndex={startIdx}
        sortKey={sortBy}
        sortDirection={sortDirection}
        onSortChange={handleHeaderSort}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={filteredAndSorted.length}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </div>
  );
}
