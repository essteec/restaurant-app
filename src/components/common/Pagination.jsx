import { Pagination as BootstrapPagination, Form, Row, Col } from 'react-bootstrap';
import { PAGINATION } from '@utils/constants.js';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  maxVisiblePages = 5,
  className = '',
}) => {
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handlePageSizeChange = (e) => {
    const newPageSize = parseInt(e.target.value, 10);
    if (onPageSizeChange) {
      onPageSizeChange(newPageSize);
    }
  };

  const getVisiblePages = () => {
    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(currentPage - half, 1);
    let end = Math.min(start + maxVisiblePages - 1, totalPages);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(end - maxVisiblePages + 1, 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <Row className={`align-items-center ${className}`}>
      <Col md={6}>
        <div className="d-flex align-items-center">
          <span className="text-muted me-3">
            Showing {startItem}-{endItem} of {totalItems} items
          </span>
          {showPageSizeSelector && (
            <div className="d-flex align-items-center">
              <span className="text-muted me-2">Show:</span>
              <Form.Select
                size="sm"
                value={pageSize}
                onChange={handlePageSizeChange}
                style={{ width: 'auto' }}
              >
                {PAGINATION.PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </Form.Select>
              <span className="text-muted ms-2">per page</span>
            </div>
          )}
        </div>
      </Col>
      <Col md={6}>
        <BootstrapPagination className="justify-content-end mb-0">
          <BootstrapPagination.First
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          />
          <BootstrapPagination.Prev
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          />
          
          {getVisiblePages().map((page) => (
            <BootstrapPagination.Item
              key={page}
              active={page === currentPage}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </BootstrapPagination.Item>
          ))}
          
          <BootstrapPagination.Next
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          />
          <BootstrapPagination.Last
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
          />
        </BootstrapPagination>
      </Col>
    </Row>
  );
};

export default Pagination;
