import { useState, useMemo } from 'react';
import { Table, Form, InputGroup, Row, Col, Card } from 'react-bootstrap';
import { Search, SortAlphaDown, SortAlphaUp } from 'react-bootstrap-icons';
import LoadingSpinner from './LoadingSpinner.jsx';
import Pagination from './Pagination.jsx';
import { PAGINATION } from '@utils/constants.js';

const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  searchable = true,
  sortable = true,
  paginated = true,
  pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
  striped = true,
  hover = true,
  bordered = false,
  responsive = true,
  size = null,
  className = '',
  emptyMessage = 'No data available',
  searchPlaceholder = 'Search...',
  onRowClick = null,
  rowClassName = null,
  noDataComponent = null,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    return data.filter(row => {
      return columns.some(column => {
        const value = column.accessor ? row[column.accessor] : '';
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, columns]);

  // Sort filtered data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate sorted data
  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData;

    const startIndex = (currentPage - 1) * currentPageSize;
    return sortedData.slice(startIndex, startIndex + currentPageSize);
  }, [sortedData, currentPage, currentPageSize, paginated]);

  const totalPages = Math.ceil(sortedData.length / currentPageSize);

  const handleSort = (columnKey) => {
    if (!sortable) return;

    setSortConfig(prevConfig => ({
      key: columnKey,
      direction: 
        prevConfig.key === columnKey && prevConfig.direction === 'asc'
          ? 'desc'
          : 'asc',
    }));
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize) => {
    setCurrentPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleRowClick = (row, index) => {
    if (onRowClick) {
      onRowClick(row, index);
    }
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? <SortAlphaDown /> : <SortAlphaUp />;
  };

  const getRowClassName = (row, index) => {
    let className = '';
    if (onRowClick) className += 'cursor-pointer ';
    if (rowClassName) className += rowClassName(row, index);
    return className.trim();
  };

  if (loading) {
    return (
      <Card className={className}>
        <Card.Body className="text-center py-5">
          <LoadingSpinner size="lg" />
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {searchable && (
        <Card.Header>
          <Row>
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <Search size={16} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
          </Row>
        </Card.Header>
      )}

      <Card.Body className="p-0">
        {paginatedData.length === 0 ? (
          <div className="text-center py-5">
            {noDataComponent || (
              <div className="text-muted">
                <h5>{emptyMessage}</h5>
                {searchTerm && (
                  <p className="mb-0">
                    Try adjusting your search criteria
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className={responsive ? 'table-responsive' : ''}>
            <Table
              striped={striped}
              hover={hover}
              bordered={bordered}
              size={size}
              className="mb-0"
            >
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={`${sortable && column.sortable !== false ? 'cursor-pointer user-select-none' : ''} ${column.className || ''}`}
                      style={{ 
                        width: column.width,
                        minWidth: column.minWidth,
                        maxWidth: column.maxWidth,
                        ...column.headerStyle 
                      }}
                      onClick={() => column.sortable !== false && handleSort(column.accessor)}
                    >
                      <div className="d-flex align-items-center justify-content-between">
                        {column.header}
                        {sortable && column.sortable !== false && (
                          <span className="ms-1">
                            {getSortIcon(column.accessor)}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, index) => (
                  <tr
                    key={row.userId || row.id || index}
                    className={getRowClassName(row, index)}
                    onClick={() => handleRowClick(row, index)}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={column.cellClassName || ''}
                        style={column.cellStyle}
                      >
                        {column.render 
                          ? column.render(row[column.accessor], row, index)
                          : row[column.accessor]
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>

      {paginated && sortedData.length > 0 && (
        <Card.Footer>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={currentPageSize}
            totalItems={sortedData.length}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </Card.Footer>
      )}
    </Card>
  );
};

export default DataTable;
