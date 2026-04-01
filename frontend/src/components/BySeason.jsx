import { useState, useMemo, useEffect } from 'react';
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
];

export default function BySeason({ seasons, seasonData, loading, error }) {
  const [selectedSeason, setSelectedSeason] = useState('');
  const [sortBy, setSortBy] = useState('fpg');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const currentData = selectedSeason ? seasonData[selectedSeason] || [] : [];

  const sortedData = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filteredData = currentData.filter((player) => (
      normalizedQuery === '' || player.player.toLowerCase().includes(normalizedQuery)
    ));
    return sortData(filteredData, sortBy, sortDirection);
  }, [currentData, sortBy, sortDirection, searchQuery]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const displayData = sortedData.slice(startIdx, startIdx + rowsPerPage);

  const handleSeasonChange = (value) => {
    setSelectedSeason(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Auto-select 2025-26 when available, otherwise pick first season
  useEffect(() => {
    if (seasons && seasons.length > 0) {
      if (seasons.includes('2025-26')) {
        setSelectedSeason('2025-26');
      } else if (!selectedSeason) {
        setSelectedSeason(seasons[0]);
      }
    }
    // only run when seasons list changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasons]);

  const handleSortChange = (value) => {
    setSortBy(value);
    setSortDirection(value === 'player' ? 'asc' : 'desc');
    setCurrentPage(1);
  };

  const handleHeaderSort = (value) => {
    if (sortBy === value) {
      setSortDirection((current) => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(value);
      setSortDirection(value === 'player' ? 'asc' : 'desc');
    }
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
      <div className="section">
        <div className="error-box">
          ⚠️ <strong>Could not load data.</strong> {error}
          <br />
          Make sure to run <code>python build_nba_json.py</code> first to generate JSON files.
        </div>
      </div>
    );
  }

  return (
    <div className="section active">
      <div className="page-title">
        <div>
          <h1>Season Leaders</h1>
          <p>Complete player statistics for selected season</p>
        </div>
      </div>

      <div className="filters filters-nba">
        <div className="filter-card filter-card-season">
          <label>Season</label>
          <select value={selectedSeason} onChange={(e) => handleSeasonChange(e.target.value)}>
            {seasons.map((season) => (
              <option key={season} value={season}>
                {season}
              </option>
            ))}
          </select>
        </div>

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
      </div>

      {!selectedSeason ? (
        <div className="loading-bar">Select a season to view data</div>
      ) : (
        <>
          <DataTable
            data={displayData}
            includeAllSeasonColumn={false}
            startIndex={startIdx}
            sortKey={sortBy}
            sortDirection={sortDirection}
            onSortChange={handleHeaderSort}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={sortedData.length}
            rowsPerPage={rowsPerPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </>
      )}
    </div>
  );
}
