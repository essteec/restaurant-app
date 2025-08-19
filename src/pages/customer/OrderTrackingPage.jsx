import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Modal, Form, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api';
import useAuth from '../../contexts/use-auth.js';
import { useToast } from '@/hooks/useToast.js';
import { LoadingSpinner, StatusBadge } from '../../components';
import { formatCurrency } from '@utils/helpers.js';
import { ORDER_STATUS, CALL_REQUEST_TYPES } from '../../utils/constants.js';
import routes from '../../routes/routes.js';
import './OrderTrackingPage.css';

const OrderTrackingPage = () => {
    const [lastOrder, setLastOrder] = useState(null);
    const [callRequests, setCallRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCallRequestModal, setShowCallRequestModal] = useState(false);
    const [newCallRequest, setNewCallRequest] = useState({ type: '', message: '' });
    const [submittingCallRequest, setSubmittingCallRequest] = useState(false);
    
    const { user, isAuthenticated } = useAuth();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate(routes.LOGIN);
            return;
        }

        fetchOrderAndCallRequests();
        
        // Set up auto-refresh every 30 seconds
        const interval = setInterval(refreshData, 30000);
        
        return () => clearInterval(interval);
    }, [isAuthenticated, navigate]);

    const fetchOrderAndCallRequests = async () => {
        try {
            setLoading(true);
            await Promise.all([fetchLastOrder(), fetchCallRequests()]);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const refreshData = async () => {
        try {
            setRefreshing(true);
            await Promise.all([fetchLastOrder(), fetchCallRequests()]);
        } catch (err) {
            console.error('Failed to refresh data:', err);
        } finally {
            setRefreshing(false);
        }
    };

    const fetchLastOrder = async () => {
        try {
            const response = await apiClient.get('/orders/last');
            setLastOrder(response.data);
        } catch (err) {
            if (err.response?.status === 404) {
                setLastOrder(null);
            } else {
                console.error('Failed to fetch last order:', err);
                showError('Failed to load order information');
            }
        }
    };

    const fetchCallRequests = async () => {
        try {
            const response = await apiClient.get('/call-requests/my/latest');
            const requestsData = Array.isArray(response.data) ? response.data : 
                               response.data.content ? response.data.content : [];
            setCallRequests(requestsData);
        } catch (err) {
            console.error('Failed to fetch call requests:', err);
            showError('Failed to load call requests');
        }
    };

    const handleCreateCallRequest = async () => {
        if (!newCallRequest.type) {
            showError('Please select a request type');
            return;
        }

        try {
            setSubmittingCallRequest(true);
            await apiClient.post('/call-requests', newCallRequest);
            showSuccess('Call request sent successfully!');
            setShowCallRequestModal(false);
            setNewCallRequest({ type: '', message: '' });
            await fetchCallRequests();
        } catch (err) {
            console.error('Failed to create call request:', err);
            showError('Failed to send call request');
        } finally {
            setSubmittingCallRequest(false);
        }
    };

    const handleResolveCallRequest = async (requestId) => {
        try {
            await apiClient.patch(`/call-requests/${requestId}`);
            showSuccess('Call request marked as resolved');
            await fetchCallRequests();
        } catch (err) {
            console.error('Failed to resolve call request:', err);
            showError('Failed to resolve call request');
        }
    };

    const getOrderStatusProgress = (status) => {
        const statuses = ['PLACED', 'PREPARING', 'READY', 'DELIVERED'];
        let currentIndex;
        if (status) {
            currentIndex = statuses.indexOf(status.toUpperCase());
            if (status === ORDER_STATUS.CANCELLED || status === ORDER_STATUS.COMPLETED) {
                return 100;
            }
        }

        return currentIndex >= 0 ? ((currentIndex) / (statuses.length - 1)) * 100 : 0;
    };

    const getOrderStatusVariant = (status) => {
        switch (status?.toUpperCase()) {
            case 'DELIVERED':
                return 'primary';
            case 'COMPLETED':
                return 'success';
            case 'CANCELLED':
                return 'danger';
            case 'PREPARING':
                return 'warning';
            case 'READY':
                return 'info';
            default:
                return 'secondary';
        }
    };

    const getCallRequestTypeLabel = (type) => {
        const labels = {
            WATER: 'Water',
            ASSISTANCE: 'Assistance',
            NEED: 'Need Help',
            PAYMENT: 'Payment',
            PACK: 'Pack Order'
        };
        return labels[type] || type;
    };

    const getCallRequestTypeIcon = (type) => {
        const icons = {
            WATER: 'bi-droplet',
            ASSISTANCE: 'bi-question-circle',
            NEED: 'bi-hand-thumbs-up',
            PAYMENT: 'bi-credit-card',
            PACK: 'bi-box'
        };
        return icons[type] || 'bi-bell';
    };

    const canCreateCallRequests = () => {
        if (!lastOrder) return false;
        const status = lastOrder.status?.toUpperCase();

        return status !== 'COMPLETED' && status !== 'CANCELLED' && lastOrder.table;
    };

    if (loading) {
        return (
            <Container className="order-tracking-page">
                <div className="text-center py-5">
                    <LoadingSpinner size="lg" />
                    <h4 className="mt-3 text-muted">Loading your order...</h4>
                    <p className="text-muted">Please wait while we fetch your order status</p>
                </div>
            </Container>
        );
    }

    if (!isAuthenticated) {
        return (
            <Container className="order-tracking-page">
                <Alert variant="warning" className="text-center mt-4">
                    <Alert.Heading>Authentication Required</Alert.Heading>
                    <p>Please log in to track your order.</p>
                    <Button variant="primary" onClick={() => navigate(routes.LOGIN)}>
                        Go to Login
                    </Button>
                </Alert>
            </Container>
        );
    }

    if (!lastOrder) {
        return (
            <Container className="order-tracking-page">
                <div className="text-center py-5">
                    <div className="text-muted">
                        <i className="bi bi-receipt" style={{ fontSize: '4rem' }}></i>
                        <h3 className="mt-3">No Recent Orders</h3>
                        <p className="mb-4">You don't have any recent orders to track.</p>
                        <Button variant="primary" onClick={() => navigate(routes.MENU)} size="lg">
                            Browse Menu
                        </Button>
                    </div>
                </div>
            </Container>
        );
    }

    return (
        <div className="order-tracking-page">
            <Container fluid className="tracking-hero-section bg-light py-4 mb-4">
                <Container>
                    <Row className="align-items-center">
                        <Col md={8}>
                            <h1 className="display-6 mb-2 text-primary">Order Tracking</h1>
                            <p className="lead text-muted">
                                Track your order status and request assistance
                            </p>
                        </Col>
                        <Col md={4} className="text-end">
                            <Button 
                                variant="outline-primary" 
                                onClick={() => navigate(routes.MENU)}
                                className="me-2"
                            >
                                <i className="bi bi-arrow-left me-1"></i>
                                Back to Menu
                            </Button>
                            <Button 
                                variant="outline-secondary" 
                                onClick={refreshData}
                                disabled={refreshing}
                            >
                                {refreshing ? (
                                    <i className="bi bi-arrow-clockwise me-1 spin"></i>
                                ) : (
                                    <i className="bi bi-arrow-clockwise me-1"></i>
                                )}
                                Refresh
                            </Button>
                        </Col>
                    </Row>
                </Container>
            </Container>

            <Container>
                <Row>
                    <Col lg={8}>
                        {/* Order Status Card */}
                        <Card className="order-status-card mb-4">
                            <Card.Header className="bg-white">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">Order #{lastOrder.orderId}</h5>
                                </div>
                            </Card.Header>
                            <Card.Body>
                                {/* Order Progress */}
                                <div className="order-progress mb-4">
                                    <div className="d-flex justify-content-between mb-2">
                                        <small className="text-muted">Order Progress</small>
                                        <Badge 
                                            bg={getOrderStatusVariant(lastOrder.status)} 
                                            className={`px-2 py-1`} 
                                            >
                                            {lastOrder.status}
                                        </Badge>
                                    </div>
                                    <ProgressBar 
                                        now={getOrderStatusProgress(lastOrder.status)}
                                        variant={getOrderStatusVariant(lastOrder.status)}
                                        className="mb-3"
                                    />
                                    <div className="progress-steps d-flex justify-content-between">
                                        <div className="step">
                                            <i className={`bi bi-gear ${lastOrder.status === 'PREPARING' ? 'text-warning' : 'text-muted'}`}></i>
                                            <div className="step-label">Preparing</div>
                                        </div>
                                        <div className="step">
                                            <i className={`bi bi-check2-circle ${lastOrder.status === 'READY' ? 'text-info' : 'text-muted'}`}></i>
                                            <div className="step-label">Ready</div>
                                        </div>
                                        <div className="step">
                                            <i className={`bi bi-truck ${lastOrder.status === 'DELIVERED' ? 'text-success' : 'text-muted'}`}></i>
                                            <div className="step-label">Delivered</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Information */}
                                <Row>
                                    <Col md={6}>
                                        <div className="order-info">
                                            <h6 className="text-muted mb-3">Order Information</h6>
                                            <div className="mb-2">
                                                <strong>Order Time:</strong>{' '}
                                                {new Date(lastOrder.orderTime).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                            {lastOrder.table && (
                                                <div className="mb-2">
                                                    <strong>Table:</strong> {lastOrder.table.tableNumber}
                                                </div>
                                            )}
                                            <div className="mb-2">
                                                <strong>Total Amount:</strong>{' '}
                                                <span className="text-primary fw-bold">
                                                    {formatCurrency(lastOrder.totalPrice)}
                                                </span>
                                            </div>
                                            {lastOrder.notes && (
                                                <div className="mb-2">
                                                    <strong>Notes:</strong>
                                                    <div className="bg-light p-2 rounded mt-1">
                                                        {lastOrder.notes}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        {/* Order Items */}
                                        <div className="order-items">
                                            <h6 className="text-muted mb-3">Order Items</h6>
                                            {lastOrder.orderItems && lastOrder.orderItems.length > 0 ? (
                                                <div className="items-list">
                                                    {lastOrder.orderItems.map((item, index) => (
                                                        <div key={index} className="item-row d-flex justify-content-between mb-2 p-2 bg-light rounded">
                                                            <div>
                                                                <Badge bg="secondary" className="me-2">{item.quantity}x</Badge>
                                                                <span>{item.foodItem?.foodName || item.foodName}</span>
                                                                {item.note && (
                                                                    <div>
                                                                        <small className="text-muted">
                                                                            <em>Note: {item.note}</em>
                                                                        </small>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="fw-bold">
                                                                {formatCurrency(item.totalPrice || (item.quantity * (item.unitPrice || item.price)))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <Alert variant="info" className="mb-0">
                                                    Order items information not available.
                                                </Alert>
                                            )}
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={4}>
                        {/* Call Requests Section */}
                        <Card className="call-requests-card">
                            <Card.Header className="bg-white">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">
                                        <i className="bi bi-bell me-2"></i>
                                        Call Requests
                                    </h5>
                                    {canCreateCallRequests() && (
                                        <Button 
                                            variant="primary" 
                                            size="sm"
                                            onClick={() => setShowCallRequestModal(true)}
                                        >
                                            <i className="bi bi-plus me-1"></i>
                                            Request Help
                                        </Button>
                                    )}
                                </div>
                            </Card.Header>
                            <Card.Body>
                                {!canCreateCallRequests() && (
                                    <Alert variant="info" className="mb-3">
                                        <i className="bi bi-info-circle me-2"></i>
                                        Call requests are not available for completed or cancelled orders.
                                    </Alert>
                                )}

                                {canCreateCallRequests() && (
                                    <div className="quick-request-buttons mb-3">
                                        <h6 className="text-muted mb-2">Quick Requests</h6>
                                        <div className="d-grid gap-2">
                                            {Object.entries(CALL_REQUEST_TYPES).map(([key, value]) => (
                                                <Button
                                                    key={key}
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    onClick={() => {
                                                        setNewCallRequest({ type: value, message: '' });
                                                        setShowCallRequestModal(true);
                                                    }}
                                                >
                                                    <i className={`${getCallRequestTypeIcon(value)} me-2`}></i>
                                                    {getCallRequestTypeLabel(value)}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="current-requests">
                                    <h6 className="text-muted mb-2">Current Requests</h6>
                                    {callRequests.length === 0 ? (
                                        <div className="text-center text-muted py-3">
                                            <i className="bi bi-check-circle" style={{ fontSize: '2rem' }}></i>
                                            <p className="mt-2 mb-0">No active requests</p>
                                        </div>
                                    ) : (
                                        <div className="requests-list">
                                            {callRequests.map((request) => (
                                                <Card key={request.callRequestId} className="request-card mb-2">
                                                    <Card.Body className="p-3">
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div className="flex-grow-1">
                                                                <div className="d-flex align-items-center mb-1">
                                                                    <i className={`${getCallRequestTypeIcon(request.type)} me-2 text-primary`}></i>
                                                                    <strong>{getCallRequestTypeLabel(request.type)}</strong>
                                                                    <Badge 
                                                                        bg={request.active ? 'warning' : 'success'} 
                                                                        className="ms-2"
                                                                    >
                                                                        {request.active ? 'Pending' : 'Resolved'}
                                                                    </Badge>
                                                                </div>
                                                                {request.message && (
                                                                    <p className="mb-1 text-muted small">{request.message}</p>
                                                                )}
                                                                <small className="text-muted">
                                                                    {new Date(request.createdAt).toLocaleTimeString('en-US', {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </small>
                                                            </div>
                                                            {request.active && (
                                                                <Button
                                                                    variant="outline-success"
                                                                    size="sm"
                                                                    onClick={() => handleResolveCallRequest(request.callRequestId)}
                                                                >
                                                                    <i className="bi bi-check me-1"></i>
                                                                    Resolve
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </Card.Body>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Quick Actions */}
                        <Card className="quick-actions-card mt-4">
                            <Card.Header className="bg-white">
                                <h5 className="mb-0">
                                    <i className="bi bi-lightning me-2"></i>
                                    Quick Actions
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <div className="d-grid gap-2">
                                    <Button 
                                        variant="primary" 
                                        onClick={() => navigate(routes.MENU)}
                                    >
                                        <i className="bi bi-grid me-2"></i>
                                        Browse Menu
                                    </Button>
                                    <Button 
                                        variant="outline-secondary" 
                                        onClick={() => navigate(routes.ORDERS)}
                                    >
                                        <i className="bi bi-list me-2"></i>
                                        View All Orders
                                    </Button>
                                    <Button 
                                        variant="outline-secondary" 
                                        onClick={() => navigate(routes.PROFILE)}
                                    >
                                        <i className="bi bi-person me-2"></i>
                                        My Profile
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>

            {/* Call Request Modal */}
            <Modal show={showCallRequestModal} onHide={() => setShowCallRequestModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Request Assistance</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Request Type *</Form.Label>
                            <Form.Select
                                value={newCallRequest.type}
                                onChange={(e) => setNewCallRequest({ ...newCallRequest, type: e.target.value })}
                                required
                            >
                                <option value="">Select a request type...</option>
                                {Object.entries(CALL_REQUEST_TYPES).map(([key, value]) => (
                                    <option key={key} value={value}>
                                        {getCallRequestTypeLabel(value)}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Additional Message (Optional)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={newCallRequest.message}
                                onChange={(e) => setNewCallRequest({ ...newCallRequest, message: e.target.value })}
                                placeholder="Any additional details or special requests..."
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCallRequestModal(false)}>
                        Cancel
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleCreateCallRequest}
                        disabled={submittingCallRequest || !newCallRequest.type}
                    >
                        {submittingCallRequest ? (
                            <>
                                <LoadingSpinner size="sm" className="me-2" />
                                Sending...
                            </>
                        ) : (
                            'Send Request'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default OrderTrackingPage;
