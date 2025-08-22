import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Spinner, Alert, Modal, Form, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../api';
import useAuth from '../../../contexts/use-auth';
import { DataTable } from '../../../components';
import { useToast } from '../../../hooks/useToast.js';
import { useConfirmation } from '../../../hooks/useConfirmation.js';

const AdminTablesPage = () => {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showTableModal, setShowTableModal] = useState(false);
    const [currentTable, setCurrentTable] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const { user, isAuthenticated } = useAuth();
    const { showSuccess, showError, showWarning } = useToast();
    const { confirm } = useConfirmation();
    const navigate = useNavigate();

    // Table status options
    const TABLE_STATUSES = [
        { value: 'AVAILABLE', label: 'Available', variant: 'success' },
        { value: 'OCCUPIED', label: 'Occupied', variant: 'danger' },
        { value: 'DIRTY', label: 'Dirty', variant: 'warning' }
    ];

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'ADMIN') {
            setError('Access Denied: You do not have administrative privileges.');
            setLoading(false);
            return;
        }
        fetchTables();
    }, [isAuthenticated, user]);

    const fetchTables = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/tables');
            // Tables endpoint returns array directly
            const tableData = response.data || [];
            setTables(tableData);
            setError(null);
        } catch (err) {
            setError('Failed to fetch tables. Please try again later.');
            showError(err.response?.data?.message || 'Failed to fetch tables');
            console.error('Fetch tables error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTableByName = async (tableName) => {
        try {
            const response = await apiClient.get(`/tables/by-name?name=${encodeURIComponent(tableName)}`);
            return response.data;
        } catch (err) {
            showError('Failed to fetch table details');
            console.error('Fetch table by name error:', err);
            return null;
        }
    };

    const handleAddTableClick = () => {
        setCurrentTable({ 
            tableNumber: '', 
            capacity: '', 
            tableStatus: 'AVAILABLE' 
        });
        setIsEditing(false);
        setShowTableModal(true);
    };

    const handleGetQrCodesClick = () => {
        navigate('/admin/tables/qr-codes');
    };

    const handleEditTableClick = (table) => {
        setCurrentTable({
            ...table,
            originalTableNumber: table.tableNumber // Store original name for API call
        });
        setIsEditing(true);
        setShowTableModal(true);
    };

    const handleUpdateTableStatus = async (table, newStatus) => {
        const confirmed = await confirm({
            title: 'Update Table Status',
            message: `Are you sure you want to change the status of table "${table.tableNumber}" to "${newStatus}"?`,
            confirmText: 'Update Status',
            confirmVariant: 'primary'
        });

        if (confirmed) {
            try {
                await apiClient.patch(`/tables/${table.tableNumber}/status`, { 
                    name: newStatus });
                showSuccess('Table status updated successfully', 'success');

                fetchTables();
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Failed to update table status';
                showError(errorMessage);
                console.error('Update table status error:', err);
            }
        }
    };

    const handleDeleteTable = async (table) => {
        const confirmed = await confirm({
            title: 'Delete Table',
            message: `Are you sure you want to delete table "${table.tableNumber}"? This action cannot be undone.`,
            confirmText: 'Delete',
            confirmVariant: 'danger'
        });

        if (confirmed) {
            try {
                await apiClient.delete(`/tables/${encodeURIComponent(table.tableNumber)}`);
                showSuccess('Table deleted successfully');
                fetchTables();
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Failed to delete table';
                showError(errorMessage);
                console.error('Delete table error:', err);
            }
        }
    };

    const handleSaveTable = async (e) => {
        e.preventDefault();

        if (!currentTable.tableNumber.trim()) {
            showError('Table number is required');
            return;
        }

        if (!currentTable.capacity || parseInt(currentTable.capacity) <= 0) {
            showError('Table capacity must be a positive number');
            return;
        }

        try {
            const payload = {
                tableNumber: currentTable.tableNumber.trim(),
                capacity: parseInt(currentTable.capacity),
                tableStatus: currentTable.tableStatus
            };

            if (isEditing) {
                // Update existing table - use the original table number for the URL
                const originalTableNumber = currentTable.originalTableNumber || currentTable.tableNumber;
                await apiClient.put(`/tables/${encodeURIComponent(originalTableNumber)}`, payload);
                showSuccess('Table updated successfully');
            } else {
                // Create new table
                await apiClient.post('/tables', payload);
                showSuccess('Table created successfully');
            }

            fetchTables();
            setShowTableModal(false);
            setCurrentTable(null);
            setIsEditing(false);
        } catch (err) {
            const errorMessage = err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} table`;
            showError(errorMessage);
            console.error('Save table error:', err);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = TABLE_STATUSES.find(s => s.value === status) || TABLE_STATUSES[0];
        return (
            <Badge bg={statusConfig.variant} style={{ minWidth: '70px' }}>
                {statusConfig.label}
            </Badge>
        );
    };

    // DataTable columns configuration
    const columns = [
        {
            key: 'tableNumber',
            header: 'Table Number',
            accessor: 'tableNumber',
            render: (value) => <strong>{value}</strong>
        },
        {
            key: 'capacity',
            header: 'Capacity',
            accessor: 'capacity',
            render: (value) => (
                <Badge bg="info">
                    <i className="bi bi-people-fill me-1"></i>
                    {value}
                </Badge>
            )
        },
        {
            key: 'tableStatus',
            header: 'Status',
            accessor: 'tableStatus',
            render: (_, table) => {
                const [selectedStatus, setSelectedStatus] = useState('');
                return (
                    <div className="d-flex align-items-center gap-3">
                        {getStatusBadge(table.tableStatus)}
                        <Form.Select
                            size="sm"
                            value={selectedStatus}
                            style={{ width: '96px' }}
                            onClick={e => e.stopPropagation()}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                if (e.target.value && e.target.value !== table.tableStatus) {
                                    handleUpdateTableStatus(table, e.target.value);
                                }
                            }}
                        >
                            <option value="">Change</option>
                            {TABLE_STATUSES.filter(s => s.value !== table.tableStatus).map(status => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </Form.Select>
                    </div>
                );
            }
        },
        {
            key: 'actions',
            header: 'Actions',
            accessor: 'tableNumber',
            sortable: false,
            render: (value, table) => (
                <div className="d-flex gap-1 flex-wrap">
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleEditTableClick(table); }}
                    >
                        <i className="bi bi-pencil me-1"></i>
                        Edit
                    </Button>
                    <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDeleteTable(table); }}
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
                <p className="mt-3">Loading tables...</p>
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
                <h1>Table Management</h1>
                <div className="d-flex gap-2">
                    <Button variant="secondary" onClick={handleGetQrCodesClick}>
                        <i className="bi bi-qr-code-scan me-2"></i>
                        Get QR Codes                       
                    </Button>
                    <Button variant="primary" onClick={handleAddTableClick}>
                        <i className="bi bi-plus-circle me-2"></i>
                        Add New Table
                    </Button>
                </div>
            </div>

            {/* Table Statistics */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <Card className="text-center">
                        <Card.Body>
                            <h3 className="text-primary">{tables.length}</h3>
                            <p className="mb-0">Total Tables</p>
                        </Card.Body>
                    </Card>
                </div>
                <div className="col-md-3">
                    <Card className="text-center">
                        <Card.Body>
                            <h3 className="text-success">{tables.filter(t => t.tableStatus === 'AVAILABLE').length}</h3>
                            <p className="mb-0">Available</p>
                        </Card.Body>
                    </Card>
                </div>
                <div className="col-md-3">
                    <Card className="text-center">
                        <Card.Body>
                            <h3 className="text-danger">{tables.filter(t => t.tableStatus === 'OCCUPIED').length}</h3>
                            <p className="mb-0">Occupied</p>
                        </Card.Body>
                    </Card>
                </div>
                <div className="col-md-3">
                    <Card className="text-center">
                        <Card.Body>
                            <h3 className="text-warning">{tables.filter(t => t.tableStatus === 'DIRTY').length}</h3>
                            <p className="mb-0">Dirty</p>
                        </Card.Body>
                    </Card>
                </div>
            </div>

            {tables.length === 0 ? (
                <Card>
                    <Card.Body className="text-center">
                        <p className="text-muted">No tables found. Create your first table to get started.</p>
                        <Button variant="primary" onClick={handleAddTableClick}>
                            Create First Table
                        </Button>
                    </Card.Body>
                </Card>
            ) : (
                <DataTable
                    data={tables}
                    columns={columns}
                    loading={loading}
                    searchable={true}
                    sortable={true}
                    paginated={false}
                    emptyMessage="No tables found"
                />
            )}

            {/* Add/Edit Table Modal */}
            <Modal show={showTableModal} onHide={() => setShowTableModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{isEditing ? 'Edit Table' : 'Add New Table'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSaveTable}>
                    <Modal.Body>
                        {currentTable && (
                            <>
                                <Form.Group className="mb-3">
                                    <Form.Label>Table Number *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={currentTable.tableNumber}
                                        onChange={(e) => setCurrentTable({ ...currentTable, tableNumber: e.target.value })}
                                        required
                                        placeholder="Enter table number (e.g., T001, A1, Table-5)"
                                    />
                                    {isEditing && (
                                        <Form.Text className="text-muted">
                                            Changing the table number will update the table identifier
                                        </Form.Text>
                                    )}
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Capacity *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={currentTable.capacity}
                                        onChange={(e) => setCurrentTable({ ...currentTable, capacity: e.target.value })}
                                        required
                                        placeholder="Enter table capacity (number of people)"
                                    />
                                    <Form.Text className="text-muted">
                                        Maximum number of people this table can accommodate
                                    </Form.Text>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Status</Form.Label>
                                    <Form.Select
                                        value={currentTable.tableStatus}
                                        onChange={(e) => setCurrentTable({ ...currentTable, tableStatus: e.target.value })}
                                    >
                                        {TABLE_STATUSES.map(status => (
                                            <option key={status.value} value={status.value}>
                                                {status.label}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                                {!isEditing && (
                                    <Alert variant="info">
                                        <small>
                                            <strong>Note:</strong> You can change the table status anytime using the status change button in the table list.
                                        </small>
                                    </Alert>
                                )}
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowTableModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            {isEditing ? 'Update Table' : 'Create Table'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default AdminTablesPage;
