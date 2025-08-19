import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Modal, Badge, ListGroup } from 'react-bootstrap';
import apiClient from '../../../api';
import useAuth from '../../../contexts/use-auth';
import { useToast } from '../../../hooks/useToast.js';
import { useConfirmation } from '../../../hooks/useConfirmation.js';
import { LoadingSpinner } from '../../../components';
import { formatCurrency } from '../../../utils/helpers';

const WaiterOperationPage = () => {
    const [tables, setTables] = useState([]);
    const [orders, setOrders] = useState([]);
    const [callRequests, setCallRequests] = useState([]);
    const [combinedData, setCombinedData] = useState([]);
    const [deliveryOrders, setDeliveryOrders] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const [showItemsModal, setShowItemsModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedOrderItems, setSelectedOrderItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);

    const { user, isAuthenticated } = useAuth();
    const { showSuccess, showError } = useToast();
    const { confirm } = useConfirmation();

    const TABLE_STATUS_CONFIG = {
        AVAILABLE: { label: 'Available', variant: 'success', icon: 'bi-check-circle-fill' },
        OCCUPIED: { label: 'Occupied', variant: 'danger', icon: 'bi-person-fill' },
        DIRTY: { label: 'Dirty', variant: 'warning', icon: 'bi-exclamation-triangle-fill' }
    };

    const ORDER_STATUS_CONFIG = {
        PLACED: { label: 'Placed', variant: 'primary' },
        PREPARING: { label: 'Preparing', variant: 'secondary' },
        READY: { label: 'Ready', variant: 'info' },
        DELIVERED: { label: 'Delivered', variant: 'primary' },
        COMPLETED: { label: 'Completed', variant: 'success' },
        CANCELLED: { label: 'Cancelled', variant: 'danger' }
    };

    const CALL_REQUEST_CONFIG = {
        WATER: { label: 'Water', variant: 'info', icon: 'bi-droplet-fill' },
        PAYMENT: { label: 'Payment', variant: 'success', icon: 'bi-credit-card-fill' },
        ASSISTANCE: { label: 'Assistance', variant: 'warning', icon: 'bi-person-raised-hand' },
        NEED: { label: 'Need Help', variant: 'danger', icon: 'bi-exclamation-circle-fill' },
        PACK: { label: 'Takeout', variant: 'secondary', icon: 'bi-bag-fill' }
    };

    const fetchData = useCallback(async () => {
        if (!isAuthenticated || !['WAITER', 'ADMIN'].includes(user?.role)) {
            setError('Access Denied: You do not have sufficient privileges.');
            setLoading(false);
            return;
        }

        try {
            const [tablesRes, ordersRes, callRequestsRes] = await Promise.all([
                apiClient.get('/tables'),
                apiClient.get('/employee/orders?size=200'),
                apiClient.get('/call-requests?active=true&size=200')
            ]);

            setTables(tablesRes.data || []);
            setOrders(ordersRes.data?.content || []);
            setCallRequests(callRequestsRes.data?.content || []);
            setError(null);
        } catch (err) {
            setError('Failed to fetch operational data. Please try again later.');
            showError(err.response?.data?.message || 'Failed to fetch data');
            console.error('Fetch data error:', err);
        }
    }, [isAuthenticated, user, showError]);

    useEffect(() => {
        setLoading(true);
        fetchData().finally(() => setLoading(false));

        const interval = setInterval(() => {
            setRefreshing(true);
            fetchData().finally(() => setRefreshing(false));
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchData]);

    useEffect(() => {
        const ordersByTable = orders.reduce((acc, order) => {
            const tableNum = order.table?.tableNumber;
            if (tableNum) {
                if (!acc[tableNum]) acc[tableNum] = [];
                acc[tableNum].push(order);
            }
            return acc;
        }, {});

        const requestsByTable = callRequests.reduce((acc, req) => {
            const tableNum = req.table?.tableNumber;
            if (tableNum) {
                if (!acc[tableNum]) acc[tableNum] = [];
                acc[tableNum].push(req);
            }
            return acc;
        }, {});

        const combined = tables.map(table => ({
            ...table,
            orders: ordersByTable[table.tableNumber] || [],
            callRequests: requestsByTable[table.tableNumber] || []
        })).sort((a, b) => a.tableNumber.localeCompare(b.tableNumber, undefined, { numeric: true }));

        setCombinedData(combined);
        setDeliveryOrders(orders.filter(o => !o.table && o.status !== 'COMPLETED' && o.status !== 'CANCELLED'));

    }, [tables, orders, callRequests]);

    const handleUpdateTableStatus = async (table, newStatus) => {
        const confirmed = await confirm({
            title: 'Update Table Status',
            message: `Are you sure you want to change table "${table.tableNumber}" to "${newStatus}"?`,
            confirmText: 'Update Status',
            variant: 'primary'
        });

        if (confirmed) {
            try {
                await apiClient.patch(`/tables/${table.tableNumber}/status`, { name: newStatus });
                showSuccess(`Table ${table.tableNumber} status updated to ${newStatus}`);
                fetchData();
            } catch (err) {
                showError(err.response?.data?.message || 'Failed to update table status');
            }
        }
    };

    const handleUpdateOrderStatus = async (order, newStatus) => {
        const confirmed = await confirm({
            title: 'Update Order Status',
            message: `Are you sure you want to change order #${order.orderId} to "${newStatus}"?`,
            confirmText: 'Update Status',
            variant: 'primary'
        });

        if (confirmed) {
            try {
                await apiClient.patch(`/employee/orders/${order.orderId}/status`, { name: newStatus });
                showSuccess(`Order #${order.orderId} status updated.`);
                fetchData();
            } catch (err) {
                showError(err.response?.data?.message || 'Failed to update order status');
            }
        }
    };

    const handleResolveCallRequest = async (request) => {
        const confirmed = await confirm({
            title: 'Resolve Call Request',
            message: `Resolve this request from table ${request.table?.tableNumber}?`,
            confirmText: 'Resolve',
            variant: 'success'
        });

        if (confirmed) {
            try {
                await apiClient.patch(`/call-requests/${request.callRequestId}/resolve`);
                showSuccess('Call request resolved.');
                fetchData();
            } catch (err) {
                showError(err.response?.data?.message || 'Failed to resolve request');
            }
        }
    };

    const handleViewItems = async (order) => {
        setSelectedOrder(order);
        setShowItemsModal(true);
        setLoadingItems(true);
        try {
            const response = await apiClient.get(`/employee/orders/${order.orderId}/items`);
            setSelectedOrderItems(response.data || []);
        } catch (err) {
            showError('Failed to fetch order items.');
        } finally {
            setLoadingItems(false);
        }
    };

    const TableCard = ({ table }) => {
        const statusConfig = TABLE_STATUS_CONFIG[table.tableStatus] || { variant: 'secondary', label: 'Unknown', icon: 'bi-question-circle' };
        const activeOrders = table.orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
        const hasActiveOrders = activeOrders.length > 0;
        const hasCallRequests = table.callRequests.length > 0;
        const isOccupiedWithNoActivity = table.tableStatus === 'OCCUPIED' && !hasActiveOrders && !hasCallRequests;

        return (
            <Col>
                <Card className={`h-100 shadow-sm`}>
                    <Card.Header className={`bg-${statusConfig.variant} bg-gradient text-white`}>
                        <div className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0 fw-bold">
                                <i className="bi bi-table me-2"></i>
                                Table {table.tableNumber}
                            </h5>
                            <Badge pill bg="light" text={statusConfig.variant} className="fs-6">
                                <i className={`${statusConfig.icon} me-1`}></i>
                                {statusConfig.label}
                            </Badge>
                        </div>
                    </Card.Header>
                    <Card.Body className="p-2 d-flex flex-column">
                        <div className="flex-grow-1">
                            {isOccupiedWithNoActivity && (
                                <div className="text-center text-muted p-3">
                                    <i className="bi bi-cup-straw fs-4"></i>
                                    <p className="mb-0 mt-2 small">Ready to be cleared or new order.</p>
                                </div>
                            )}

                            {hasActiveOrders && (
                                <div className="mb-2">
                                    <h6 className="text-muted small px-2 mb-1">Active Orders</h6>
                                    <ListGroup variant="flush">
                                        {activeOrders.map(order => (
                                            <ListGroup.Item key={order.orderId} className="px-2 py-1 d-flex justify-content-between align-items-center">
                                                <div>
                                                    <strong className="me-2">#{order.orderId}</strong>
                                                    <Badge bg={ORDER_STATUS_CONFIG[order.status]?.variant || 'secondary'} text="white">
                                                        {ORDER_STATUS_CONFIG[order.status]?.label || order.status}
                                                    </Badge>
                                                </div>
                                                <Button variant="outline-primary" size="sm" onClick={() => handleViewItems(order)}>
                                                    <i className="bi bi-list-ul"></i>
                                                </Button>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                </div>
                            )}

                            {hasCallRequests && (
                                <div className="mt-2">
                                    <h6 className="text-muted small px-2 mb-1">Call Requests</h6>
                                    <ListGroup variant="flush">
                                        {table.callRequests.map(req => (
                                            <ListGroup.Item key={req.callRequestId} className="px-2 py-1 d-flex justify-content-between align-items-center">
                                                <Badge bg={CALL_REQUEST_CONFIG[req.type]?.variant || 'secondary'} text="white">
                                                    <i className={`${CALL_REQUEST_CONFIG[req.type]?.icon || 'bi-bell'} me-1`}></i>
                                                    {CALL_REQUEST_CONFIG[req.type]?.label || req.type}
                                                </Badge>
                                                <Button variant="outline-success" size="sm" onClick={() => handleResolveCallRequest(req)}>
                                                    <i className="bi bi-check-lg"></i> Resolve
                                                </Button>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                </div>
                            )}
                        </div>
                    </Card.Body>
                    <Card.Footer className="p-2 d-grid gap-1">
                        {table.tableStatus === 'DIRTY' && (
                            <Button variant="success" size="sm" onClick={() => handleUpdateTableStatus(table, 'AVAILABLE')}>Mark as Clean</Button>
                        )}
                        {table.tableStatus === 'AVAILABLE' && (
                            <Button variant="warning" size="sm" onClick={() => handleUpdateTableStatus(table, 'OCCUPIED')}>Seat Guests</Button>
                        )}
                        {table.tableStatus === 'OCCUPIED' && (
                            <Button variant="outline-secondary" size="sm" onClick={() => handleUpdateTableStatus(table, 'DIRTY')}>Clear Table</Button>
                        )}
                    </Card.Footer>
                </Card>
            </Col>
        );
    };

    if (loading) {
        return <LoadingSpinner fullPage text="Loading Restaurant Operations..." />;
    }

    if (error) {
        return <Container className="mt-4"><Alert variant="danger">{error}</Alert></Container>;
    }

    return (
        <Container fluid className="py-4">
            <Row className="align-items-center mb-4">
                <Col>
                    <h1 className="mb-0">Waiter Operations</h1>
                    <p className="text-muted mb-0">At-a-glance view of the restaurant floor. Auto-refreshes every 30 seconds.</p>
                </Col>
                <Col xs="auto">
                    <Button variant="outline-primary" onClick={() => { setRefreshing(true); fetchData().finally(() => setRefreshing(false)); }} disabled={refreshing}>
                        <i className={`bi bi-arrow-clockwise ${refreshing ? 'spin' : ''}`}></i> Refresh
                    </Button>
                </Col>
            </Row>

            {deliveryOrders.length > 0 && (
                <Card className="mb-4">
                    <Card.Header className="bg-info text-white">
                        <h5 className="mb-0"><i className="bi bi-truck me-2"></i>Delivery Orders ({deliveryOrders.length})</h5>
                    </Card.Header>
                    <ListGroup variant="flush">
                        {deliveryOrders.map(order => (
                            <ListGroup.Item key={order.orderId} className="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>Order #{order.orderId}</strong> for {order.customer?.firstName || 'Customer'}
                                </div>
                                <div>
                                    <Badge bg={ORDER_STATUS_CONFIG[order.status]?.variant || 'secondary'} className="me-2">
                                        {ORDER_STATUS_CONFIG[order.status]?.label || order.status}
                                    </Badge>
                                    <Button variant="outline-primary" size="sm" onClick={() => handleViewItems(order)}>
                                        View Items
                                    </Button>
                                </div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </Card>
            )}

            <Row xs={1} md={2} lg={3} xl={4} xxl={5} className="g-4">
                {combinedData.map(table => (
                    <TableCard key={table.tableNumber} table={table} />
                ))}
            </Row>

            <Modal show={showItemsModal} onHide={() => setShowItemsModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Order #{selectedOrder?.orderId} Items</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loadingItems ? (
                        <LoadingSpinner text="Loading items..." />
                    ) : (
                        <ListGroup variant="flush">
                            {selectedOrderItems.map(item => (
                                <ListGroup.Item key={item.orderItemId}>
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <Badge bg="primary" pill className="me-2">{item.quantity}</Badge>
                                            <strong>{item.foodItem?.foodName}</strong>
                                        </div>
                                        <span className="text-muted">{formatCurrency(item.totalPrice)}</span>
                                    </div>
                                    {item.note && <div className="text-muted small ps-4 fst-italic">- {item.note}</div>}
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowItemsModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default WaiterOperationPage;