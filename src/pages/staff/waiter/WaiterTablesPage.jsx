import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Spinner, Alert, Modal, Form, Badge } from 'react-bootstrap';
import apiClient from '../../../api';
import useAuth from '../../../contexts/use-auth';
import { useToast } from '../../../hooks/useToast.js';
import { useConfirmation } from '../../../hooks/useConfirmation.js';

const WaiterTablesPage = () => {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showTableModal, setShowTableModal] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);

    const { user, isAuthenticated } = useAuth();
    const { showSuccess, showError, showWarning } = useToast();
    const { confirm } = useConfirmation();

    // Table status options for waiters
    const TABLE_STATUSES = [
        { value: 'AVAILABLE', label: 'Available', variant: 'success' },
        { value: 'OCCUPIED', label: 'Occupied', variant: 'danger' },
        { value: 'DIRTY', label: 'Dirty', variant: 'warning' }
    ];

    useEffect(() => {
        if (!isAuthenticated || !['WAITER', 'ADMIN'].includes(user?.role)) {
            setError('Access Denied: You do not have waiter privileges.');
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
            const response = await apiClient.get(`/tables/by-name?name=${tableName}`);
            return response.data;
        } catch (err) {
            showError('Failed to fetch table details');
            console.error('Fetch table by name error:', err);
            return null;
        }
    };

    const fetchAvailableTables = async () => {
        try {
            const response = await apiClient.get('/tables/available');
            return response.data || [];
        } catch (err) {
            showError('Failed to fetch available tables');
            console.error('Fetch available tables error:', err);
            return [];
        }
    };

    const handleViewTableDetails = async (name) => {
        const table = await fetchTableByName(name);
        setSelectedTable(table);
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
                    name: newStatus 
                });
                showSuccess(`Table ${table.tableNumber} status updated to ${newStatus}`);
                fetchTables();
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Failed to update table status';
                showError(errorMessage);
                console.error('Update table status error:', err);
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'AVAILABLE': return '#28a745';
            case 'OCCUPIED': return '#dc3545';
            case 'DIRTY': return '#ffc107';
            default: return '#6c757d';
        }
    };

    const TableCard = ({ table }) => {
        const statusColor = getStatusColor(table.tableStatus);
        
        return (
            <div 
                style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: `3px solid ${statusColor}`,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    minHeight: '120px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}
                className="table-card"
                onClick={() => handleViewTableDetails(table.tableNumber)}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <h4 style={{ 
                        margin: '0 0 8px 0', 
                        color: '#2c3e50',
                        fontSize: '24px',
                        fontWeight: 'bold'
                    }}>
                        Table {table.tableNumber}
                    </h4>
                    <div style={{
                        background: statusColor,
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        display: 'inline-block'
                    }}>
                        {table.tableStatus.toLowerCase().replace('_', ' ')}
                    </div>
                </div>
                
                <div style={{ marginTop: '12px' }}>
                    {table.tableStatus === 'DIRTY' && (
                        <Button
                            variant="success"
                            size="sm"
                            style={{ width: '100%', marginBottom: '6px' }}
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                handleUpdateTableStatus(table, 'AVAILABLE'); 
                            }}
                        >
                            <i className="bi bi-check-circle me-1"></i>
                            Mark Clean
                        </Button>
                    )}
                    {table.tableStatus === 'AVAILABLE' && (
                        <Button
                            variant="warning"
                            size="sm"
                            style={{ width: '100%', marginBottom: '6px' }}
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                handleUpdateTableStatus(table, 'OCCUPIED'); 
                            }}
                        >
                            <i className="bi bi-person-plus me-1"></i>
                            Seat Guests
                        </Button>
                    )}
                    {table.tableStatus === 'OCCUPIED' && (
                        <Button
                            variant="outline-warning"
                            size="sm"
                            style={{ width: '100%', marginBottom: '6px' }}
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                handleUpdateTableStatus(table, 'DIRTY'); 
                            }}
                        >
                            <i className="bi bi-exclamation-triangle me-1"></i>
                            Clear Table
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    const TableSection = ({ title, tables, bgColor, icon }) => {
        if (tables.length === 0) return null;
        
        return (
            <div style={{ marginBottom: '32px' }}>
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
                        {title} ({tables.length})
                    </h3>
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '16px'
                }}>
                    {tables.map(table => (
                        <TableCard key={table.tableNumber} table={table} />
                    ))}
                </div>
            </div>
        );
    };

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
        <Container fluid className="mt-4" style={{ maxWidth: '1400px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 style={{ color: '#2c3e50', fontWeight: 'bold' }}>Table Management</h1>
                <div className="d-flex gap-3 align-items-center">
                    <div style={{
                        background: '#f8f9fa',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#495057'
                    }}>
                        <i className="bi bi-grid-3x3-gap me-2"></i>
                        {tables.length} Total Tables
                    </div>
                    <Button 
                        variant="outline-primary" 
                        onClick={fetchTables}
                        style={{ borderRadius: '20px' }}
                    >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Refresh
                    </Button>
                </div>
            </div>

            {tables.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px',
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <i className="bi bi-table" style={{ fontSize: '48px', color: '#6c757d', marginBottom: '16px' }}></i>
                    <p style={{ color: '#6c757d', fontSize: '18px', margin: 0 }}>No tables found in the system.</p>
                    <Button 
                        variant="outline-primary" 
                        onClick={fetchTables}
                        style={{ marginTop: '16px', borderRadius: '20px' }}
                    >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Refresh Table List
                    </Button>
                </div>
            ) : (
                // Horizontal group layout for table sections
                <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', overflowX: 'auto' }}>
                    <div style={{ flex: '1 1 0', minWidth: '280px' }}>
                        <TableSection
                            title="Available"
                            tables={tables.filter(t => t.tableStatus === 'AVAILABLE')}
                            bgColor="#28a745"
                            icon="bi-check-circle-fill"
                        />
                    </div>
                    <div style={{ flex: '1 1 0', minWidth: '280px' }}>
                        <TableSection
                            title="Occupied"
                            tables={tables.filter(t => t.tableStatus === 'OCCUPIED')}
                            bgColor="#dc3545"
                            icon="bi-person-fill"
                        />
                    </div>
                    <div style={{ flex: '1 1 0', minWidth: '280px' }}>
                        <TableSection
                            title="Needs Cleaning"
                            tables={tables.filter(t => t.tableStatus === 'DIRTY')}
                            bgColor="#ffc107"
                            icon="bi-exclamation-triangle-fill"
                        />
                    </div>
                </div>
            )}

            {/* Table Details Modal */}
            <Modal show={showTableModal} onHide={() => setShowTableModal(false)} size="md" centered>
                <Modal.Header closeButton style={{ background: '#f8f9fa', borderBottom: 'none' }}>
                    <Modal.Title style={{ color: '#2c3e50' }}>
                        <i className="bi bi-table me-2"></i>
                        Table {selectedTable?.tableNumber}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: '24px' }}>
                    {selectedTable && (
                        <div>
                            <div style={{
                                textAlign: 'center',
                                marginBottom: '24px',
                                padding: '20px',
                                background: '#f8f9fa',
                                borderRadius: '12px'
                            }}>
                                <h4 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>
                                    Table {selectedTable.tableNumber}
                                </h4>
                                <div style={{
                                    background: getStatusColor(selectedTable.tableStatus),
                                    color: 'white',
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    display: 'inline-block'
                                }}>
                                    {selectedTable.tableStatus.toLowerCase().replace('_', ' ')}
                                </div>
                            </div>
                            
                            <div style={{ textAlign: 'center' }}>
                                <h6 style={{ marginBottom: '16px', color: '#495057' }}>Change Status</h6>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {TABLE_STATUSES.filter(s => s.value !== selectedTable.tableStatus).map(status => (
                                        <Button
                                            key={status.value}
                                            variant={status.variant}
                                            style={{ borderRadius: '20px' }}
                                            onClick={() => {
                                                handleUpdateTableStatus(selectedTable, status.value);
                                                setShowTableModal(false);
                                            }}
                                        >
                                            Change to {status.label}
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
                        onClick={() => setShowTableModal(false)}
                        style={{ borderRadius: '20px', paddingLeft: '24px', paddingRight: '24px' }}
                    >
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default WaiterTablesPage;
