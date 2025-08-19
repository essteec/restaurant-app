import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Spinner, Alert, Modal, Form, Badge, Row, Col, Pagination as BSPagination } from 'react-bootstrap';
import apiClient from '../../../api';
import useAuth from '../../../contexts/use-auth';
import { DataTable } from '../../../components';
import { useToast } from '../../../hooks/useToast.js';
import { useConfirmation } from '../../../hooks/useConfirmation.js';
import { PAGINATION } from '../../../utils/constants';

const AdminOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [showItemsModal, setShowItemsModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedOrderItems, setSelectedOrderItems] = useState([]);
    const [statusFilter, setStatusFilter] = useState('');
    const [availableTables, setAvailableTables] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);

    // Pagination state
    const [pagination, setPagination] = useState({
        page: 0,
        size: PAGINATION.DEFAULT_PAGE_SIZE,
        totalElements: 0,
        totalPages: 0
    });

    const { user, isAuthenticated } = useAuth();
    const { showSuccess, showError, showWarning } = useToast();
    const { confirm } = useConfirmation();

    // Order status options
    const ORDER_STATUSES = [
        { value: 'PLACED', label: 'Placed', variant: 'primary' },
        { value: 'PREPARING', label: 'Preparing', variant: 'secondary' },
        { value: 'READY', label: 'Ready', variant: 'info' },
        { value: 'SHIPPED', label: 'Shipped', variant: 'secondary' },
        { value: 'DELIVERED', label: 'Delivered', variant: 'primary' },
        { value: 'COMPLETED', label: 'Completed', variant: 'success' },
        { value: 'CANCELLED', label: 'Cancelled', variant: 'danger' },
    ];

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'ADMIN') {
            setError('Access Denied: You do not have administrative privileges.');
            setLoading(false);
            return;
        }
        fetchOrders();
        fetchAvailableTables();
    }, [isAuthenticated, user, pagination.page, pagination.size, statusFilter]);

    // Pagination handlers
    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };
    
    const handlePageSizeChange = (newSize) => {
        setPagination(prev => ({ ...prev, page: 0, size: newSize }));
    };

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                size: pagination.size.toString(),
                sort: 'orderTime,desc'
            });
            
            if (statusFilter) {
                params.append('status', statusFilter);
            }

            const response = await apiClient.get(`/employee/orders?${params}`);
            const data = response.data;
            const orderData = Array.isArray(data)
                ? data
                : (data.content || []);

            // Handle empty page
            if (orderData.length === 0 && pagination.page > 0) {
                setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                return;
            }

            setOrders(orderData);
            // Update pagination totals
            setPagination(prev => ({
                ...prev,
                totalElements: data.totalElements ?? orderData.length,
                totalPages: data.totalPages || 1
            }));
            setError(null);
        } catch (err) {
            setError('Failed to fetch orders. Please try again later.');
            showError(err.response?.data?.message || 'Failed to fetch orders');
            console.error('Fetch orders error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableTables = async () => {
        try {
            const response = await apiClient.get('/tables');
            setAvailableTables(response.data || []);
        } catch (err) {
            console.error('Failed to fetch tables:', err);
        }
    };

    const fetchOrderItems = async (orderId) => {
        try {
            setLoadingItems(true);
            const response = await apiClient.get(`/employee/orders/${orderId}/items`);
            setSelectedOrderItems(response.data || []);
        } catch (err) {
            showError('Failed to fetch order items');
            console.error('Fetch order items error:', err);
        } finally {
            setLoadingItems(false);
        }
    };

    const handleViewOrderClick = async (order) => {
        setSelectedOrder(order);
        await fetchOrderItems(order.orderId);
        setShowOrderModal(true);
    };

    const handleViewItemsClick = async (order) => {
        setSelectedOrder(order);
        await fetchOrderItems(order.orderId);
        setShowItemsModal(true);
    };

    const handleUpdateOrderStatus = async (order, newStatus) => {
        const confirmed = await confirm({
            title: 'Update Order Status',
            message: `Are you sure you want to change order #${order.orderId} status to "${newStatus}"?`,
            confirmText: 'Update Status',
            confirmVariant: 'primary'
        });

        if (confirmed) {
            try {
                await apiClient.patch(`/employee/orders/${order.orderId}/status`, {
                    name: newStatus
                });
                showSuccess('Order status updated successfully');
                
                // Update the selected order in the modal
                const updatedOrder = { ...selectedOrder, status: newStatus };
                setSelectedOrder(updatedOrder);
                
                // Also refresh the orders list in the background
                fetchOrders();
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Failed to update order status';
                showError(errorMessage);
                console.error('Update order status error:', err);
            }
        }
    };

    const handleChangeOrderTable = async (order, newTableNumber) => {
        if (!newTableNumber) {
            showError('Please select a table');
            return;
        }

        try {
            await apiClient.patch(`/employee/orders/${order.orderId}/table`, {
                name: newTableNumber
            });
            showSuccess('Order table updated successfully');
            
            // Find the table details from availableTables
            const selectedTable = availableTables.find(table => table.tableNumber === newTableNumber);
            
            // Update the selected order in the modal
            const updatedOrder = { 
                ...selectedOrder, 
                table: selectedTable || { tableNumber: newTableNumber }
            };
            setSelectedOrder(updatedOrder);
            
            // Refresh the orders list in the background
            fetchOrders();
            
            // Keep the modal open - don't close it
            // setShowOrderModal(false); // Removed this line
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to update order table';
            showError(errorMessage);
            console.error('Update order table error:', err);
        }
    };

    const handleDeleteOrder = async (order) => {
        const confirmed = await confirm({
            title: 'Delete Order',
            message: `Are you sure you want to delete order #${order.orderId}? This action cannot be undone.`,
            confirmText: 'Delete',
            confirmVariant: 'danger'
        });

        if (confirmed) {
            try {
                await apiClient.delete(`/employee/orders/${order.orderId}`);
                showSuccess('Order deleted successfully');
                fetchOrders();
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Failed to delete order';
                showError(errorMessage);
                console.error('Delete order error:', err);
            }
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = ORDER_STATUSES.find(s => s.value === status) || ORDER_STATUSES[0];
        return (
            <Badge bg={statusConfig.variant} style={{ minWidth: '80px' }}>
                {statusConfig.label}
            </Badge>
        );
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return '';
        return new Date(dateTimeString).toLocaleString();
    };

    // DataTable columns configuration
    const columns = [
        {
            key: 'orderId',
            header: 'Order ID',
            accessor: 'orderId',
            render: (value) => <strong>#{value}</strong>
        },
        {
            key: 'orderTime',
            header: 'Order Time',
            accessor: 'orderTime',
            render: (value) => (
                <div className="small">
                    {formatDateTime(value)}
                </div>
            )
        },
        {
            key: 'customer',
            header: 'Customer',
            accessor: 'customer',
            render: (customer) => (
                <div>
                    <strong>{customer?.firstName || 'No Customer'} {customer?.lastName || ''}</strong>
                    <div className="small text-muted">{customer?.email || 'Deleted user?'}</div>
                </div>
            )
        },
        {
            key: 'status',
            header: 'Status',
            accessor: 'status',
            render: (value) => getStatusBadge(value)
        },
        {
            key: 'totalPrice',
            header: 'Total',
            accessor: 'totalPrice',
            render: (value) => (
                <strong className="text-success">
                    {formatCurrency(value)}
                </strong>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            accessor: 'orderId',
            sortable: false,
            render: (value, order) => (
                <div className="d-flex gap-1 flex-wrap">
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleViewOrderClick(order); }}
                    >
                        <i className="bi bi-eye me-1"></i>
                        View
                    </Button>
                    <Button
                        variant="outline-info"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleViewItemsClick(order); }}
                    >
                        <i className="bi bi-list me-1"></i>
                        Items
                    </Button>
                    <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order); }}
                    >
                        <i className="bi bi-trash me-1"></i>
                        Delete
                    </Button>
                </div>
            )
        }
    ];

    if (loading) {
        return (
            <Container className="text-center mt-4">
                <Spinner animation="border" />
                <p className="mt-3">Loading orders...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Order Management</h1>
                <div className="d-flex gap-2">
                    <Form.Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ width: 'auto' }}
                    >
                        <option value="">All Statuses</option>
                        {ORDER_STATUSES.map(status => (
                            <option key={status.value} value={status.value}>
                                {status.label}
                            </option>
                        ))}
                    </Form.Select>
                    <Button variant="outline-secondary" onClick={fetchOrders}>
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Refresh
                    </Button>
                </div>
            </div>

            {orders.length === 0 ? (
                <Card>
                    <Card.Body className="text-center">
                        <p className="text-muted">No orders found for the selected criteria.</p>
                    </Card.Body>
                </Card>
            ) : (
                <DataTable
                    data={orders}
                    columns={columns}
                    loading={loading}
                    searchable={true}
                    sortable={true}
                    paginated={false}
                    emptyMessage="No orders found"
                />
            )}

            {/* Custom Backend Pagination Controls */}
            {orders.length > 0 && (
                <Card className="mt-3">
                    <Card.Body>
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                            <div className="d-flex align-items-center gap-2">
                                <Form.Label className="mb-0">Page Size:</Form.Label>
                                <Form.Select
                                    size="sm"
                                    style={{ width: 'auto' }}
                                    value={pagination.size}
                                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                >
                                    {PAGINATION.PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </Form.Select>
                            </div>
                            <BSPagination className="mb-0">
                                <BSPagination.First disabled={pagination.page === 0} onClick={() => handlePageChange(0)} />
                                <BSPagination.Prev disabled={pagination.page === 0} onClick={() => handlePageChange(pagination.page - 1)} />
                                {Array.from({ length: pagination.totalPages || 1 }, (_, i) => i)
                                    .slice(Math.max(0, pagination.page - 2), Math.min(pagination.totalPages, pagination.page + 3))
                                    .map(p => (
                                        <BSPagination.Item
                                            key={p}
                                            active={p === pagination.page}
                                            onClick={() => handlePageChange(p)}
                                        >{p + 1}</BSPagination.Item>
                                    ))
                                }
                                <BSPagination.Next disabled={pagination.page >= pagination.totalPages - 1} onClick={() => handlePageChange(pagination.page + 1)} />
                                <BSPagination.Last disabled={pagination.page >= pagination.totalPages - 1} onClick={() => handlePageChange(pagination.totalPages - 1)} />
                            </BSPagination>
                        </div>
                    </Card.Body>
                </Card>
            )}

            {/* Order Details Modal */}
            <Modal show={showOrderModal} onHide={() => setShowOrderModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Order Details #{selectedOrder?.orderId}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedOrder && (
                        <>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <Card>
                                        <Card.Header>
                                            <h6 className="mb-0">Order Information</h6>
                                        </Card.Header>
                                        <Card.Body>
                                            <p><strong>Order Time:</strong> {formatDateTime(selectedOrder.orderTime)}</p>
                                            <p><strong>Status:</strong> {getStatusBadge(selectedOrder.status)}</p>
                                            <p><strong>Total Price:</strong> {formatCurrency(selectedOrder.totalPrice)}</p>
                                            {selectedOrder.notes && (
                                                <p><strong>Notes:</strong> {selectedOrder.notes}</p>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card>
                                        <Card.Header>
                                            <h6 className="mb-0">Customer Information</h6>
                                        </Card.Header>
                                        <Card.Body>
                                            <p><strong>Name:</strong> {selectedOrder.customer?.firstName || 'No Customer'} {selectedOrder.customer?.lastName || ''}</p>
                                            <p><strong>Email:</strong> {selectedOrder.customer?.email || 'Deleted user?'}</p>
                                            {selectedOrder.customer?.loyaltyPoints && (
                                                <p><strong>Loyalty Points:</strong> {selectedOrder.customer.loyaltyPoints}</p>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Status Update Section */}
                            <Card className="mb-3">
                                <Card.Header>
                                    <h6 className="mb-0">Update Order Status</h6>
                                </Card.Header>
                                <Card.Body>
                                    <div className="d-flex gap-2 flex-wrap">
                                        {ORDER_STATUSES.map(status => (
                                            <Button
                                                key={status.value}
                                                variant={selectedOrder.status === status.value ? status.variant : `outline-${status.variant}`}
                                                size="sm"
                                                onClick={() => handleUpdateOrderStatus(selectedOrder, status.value)}
                                                disabled={selectedOrder.status === status.value}
                                            >
                                                {status.label}
                                            </Button>
                                        ))}
                                    </div>
                                </Card.Body>
                            </Card>

                            {/* Table Assignment Section */}
                            <Card className="mb-3">
                                <Card.Header>
                                    <h6 className="mb-0">Table Assignment</h6>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={8}>
                                            <Form.Select
                                                value={selectedOrder.table?.tableNumber || ''}
                                                onChange={(e) => handleChangeOrderTable(selectedOrder, e.target.value)}
                                            >
                                                <option value="">Select Table</option>
                                                {availableTables.map(table => (
                                                    <option key={table.tableNumber} value={table.tableNumber}>
                                                        {table.tableNumber} (Capacity: {table.capacity}, Status: {table.tableStatus})
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Col>
                                        <Col md={4}>
                                            <p className="mb-0 pt-2">
                                                Current: {selectedOrder.table?.tableNumber ? (
                                                    <Badge bg="secondary">{selectedOrder.table.tableNumber}</Badge>
                                                ) : (
                                                    <span className="text-muted">No table assigned</span>
                                                )}
                                            </p>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Address Information */}
                            {selectedOrder.address && (
                                <Row className="mb-3">
                                    <Col md={12}>
                                        <Card>
                                            <Card.Header>
                                                <h6 className="mb-0">Delivery Address</h6>
                                            </Card.Header>
                                            <Card.Body>
                                                <p><strong>Name:</strong> {selectedOrder.address.name}</p>
                                                <p><strong>Street:</strong> {selectedOrder.address.street} {selectedOrder.address.apartment}</p>
                                                <p><strong>Location:</strong> {selectedOrder.address.district && `${selectedOrder.address.district}, `}{selectedOrder.address.subprovince && `${selectedOrder.address.subprovince}, `}{selectedOrder.address.city}</p>
                                                <p><strong>Country:</strong> {selectedOrder.address.country} {selectedOrder.address.province}</p>
                                                {selectedOrder.address.description && (
                                                    <p><strong>Description:</strong> {selectedOrder.address.description}</p>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            )}

                            {/* Order Items Section */}
                            <Card>
                                <Card.Header>
                                    <h6 className="mb-0">Order Items ({selectedOrderItems.length})</h6>
                                </Card.Header>
                                <Card.Body>
                                    {loadingItems ? (
                                        <div className="text-center">
                                            <Spinner animation="border" size="sm" />
                                            <span className="ms-2">Loading items...</span>
                                        </div>
                                    ) : selectedOrderItems.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-sm">
                                                <thead>
                                                    <tr>
                                                        <th>Item</th>
                                                        <th>Quantity</th>
                                                        <th>Unit Price</th>
                                                        <th>Total</th>
                                                        <th>Notes</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedOrderItems.map((item, index) => (
                                                        <tr key={index}>
                                                            <td>
                                                                <strong>{item.foodItem?.foodName}</strong>
                                                                {item.foodItem?.description && (
                                                                    <div className="small text-muted">{item.foodItem.description}</div>
                                                                )}
                                                            </td>
                                                            <td>{item.quantity}</td>
                                                            <td>{formatCurrency(item.unitPrice)}</td>
                                                            <td><strong>{formatCurrency(item.totalPrice)}</strong></td>
                                                            <td className="small">{item.note || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-muted mb-0">No items found for this order.</p>
                                    )}
                                </Card.Body>
                            </Card>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowOrderModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Order Items Modal */}
            <Modal show={showItemsModal} onHide={() => setShowItemsModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Order Items - Order #{selectedOrder?.orderId}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loadingItems ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" />
                            <p className="mt-3">Loading order items...</p>
                        </div>
                    ) : selectedOrderItems.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table">
                                <thead className="table-dark">
                                    <tr>
                                        <th>Food Item</th>
                                        <th>Quantity</th>
                                        <th>Unit Price</th>
                                        <th>Total Price</th>
                                        <th>Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedOrderItems.map((item, index) => (
                                        <tr key={index}>
                                            <td>
                                                <div>
                                                    <strong>{item.foodItem?.foodName}</strong>
                                                    {item.foodItem?.description && (
                                                        <div className="text-muted small">{item.foodItem.description}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <Badge bg="info">{item.quantity}</Badge>
                                            </td>
                                            <td>{formatCurrency(item.unitPrice)}</td>
                                            <td><strong>{formatCurrency(item.totalPrice)}</strong></td>
                                            <td className="small">{item.note || <span className="text-muted">No notes</span>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="table-active">
                                        <th colSpan="3">Total Order Value:</th>
                                        <th>{formatCurrency(selectedOrder?.totalPrice)}</th>
                                        <th></th>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <Alert variant="warning">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            No items found for this order.
                        </Alert>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowItemsModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default AdminOrdersPage;
