export default function Pagination({
  currentPage,
  totalPages,
  totalCount,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange
}) {
  const handlePageInput = (e) => {
    const page = parseInt(e.target.value);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const handlePrevClick = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextClick = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="pagination-container">
      <div className="rows-per-page">
        <label>Rows per page</label>
        <select value={rowsPerPage} onChange={(e) => onRowsPerPageChange(parseInt(e.target.value))}>
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>
      <div className="pagination-nav">
        <button onClick={handlePrevClick} disabled={currentPage === 1}>
          ←
        </button>
        <div className="pagination-info">
          <span>{totalCount} Rows · Page</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={currentPage}
            onChange={handlePageInput}
          />
          <span>of {totalPages}</span>
        </div>
        <button onClick={handleNextClick} disabled={currentPage >= totalPages}>
          →
        </button>
      </div>
    </div>
  );
}
