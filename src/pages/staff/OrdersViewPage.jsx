import { useState, useEffect } from 'react';
import { 
    Container, 
    Row, 
    Col, 
    Card, 
    Button, 
    Badge, 
    Modal, 
    Form,
    Alert,
    ListGroup,
    Image,
    Spinner
} from 'react-bootstrap';
import DataTable from '../../components/common/DataTable.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import apiClient from '../../api';
import useAuth from '../../contexts/use-auth';
import { useToast } from '../../hooks/useToast.js';
import { PAGINATION } from '../../utils/constants.js';

const OrdersViewPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [showItemsModal, setShowItemsModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedOrderItems, setSelectedOrderItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const { user, isAuthenticated } = useAuth();
    const { showSuccess, showError, showWarning } = useToast();

    // Order status configurations
    const statusConfigs = {
        PLACED: { 
            label: 'Placed', 
            variant: 'primary', 
            color: '#0d6efd',
            icon: 'bi-clock-history',
            description: 'Order has been placed'
        },
        PREPARING: { 
            label: 'Preparing', 
            variant: 'secondary', 
            color: '#6c757d',
            icon: 'bi-gear-fill',
            description: 'Kitchen is preparing the order'
        },
        READY: { 
            label: 'Ready', 
            variant: 'info', 
            color: '#0dcaf0',
            icon: 'bi-check-circle-fill',
            description: 'Order is ready for pickup/delivery'
        },
        SHIPPED: { 
            label: 'Shipped', 
            variant: 'warning', 
            color: '#ffc107',
            icon: 'bi-truck',
            description: 'Order is out for delivery'
        },
        DELIVERED: { 
            label: 'Delivered', 
            variant: 'primary', 
            color: '#0d6efd',
            icon: 'bi-house-check-fill',
            description: 'Order has been delivered'
        },
        COMPLETED: { 
            label: 'Completed', 
            variant: 'success', 
            color: '#198754',
            icon: 'bi-check-circle-fill',
            description: 'Order is completed'
        },
        CANCELLED: { 
            label: 'Cancelled', 
            variant: 'danger', 
            color: '#dc3545',
            icon: 'bi-x-circle-fill',
            description: 'Order has been cancelled'
        },
    };

    useEffect(() => {
        if (!isAuthenticated || !user) {
            setLoading(false);
            return;
        }

        // Only allow CHEF and WAITER roles
        if (!['CHEF', 'WAITER'].includes(user.role)) {
            setError('Access denied. This page is only for kitchen staff and waiters.');
            setLoading(false);
            return;
        }

        fetchOrders();
    }, [isAuthenticated, user, refreshKey]);

    // Auto-refresh every 30 seconds for real-time updates
    useEffect(() => {
        if (!isAuthenticated || !user || !['CHEF', 'WAITER'].includes(user.role)) {
            return;
        }

        const interval = setInterval(() => {
            fetchOrders();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [isAuthenticated, user]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/orders');
            
            // Filter orders to show only today's orders
            const today = new Date().toDateString();
            const todaysOrders = response.data.filter(order => {
                const orderDate = new Date(order.orderTime).toDateString();
                return orderDate === today;
            });
            
            setOrders(todaysOrders || []);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
            setError('Failed to fetch orders. Please try again.');
            showError('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const fetchOrderItems = async (orderId) => {
        try {
            setLoadingItems(true);
            const response = await apiClient.get(`/orders/${orderId}/items`);
            setSelectedOrderItems(response.data || []);
        } catch (err) {
            console.error('Failed to fetch order items:', err);
            showError('Failed to fetch order items');
            setSelectedOrderItems([]);
        } finally {
            setLoadingItems(false);
        }
    };

    const handleViewOrderClick = (order) => {
        setSelectedOrder(order);
        setShowOrderModal(true);
    };

    const handleViewItemsClick = async (order) => {
        setSelectedOrder(order);
        setShowItemsModal(true);
        await fetchOrderItems(order.orderId);
    };

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
        showSuccess('Orders refreshed');
    };

    const getStatusBadge = (status) => {
        const config = statusConfigs[status] || statusConfigs.PLACED;
        return (
            <Badge bg={config.variant} className="d-flex align-items-center gap-1">
                <i className={config.icon}></i>
                {config.label}
            </Badge>
        );
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount || 0);
    };

    const formatDateTime = (dateTimeString) => {
        const date = new Date(dateTimeString);
        return {
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    };

    const getPriorityColor = (orderTime) => {
        const now = new Date();
        const orderDate = new Date(orderTime);
        const minutesDiff = (now - orderDate) / (1000 * 60);
        
        if (minutesDiff > 60) return 'danger'; // Over 1 hour
        if (minutesDiff > 30) return 'warning'; // Over 30 minutes
        return 'success'; // Fresh order
    };

    // DataTable columns configuration
    const columns = [
        {
            key: 'orderId',
            header: 'Order ID',
            accessor: 'orderId',
            render: (value, order) => {
                const priority = getPriorityColor(order.orderTime);
                return (
                    <div className="d-flex align-items-center gap-2">
                        <strong>#{value}</strong>
                        {priority === 'danger' && (
                            <Badge bg="danger" pill>
                                <i className="bi bi-exclamation-triangle-fill"></i>
                            </Badge>
                        )}
                        {priority === 'warning' && (
                            <Badge bg="warning" pill>
                                <i className="bi bi-clock-fill"></i>
                            </Badge>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'orderTime',
            header: 'Order Time',
            accessor: 'orderTime',
            render: (value) => {
                const { date, time } = formatDateTime(value);
                return (
                    <div className="small">
                        <div className="fw-bold">{time}</div>
                        <div className="text-muted">{date}</div>
                    </div>
                );
            }
        },
        {
            key: 'customer',
            header: 'Customer',
            accessor: 'customer',
            render: (customer) => (
                <div>
                    <strong>
                        {customer?.firstName || 'Walk-in'} {customer?.lastName || 'Customer'}
                    </strong>
                    {customer?.email && (
                        <div className="small text-muted">{customer.email}</div>
                    )}
                </div>
            )
        },
        {
            key: 'table',
            header: 'Table',
            accessor: 'table',
            render: (table) => (
                <div className="text-center">
                    {table ? (
                        <Badge bg="secondary" className="fs-6">
                            <i className="bi bi-table me-1"></i>
                            {table.tableNumber}
                        </Badge>
                    ) : (
                        <Badge bg="info" className="fs-6">
                            <i className="bi bi-house-door me-1"></i>
                            Delivery
                        </Badge>
                    )}
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
            key: 'foodItems',
            header: 'Items Preview',
            accessor: 'orderItems',
            sortable: false,
            render: (orderItems) => (
                <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '200px' }}>
                    {orderItems?.slice(0, 3).map((item, index) => (
                        <Badge 
                            key={index} 
                            bg="light" 
                            text="dark" 
                            className="small fw-normal"
                        >
                            {item.quantity}x {item.foodItem?.foodName?.substring(0, 15)}
                            {item.foodItem?.foodName?.length > 15 && '...'}
                        </Badge>
                    ))}
                    {orderItems?.length > 3 && (
                        <Badge bg="primary" className="small">
                            +{orderItems.length - 3} more
                        </Badge>
                    )}
                </div>
            )
        },
        {
            key: 'totalPrice',
            header: 'Total',
            accessor: 'totalPrice',
            render: (value) => (
                <strong className="text-success fs-6">
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
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewOrderClick(order);
                        }}
                    >
                        <i className="bi bi-eye me-1"></i>
                        View
                    </Button>
                    <Button
                        variant="outline-info"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewItemsClick(order);
                        }}
                    >
                        <i className="bi bi-list-ul me-1"></i>
                        Items
                    </Button>
                </div>
            )
        }
    ];

    if (loading) {
        return (
            <Container fluid className="py-4">
                <LoadingSpinner size="lg" message="Loading today's orders..." />
            </Container>
        );
    }

    if (error) {
        return (
            <Container fluid className="py-4">
                <Alert variant="danger">
                    <Alert.Heading>Error</Alert.Heading>
                    {error}
                </Alert>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4">
            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h1 className="mb-1">
                                <i className="bi bi-receipt me-2"></i>
                                Today's Customer Orders
                            </h1>
                            <p className="text-muted mb-0">
                                {user?.role === 'CHEF' ? 'Kitchen view of customer orders' : 'Service view of customer orders'} • 
                                Total: {orders.length} orders • 
                                Auto-refreshes every 30 seconds
                            </p>
                        </div>
                        <Button 
                            variant="outline-primary" 
                            onClick={handleRefresh}
                            className="d-flex align-items-center gap-2"
                        >
                            <i className="bi bi-arrow-clockwise"></i>
                            Refresh
                        </Button>
                    </div>
                </Col>
            </Row>

            <Row>
                <Col>
                    <DataTable
                        data={orders}
                        columns={columns}
                        loading={loading}
                        searchable={true}
                        sortable={true}
                        paginated={true}
                        pageSize={PAGINATION.DEFAULT_PAGE_SIZE}
                        searchPlaceholder="Search orders by customer, table, or items..."
                        emptyMessage="No customer orders found for today"
                        className="shadow-sm"
                    />
                </Col>
            </Row>

            {/* Order Details Modal */}
            <Modal 
                show={showOrderModal} 
                onHide={() => setShowOrderModal(false)} 
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="bi bi-receipt me-2"></i>
                        Order Details #{selectedOrder?.orderId}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedOrder && (
                        <Row>
                            <Col md={6}>
                                <Card className="mb-3">
                                    <Card.Header>
                                        <h6 className="mb-0">
                                            <i className="bi bi-info-circle me-2"></i>
                                            Order Information
                                        </h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="mb-2">
                                            <strong>Status:</strong> {getStatusBadge(selectedOrder.status)}
                                        </div>
                                        <div className="mb-2">
                                            <strong>Order Time:</strong> {formatDateTime(selectedOrder.orderTime).date} at {formatDateTime(selectedOrder.orderTime).time}
                                        </div>
                                        <div className="mb-2">
                                            <strong>Total Price:</strong> <span className="text-success fw-bold">{formatCurrency(selectedOrder.totalPrice)}</span>
                                        </div>
                                        {selectedOrder.notes && (
                                            <div className="mb-2">
                                                <strong>Notes:</strong>
                                                <div className="border rounded p-2 mt-1 bg-light">
                                                    {selectedOrder.notes}
                                                </div>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card className="mb-3">
                                    <Card.Header>
                                        <h6 className="mb-0">
                                            <i className="bi bi-person me-2"></i>
                                            Customer & Location
                                        </h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="mb-2">
                                            <strong>Customer:</strong> {selectedOrder.customer?.firstName || 'Walk-in'} {selectedOrder.customer?.lastName || 'Customer'}
                                        </div>
                                        {selectedOrder.customer?.email && (
                                            <div className="mb-2">
                                                <strong>Email:</strong> {selectedOrder.customer.email}
                                            </div>
                                        )}
                                        {selectedOrder.table ? (
                                            <div className="mb-2">
                                                <strong>Table:</strong> 
                                                <Badge bg="secondary" className="ms-2">
                                                    <i className="bi bi-table me-1"></i>
                                                    {selectedOrder.table.tableNumber}
                                                </Badge>
                                                <div className="small text-muted">
                                                    Capacity: {selectedOrder.table.capacity} people
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mb-2">
                                                <strong>Service Type:</strong>
                                                <Badge bg="info" className="ms-2">
                                                    <i className="bi bi-house-door me-1"></i>
                                                    Delivery
                                                </Badge>
                                                {selectedOrder.address && (
                                                    <div className="mt-2 p-2 border rounded bg-light">
                                                        <strong>{selectedOrder.address.name}</strong><br />
                                                        {selectedOrder.address.street}<br />
                                                        {selectedOrder.address.city}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowOrderModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Order Items Modal */}
            <Modal 
                show={showItemsModal} 
                onHide={() => setShowItemsModal(false)} 
                size="xl"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="bi bi-list-ul me-2"></i>
                        Order Items - #{selectedOrder?.orderId}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loadingItems ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" />
                            <div className="mt-2">Loading order items...</div>
                        </div>
                    ) : selectedOrderItems.length > 0 ? (
                        <Row>
                            {selectedOrderItems.map((item, index) => (
                                <Col md={6} lg={4} key={item.orderItemId || index} className="mb-3">
                                    <Card className="h-100 border shadow-sm">
                                        {item.foodItem?.image && (
                                            <div className="position-relative">
                                                <Card.Img 
                                                    variant="top" 
                                                    src={`/uploads/images/${item.foodItem.image}`}
                                                    style={{ height: '150px', objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                                <Badge 
                                                    bg="primary" 
                                                    className="position-absolute top-0 end-0 m-2"
                                                    style={{ fontSize: '0.8rem' }}
                                                >
                                                    Qty: {item.quantity}
                                                </Badge>
                                            </div>
                                        )}
                                        <Card.Body className="d-flex flex-column">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <Card.Title className="h6 mb-0">
                                                    {item.foodItem?.foodName || 'Unknown Item'}
                                                </Card.Title>
                                                {!item.foodItem?.image && (
                                                    <Badge bg="primary">
                                                        Qty: {item.quantity}
                                                    </Badge>
                                                )}
                                            </div>
                                            
                                            {item.foodItem?.description && (
                                                <Card.Text className="small text-muted mb-2">
                                                    {item.foodItem.description}
                                                </Card.Text>
                                            )}
                                            
                                            <div className="mt-auto">
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <div>
                                                        <div className="small text-muted">Unit Price</div>
                                                        <strong>{formatCurrency(item.unitPrice)}</strong>
                                                    </div>
                                                    <div className="text-end">
                                                        <div className="small text-muted">Total</div>
                                                        <strong className="text-success">{formatCurrency(item.totalPrice)}</strong>
                                                    </div>
                                                </div>
                                                
                                                {item.note && (
                                                    <Alert variant="warning" className="small mb-0 py-2">
                                                        <i className="bi bi-sticky me-1"></i>
                                                        <strong>Note:</strong> {item.note}
                                                    </Alert>
                                                )}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <Alert variant="info" className="text-center">
                            <i className="bi bi-info-circle me-2"></i>
                            No items found for this order.
                        </Alert>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <div className="d-flex justify-content-between align-items-center w-100">
                        <div>
                            {selectedOrder && (
                                <strong className="text-success">
                                    Order Total: {formatCurrency(selectedOrder.totalPrice)}
                                </strong>
                            )}
                        </div>
                        <Button variant="secondary" onClick={() => setShowItemsModal(false)}>
                            Close
                        </Button>
                    </div>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default OrdersViewPage;
