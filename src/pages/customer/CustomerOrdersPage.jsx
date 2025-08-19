import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Tab, Tabs } from 'react-bootstrap';
import apiClient from '../../api';
import useAuth from '../../contexts/use-auth.js';
import { useToast } from '@/hooks/useToast.js';
import { LoadingSpinner, StatusBadge } from '../../components';
import { formatCurrency } from '@utils/helpers.js';
import './CustomerOrdersPage.css';

const CustomerOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderItems, setOrderItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    
    const { user, isAuthenticated } = useAuth();
    const { showError } = useToast();

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        fetchOrders();
    }, [isAuthenticated]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await apiClient.get('/orders');
            const ordersData = Array.isArray(response.data) ? response.data : 
                              response.data.content ? response.data.content : [];
            
            // Sort orders by date (newest first)
            const sortedOrders = ordersData.sort((a, b) => 
                new Date(b.orderTime) - new Date(a.orderTime)
            );
            
            setOrders(sortedOrders);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
            setError('Unable to load your orders. Please try again later.');
            showError('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const fetchOrderDetails = async (orderId) => {
        try {
            setDetailsLoading(true);
            const itemsResponse = await apiClient.get(`/orders/${orderId}/items`);
            setOrderItems(Array.isArray(itemsResponse.data) ? itemsResponse.data : itemsResponse.data.content ? itemsResponse.data.content : []);
        } catch (err) {
            console.error('Failed to fetch order details:', err);
            showError('Failed to load order details');
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleOrderSelect = (order) => {
        setSelectedOrder(order);
        setOrderItems([]);
        fetchOrderDetails(order.orderId);
    };

    const getStatusVariant = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': 
            case 'delivered': 
                return 'success';
            case 'cancelled': 
                return 'danger';
            case 'preparing': 
                return 'warning';
            case 'ready': 
                return 'info';
            case 'placed': 
            case 'pending': 
                return 'primary';
            case 'shipped': 
                return 'secondary';
            default: 
                return 'light';
        }
    };

    const getFilteredOrders = () => {
        if (activeTab === 'all') return orders;
        return orders.filter(order => {
            const status = order.status?.toLowerCase();
            switch (activeTab) {
                case 'active':
                    return ['placed', 'pending', 'preparing', 'ready'].includes(status);
                case 'completed':
                    return ['completed', 'delivered'].includes(status);
                case 'cancelled':
                    return status === 'cancelled';
                default:
                    return true;
            }
        });
    };

    const OrderCard = ({ order, isSelected, onClick }) => (
        <Card 
            className={`order-card mb-3 ${isSelected ? 'selected' : ''}`}
            onClick={() => onClick(order)}
            style={{ cursor: 'pointer' }}
        >
            <Card.Body>
                <Row className="align-items-center">
                    <Col md={3}>
                        <div className="order-header">
                            <h6 className="mb-1">Order #{order.orderId}</h6>
                            <small className="text-muted">
                                {new Date(order.orderTime).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </small>
                        </div>
                    </Col>
                    <Col md={2}>
                        <StatusBadge status={order.status} variant={getStatusVariant(order.status)} />
                    </Col>
                    <Col md={2}>
                        {order.table && (
                            <div className="table-info">
                                <small className="text-muted">Table</small>
                                <div className="fw-bold">{order.table.tableNumber}</div>
                            </div>
                        )}
                    </Col>
                    <Col md={3}>
                        <div className="total-price">
                            <small className="text-muted">Total</small>
                            <div className="fw-bold text-primary h5 mb-0">
                                {formatCurrency(order.totalPrice)}
                            </div>
                        </div>
                    </Col>
                    <Col md={2} className="text-end">
                        <Button 
                            variant={isSelected ? "primary" : "outline-primary"} 
                            size="sm"
                        >
                            {isSelected ? 'Selected' : 'View Details'}
                        </Button>
                    </Col>
                </Row>
                {order.notes && (
                    <Row className="mt-2">
                        <Col>
                            <small className="text-muted">
                                <strong>Notes:</strong> {order.notes}
                            </small>
                        </Col>
                    </Row>
                )}
            </Card.Body>
        </Card>
    );

    const OrderDetailsPanel = () => {
        if (!selectedOrder) {
            return (
                <Card className="order-details-panel">
                    <Card.Body className="text-center py-5">
                        <div className="text-muted">
                            <i className="bi bi-receipt" style={{ fontSize: '3rem' }}></i>
                            <h5 className="mt-3">Select an Order</h5>
                            <p>Choose an order from the list to view detailed information</p>
                        </div>
                    </Card.Body>
                </Card>
            );
        }

        if (detailsLoading) {
            return (
                <Card className="order-details-panel">
                    <Card.Body className="text-center py-5">
                        <LoadingSpinner size="lg" />
                        <p className="mt-3 text-muted">Loading order details...</p>
                    </Card.Body>
                </Card>
            );
        }

        return (
            <Card className="order-details-panel">
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Order #{selectedOrder.orderId}</h5>
                        <StatusBadge 
                            status={selectedOrder.status} 
                            variant={getStatusVariant(selectedOrder.status)}
                            size="lg"
                        />
                    </div>
                </Card.Header>
                <Card.Body>
                    <Row className="mb-4">
                        <Col md={12}>
                            <div className="order-info">
                                <h6 className="text-muted mb-3">Order Information</h6>
                                <div className="mb-2">
                                    <strong>Order Date:</strong>{' '}
                                    {new Date(selectedOrder.orderTime).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                                {selectedOrder.table && (
                                    <div className="mb-2">
                                        <strong>Table:</strong> {selectedOrder.table.tableNumber} 
                                    </div>
                                )}
                                <div className="mb-2">
                                    <strong>Total Amount:</strong>{' '}
                                    <span className="text-primary fw-bold">
                                        {formatCurrency(selectedOrder.totalPrice)}
                                    </span>
                                </div>
                                {selectedOrder.notes && (
                                    <div className="mb-2">
                                        <strong>Order Notes:</strong>
                                        <div className="bg-light p-2 rounded mt-1">
                                            {selectedOrder.notes}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Col>
                    </Row>

                    <div className="order-items">
                        <h6 className="text-muted mb-3">Order Items</h6>
                        {orderItems.length > 0 ? (
                            <div className="items-list">
                                {orderItems.map((item, index) => (
                                    <Card key={index} className="item-card mb-2">
                                        <Card.Body className="py-2">
                                            <Row className="align-items-center">
                                                <Col md={1}>
                                                    <Badge bg="secondary" className="quantity-badge">
                                                        {item.quantity}x
                                                    </Badge>
                                                </Col>
                                                <Col md={6}>
                                                    <div className="item-details">
                                                        <h6 className="mb-1">{item.foodItem?.foodName || item.foodName}</h6>
                                                        {item.note && (
                                                            <small className="text-muted">
                                                                <em>Note: {item.note}</em>
                                                            </small>
                                                        )}
                                                    </div>
                                                </Col>
                                                <Col md={2} className="text-center">
                                                    <small className="text-muted">Unit Price</small>
                                                    <div>{formatCurrency(item.unitPrice || item.price)}</div>
                                                </Col>
                                                <Col md={3} className="text-end">
                                                    <small className="text-muted">Subtotal</small>
                                                    <div className="fw-bold">
                                                        {formatCurrency(item.totalPrice || (item.quantity * (item.unitPrice || item.price)))}
                                                    </div>
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Alert variant="info">
                                No items found for this order.
                            </Alert>
                        )}
                    </div>

                    <div className="order-summary mt-4 pt-3 border-top">
                        <Row>
                            <Col md={8}></Col>
                            <Col md={4}>
                                <div className="summary-row d-flex justify-content-between mb-2">
                                    <span>Subtotal:</span>
                                    <span>{formatCurrency(selectedOrder.totalPrice)}</span>
                                </div>
                                <div className="summary-row d-flex justify-content-between mb-2 fw-bold h5">
                                    <span>Total:</span>
                                    <span className="text-primary">{formatCurrency(selectedOrder.totalPrice)}</span>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </Card.Body>
            </Card>
        );
    };

    if (loading) {
        return (
            <Container className="customer-orders-page">
                <div className="text-center py-5">
                    <LoadingSpinner size="lg" />
                    <h4 className="mt-3 text-muted">Loading your orders...</h4>
                    <p className="text-muted">Please wait while we fetch your order history</p>
                </div>
            </Container>
        );
    }

    if (!isAuthenticated) {
        return (
            <Container className="customer-orders-page">
                <Alert variant="warning" className="text-center mt-4">
                    <Alert.Heading>Authentication Required</Alert.Heading>
                    <p>Please log in to view your order history.</p>
                    <Button variant="primary" href="/login">
                        Go to Login
                    </Button>
                </Alert>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="customer-orders-page">
                <Alert variant="danger" className="text-center mt-4">
                    <Alert.Heading>Unable to Load Orders</Alert.Heading>
                    <p>{error}</p>
                    <Button variant="outline-danger" onClick={fetchOrders}>
                        Try Again
                    </Button>
                </Alert>
            </Container>
        );
    }

    const filteredOrders = getFilteredOrders();

    return (
        <div className="customer-orders-page">
            <Container fluid className="orders-hero-section bg-light py-4 mb-4">
                <Container>
                    <Row className="align-items-center">
                        <Col md={8}>
                            <h1 className="display-5 mb-2 text-primary">My Orders</h1>
                            <p className="lead text-muted">
                                Track and review your order history
                            </p>
                        </Col>
                        <Col md={4} className="text-end">
                            <div className="orders-stats">
                                <Badge bg="secondary" className="me-2">
                                    {orders.length} Total Orders
                                </Badge>
                                <Badge bg="info">
                                    {filteredOrders.length} Showing
                                </Badge>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </Container>

            <Container>
                {orders.length === 0 ? (
                    <div className="empty-state text-center py-5">
                        <div className="text-muted">
                            <i className="bi bi-receipt" style={{ fontSize: '4rem' }}></i>
                            <h3 className="mt-3">No Orders Yet</h3>
                            <p className="mb-4">You haven't placed any orders yet. Start exploring our menu!</p>
                            <Button variant="primary" href="/menu" size="lg">
                                Browse Menu
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <Tabs
                            activeKey={activeTab}
                            onSelect={(key) => setActiveTab(key)}
                            className="order-tabs mb-4"
                            fill
                        >
                            <Tab eventKey="all" title={
                                <span>
                                    All Orders
                                    <Badge bg="light" text="dark" className="ms-2">
                                        {orders.length}
                                    </Badge>
                                </span>
                            } />
                            <Tab eventKey="active" title={
                                <span>
                                    Active
                                    <Badge bg="warning" className="ms-2">
                                        {orders.filter(o => ['placed', 'pending', 'preparing', 'ready'].includes(o.status?.toLowerCase())).length}
                                    </Badge>
                                </span>
                            } />
                            <Tab eventKey="completed" title={
                                <span>
                                    Completed
                                    <Badge bg="success" className="ms-2">
                                        {orders.filter(o => ['completed', 'delivered'].includes(o.status?.toLowerCase())).length}
                                    </Badge>
                                </span>
                            } />
                            <Tab eventKey="cancelled" title={
                                <span>
                                    Cancelled
                                    <Badge bg="danger" className="ms-2">
                                        {orders.filter(o => o.status?.toLowerCase() === 'cancelled').length}
                                    </Badge>
                                </span>
                            } />
                        </Tabs>

                        <Row>
                            <Col lg={6}>
                                <div className="orders-list">
                                    <h5 className="mb-3">
                                        {activeTab === 'all' ? 'All Orders' : 
                                         activeTab === 'active' ? 'Active Orders' :
                                         activeTab === 'completed' ? 'Completed Orders' : 'Cancelled Orders'}
                                        <small className="text-muted ms-2">({filteredOrders.length})</small>
                                    </h5>
                                    
                                    {filteredOrders.length === 0 ? (
                                        <Alert variant="info" className="text-center">
                                            <i className="bi bi-info-circle me-2"></i>
                                            No orders found in this category.
                                        </Alert>
                                    ) : (
                                        filteredOrders.map((order) => (
                                            <OrderCard
                                                key={order.orderId}
                                                order={order}
                                                isSelected={selectedOrder?.orderId === order.orderId}
                                                onClick={handleOrderSelect}
                                            />
                                        ))
                                    )}
                                </div>
                            </Col>
                            <Col lg={6}>
                                <div className="order-details-section">
                                    <h5 className="mb-3">Order Details</h5>
                                    <OrderDetailsPanel />
                                </div>
                            </Col>
                        </Row>
                    </>
                )}
            </Container>
        </div>
    );
};

export default CustomerOrdersPage;