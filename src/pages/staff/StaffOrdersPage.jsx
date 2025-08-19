import React, { useState, useEffect } from 'react';
import { Container, Button, Spinner, Alert, Modal, Badge, Form } from 'react-bootstrap';
import apiClient from '@api';
import useAuth from '@contexts/use-auth.js';
import { useToast } from '../../hooks/useToast.js';
import { useConfirmation } from '../../hooks/useConfirmation.js';

const StaffOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [showItemsModal, setShowItemsModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedOrderItems, setSelectedOrderItems] = useState([]);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [availableTables, setAvailableTables] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);

    const { user, isAuthenticated } = useAuth();
    const { showSuccess, showError, showWarning } = useToast();
    const { confirm } = useConfirmation();

    // Order status options for waiters
    const ORDER_STATUSES = [
        { value: 'PLACED', label: 'Placed', color: '#ffae00', bgColor: '#cce5ff' },
        { value: 'PREPARING', label: 'Preparing', color: '#6c757d', bgColor: '#e9ecef' },
        { value: 'READY', label: 'Ready', color: user.role === 'CHEF' ? '#28a745' : '#ff1a1a', bgColor: '#d1ecf1' },
        { value: 'SHIPPED', label: 'Shipped', color: '#69b1ffff', bgColor: '#e8f1d1' },
        { value: 'DELIVERED', label: 'Delivered', color: '#006ce0ff', bgColor: '#cce5ff' },
        { value: 'COMPLETED', label: 'Completed', color: '#28a745', bgColor: '#d4edda' },
        { value: 'CANCELLED', label: 'Cancelled', color: '#df4f5d', bgColor: '#f8d7da' }
    ];

    useEffect(() => {
        if (!isAuthenticated || !['CHEF', 'WAITER', 'ADMIN'].includes(user?.role)) {
            setError('Access Denied: You do not have waiter privileges.');
            setLoading(false);
            return;
        }
        fetchOrders();
        fetchAvailableTables();
    }, [isAuthenticated, user, statusFilter]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            let url = '/employee/orders?size=100'; // Use employee endpoint for waiters
            
            if (statusFilter !== 'ALL') {
                url += `&status=${statusFilter}`;
            }

            const response = await apiClient.get(url);
            const orderData = response.data?.content || [];
            setOrders(orderData);
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
            const response = await apiClient.get('/tables/available');
            setAvailableTables(response.data || []);
        } catch (err) {
            console.error('Failed to fetch available tables:', err);
        }
    };

    const fetchOrderItems = async (orderId) => {
        try {
            setLoadingItems(true);
            const response = await apiClient.get(`/employee/orders/${orderId}/items`);
            // API returns array directly, not paginated content
            return response.data || [];
        } catch (err) {
            showError('Failed to fetch order items');
            console.error('Fetch order items error:', err);
            return [];
        } finally {
            setLoadingItems(false);
        }
    };

    const handleViewOrderDetails = async (order) => {
        setSelectedOrder(order);
        setShowOrderModal(true);
    };

    const handleViewOrderItems = async (order) => {
        const items = await fetchOrderItems(order.orderId);
        setSelectedOrder(order);
        setSelectedOrderItems(items);
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
                showSuccess(`Order #${order.orderId} status updated to ${newStatus}`);
                fetchOrders();
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Failed to update order status';
                showError(errorMessage);
                console.error('Update order status error:', err);
            }
        }
    };

    const handleChangeOrderTable = async (order, newTableNumber) => {
        const confirmed = await confirm({
            title: 'Change Order Table',
            message: `Are you sure you want to move order #${order.orderId} to table ${newTableNumber}?`,
            confirmText: 'Change Table',
            confirmVariant: 'warning'
        });

        if (confirmed) {
            try {
                await apiClient.patch(`/employee/orders/${order.orderId}/table`, { 
                    name: newTableNumber 
                });
                showSuccess(`Order #${order.orderId} moved to table ${newTableNumber}`);
                fetchOrders();
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Failed to change order table';
                showError(errorMessage);
                console.error('Change order table error:', err);
            }
        }
    };

    const getOrderStatusConfig = (status) => {
        return ORDER_STATUSES.find(s => s.value === status) || ORDER_STATUSES[0];
    };

    const getTimeAgo = (dateString) => {
        const now = new Date();
        const orderTime = new Date(dateString);
        const diffMs = now - orderTime;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const OrderCard = ({ order, bgColor }) => {
        const statusConfig = getOrderStatusConfig(order.status);
        const timeAgo = getTimeAgo(order.orderTime);
        const isOld = new Date() - new Date(order.orderTime) > 60 * 60 * 1000; // 60+ minutes old

        return (
            <div 
                style={{
                    background: 'white',
                    borderRadius: '12px',
                    marginTop: '2px',
                    padding: '20px',
                    boxShadow: isOld && order.status !== 'COMPLETED' ? '0 4px 16px rgba(220, 53, 69, 0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
                    border: `3px solid ${statusConfig.color}`,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    minHeight: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative'
                }}
                className="order-card"
                onClick={() => handleViewOrderDetails(order)}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = isOld && order.status !== 'COMPLETED' ? '0 6px 20px rgba(220, 53, 69, 0.3)' : '0 4px 16px rgba(0,0,0,0.15)';
                    e.currentTarget.style.borderWidth = '4px';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = isOld && order.status !== 'COMPLETED' ? '0 4px 16px rgba(220, 53, 69, 0.2)' : '0 2px 8px rgba(0,0,0,0.1)';
                    e.currentTarget.style.borderWidth = '3px';
                }}
            >
                {isOld && order.status !== 'COMPLETED' && (
                    <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        background: '#dc3545',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                    }}>
                        OLD ORDER
                    </div>
                )}
                
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <h5 style={{ margin: 0, color: '#2c3e50', fontSize: '18px', fontWeight: 'bold' }}>
                            Order #{order.orderId}
                        </h5>
                        <div style={{
                            background: statusConfig.color,
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}>
                            {statusConfig.label}
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        {order.table && (
                            <Badge bg="secondary" style={{ fontSize: '12px' }}>
                                <i className="bi bi-table me-1"></i>
                                {order.table.tableNumber}
                            </Badge>
                        )}
                        <span style={{ fontSize: '12px', color: '#6c757d' }}>
                            {timeAgo}
                        </span>
                    </div>
                    
                    <div style={{ fontSize: '14px', color: '#495057', marginBottom: '8px' }}>
                        Customer: {order.customer?.firstName || 'No Customer'} {order.customer?.lastName || ''}
                    </div>
                    
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#28a745' }}>
                        {formatCurrency(order.totalPrice)}
                    </div>
                    
                    {order.notes && (
                        <p style={{ 
                            color: '#495057', 
                            fontSize: '12px', 
                            margin: '8px 0 0 0',
                            fontStyle: 'italic',
                            lineHeight: '1.4'
                        }}>
                            Note: "{order.notes}"
                        </p>
                    )}
                </div>
                
                <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            handleViewOrderItems(order); 
                        }}
                    >
                        <i className="bi bi-list me-1"></i>
                        Items
                    </Button>
                    
                    {order.status === 'PLACED' && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                if (user?.role === 'WAITER') {
                                    handleUpdateOrderStatus(order, 'DELIVERED');
                                }
                                else {
                                    handleUpdateOrderStatus(order, 'PREPARING'); // if user is WAITER 'DELIVERED' else 'PREPARING' 
                                }
                            }}
                        >
                            <i className="bi bi-clock me-1"></i>
                            { user?.role === 'WAITER' ? 'Deliver' : 'Start Prep' }
                        </Button>
                    )}
                    {order.status === 'PREPARING' && (
                        <Button
                            variant="info"
                            size="sm"
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                handleUpdateOrderStatus(order, 'READY'); 
                            }}
                        >
                            <i className="bi bi-check-circle me-1"></i>
                            Mark Ready
                        </Button>
                    )}
                    {order.status === 'READY' && user.role !== 'CHEF' && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                handleUpdateOrderStatus(order, 'DELIVERED'); 
                            }}
                        >
                            <i className="bi bi-truck me-1"></i>
                            Deliver
                        </Button>
                    )}
                    {(order.status === 'DELIVERED' || order.status === 'SHIPPED') && (
                        <Button
                            variant="success"
                            size="sm"
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                handleUpdateOrderStatus(order, 'COMPLETED'); 
                            }}
                        >
                            <i className="bi bi-check-all me-1"></i>
                            Complete
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    const OrderSection = ({ title, orders, bgColor, icon }) => {
        if (orders.length === 0) return null;
        
        return (
            <div style={{ flex: '1 1 0', minWidth: '320px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '16px',
                    padding: '12px 16px',
                    background: bgColor,
                    borderRadius: '8px',
                    color: 'white'
                }}>
                    <i className={`bi ${icon} me-2`} style={{ fontSize: '20px' }}></i>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                        {title} ({orders.length})
                    </h3>
                </div>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                    // Remove maxHeight and overflowY to allow page to expand
                }}>
                    {orders.map(order => (
                        <OrderCard key={order.orderId} order={order} bgColor={bgColor} />
                    ))}
                </div>
            </div>
        );
    };

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

    
    const groupedOrders = {
        orders: orders.sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime)),
        PLACED: orders.filter(o => o.status === 'PLACED'),
        PREPARING: orders.filter(o => o.status === 'PREPARING'),
        READY: orders.filter(o => o.status === 'READY'),
        ACTIVE: orders.filter(o => o.status === 'DELIVERED' || o.status === 'SHIPPED'),
        COMPLETED: orders.filter(o => o.status === 'COMPLETED' || o.status === 'CANCELLED')
    };

    return (
        <Container fluid className="mt-4" style={{ maxWidth: '1400px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 style={{ color: '#2c3e50', fontWeight: 'bold' }}>Order Management</h1>
                <div className="d-flex gap-3 align-items-center">
                    <div style={{
                        background: orders.length > 0 ? '#e79e02' : '#f8f9fa',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: orders.length > 0 ? 'white' : '#495057'
                    }}>
                        <i className="bi bi-plus me-2"></i>
                        {groupedOrders.PLACED.length} New Orders
                    </div>

                    <div style={{
                        background: orders.length > 0 ? '#e7181b' : '#f8f9fa',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: orders.length > 0 ? 'white' : '#495057'
                    }}>
                        <i className="bi bi-receipt me-2"></i>
                        {groupedOrders.READY.length} Orders Ready
                    </div>
                    <Button 
                        variant="outline-primary" 
                        onClick={fetchOrders}
                        style={{ borderRadius: '20px' }}
                    >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Refresh
                    </Button>
                </div>

            </div>

            {/* Status Filter For Only Admin! */}
            {user.role === 'ADMIN' && ( 
                <div style={{ 
                    background: 'white', 
                    padding: '16px', 
                    borderRadius: '12px', 
                    marginBottom: '24px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <Form.Group className="row align-items-center">
                        <div className="col-md-4">
                            <Form.Label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                                Filter by Status
                            </Form.Label>
                            <Form.Select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{ borderRadius: '8px' }}
                            >
                                <option value="ALL">All Orders</option>
                                {ORDER_STATUSES.map(status => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </div>
                    </Form.Group>
                </div>
            )}

            {orders.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px',
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <i className="bi bi-receipt-cutoff" style={{ fontSize: '48px', color: '#6c757d', marginBottom: '16px' }}></i>
                    <p style={{ color: '#6c757d', fontSize: '18px', margin: 0 }}>No orders found</p>
                    <Button 
                        variant="outline-primary" 
                        onClick={fetchOrders}
                        style={{ marginTop: '16px', borderRadius: '20px' }}
                    >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Refresh Orders
                    </Button>
                </div>
            ) : (
                // Horizontal layout for order sections
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', overflowX: 'auto' }}>
                    <OrderSection
                        title="New Orders"
                        orders={groupedOrders.PLACED}
                        bgColor="#ffae00"
                        icon="bi-plus-circle-fill"
                    />
                    <OrderSection
                        title="Preparing"
                        orders={groupedOrders.PREPARING}
                        bgColor="#6c757d"
                        icon="bi-clock-fill"
                    />
                    <OrderSection
                        title="Ready To Serve"
                        orders={groupedOrders.READY}
                        bgColor={user.role === 'CHEF' ? '#28a745' : '#ff1a1a'}
                        icon="bi-check-circle-fill"
                    />
                    <OrderSection
                        title="Active Orders"
                        orders={groupedOrders.ACTIVE}
                        bgColor="#007bffff"
                        icon="bi-truck-flatbed"
                    />
                    <OrderSection
                        title="Completed Orders"  
                        orders={groupedOrders.COMPLETED}
                        bgColor="#28a745"
                        icon="bi-check-all"
                    />
                </div>
            )}

            {/* Order Details Modal */}
            <Modal show={showOrderModal} onHide={() => setShowOrderModal(false)} size="lg" centered>
                <Modal.Header closeButton style={{ background: '#f8f9fa', borderBottom: 'none' }}>
                    <Modal.Title style={{ color: '#2c3e50' }}>
                        <i className="bi bi-receipt me-2"></i>
                        Order #{selectedOrder?.orderId}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: '24px' }}>
                    {selectedOrder && (
                        <div>
                            <div style={{
                                textAlign: 'center',
                                marginBottom: '24px',
                                padding: '20px',
                                background: getOrderStatusConfig(selectedOrder.status).bgColor,
                                borderRadius: '12px'
                            }}>
                                <h4 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>
                                    Order #{selectedOrder.orderId}
                                </h4>
                                <div style={{
                                    background: getOrderStatusConfig(selectedOrder.status).color,
                                    color: 'white',
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    display: 'inline-block'
                                }}>
                                    {getOrderStatusConfig(selectedOrder.status).label}
                                </div>
                                <p style={{ margin: '8px 0 0 0', color: '#6c757d' }}>
                                    <i className="bi bi-clock me-1"></i>
                                    {new Date(selectedOrder.orderTime).toLocaleString()} • {formatCurrency(selectedOrder.totalPrice)}
                                </p>
                            </div>
                            
                            <div className="row">
                                <div className="col-md-6">
                                    <h6 style={{ marginBottom: '12px', color: '#495057' }}>Customer</h6>
                                    <p style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>
                                        {selectedOrder.customer?.firstName || 'No Customer'} {selectedOrder.customer?.lastName || ''}
                                    </p>
                                    <small style={{ color: '#6c757d' }}>
                                        {selectedOrder.customer?.email || 'N/A'}
                                    </small>
                                </div>
                                <div className="col-md-6">
                                    <h6 style={{ marginBottom: '12px', color: '#495057' }}>Table</h6>
                                    <p style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>
                                        {selectedOrder.table?.tableNumber || 'No Table Assigned'}
                                    </p>
                                    {availableTables.length > 0 && (
                                        <Form.Select 
                                            size="sm"
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    handleChangeOrderTable(selectedOrder, e.target.value);
                                                    setShowOrderModal(false);
                                                }
                                            }}
                                        >
                                            <option value="">Change Table</option>
                                            {availableTables.map(table => (
                                                <option key={table.tableNumber} value={table.tableNumber}>
                                                    {table.tableNumber}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    )}
                                </div>
                            </div>
                            
                            {selectedOrder.notes && (
                                <div style={{ marginTop: '20px' }}>
                                    <h6 style={{ marginBottom: '12px', color: '#495057' }}>Notes</h6>
                                    <p style={{ 
                                        margin: 0, 
                                        color: '#2c3e50',
                                        fontStyle: 'italic',
                                        padding: '12px',
                                        background: '#f8f9fa',
                                        borderRadius: '8px'
                                    }}>
                                        "{selectedOrder.notes}"
                                    </p>
                                </div>
                            )}
                            
                            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                                <h6 style={{ marginBottom: '16px', color: '#495057' }}>Update Status</h6>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                    {ORDER_STATUSES.filter(s => s.value !== selectedOrder.status).map(status => (
                                        <Button
                                            key={status.value}
                                            style={{ 
                                                backgroundColor: status.color,
                                                borderColor: status.color,
                                                borderRadius: '20px'
                                            }}
                                            onClick={() => {
                                                handleUpdateOrderStatus(selectedOrder, status.value);
                                                setShowOrderModal(false);
                                            }}
                                        >
                                            {status.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer style={{ borderTop: 'none', justifyContent: 'center' }}>
                    <Button 
                        variant="secondary" 
                        onClick={() => setShowOrderModal(false)}
                        style={{ borderRadius: '20px', paddingLeft: '24px', paddingRight: '24px' }}
                    >
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Order Items Modal */}
            <Modal show={showItemsModal} onHide={() => setShowItemsModal(false)} size="lg" centered>
                <Modal.Header closeButton style={{ background: '#f8f9fa', borderBottom: 'none' }}>
                    <Modal.Title style={{ color: '#2c3e50' }}>
                        <i className="bi bi-list me-2"></i>
                        Order #{selectedOrder?.orderId} Items
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: '24px' }}>
                    {loadingItems ? (
                        <div className="text-center">
                            <Spinner animation="border" />
                            <p className="mt-3">Loading order items...</p>
                        </div>
                    ) : (
                        <div>
                            {selectedOrderItems.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#6c757d' }}>No items found for this order</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {selectedOrderItems.map(item => (
                                        <div 
                                            key={item.orderItemId}
                                            style={{
                                                padding: '16px',
                                                background: '#f8f9fa',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div>
                                                <h6 style={{ margin: '0 0 4px 0', color: '#2c3e50' }}>
                                                    {item.foodItem?.foodName || 'Unknown Item'}
                                                </h6>
                                                <div style={{ fontSize: '14px', color: '#6c757d' }}>
                                                    Quantity: {item.quantity} × {formatCurrency(item.unitPrice)}
                                                </div>
                                                {item.note && (
                                                    <div style={{ fontSize: '12px', color: '#495057', fontStyle: 'italic', marginTop: '4px' }}>
                                                        Note: "{item.note}"
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ fontWeight: 'bold', color: '#28a745', fontSize: '16px' }}>
                                                {formatCurrency(item.totalPrice)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer style={{ borderTop: 'none', justifyContent: 'center' }}>
                    <Button 
                        variant="secondary" 
                        onClick={() => setShowItemsModal(false)}
                        style={{ borderRadius: '20px', paddingLeft: '24px', paddingRight: '24px' }}
                    >
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default StaffOrdersPage;
