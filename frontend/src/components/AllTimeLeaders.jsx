import { useState, useMemo } from 'react';
import DataTable from './DataTable';
import Pagination from './Pagination';
import { sortData } from '../utils/dataLoader';

export default function AllTimeLeaders({ data, loading, error }) {
  const [sortBy, setSortBy] = useState('fpg');
  const [minGp, setMinGp] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAndSorted = useMemo(() => {
    let filtered = data.filter(p => p.gp >= minGp);
    return sortData(filtered, sortBy);
  }, [data, sortBy, minGp]);

  const totalPages = Math.ceil(filteredAndSorted.length / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const displayData = filteredAndSorted.slice(startIdx, startIdx + rowsPerPage);

  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleMinGpChange = (value) => {
    setMinGp(parseInt(value));
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

      <div className="filters">
        <label>Sort By</label>
        <select value={sortBy} onChange={(e) => handleSortChange(e.target.value)}>
          <option value="fpg">Fantasy Points Per Game</option>
          <option value="tfp">Total Fantasy Points</option>
          <option value="pts">Total Points</option>
          <option value="reb">Rebounds</option>
          <option value="ast">Assists</option>
        </select>

        <label>Min Games</label>
        <select value={minGp} onChange={(e) => handleMinGpChange(e.target.value)}>
          <option value="0">All</option>
          <option value="10">10+</option>
          <option value="25">25+</option>
          <option value="50">50+</option>
        </select>

        <div className="filter-spacer"></div>
        <span className="last-updated">Updated Daily</span>
      </div>

      <DataTable data={displayData} includeAllSeasonColumn={true} />

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
