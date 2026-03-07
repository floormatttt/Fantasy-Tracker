import { useState, useMemo, useEffect } from 'react';
import DataTable from './DataTable';
import Pagination from './Pagination';
import { sortData } from '../utils/dataLoader';

export default function BySeason({ seasons, seasonData, loading, error }) {
  const [selectedSeason, setSelectedSeason] = useState('');
  const [sortBy, setSortBy] = useState('fpg');
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  // Auto-select the most recent available season
  useEffect(() => {
    if (seasons.length > 0 && !selectedSeason) {
      // Try to select 2025-26, otherwise select the last season in the list
      const defaultSeason = seasons.includes('2025-26') ? '2025-26' : seasons[seasons.length - 1];
      setSelectedSeason(defaultSeason);
    }
  }, [seasons]);

  const currentData = selectedSeason ? seasonData[selectedSeason] || [] : [];

  const sortedData = useMemo(() => {
    return sortData(currentData, sortBy);
  }, [currentData, sortBy]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const displayData = sortedData.slice(startIdx, startIdx + rowsPerPage);

  const handleSeasonChange = (value) => {
    setSelectedSeason(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
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
    <div className="section">
      <div className="page-title">
        <div>
          <h1>Season Leaders</h1>
          <p>Complete player statistics for selected season</p>
        </div>
      </div>

      <div className="filters">
        <label>Season</label>
        <select value={selectedSeason} onChange={(e) => handleSeasonChange(e.target.value)}>
          <option value="">Select Season...</option>
          {seasons.map(season => (
            <option key={season} value={season}>
              {season}
            </option>
          ))}
        </select>

        <label>Sort By</label>
        <select value={sortBy} onChange={(e) => handleSortChange(e.target.value)}>
          <option value="fpg">Fantasy Points Per Game</option>
          <option value="tfp">Total Fantasy Points</option>
          <option value="pts">Total Points</option>
        </select>

        <div className="filter-spacer"></div>
        <span className="last-updated">Updated Daily</span>
      </div>

      {!selectedSeason ? (
        <div className="loading-bar">Select a season to view data</div>
      ) : (
        <>
          <DataTable data={displayData} includeAllSeasonColumn={false} />
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
