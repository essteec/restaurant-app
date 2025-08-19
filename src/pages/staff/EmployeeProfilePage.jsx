import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Spinner, Row, Col, Badge } from 'react-bootstrap';
import useAuth from '@contexts/use-auth.js';
import apiClient from '@api';

const EmployeeProfilePage = () => {
    const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        birthday: '',
        role: '',
        loyaltyPoints: 0,
        salary: 0
    });
    const [originalEmail, setOriginalEmail] = useState('');
    const [passwordData, setPasswordData] = useState({
        password: '',
        newPassword: '',
        confirmNewPassword: '',
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

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
            const response = await apiClient.get('/users/employee/profile');
            const data = response.data;
            
            setProfileData({
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                email: data.email || '',
                birthday: data.birthday || '',
                role: data.role || '',
                loyaltyPoints: data.loyaltyPoints || 0,
                salary: data.salary || 0
            });
            setOriginalEmail(data.email || '');
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

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            // Note: Employee profile updates might be restricted to certain fields
            // Only updating fields that employees should be able to modify
            const updateData = {
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                email: profileData.email,
                birthday: profileData.birthday
            };
            
            // For employees, we need to use the regular user endpoint with their ID
            // Since we don't have a direct employee profile update endpoint
            // This might need adjustment based on actual backend implementation
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
            // Use the common password change endpoint for all users
            await apiClient.post('/users/me/password', {
                password: passwordData.password,
                newPassword: passwordData.newPassword,
            });
            setSuccess('Password changed successfully! Please log in again with your new password.');
            setPasswordData({
                password: '',
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

    const getRoleBadgeVariant = (role) => {
        switch (role) {
            case 'ADMIN':
                return 'danger';
            case 'CHEF':
                return 'warning';
            case 'WAITER':
                return 'info';
            default:
                return 'secondary';
        }
    };

    const formatSalary = (salary) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(salary);
    };

    if (loading) {
        return <Container className="text-center mt-4"><Spinner animation="border" /></Container>;
    }

    if (error && !isAuthenticated) {
        return <Container className="mt-4"><Alert variant="danger">{error}</Alert></Container>;
    }

    return (
        <Container className="mt-4">
            <h1 className="mb-4">Employee Profile</h1>
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
                        
                        {/* Employee-specific information (read-only) */}
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Role</Form.Label>
                                    <div>
                                        <Badge bg={getRoleBadgeVariant(profileData.role)} pill className="fs-6">
                                            {profileData.role}
                                        </Badge>
                                    </div>
                                    <Form.Text className="text-muted">
                                        Role cannot be changed. Contact administrator if needed.
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            {profileData.salary > 0 && (
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Salary</Form.Label>
                                        <div>
                                            <Badge bg="success" pill className="fs-6">
                                                {formatSalary(profileData.salary)}
                                            </Badge>
                                        </div>
                                        <Form.Text className="text-muted">
                                            Salary information is managed by administration.
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                            )}
                        </Row>

                        {profileData.loyaltyPoints > 0 && (
                            <div className="mb-3">
                                <Badge bg="secondary" pill className="fs-6">
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
                                name="password" 
                                value={passwordData.password} 
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
                                        Minimum 6 characters, must contain uppercase, lowercase, and number
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

            {/* Employee Information Notice */}
            <Card className="mb-4">
                <Card.Header>Employment Information</Card.Header>
                <Card.Body>
                    <div className="alert alert-info">
                        <h6>Employee Account Information:</h6>
                        <ul className="mb-0">
                            <li>Your role and salary are managed by the administration</li>
                            <li>Contact your supervisor or administrator for role changes or salary adjustments</li>
                            <li>Keep your personal information up to date for payroll and contact purposes</li>
                            <li>Address management is not available for employee accounts</li>
                        </ul>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default EmployeeProfilePage;
