import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Spinner, Modal, Row, Col, Badge } from 'react-bootstrap';
import useAuth from '../../contexts/use-auth';
import apiClient from '../../api';

const ProfilePage = () => {
    const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        birthday: '',
        loyaltyPoints: 0
    });
    const [originalEmail, setOriginalEmail] = useState('');
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
    });
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [addressLoading, setAddressLoading] = useState(false);
    
    // Address modal state
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [addressFormData, setAddressFormData] = useState({
        name: '',
        country: '',
        city: '',
        province: '',
        street: '',
        apartment: ''
    });

    // Fetch profile data on component mount
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            fetchProfileData();
        } else if (!authLoading && !isAuthenticated) {
            setError('Please log in to view your profile.');
            setLoading(false);
        }
    }, [isAuthenticated, authLoading]);

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/users/profile');
            const data = response.data;
            
            setProfileData({
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                email: data.email || '',
                birthday: data.birthday || '',
                loyaltyPoints: data.loyaltyPoints || 0
            });
            setOriginalEmail(data.email || '');
            setAddresses(data.addresses || []);
            setError(null);
        } catch (err) {
            setError('Failed to load profile data. ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleAddressFormChange = (e) => {
        setAddressFormData({ ...addressFormData, [e.target.name]: e.target.value });
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            const updateData = {
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                email: profileData.email,
                birthday: profileData.birthday
            };
            await apiClient.put('/users/profile', updateData);
            // If the email changed, we'll notify the user and force logout for security
            const emailChanged = updateData.email && updateData.email !== originalEmail;
            if (emailChanged) {
                setSuccess('Profile updated. Email changed — you will be logged out and need to sign in with the new email.');
                // Refresh profile data then logout shortly so user sees the updated info
                await fetchProfileData();
                setTimeout(() => {
                    logout();
                }, 2000);
            } else {
                setSuccess('Profile updated successfully!');
                // Refresh profile data to get updated info
                await fetchProfileData();
            }
        } catch (err) {
            setError('Failed to update profile. ' + (err.response?.data?.message || err.message));
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (passwordData.newPassword !== passwordData.confirmNewPassword) {
            setError('New password and confirmation do not match.');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setError('New password must be at least 6 characters long.');
            return;
        }

        try {
            await apiClient.post('/auth/change-password', {
                email: profileData.email,
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            setSuccess('Password changed successfully! Please log in again with your new password.');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmNewPassword: '',
            });
            // Auto logout after password change for security
            setTimeout(() => {
                logout();
            }, 3000);
        } catch (err) {
            setError('Failed to change password. ' + (err.response?.data?.message || err.message));
        }
    };

    // Address Management Functions
    const openAddressModal = (address = null) => {
        if (address) {
            // Edit existing address
            setEditingAddress(address);
            setAddressFormData({
                name: address.name || '',
                country: address.country || '',
                city: address.city || '',
                province: address.province || '',
                street: address.street || '',
                apartment: address.apartment || ''
            });
        } else {
            // Add new address
            setEditingAddress(null);
            setAddressFormData({
                name: '',
                country: '',
                city: '',
                province: '',
                street: '',
                apartment: ''
            });
        }
        setShowAddressModal(true);
    };

    const closeAddressModal = () => {
        setShowAddressModal(false);
        setEditingAddress(null);
        setAddressFormData({
            name: '',
            country: '',
            city: '',
            province: '',
            street: '',
            apartment: ''
        });
    };

    const handleAddressSubmit = async (e) => {
        e.preventDefault();
        setAddressLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (editingAddress) {
                // Update existing address
                await apiClient.put(`/addresses/${editingAddress.addressId}`, addressFormData);
                setSuccess('Address updated successfully!');
            } else {
                // Create new address
                await apiClient.post('/addresses', addressFormData);
                setSuccess('Address added successfully!');
            }
            
            closeAddressModal();
            await fetchProfileData(); // Refresh to get updated addresses
        } catch (err) {
            setError('Failed to save address. ' + (err.response?.data?.message || err.message));
        } finally {
            setAddressLoading(false);
        }
    };

    const handleDeleteAddress = async (addressId) => {
        if (!window.confirm('Are you sure you want to delete this address?')) {
            return;
        }

        setAddressLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await apiClient.delete(`/addresses/${addressId}`);
            setSuccess('Address deleted successfully!');
            await fetchProfileData(); // Refresh to get updated addresses
        } catch (err) {
            setError('Failed to delete address. ' + (err.response?.data?.message || err.message));
        } finally {
            setAddressLoading(false);
        }
    };

    if (loading) {
        return <Container className="text-center mt-4"><Spinner animation="border" /></Container>;
    }

    if (error && !isAuthenticated) {
        return <Container className="mt-4"><Alert variant="danger">{error}</Alert></Container>;
    }

    return (
        <Container className="mt-4">
            <h1 className="mb-4">My Profile</h1>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            {/* Personal Information */}
            <Card className="mb-4">
                <Card.Header>Personal Information</Card.Header>
                <Card.Body>
                    <Form onSubmit={handleUpdateProfile}>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>First Name *</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="firstName" 
                                        value={profileData.firstName} 
                                        onChange={handleProfileChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Last Name</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="lastName" 
                                        value={profileData.lastName} 
                                        onChange={handleProfileChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control 
                                        type="email" 
                                        name="email" 
                                        value={profileData.email} 
                                        onChange={handleProfileChange}
                                        required
                                    />
                                    <Form.Text className="text-muted">
                                        Changing your email will require you to re-authenticate; you may be logged out after updating.
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Birthday</Form.Label>
                                    <Form.Control 
                                        type="date" 
                                        name="birthday" 
                                        value={profileData.birthday} 
                                        onChange={handleProfileChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        {profileData.loyaltyPoints > 0 && (
                            <div className="mb-3">
                                <Badge bg="success" pill className="fs-6">
                                    Loyalty Points: {profileData.loyaltyPoints}
                                </Badge>
                            </div>
                        )}
                        <Button variant="primary" type="submit">Update Profile</Button>
                    </Form>
                </Card.Body>
            </Card>

            {/* Change Password */}
            <Card className="mb-4">
                <Card.Header>Change Password</Card.Header>
                <Card.Body>
                    <Form onSubmit={handleChangePassword}>
                        <Form.Group className="mb-3">
                            <Form.Label>Current Password *</Form.Label>
                            <Form.Control 
                                type="password" 
                                name="currentPassword" 
                                value={passwordData.currentPassword} 
                                onChange={handlePasswordChange}
                                required
                            />
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>New Password *</Form.Label>
                                    <Form.Control 
                                        type="password" 
                                        name="newPassword" 
                                        value={passwordData.newPassword} 
                                        onChange={handlePasswordChange}
                                        minLength={6}
                                        required
                                    />
                                    <Form.Text className="text-muted">
                                        Minimum 6 characters
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Confirm New Password *</Form.Label>
                                    <Form.Control 
                                        type="password" 
                                        name="confirmNewPassword" 
                                        value={passwordData.confirmNewPassword} 
                                        onChange={handlePasswordChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Button variant="warning" type="submit">Change Password</Button>
                    </Form>
                </Card.Body>
            </Card>

            {/* Address Management */}
            <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <span>My Addresses</span>
                    <Button 
                        variant="outline-primary" 
                        size="sm" 
                        onClick={() => openAddressModal()}
                        disabled={addressLoading}
                    >
                        Add New Address
                    </Button>
                </Card.Header>
                <Card.Body>
                    {addressLoading && <Spinner animation="border" size="sm" className="me-2" />}
                    {addresses.length === 0 ? (
                        <p className="text-muted">No addresses found. Add your first address to get started.</p>
                    ) : (
                        <div className="row">
                            {addresses.map((address) => (
                                <div key={address.addressId} className="col-md-6 mb-3">
                                    <Card className="h-100">
                                        <Card.Body>
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <h6 className="card-title mb-0">{address.name}</h6>
                                                <div>
                                                    <Button 
                                                        variant="outline-secondary" 
                                                        size="sm" 
                                                        className="me-1"
                                                        onClick={() => openAddressModal(address)}
                                                        disabled={addressLoading}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button 
                                                        variant="outline-danger" 
                                                        size="sm"
                                                        onClick={() => handleDeleteAddress(address.addressId)}
                                                        disabled={addressLoading}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                            <p className="card-text small text-muted mb-0">
                                                {address.street}
                                                {address.apartment && `, ${address.apartment}`}<br/>
                                                {address.city}, {address.province}<br/>
                                                {address.country}
                                            </p>
                                        </Card.Body>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Address Modal */}
            <Modal show={showAddressModal} onHide={closeAddressModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddressSubmit}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Address Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={addressFormData.name}
                                        onChange={handleAddressFormChange}
                                        placeholder="e.g., Home, Work, etc."
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Country *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="country"
                                        value={addressFormData.country}
                                        onChange={handleAddressFormChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>City *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="city"
                                        value={addressFormData.city}
                                        onChange={handleAddressFormChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Province/State *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="province"
                                        value={addressFormData.province}
                                        onChange={handleAddressFormChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Street Address *</Form.Label>
                            <Form.Control
                                type="text"
                                name="street"
                                value={addressFormData.street}
                                onChange={handleAddressFormChange}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Apartment/Unit (Optional)</Form.Label>
                            <Form.Control
                                type="text"
                                name="apartment"
                                value={addressFormData.apartment}
                                onChange={handleAddressFormChange}
                                placeholder="Apt, Suite, Unit, etc."
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeAddressModal}>
                            Cancel
                        </Button>
                        <Button 
                            variant="primary" 
                            type="submit"
                            disabled={addressLoading}
                        >
                            {addressLoading && <Spinner animation="border" size="sm" className="me-2" />}
                            {editingAddress ? 'Update Address' : 'Add Address'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default ProfilePage;
