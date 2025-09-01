import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form, InputGroup, Modal, Table, Pagination as BSPagination } from 'react-bootstrap';
import apiClient from '../../../api';
import useAuth from '../../../contexts/use-auth';
import { LoadingSpinner, DataTable } from '../../../components';
import { useToast } from '../../../hooks/useToast.js';
import { useConfirmation } from '../../../hooks/useConfirmation.js';
import { USER_ROLES, PAGINATION } from '../../../utils/constants';
import { formatDate } from '../../../utils/helpers';

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filteredRole, setFilteredRole] = useState('');
    const [pagination, setPagination] = useState({
        page: 0,
        size: PAGINATION.DEFAULT_PAGE_SIZE,
        totalElements: 0,
        totalPages: 0
    });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    // Restored formData state (was removed inadvertently)
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'CUSTOMER',
        birthday: '',
        salary: '',
        loyaltyPoints: ''
    });
    // Newly added state
    const [showSalaryModal, setShowSalaryModal] = useState(false);
    const [salaryUser, setSalaryUser] = useState(null);
    const [salaryValue, setSalaryValue] = useState('');
    const [showAddressesModal, setShowAddressesModal] = useState(false);
    const [addressesUser, setAddressesUser] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [loadingAddresses, setLoadingAddresses] = useState(false);

    const { user, isAuthenticated } = useAuth();
    const { showSuccess, showError, showWarning, showInfo } = useToast();
    const { confirm } = useConfirmation();
    const showConfirmation = confirm; // alias for existing calls
    const [searchQuery, setSearchQuery] = useState('');
    const [searchInputValue, setSearchInputValue] = useState('');

    // Helper function to maintain compatibility
    const showToast = (message, type = 'info') => {
        switch (type) {
            case 'success': return showSuccess(message);
            case 'error': return showError(message);
            case 'warning': return showWarning(message);
            case 'info': return showInfo(message);
            default: return showInfo(message);
        }
    };

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'ADMIN') {
            setError('Access Denied: You do not have administrative privileges.');
            setLoading(false);
            return;
        }

        fetchUsers();
    }, [isAuthenticated, user, pagination.page, pagination.size, filteredRole, searchQuery]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                size: pagination.size.toString(),
                sort: 'firstName,asc'
            });
            if (filteredRole) params.append('role', filteredRole);
            
            let response;
            if (searchQuery?.trim()) {
                params.append('query', searchQuery.trim());
                response = await apiClient.get(`/users/search?${params}`);
            } else {
                response = await apiClient.get(`/users/?${params}`);
            }

            const data = response.data;
            const content = (data.content || []).map(u => ({
                ...u,
                name: `${u.firstName} ${u.lastName || ''}`.trim()
            }));
            // If the current page becomes empty (after deletions) and not the first page, go back one page
            if (content.length === 0 && pagination.page > 0) {
                setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                return; // trigger re-fetch via useEffect
            }
            setUsers(content);
            setPagination(prev => ({
                ...prev,
                totalElements: data.totalElements ?? content.length,
                totalPages: data.totalPages || 1
            }));
            setError(null);
        } catch (err) {
            setError('Failed to fetch users. Please try again later.');
            showToast(err.response?.data?.message || 'Failed to fetch users', 'error');
            console.error('Fetch users error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const isValidPassword = (pwd) => /(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}/.test(pwd);
            if (!isValidPassword(formData.password)) {
                showToast('Password must have upper, lower, digit, min 6 chars', 'error');
                return;
            }
            const payload = { ...formData };
            
            // Convert salary to number if present and not empty
            if (payload.salary && payload.salary !== '' && payload.role !== 'CUSTOMER') {
                payload.salary = parseFloat(payload.salary);
            } else {
                delete payload.salary; // Remove empty or invalid salary field
            }
            
            // Convert loyalty points to number if present and not empty
            if (payload.loyaltyPoints && payload.loyaltyPoints !== '') {
                payload.loyaltyPoints = parseInt(payload.loyaltyPoints, 10);
            } else {
                delete payload.loyaltyPoints; // Remove empty loyalty points field
            }
            
            // Remove empty fields
            if (!payload.lastName) delete payload.lastName;
            if (!payload.birthday) delete payload.birthday;
            
            await apiClient.post('/users/', payload);
            showToast('User created successfully', 'success');
            setShowCreateModal(false);
            resetForm();
            fetchUsers();
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to create user';
            showToast(errorMessage, 'error');
            console.error('Create user error:', err);
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            delete payload.password; // Don't send password in updates
            
            // Convert salary to number if present and not empty
            if (payload.salary && payload.salary !== '') {
                payload.salary = parseFloat(payload.salary);
            } else {
                delete payload.salary; // Remove empty salary field
            }
            
            // Convert loyalty points to number if present and not empty
            if (payload.loyaltyPoints && payload.loyaltyPoints !== '') {
                payload.loyaltyPoints = parseInt(payload.loyaltyPoints, 10);
            } else {
                delete payload.loyaltyPoints; // Remove empty loyalty points field
            }
            
            // Remove empty fields that shouldn't be sent
            if (!payload.lastName) delete payload.lastName;
            if (!payload.birthday) delete payload.birthday;
            if (payload.role === 'CUSTOMER') delete payload.salary;
            
            await apiClient.put(`/users/${currentUser.userId}`, payload);
            showToast('User updated successfully', 'success');
            setShowEditModal(false);
            resetForm();
            fetchUsers();
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to update user';
            showToast(errorMessage, 'error');
            console.error('Update user error:', err);
        }
    };

    const handleDeleteUser = async (userId, userName) => {
        const confirmed = await showConfirmation({
            title: 'Delete User',
            message: `Are you sure you want to delete user "${userName}"? This action cannot be undone.`,
            confirmText: 'Delete',
            confirmVariant: 'danger'
        });

        if (confirmed) {
            try {
                await apiClient.delete(`/users/${userId}`);
                showToast('User deleted successfully', 'success');
                fetchUsers();
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Failed to delete user';
                showToast(errorMessage, 'error');
                console.error('Delete user error:', err);
            }
        }
    };

    const handleRoleChange = async (userId, newRole, userName) => {
        const confirmed = await showConfirmation({
            title: 'Change User Role',
            message: `Are you sure you want to change ${userName}'s role to ${newRole}?`,
            confirmText: 'Change Role',
            confirmVariant: 'warning'
        });

        if (confirmed) {
            try {
                await apiClient.patch(`/users/${userId}/role`, { name: newRole });
                showToast('User role updated successfully', 'success');
                fetchUsers();
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Failed to update user role';
                showToast(errorMessage, 'error');
                console.error('Update role error:', err);
            }
        }
    };

    const handleSalaryChange = async (userId, newSalary, userName) => {
        if (!userId) {
            showToast('Invalid user ID', 'error');
            return;
        }
        
        const isClearing = newSalary === '' || newSalary === null || isNaN(parseFloat(newSalary));
        const confirmed = await showConfirmation({
            title: isClearing ? 'Clear Salary' : 'Update Salary',
            message: isClearing
                ? `Are you sure you want to clear ${userName}'s salary?`
                : `Are you sure you want to update ${userName}'s salary to $${Number(newSalary).toFixed(2)}?`,
            confirmText: isClearing ? 'Clear' : 'Update Salary',
            confirmVariant: isClearing ? 'danger' : 'info'
        });

        if (confirmed) {
            try {
                const payload = { decimal: isClearing ? null : parseFloat(newSalary) };
                await apiClient.patch(`/users/${userId}/salary`, payload);
                showToast(isClearing ? 'Salary cleared successfully' : 'Salary updated successfully', 'success');
                await fetchUsers();
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Failed to update salary';
                showToast(errorMessage, 'error');
                console.error('Update salary error:', err);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            role: 'CUSTOMER',
            birthday: '',
            salary: '',
            loyaltyPoints: ''
        });
        setCurrentUser(null);
    };

    const openCreateModal = () => {
        resetForm();
        setShowCreateModal(true);
    };

    const openEditModal = (usr) => {
        setCurrentUser(usr);
        setFormData({
            firstName: usr.firstName || '',
            lastName: usr.lastName || '',
            email: usr.email || '',
            password: '',
            role: usr.role || 'CUSTOMER',
            birthday: usr.birthday || '',
            salary: usr.role !== 'CUSTOMER' ? (usr.salary ?? '') : '',
            loyaltyPoints: usr.loyaltyPoints ?? ''
        });
        setShowEditModal(true);
    };

    // New helpers
    const openSalaryModal = (user) => {
        if (!user || !user.userId) {
            showToast('Invalid user selected', 'error');
            return;
        }
        setSalaryUser(user);
        setSalaryValue(user.salary || '');
        setShowSalaryModal(true);
    };

    const handleSalarySubmit = async (e) => {
        e.preventDefault();
        if (!salaryUser || !salaryUser.userId) {
            showToast('No user selected for salary update', 'error');
            return;
        }
        await handleSalaryChange(salaryUser.userId, salaryValue, `${salaryUser.firstName} ${salaryUser.lastName || ''}`);
        setShowSalaryModal(false);
    };

    const fetchUserAddresses = async (userId) => {
        try {
            setLoadingAddresses(true);
            const res = await apiClient.get(`/users/${userId}/addresses`);
            setAddresses(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            showToast('Failed to load addresses', 'error');
            console.error('Fetch addresses error:', err);
        } finally {
            setLoadingAddresses(false);
        }
    };

    const openAddressesModal = async (user) => {
        setAddressesUser(user);
        setShowAddressesModal(true);
        await fetchUserAddresses(user.userId);
    };

    const handleDeleteAddress = async (addressId) => {
        if (!addressesUser) {
            showToast('No user selected for address deletion', 'error');
            return;
        }
        
        if (!addressId) {
            showToast('Invalid address ID', 'error');
            return;
        }
        
        console.log('Deleting address:', {
            addressId,
            userId: addressesUser.userId,
            addressesUser
        });
        
        const confirmed = await showConfirmation({
            title: 'Delete Address',
            message: 'Are you sure you want to delete this address?',
            confirmText: 'Delete',
            confirmVariant: 'danger'
        });
        if (!confirmed) return;
        
        try {
            const deleteUrl = `/users/${addressesUser.userId}/addresses/${addressId}`;
            console.log('DELETE URL:', deleteUrl);
            await apiClient.delete(deleteUrl);
            showToast('Address deleted successfully', 'success');
            setAddresses(prev => prev.filter(a => a.addressId !== addressId));
        } catch (err) {
            console.error('Delete address error:', err);
            console.error('Full error details:', err.response);
            
            let errorMessage = 'Failed to delete address';
            
            if (err.response?.status === 500) {
                errorMessage = 'Server error occurred while deleting address. Please try again later or contact support.';
            } else if (err.response?.status === 404) {
                errorMessage = 'Address not found. It may have already been deleted.';
                // Remove from local state since it doesn't exist on server
                setAddresses(prev => prev.filter(a => a.addressId !== addressId));
            } else if (err.response?.status === 403) {
                errorMessage = 'You do not have permission to delete this address.';
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }
            
            showToast(errorMessage, 'error');
            
            // For 500 errors, refresh the address list to check current state
            if (err.response?.status === 500) {
                console.log('Refreshing addresses due to server error...');
                try {
                    await fetchUserAddresses(addressesUser.userId);
                } catch (refreshErr) {
                    console.error('Failed to refresh addresses:', refreshErr);
                }
            }
        }
    };

    // Added missing pagination handlers
    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handlePageSizeChange = (newSize) => {
        setPagination(prev => ({ ...prev, page: 0, size: newSize }));
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setSearchQuery(searchInputValue);
        setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page when searching
    };

    const handleSearchClear = () => {
        setSearchInputValue('');
        setSearchQuery('');
        setPagination(prev => ({ ...prev, page: 0 }));
    };

    // DataTable columns configuration
    const columns = [
        { 
            key: 'userId', 
            header: 'ID', 
            accessor: 'userId', 
            sortable: true
        },
        { key: 'name', header: 'Name', accessor: 'name', sortable: true },
        { key: 'email', header: 'Email', accessor: 'email', sortable: true },
        { 
            key: 'role', header: 'Role', accessor: 'role', sortable: true,
            render: (value, usr) => (
                <Form.Select
                    size="sm"
                    value={usr.role}
                    onClick={e => e.stopPropagation()}
                    onChange={(e) => {
                        if (e.target.value !== usr.role) {
                            handleRoleChange(usr.userId, e.target.value, usr.name);
                        }
                    }}
                >
                    {Object.values(USER_ROLES).map(r => <option key={r} value={r}>{r}</option>)}
                </Form.Select>
            )
        },
        { 
            key: 'birthday', header: 'Birthday', accessor: 'birthday',
            render: (value) => value ? formatDate(value) : 'N/A'
        },
        { 
            key: 'loyaltyPoints', header: 'Points', accessor: 'loyaltyPoints',
            render: (points) => <Badge bg="info">{(points || 0).toLocaleString()}</Badge>
        },
        { 
            key: 'salary', header: 'Salary', accessor: 'salary',
            render: (value, usr) => usr.role !== 'CUSTOMER' ? (
                <Button variant="outline-secondary" size="sm" onClick={(e) => { e.stopPropagation(); openSalaryModal(usr); }}>
                    {value ? `$${Number(value).toFixed(2)}` : 'Set'}
                </Button>
            ) : 'N/A'
        },
        { 
            key: 'actions', header: 'Actions', accessor: 'id',
            render: (value, usr) => (
                <div className="d-flex gap-1 flex-wrap">
                    <Button 
                        variant="outline-primary" size="sm"
                        onClick={(e) => { e.stopPropagation(); openEditModal(usr); }}
                    >Edit</Button>
                    <Button 
                        variant="outline-secondary" size="sm"
                        onClick={(e) => { e.stopPropagation(); openAddressesModal(usr); }}
                    >Addresses</Button>
                    <Button 
                        variant="outline-danger" size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDeleteUser(usr.userId, usr.name); }}
                    >Delete</Button>
                </div>
            )
        }
    ];

    if (loading) {
        return (
            <Container className="text-center mt-4">
                <LoadingSpinner size="lg" />
                <p className="mt-3">Loading users...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-4">
                <div className="alert alert-danger" role="alert">
                    <h4 className="alert-heading">Access Error</h4>
                    <p>{error}</p>
                </div>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <Row>
                <Col>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1>User Management</h1>
                        <Button variant="primary" onClick={openCreateModal}>
                            <i className="bi bi-plus-circle me-2"></i>
                            Create User
                        </Button>
                    </div>

                    {/* Search Bar and Role Filter */}
                    <Card className="mb-4">
                        <Card.Body>
                            <Form onSubmit={handleSearchSubmit}>
                                <Row className="align-items-end">
                                    <Col md={4} lg={5}>
                                        <Form.Group>
                                            <Form.Control
                                                type="text"
                                                placeholder="Search users..."
                                                value={searchInputValue}
                                                onChange={(e) => setSearchInputValue(e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={3} lg={4}>
                                        <div className="d-flex gap-2">
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                disabled={loading}
                                            >
                                                <i className="bi bi-search me-1"></i>
                                                Search
                                            </Button>
                                            {searchQuery && (
                                                <Button
                                                    variant="outline-secondary"
                                                    onClick={handleSearchClear}
                                                    disabled={loading}
                                                    title="Clear Search"
                                                >
                                                    <i className="bi bi-x-circle me-1"></i>
                                                </Button>
                                            )}
                                            <small className="text-muted align-self-center ms-1">
                                        <span> ({pagination.totalElements} result{pagination.totalElements !== 1 ? 's' : ''})</span>
                                            </small>
                                        </div>
                                    </Col>
                                    <Col md={2} lg={3}>
                                        <Form.Group>
                                            <Form.Select
                                                value={filteredRole}
                                                onChange={(e) => {
                                                    setFilteredRole(e.target.value);
                                                    setPagination(prev => ({ ...prev, page: 0 }));
                                                }}
                                            >
                                                <option value="">All Roles</option>
                                                {Object.values(USER_ROLES).map(role => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Form>
                        </Card.Body>
                    </Card>

                    {users.length === 0 ? (
                        <Card>
                            <Card.Body className="text-center">
                                <p className="text-muted">No users found matching your search. Try a different search term.</p>
                                <Button variant="primary" onClick={handleSearchClear}>
                                    Clear Search
                                </Button>
                            </Card.Body>
                        </Card>
                        ) : (
                        <Card>
                            <Card.Body>
                                <DataTable
                                    data={users}
                                    columns={columns}
                                    loading={loading}
                                    searchable={false}
                                    sortable={true}
                                    paginated={false}
                                    emptyMessage={"No users found" + (searchQuery ? ` matching "${searchQuery}"` : '')}
                                />
                            </Card.Body>
                        </Card>
                    )}
                </Col>
            </Row>

            {/* Backend Pagination Controls */}
            <Card className="mt-3">
                <Card.Body>
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-3 gap-3">
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
                            {Array.from({ length: pagination.totalPages || 1 }, (_, i) => i).slice(Math.max(0, pagination.page - 2), Math.min(pagination.totalPages, pagination.page + 3)).map(p => (
                                <BSPagination.Item
                                    key={p}
                                    active={p === pagination.page}
                                    onClick={() => handlePageChange(p)}
                                >{p + 1}</BSPagination.Item>
                            ))}
                            <BSPagination.Next disabled={pagination.page >= pagination.totalPages - 1} onClick={() => handlePageChange(pagination.page + 1)} />
                            <BSPagination.Last disabled={pagination.page >= pagination.totalPages - 1} onClick={() => handlePageChange(pagination.totalPages - 1)} />
                        </BSPagination>
                    </div>
                </Card.Body>
            </Card>

            {/* Create User Modal */}
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Create New User</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreateUser}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>First Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        required
                                        placeholder="Enter first name"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Last Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        placeholder="Enter last name"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email *</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        placeholder="Enter email address"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Password *</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        placeholder="Minimum 6 characters"
                                        minLength={6}
                                    />
                                    <Form.Text className="text-muted">
                                        Must contain uppercase, lowercase, and digit
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Role *</Form.Label>
                                    <Form.Select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        required
                                    >
                                        {Object.values(USER_ROLES).map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Birthday</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={formData.birthday}
                                        onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        {formData.role !== 'CUSTOMER' && (
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Salary</Form.Label>
                                        <InputGroup>
                                            <InputGroup.Text>$</InputGroup.Text>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.salary}
                                                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                                placeholder="0.00"
                                            />
                                        </InputGroup>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Loyalty Points</Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="0"
                                            value={formData.loyaltyPoints}
                                            onChange={(e) => setFormData({ ...formData, loyaltyPoints: e.target.value })}
                                            placeholder="0"
                                        />
                                        <Form.Text className="text-muted">
                                            Customer loyalty points (optional)
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                            </Row>
                        )}
                        {formData.role === 'CUSTOMER' && (
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Loyalty Points</Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="0"
                                            value={formData.loyaltyPoints}
                                            onChange={(e) => setFormData({ ...formData, loyaltyPoints: e.target.value })}
                                            placeholder="0"
                                        />
                                        <Form.Text className="text-muted">
                                            Customer loyalty points (optional)
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                            </Row>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            Create User
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Edit User Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Edit User</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleUpdateUser}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>First Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        required
                                        placeholder="Enter first name"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Last Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        placeholder="Enter last name"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email *</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        placeholder="Enter email address"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Role *</Form.Label>
                                    <Form.Select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        required
                                    >
                                        {Object.values(USER_ROLES).map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Birthday</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={formData.birthday}
                                        onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Loyalty Points</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        value={formData.loyaltyPoints}
                                        onChange={(e) => setFormData({ ...formData, loyaltyPoints: e.target.value })}
                                        placeholder="0"
                                    />
                                    <Form.Text className="text-muted">
                                        Customer loyalty points
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>
                        {formData.role !== 'CUSTOMER' && (
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Salary</Form.Label>
                                        <InputGroup>
                                            <InputGroup.Text>$</InputGroup.Text>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.salary}
                                                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                                placeholder="0.00"
                                            />
                                        </InputGroup>
                                    </Form.Group>
                                </Col>
                            </Row>
                        )}
                        {currentUser && (
                            <div className="alert alert-info">
                                <small>
                                    <strong>User ID:</strong> {currentUser.userId} | 
                                    <strong> Loyalty Points:</strong> {currentUser.loyaltyPoints || 0} |
                                    <strong> Created:</strong> {formatDate(currentUser.createdAt) || 'N/A'}
                                </small>
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            Update User
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Salary Modal */}
            <Modal show={showSalaryModal} onHide={() => setShowSalaryModal(false)} centered>
                <Form onSubmit={handleSalarySubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Update Salary</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {salaryUser && (
                            <p className="mb-2"><strong>User:</strong> {salaryUser.firstName} {salaryUser.lastName || ''}</p>
                        )}
                        <Form.Group className="mb-3">
                            <Form.Label>Salary (USD)</Form.Label>
                            <InputGroup>
                                <InputGroup.Text>$</InputGroup.Text>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={salaryValue}
                                    onChange={(e) => setSalaryValue(e.target.value)}
                                />
                            </InputGroup>
                            <Form.Text className="text-muted">Empty value will clear the salary.</Form.Text>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="outline-danger" disabled={!salaryUser || !salaryUser.userId || salaryUser.salary == null} onClick={async () => {
                            if (!salaryUser || !salaryUser.userId) return;
                            await handleSalaryChange(salaryUser.userId, '', `${salaryUser.firstName} ${salaryUser.lastName || ''}`);
                            setShowSalaryModal(false);
                        }}>Clear Salary</Button>
                        <Button variant="secondary" onClick={() => setShowSalaryModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit">Save</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Addresses Modal */}
            <Modal show={showAddressesModal} onHide={() => setShowAddressesModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>User Addresses</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {addressesUser && (
                        <p><strong>User:</strong> {addressesUser.firstName} {addressesUser.lastName || ''}</p>
                    )}
                    {loadingAddresses ? (
                        <div className="text-center py-4"><LoadingSpinner size="lg" /></div>
                    ) : addresses.length === 0 ? (
                        <p className="text-muted">No addresses found.</p>
                    ) : (
                        <Table striped bordered hover size="sm" responsive>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>City</th>
                                    <th>Street</th>
                                    <th>Description</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {addresses.map(addr => (
                                    <tr key={addr.addressId}>
                                        <td>{addr.addressId}</td>
                                        <td>{addr.name}</td>
                                        <td>{addr.city}</td>
                                        <td>{addr.street}</td>
                                        <td>{addr.description || '-'}</td>
                                        <td>
                                            <Button 
                                                variant="outline-danger" 
                                                size="sm" 
                                                onClick={() => handleDeleteAddress(addr.addressId)}
                                            >
                                                Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddressesModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default AdminUsersPage;
