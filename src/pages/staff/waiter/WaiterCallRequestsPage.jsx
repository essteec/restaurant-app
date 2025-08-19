import React, { useState, useEffect } from 'react';
import { Container, Button, Spinner, Alert, Modal, Badge, Form } from 'react-bootstrap';
import apiClient from '../../../api';
import useAuth from '../../../contexts/use-auth';
import { useToast } from '../../../hooks/useToast.js';
import { useConfirmation } from '../../../hooks/useConfirmation.js';

const WaiterCallRequestsPage = () => {
    const [callRequests, setCallRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [filterType, setFilterType] = useState('ALL');
    const [showActiveOnly, setShowActiveOnly] = useState(true);

    const { user, isAuthenticated } = useAuth();
    const { showSuccess, showError, showWarning } = useToast();
    const { confirm } = useConfirmation();

    // Call request types with their properties
    const REQUEST_TYPES = [
        { value: 'WATER', label: 'Water', icon: 'bi-droplet-fill', color: '#17a2b8', bgColor: '#d1ecf1' },
        { value: 'PAYMENT', label: 'Payment', icon: 'bi-credit-card-fill', color: '#28a745', bgColor: '#d4edda' },
        { value: 'ASSISTANCE', label: 'Assistance', icon: 'bi-person-raised-hand', color: '#ffc107', bgColor: '#fff3cd' },
        { value: 'NEED', label: 'Need Help', icon: 'bi-exclamation-circle-fill', color: '#dc3545', bgColor: '#f8d7da' },
        { value: 'PACK', label: 'Takeout', icon: 'bi-bag-fill', color: '#6f42c1', bgColor: '#e2d9f3' }
    ];

    useEffect(() => {
        if (!isAuthenticated || !['WAITER', 'ADMIN'].includes(user?.role)) {
            setError('Access Denied: You do not have waiter privileges.');
            setLoading(false);
            return;
        }
        fetchCallRequests();
    }, [isAuthenticated, user, filterType, showActiveOnly]);

    const fetchCallRequests = async () => {
        try {
            setLoading(true);
            let url = '/call-requests?size=50'; // Get more items to show
            
            if (filterType !== 'ALL') {
                url += `&type=${filterType}`;
            }
            
            if (showActiveOnly) {
                url += `&active=true`;
            }

            const response = await apiClient.get(url);
            const requestData = response.data?.content || [];
            setCallRequests(requestData);
            setError(null);
        } catch (err) {
            setError('Failed to fetch call requests. Please try again later.');
            showError(err.response?.data?.message || 'Failed to fetch call requests');
            console.error('Fetch call requests error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCallRequestById = async (id) => {
        try {
            const response = await apiClient.get(`/call-requests/${id}`);
            return response.data;
        } catch (err) {
            showError('Failed to fetch call request details');
            console.error('Fetch call request by ID error:', err);
            return null;
        }
    };

    const handleViewRequestDetails = async (id) => {
        const request = await fetchCallRequestById(id);
        if (request) {
            setSelectedRequest(request);
            setShowRequestModal(true);
        }
    };

    const handleResolveRequest = async (request) => {
        const confirmed = await confirm({
            title: 'Resolve Call Request',
            message: `Are you sure you want to resolve this ${request.type.toLowerCase()} request from table ${request.table?.tableNumber}?`,
            confirmText: 'Resolve Request',
            confirmVariant: 'success'
        });

        if (confirmed) {
            try {
                await apiClient.patch(`/call-requests/${request.callRequestId}/resolve`);
                showSuccess(`${request.type} request from table ${request.table?.tableNumber} has been resolved`);
                fetchCallRequests();
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Failed to resolve call request';
                showError(errorMessage);
                console.error('Resolve call request error:', err);
            }
        }
    };

    const handleDeleteRequest = async (request) => {
        const confirmed = await confirm({
            title: 'Delete Call Request',
            message: `Are you sure you want to delete this ${request.type.toLowerCase()} request from table ${request.table?.tableNumber}?`,
            confirmText: 'Delete Request',
            confirmVariant: 'danger'
        });

        if (confirmed) {
            try {
                await apiClient.delete(`/call-requests/${request.callRequestId}`);
                showSuccess(`${request.type} request from table ${request.table?.tableNumber} has been deleted`);
                fetchCallRequests();
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Failed to delete call request';
                showError(errorMessage);
                console.error('Delete call request error:', err);
            }
        }
    };

    const getRequestTypeConfig = (type) => {
        return REQUEST_TYPES.find(t => t.value === type) || REQUEST_TYPES[0];
    };

    const getTimeAgo = (dateString) => {
        const now = new Date();
        const requestTime = new Date(dateString);
        const diffMs = now - requestTime;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    const RequestCard = ({ request }) => {
        const typeConfig = getRequestTypeConfig(request.type);
        const timeAgo = getTimeAgo(request.createdAt);
        const isUrgent = new Date() - new Date(request.createdAt) > 5 * 60 * 1000; // 5+ minutes old
        
        return (
            <div 
                style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: isUrgent ? '0 4px 16px rgba(220, 53, 69, 0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
                    border: isUrgent ? '2px solid #dc3545' : `2px solid ${typeConfig.color}`,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    minHeight: '140px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative'
                }}
                className="request-card"
                onClick={() => handleViewRequestDetails(request.callRequestId)}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = isUrgent ? '0 6px 20px rgba(220, 53, 69, 0.3)' : '0 4px 16px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = isUrgent ? '0 4px 16px rgba(220, 53, 69, 0.2)' : '0 2px 8px rgba(0,0,0,0.1)';
                }}
            >
                {!request.active ? (
                    <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: '#414549ff',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                    }}>
                        RESOLVED
                    </div>
                ) : isUrgent ? (
                    <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: '#dc3545',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                    }}>
                        URGENT
                    </div>
                ) : (
                    <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: '#0fe9a0ff',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                    }}>
                        NEW
                    </div>
                )}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{
                            background: typeConfig.color,
                            color: 'white',
                            borderRadius: '8px',
                            padding: '8px',
                            marginRight: '12px'
                        }}>
                            <i className={typeConfig.icon} style={{ fontSize: '18px' }}></i>
                        </div>
                        <div>
                            <h5 style={{ margin: '0 0 4px 0', color: '#2c3e50', fontSize: '16px', fontWeight: 'bold' }}>
                                {typeConfig.label} Request
                            </h5>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Badge bg="secondary" style={{ fontSize: '12px' }}>
                                    <i className="bi bi-table me-1"></i>
                                    {request.table ? request.table.tableNumber : 'Unknown Table'} 
                                </Badge>
                                <span style={{ fontSize: '12px', color: '#6c757d' }}>
                                    {timeAgo}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {request.message && (
                        <p style={{ 
                            color: '#495057', 
                            fontSize: '14px', 
                            margin: '8px 0 0 0',
                            fontStyle: 'italic',
                            lineHeight: '1.4'
                        }}>
                            "{request.message}"
                        </p>
                    )}
                    
                    <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '8px' }}>
                        Customer: {request.customer ? `${request.customer.firstName} ${request.customer.lastName}` : 'Unknown Customer'}
                    </div>
                </div>
                
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    <Button
                        variant="success"
                        size="sm"
                        style={{ flex: 1 }}
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            handleResolveRequest(request); 
                        }}
                    >
                        <i className="bi bi-check-circle me-1"></i>
                        Resolve
                    </Button>
                    {user?.role === 'ADMIN' && (
                        <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                            handleDeleteRequest(request); 
                        }}
                        >
                            <i className="bi bi-trash"></i>
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    const RequestSection = ({ title, requests, bgColor, icon }) => {
        if (requests.length === 0) return null;
        
        return (
            <div style={{ flex: '1 1 0', minWidth: '300px' }}>
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
                        {title} ({requests.length})
                    </h3>
                </div>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    maxHeight: '600px',
                    overflowY: 'auto'
                }}>
                    {requests.map(request => (
                        <RequestCard key={request.callRequestId} request={request} />
                    ))}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <Container className="text-center mt-4">
                <Spinner animation="border" />
                <p className="mt-3">Loading call requests...</p>
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

    // Group requests by type for the horizontal layout
    const groupedRequests = REQUEST_TYPES.reduce((acc, type) => {
        acc[type.value] = callRequests.filter(req => req.type === type.value);
        return acc;
    }, {});

    const totalActiveRequests = callRequests.filter(req => req.active).length;

    return (
        <Container fluid className="mt-4" style={{ maxWidth: '1400px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 style={{ color: '#2c3e50', fontWeight: 'bold' }}>Call Requests</h1>
                <div className="d-flex gap-3 align-items-center">
                    <div style={{
                        background: totalActiveRequests > 0 ? '#dc3545' : '#f8f9fa',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: totalActiveRequests > 0 ? 'white' : '#495057'
                    }}>
                        <i className="bi bi-bell-fill me-2"></i>
                        {totalActiveRequests} Active Requests
                    </div>
                    <Button 
                        variant="outline-primary" 
                        onClick={fetchCallRequests}
                        style={{ borderRadius: '20px' }}
                    >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Refresh
                    </Button>
                </div>
            </div>

            {user?.role === 'ADMIN' && (
                <div style={{ 
                    background: 'white', 
                    padding: '16px', 
                    borderRadius: '12px', 
                    marginBottom: '24px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <div className="row align-items-center">
                        <div className="col-md-6">
                            <Form.Group>
                                <Form.Label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                                    Filter by Type
                                </Form.Label>
                                <Form.Select 
                                    value={filterType} 
                                    onChange={(e) => setFilterType(e.target.value)}
                                    style={{ borderRadius: '8px' }}
                                >
                                    <option value="ALL">All Types</option>
                                    {REQUEST_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group>
                                <Form.Label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                                    Status Filter
                                </Form.Label>
                                <div>
                                    <Form.Check
                                        type="switch"
                                        id="active-switch"
                                        label="Show Active Only"
                                        checked={showActiveOnly}
                                        onChange={(e) => setShowActiveOnly(e.target.checked)}
                                        />
                                </div>
                            </Form.Group>
                        </div>
                    </div>
                </div>
            )}

            {callRequests.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px',
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <i className="bi bi-bell-slash" style={{ fontSize: '48px', color: '#6c757d', marginBottom: '16px' }}></i>
                    <p style={{ color: '#6c757d', fontSize: '18px', margin: 0 }}>
                        {showActiveOnly ? 'No active call requests' : 'No call requests found'}
                    </p>
                    <Button 
                        variant="outline-primary" 
                        onClick={fetchCallRequests}
                        style={{ marginTop: '16px', borderRadius: '20px' }}
                    >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Refresh
                    </Button>
                </div>
            ) : (
                // Horizontal layout for request sections
                <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', overflowX: 'auto' }}>
                    {REQUEST_TYPES.map(type => {
                        const typeRequests = groupedRequests[type.value];
                        if (typeRequests.length === 0) return null;
                        
                        return (
                            <RequestSection
                                key={type.value}
                                title={type.label}
                                requests={typeRequests}
                                bgColor={type.color}
                                icon={type.icon}
                            />
                        );
                    })}
                </div>
            )}

            {/* Request Details Modal */}
            <Modal show={showRequestModal} onHide={() => setShowRequestModal(false)} size="md" centered>
                <Modal.Header closeButton style={{ background: '#f8f9fa', borderBottom: 'none' }}>
                    <Modal.Title style={{ color: '#2c3e50' }}>
                        <i className="bi bi-bell me-2"></i>
                        Call Request Details
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: '24px' }}>
                    {selectedRequest && (
                        <div>
                            <div style={{
                                textAlign: 'center',
                                marginBottom: '24px',
                                padding: '20px',
                                background: getRequestTypeConfig(selectedRequest.type).bgColor,
                                borderRadius: '12px'
                            }}>
                                <div style={{
                                    background: getRequestTypeConfig(selectedRequest.type).color,
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '60px',
                                    height: '60px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 12px auto'
                                }}>
                                    <i className={getRequestTypeConfig(selectedRequest.type).icon} style={{ fontSize: '24px' }}></i>
                                </div>
                                <h4 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>
                                    {getRequestTypeConfig(selectedRequest.type).label} Request
                                </h4>
                                <p style={{ margin: 0, color: '#6c757d' }}>
                                    {selectedRequest.table ? `Table ${selectedRequest.table.tableNumber}` : "Unknown Table"} • {getTimeAgo(selectedRequest.createdAt)}
                                </p>
                            </div>
                            
                            <div style={{ marginBottom: '20px' }}>
                                <p style={{ margin: 0, color: '#2c3e50' }}>
                                    {selectedRequest.customer?.firstName || "Unknown"} {selectedRequest.customer?.lastName || "Customer"}
                                </p>
                                <small style={{ color: '#6c757d' }}>
                                    {selectedRequest.customer?.email || "Unknown Email"}
                                </small>
                            </div>
                            
                            {selectedRequest.message && (
                                <div style={{ marginBottom: '20px' }}>
                                    <h6 style={{ marginBottom: '12px', color: '#495057' }}>Message</h6>
                                    <p style={{ 
                                        margin: 0, 
                                        color: '#2c3e50',
                                        fontStyle: 'italic',
                                        padding: '12px',
                                        background: '#f8f9fa',
                                        borderRadius: '8px'
                                    }}>
                                        "{selectedRequest.message}"
                                    </p>
                                </div>
                            )}
                            
                            <div style={{ textAlign: 'center' }}>
                                <h6 style={{ marginBottom: '16px', color: '#495057' }}>Actions</h6>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <Button
                                        variant="success"
                                        style={{ flex: 1, borderRadius: '20px' }}
                                        onClick={() => {
                                            handleResolveRequest(selectedRequest);
                                            setShowRequestModal(false);
                                        }}
                                    >
                                        <i className="bi bi-check-circle me-2"></i>
                                        Resolve Request
                                    </Button>
                                    {user?.role === 'ADMIN' && (
                                        <Button
                                            variant="danger"
                                            style={{ borderRadius: '20px' }}
                                            onClick={() => {
                                                handleDeleteRequest(selectedRequest);
                                                setShowRequestModal(false);
                                            }}
                                        >
                                            <i className="bi bi-trash"></i>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer style={{ borderTop: 'none', justifyContent: 'center' }}>
                    <Button 
                        variant="secondary" 
                        onClick={() => setShowRequestModal(false)}
                        style={{ borderRadius: '20px', paddingLeft: '24px', paddingRight: '24px' }}
                    >
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default WaiterCallRequestsPage;
