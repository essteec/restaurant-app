import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Spinner, Alert, Modal, Form, Badge, Row, Col, Pagination as BSPagination } from 'react-bootstrap';
import apiClient from '../../../api';
import useAuth from '../../../contexts/use-auth';
import { DataTable } from '../../../components';
import { useToast } from '../../../hooks/useToast.js';
import { useConfirmation } from '../../../hooks/useConfirmation.js';
import { PAGINATION } from '../../../utils/constants';

const AdminCallRequestsPage = () => {
    const [callRequests, setCallRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCallRequestModal, setShowCallRequestModal] = useState(false);
    const [selectedCallRequest, setSelectedCallRequest] = useState(null);
    const [typeFilter, setTypeFilter] = useState('');
    const [activeFilter, setActiveFilter] = useState('');

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

    // Call request type options: WATER, PAYMENT, ASSISTANCE, NEED, PACK
    const CALL_REQUEST_TYPES = [
        { value: 'WATER', label: 'Water', variant: 'primary' },
        { value: 'PAYMENT', label: 'Payment', variant: 'success' },
        { value: 'ASSISTANCE', label: 'Assistance', variant: 'info' },
        { value: 'NEED', label: 'Need', variant: 'warning' },
        { value: 'PACK', label: 'Pack', variant: 'secondary' }
    ];

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'ADMIN') {
            setError('Access Denied: You do not have administrative privileges.');
            setLoading(false);
            return;
        }
        fetchCallRequests();
    }, [isAuthenticated, user, pagination.page, pagination.size, typeFilter, activeFilter]);

    // Pagination handlers
    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handlePageSizeChange = (newSize) => {
        setPagination(prev => ({ ...prev, page: 0, size: newSize }));
    };

    const fetchCallRequests = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                size: pagination.size.toString(),
                sort: 'createdAt,desc'
            });

            if (typeFilter) {
                params.append('type', typeFilter);
            }

            if (activeFilter) {
                params.append('active', activeFilter);
            }

            const response = await apiClient.get(`/call-requests?${params}`);
            const data = response.data;
            const callRequestData = Array.isArray(data)
                ? data
                : (data.content || []);

            // Handle empty page
            if (callRequestData.length === 0 && pagination.page > 0) {
                setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                return;
            }

            setCallRequests(callRequestData);
            // Update pagination totals
            setPagination(prev => ({
                ...prev,
                totalElements: data.totalElements ?? callRequestData.length,
                totalPages: data.totalPages || 1
            }));
            setError(null);
        } catch (err) {
            setError('Failed to fetch call requests. Please try again later.');
            showError(err.response?.data?.message || 'Failed to fetch call requests');
            console.error('Fetch call requests error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewCallRequestClick = (callRequest) => {
        setSelectedCallRequest(callRequest);
        setShowCallRequestModal(true);
    };

    const handleResolveCallRequest = async (callRequest) => {
        const confirmed = await confirm({
            title: 'Resolve Call Request',
            message: `Are you sure you want to resolve call request #${callRequest.callRequestId}?`,
            confirmText: 'Resolve',
            confirmVariant: 'success'
        });

        if (confirmed) {
            try {
                await apiClient.patch(`/call-requests/${callRequest.callRequestId}/resolve`);
                showSuccess('Call request resolved successfully');

                // Update the selected call request in the modal
                const updatedCallRequest = { ...selectedCallRequest, active: false };
                setSelectedCallRequest(updatedCallRequest);

                // Also refresh the call requests list in the background
                fetchCallRequests();
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Failed to resolve call request';
                showError(errorMessage);
                console.error('Resolve call request error:', err);
            }
        }
    };

    const handleDeleteCallRequest = async (callRequest) => {
        const confirmed = await confirm({
            title: 'Delete Call Request',
            message: `Are you sure you want to delete call request #${callRequest.callRequestId}? This action cannot be undone.`,
            confirmText: 'Delete',
            confirmVariant: 'danger'
        });

        if (confirmed) {
            try {
                await apiClient.delete(`/call-requests/${callRequest.callRequestId}`);
                showSuccess('Call request deleted successfully');
                fetchCallRequests();
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Failed to delete call request';
                showError(errorMessage);
                console.error('Delete call request error:', err);
            }
        }
    };

    const getTypeBadge = (type) => {
        const typeConfig = CALL_REQUEST_TYPES.find(t => t.value === type) || CALL_REQUEST_TYPES[0];
        return (
            <Badge bg={typeConfig.variant} style={{ minWidth: '72px' }}>
                {typeConfig.label}
            </Badge>
        );
    };

    const getActiveBadge = (active, minWidth='60px') => {
        return (
            <Badge bg={active ? 'success' : 'secondary'} style={{ minWidth: minWidth }}>
                {active ? 'Active' : 'Resolved'}
            </Badge>
        );
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return '';
        return new Date(dateTimeString).toLocaleString();
    };

    // DataTable columns configuration
    const columns = [
        {
            key: 'callRequestId',
            header: 'Request ID',
            accessor: 'callRequestId',
            render: (value) => <strong>#{value}</strong>
        },
        {
            key: 'createdAt',
            header: 'Created Time',
            accessor: 'createdAt',
            render: (value) => (
                <div className="small">
                    {formatDateTime(value)}
                </div>
            )
        },
        {
            key: 'type',
            header: 'Type',
            accessor: 'type',
            render: (value) => getTypeBadge(value)
        },
        {
            key: 'customer',
            header: 'Customer',
            accessor: 'customer',
            render: (customer) => (
                <div>
                    <strong>{customer?.firstName || 'No Customer'} {customer?.lastName || ''}</strong>
                    <div className="small text-muted">{customer?.email || 'No email'}</div>
                </div>
            )
        },
        {
            key: 'active',
            header: 'Status',
            accessor: 'active',
            render: (value) => getActiveBadge(value)
        },
        {
            key: 'actions',
            header: 'Actions',
            accessor: 'callRequestId',
            sortable: false,
            render: (value, callRequest) => (
                <div className="d-flex gap-1 flex-wrap">
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleViewCallRequestClick(callRequest); }}
                    >
                        <i className="bi bi-eye me-1"></i>
                        View
                    </Button>
                    {callRequest.active && (
                        <Button
                            variant="outline-success"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleResolveCallRequest(callRequest); }}
                        >
                            <i className="bi bi-check-circle me-1"></i>
                            Resolve
                        </Button>
                    )}
                    <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDeleteCallRequest(callRequest); }}
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

    return (
        <Container className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Call Request Management</h1>
                <div className="d-flex gap-2">
                    <Form.Select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        style={{ width: 'auto' }}
                    >
                        <option value="">All Types</option>
                        {CALL_REQUEST_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </Form.Select>
                    <Form.Select
                        value={activeFilter}
                        onChange={(e) => setActiveFilter(e.target.value)}
                        style={{ width: 'auto' }}
                    >
                        <option value="">All Status</option>
                        <option value="true">Active</option>
                        <option value="false">Resolved</option>
                    </Form.Select>
                    <Button variant="outline-secondary" onClick={fetchCallRequests}>
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Refresh
                    </Button>
                </div>
            </div>

            {callRequests.length === 0 ? (
                <Card>
                    <Card.Body className="text-center">
                        <p className="text-muted">No call requests found for the selected criteria.</p>
                    </Card.Body>
                </Card>
            ) : (
                <DataTable
                    data={callRequests}
                    columns={columns}
                    loading={loading}
                    searchable={true}
                    sortable={true}
                    paginated={false}
                    emptyMessage="No call requests found"
                />
            )}

            {/* Custom Backend Pagination Controls */}
            {callRequests.length > 0 && (
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

            {/* Call Request Details Modal */}
            <Modal show={showCallRequestModal} onHide={() => setShowCallRequestModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Call Request Details #{selectedCallRequest?.callRequestId}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedCallRequest && (
                        <>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <Card>
                                        <Card.Header>
                                            <h6 className="mb-0">Request Information</h6>
                                        </Card.Header>
                                        <Card.Body>
                                            <p><strong>Request ID:</strong> #{selectedCallRequest.callRequestId}</p>
                                            <p><strong>Created Time:</strong> {formatDateTime(selectedCallRequest.createdAt)}</p>
                                            <p><strong>Type:</strong> {getTypeBadge(selectedCallRequest.type)}</p>
                                            <p><strong>Status:</strong> {getActiveBadge(selectedCallRequest.active, "60px")}</p>
                                            {selectedCallRequest.message && (
                                                <p><strong>Message:</strong> {selectedCallRequest.message}</p>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card>
                                        <Card.Header>
                                            <h6 className="mb-0">Customer & Table Information</h6>
                                        </Card.Header>
                                        <Card.Body>
                                            <p><strong>Customer:</strong> {selectedCallRequest.customer?.firstName || 'No Customer'} {selectedCallRequest.customer?.lastName || ''}</p>
                                            <p><strong>Email:</strong> {selectedCallRequest.customer?.email || 'No email'}</p>
                                            <p><strong>Table:</strong> 
                                                {selectedCallRequest.table?.tableNumber ? (
                                                    <Badge bg="secondary" className="ms-2">{selectedCallRequest.table.tableNumber}</Badge>
                                                ) : (
                                                    <span className="text-muted ms-2">No table assigned</span>
                                                )}
                                            </p>
                                            {selectedCallRequest.table?.capacity && (
                                                <p><strong>Table Capacity:</strong> {selectedCallRequest.table.capacity}</p>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Resolution Actions */}
                            {selectedCallRequest.active && (
                                <Card className="mb-3">
                                    <Card.Header>
                                        <h6 className="mb-0">Actions</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="d-flex gap-2">
                                            <Button
                                                variant="success"
                                                onClick={() => handleResolveCallRequest(selectedCallRequest)}
                                            >
                                                <i className="bi bi-check-circle me-2"></i>
                                                Resolve Request
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                onClick={() => {
                                                    setShowCallRequestModal(false);
                                                    handleDeleteCallRequest(selectedCallRequest);
                                                }}
                                            >
                                                <i className="bi bi-trash me-2"></i>
                                                Delete Request
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Additional Information */}
                            <Card>
                                <Card.Header>
                                    <h6 className="mb-0">Request Type Details</h6>
                                </Card.Header>
                                <Card.Body>
                                    <div className="row">
                                        <div className="col-12">
                                            {selectedCallRequest.type === 'WATER' && (
                                                <Alert variant="info">
                                                    <i className="bi bi-droplet-fill me-2"></i>
                                                    Customer is requesting water service.
                                                </Alert>
                                            )}
                                            {selectedCallRequest.type === 'PAYMENT' && (
                                                <Alert variant="success">
                                                    <i className="bi bi-credit-card-fill me-2"></i>
                                                    Customer is ready to pay their bill.
                                                </Alert>
                                            )}
                                            {selectedCallRequest.type === 'ASSISTANCE' && (
                                                <Alert variant="warning">
                                                    <i className="bi bi-person-raised-hand me-2"></i>
                                                    Customer needs general assistance from staff.
                                                </Alert>
                                            )}
                                            {selectedCallRequest.type === 'NEED' && (
                                                <Alert variant="secondary">
                                                    <i className="bi bi-question-circle-fill me-2"></i>
                                                    Customer has a specific need or request.
                                                </Alert>
                                            )}
                                            {selectedCallRequest.type === 'PACK' && (
                                                <Alert variant="primary">
                                                    <i className="bi bi-box-seam me-2"></i>
                                                    Customer wants to pack remaining food.
                                                </Alert>
                                            )}
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCallRequestModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default AdminCallRequestsPage;
