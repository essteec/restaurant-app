import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge, Modal } from 'react-bootstrap';
import { useCart } from '../../contexts/use-cart.js';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient, { publicApiClient } from '../../api';
import useAuth from '../../contexts/use-auth.js';
import { useToast } from '../../hooks/useToast.js';
import { LoadingSpinner } from '../../components';
import { formatCurrency } from '../../utils/helpers.js';
import routes from '../../routes/routes.js';
import './CheckoutPage.css';

const CheckoutPage = () => {
    const { 
        cartItems,
        getOrderData,
        clearCart,
        cartTotal,
        itemCount,
        isEmpty,
        selectedTable, // context value (object: { tableNumber })
        selectTable
    } = useCart();
    const { user, isAuthenticated } = useAuth();
    const [addresses, setAddresses] = useState([]);
    const [availableTables, setAvailableTables] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [orderType, setOrderType] = useState(''); // 'table' or 'delivery'
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [addressForm, setAddressForm] = useState({
        name: '',
        country: '',
        city: '',
        province: '',
        street: '',
        apartment: ''
    });

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { showSuccess, showError: showErrorToast } = useToast();

    // Replace previous cartSelectedTable effects with unified selectedTable effect
    useEffect(() => {
        console.log('CheckoutPage: selectedTable changed:', selectedTable);
        if (selectedTable && selectedTable.tableNumber) {
            setOrderType('table');
        }
    }, [selectedTable]);

    // Initial mount check
    useEffect(() => {
        if (selectedTable && selectedTable.tableNumber) {
            setOrderType('table');
        }
    }, []);

    // Redirect if cart is empty
    useEffect(() => {
        if (isEmpty) {
            navigate(routes.CART);
            return;
        }
    }, [isEmpty, navigate]);

    // Fetch user addresses and available tables
    useEffect(() => {
        console.log('CheckoutPage: fetch data effect. isAuthenticated:', isAuthenticated, 'orderType:', orderType, 'selectedTable:', selectedTable);
        if (isAuthenticated) {
            fetchAddresses();
        }
        fetchAvailableTables();
    }, [isAuthenticated]);

    const fetchAddresses = async () => {
        try {
            const response = await apiClient.get('/users/profile');
            const userAddresses = response.data.addresses || [];
            setAddresses(userAddresses);
            if (userAddresses.length > 0 && !orderType && !(selectedTable && selectedTable.tableNumber)) {
                setOrderType('delivery');
                setSelectedAddress(userAddresses[0].addressId);
            }
        } catch (error) {
            console.error('Failed to fetch addresses:', error);
            setError('Failed to load your addresses.');
        }
    };

    const fetchAvailableTables = async () => {
        try {
            const response = await publicApiClient.get('/tables/available');
            const tables = Array.isArray(response.data) ? response.data : 
                          response.data.content ? response.data.content : [];
            setAvailableTables(tables);
        } catch (error) {
            console.error('Failed to fetch tables:', error);
            setError('Failed to load available tables.');
        }
    };

    const handleOrderTypeChange = (type) => {
        setOrderType(type);
        if (type === 'table') {
            // keep current table if any
        } else {
            selectTable(null); // clear table when switching to delivery
        }
        setError('');
    };

    const handleAddressModalShow = () => {
        setAddressForm({
            name: '',
            country: '',
            city: '',
            province: '',
            street: '',
            apartment: ''
        });
        setShowAddressModal(true);
    };

    const handleAddressSave = async () => {
        try {
            if (!addressForm.name || !addressForm.street || !addressForm.city) {
                setError('Please fill in all required address fields.');
                return;
            }

            const response = await apiClient.post('/addresses', addressForm);
            const newAddress = response.data;
            
            // Refresh the addresses from profile since the address was added to user profile
            await fetchAddresses();
            setSelectedAddress(newAddress.addressId);
            setShowAddressModal(false);
            showSuccess('Address saved successfully!');
        } catch (error) {
            console.error('Failed to save address:', error);
            setError('Failed to save address. Please try again.');
        }
    };

    const validateOrder = () => {
        if (!orderType) {
            setError('Please select delivery method (Table service or Delivery).');
            return false;
        }
        if (orderType === 'table' && !(selectedTable && selectedTable.tableNumber)) {
            setError('Please select a table.');
            return false;
        }
        if (orderType === 'delivery') {
            if (!isAuthenticated) {
                setError('Please log in to place a delivery order.');
                return false;
            }
            if (!selectedAddress) {
                setError('Please select a delivery address.');
                return false;
            }
        }
        return true;
    };

    const handlePlaceOrder = async () => {
        if (!validateOrder()) return;
        setLoading(true);
        setError('');
        const orderData = {
            orderItems: cartItems.map(item => ({
                foodName: item.foodName,
                quantity: item.quantity,
                note: item.notes || ''
            })),
            notes
        };
        if (orderType === 'table') {
            orderData.tableNumber = selectedTable.tableNumber;
        } else {
            orderData.addressId = selectedAddress;
        }
        try {
            await apiClient.post('/orders', orderData);
            clearCart();
            showSuccess('Order placed successfully!');
            navigate(routes.ORDER_TRACKING);
        } catch (error) {
            console.error('Failed to place order:', error);
            setError(error.response?.data?.message || 'Failed to place order. Please try again.');
        }
        setLoading(false);
        navigate(routes.ORDER_TRACKING);
    };

    if (isEmpty) {
        return null; // Will redirect via useEffect
    }

    return (
        <div className="checkout-page">
            <Container fluid className="checkout-hero-section bg-light py-4 mb-4">
                <Container>
                    <Row className="align-items-center">
                        <Col md={8}>
                            <h1 className="display-5 mb-2 text-primary">Checkout</h1>
                            <p className="lead text-muted">
                                Complete your order by selecting delivery method
                            </p>
                        </Col>
                        <Col md={4} className="text-end">
                            <Badge bg="success" className="me-2">
                                {itemCount} item{itemCount !== 1 ? 's' : ''}
                            </Badge>
                            <Badge bg="primary">
                                {formatCurrency(cartTotal)}
                            </Badge>
                        </Col>
                    </Row>
                </Container>
            </Container>

            <Container>
                <Row>
                    <Col lg={8}>
                        {/* Order Type Selection */}
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">Delivery Method</h5>
                            </Card.Header>
                            <Card.Body>
                                {selectedTable && selectedTable.tableNumber && (
                                    <Alert variant="info" className="mb-3">
                                        <i className="bi bi-qr-code me-2"></i>
                                        <strong>QR Code Detected:</strong> Table {selectedTable.tableNumber} has been automatically selected for table service.
                                    </Alert>
                                )}

                                <Form>
                                    <fieldset disabled={!!(selectedTable && selectedTable.tableNumber)} style={{ border: 'none', padding: 0, margin: 0 }}>
                                        <div className="d-flex gap-3 mb-3">
                                            <Form.Check
                                                type="radio"
                                                id="table-service"
                                                name="orderType"
                                                label="Table Service"
                                                checked={orderType === 'table'}
                                                onChange={() => handleOrderTypeChange('table')}
                                            />
                                            <Form.Check
                                                type="radio"
                                                id="delivery"
                                                name="orderType"
                                                label="Delivery"
                                                checked={orderType === 'delivery'}
                                                onChange={() => handleOrderTypeChange('delivery')}
                                                disabled={!isAuthenticated}
                                            />
                                        </div>
                                        
                                        {!isAuthenticated && (
                                            <Alert variant="info" className="mb-3">
                                                <Alert.Heading>Login Required for Delivery</Alert.Heading>
                                                <p>Please log in to place a delivery order or choose table service.</p>
                                            </Alert>
                                        )}
                                    </fieldset>
                                </Form>
                            </Card.Body>
                        </Card>

                        {/* Table Selection */}
                        {orderType === 'table' && !(selectedTable && selectedTable.tableNumber) && (
                            <Card className="mb-4">
                                <Card.Header>
                                    <h5 className="mb-0">Select Table</h5>
                                </Card.Header>
                                <Card.Body>
                                    {selectedTable && selectedTable.tableNumber && (
                                        <Alert variant="success" className="mb-3">
                                            <i className="bi bi-qr-code me-2"></i>
                                            Table {selectedTable.tableNumber} selected from QR code
                                        </Alert>
                                    )}
                                    <Form.Group>
                                        <Form.Label>Available Tables</Form.Label>
                                        <Form.Select
                                            value={selectedTable?.tableNumber || ''}
                                            onChange={(e) => selectTable(e.target.value ? { tableNumber: e.target.value } : null)}
                                        >
                                            <option value="">Choose a table...</option>
                                            {availableTables.map(table => (
                                                <option key={table.tableNumber} value={table.tableNumber}>
                                                    Table {table.tableNumber} (Capacity: {table.capacity})
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Card.Body>
                            </Card>
                        )}

                        {/* Address Selection */}
                        {orderType === 'delivery' && isAuthenticated && (
                            <Card className="mb-4">
                                <Card.Header>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0">Delivery Address</h5>
                                        <Button 
                                            variant="outline-primary" 
                                            size="sm"
                                            onClick={handleAddressModalShow}
                                        >
                                            Add New Address
                                        </Button>
                                    </div>
                                </Card.Header>
                                <Card.Body>
                                    {addresses.length === 0 ? (
                                        <Alert variant="warning">
                                            You have no saved addresses. Please add a delivery address.
                                        </Alert>
                                    ) : (
                                        <Form.Group>
                                            <Form.Label>Select Delivery Address</Form.Label>
                                            <Form.Select
                                                value={selectedAddress}
                                                onChange={(e) => setSelectedAddress(e.target.value)}
                                            >
                                                <option value="">Choose an address...</option>
                                                {addresses.map(address => (
                                                    <option key={address.addressId} value={address.addressId}>
                                                        {address.name} - {address.street}, {address.city}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    )}
                                </Card.Body>
                            </Card>
                        )}

                        {/* Order Notes */}
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">Order Notes</h5>
                            </Card.Header>
                            <Card.Body>
                                <Form.Group>
                                    <Form.Label>Special Instructions (Optional)</Form.Label>
                                    <Form.Control 
                                        as="textarea" 
                                        rows={3} 
                                        value={notes} 
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Any special requests for your order..."
                                    />
                                </Form.Group>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={4}>
                        {/* Order Summary */}
                        <Card className="sticky-top">
                            <Card.Header>
                                <h5 className="mb-0">Order Summary</h5>
                            </Card.Header>
                            <Card.Body>
                                {/* Items */}
                                <div className="order-items mb-3">
                                    {cartItems.map((item, index) => (
                                        <div key={index} className="d-flex justify-content-between mb-2">
                                            <div>
                                                <div className="fw-bold">{item.foodName}</div>
                                                <small className="text-muted">
                                                    {item.quantity}x {formatCurrency(item.price)}
                                                    {item.notes && (
                                                        <div className="text-info">Note: {item.notes}</div>
                                                    )}
                                                </small>
                                            </div>
                                            <div className="fw-bold">
                                                {formatCurrency(item.price * item.quantity)}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <hr />

                                {/* Price breakdown */}
                                <div className="price-breakdown">
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Subtotal ({itemCount} items)</span>
                                        <span>{formatCurrency(cartTotal)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Tax & Service</span>
                                        <span className="text-muted">Included</span>
                                    </div>
                                    <hr />
                                    <div className="d-flex justify-content-between mb-3">
                                        <h5>Total</h5>
                                        <h5 className="text-primary">{formatCurrency(cartTotal)}</h5>
                                    </div>
                                </div>

                                {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

                                <Button 
                                    variant="primary" 
                                    size="lg"
                                    className="w-100" 
                                    onClick={handlePlaceOrder} 
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <LoadingSpinner size="sm" className="me-2" />
                                            Placing Order...
                                        </>
                                    ) : (
                                        'Place Order'
                                    )}
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>

            {/* Add Address Modal */}
            <Modal show={showAddressModal} onHide={() => setShowAddressModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Add New Address</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Address Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={addressForm.name}
                                        onChange={(e) => setAddressForm(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Home, Work, etc."
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Country</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={addressForm.country}
                                        onChange={(e) => setAddressForm(prev => ({ ...prev, country: e.target.value }))}
                                        placeholder="Country"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>City *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={addressForm.city}
                                        onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                                        placeholder="City"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Province/State</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={addressForm.province}
                                        onChange={(e) => setAddressForm(prev => ({ ...prev, province: e.target.value }))}
                                        placeholder="Province or State"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={8}>
                                <Form.Group>
                                    <Form.Label>Street Address *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={addressForm.street}
                                        onChange={(e) => setAddressForm(prev => ({ ...prev, street: e.target.value }))}
                                        placeholder="Street address"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Apartment/Unit</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={addressForm.apartment}
                                        onChange={(e) => setAddressForm(prev => ({ ...prev, apartment: e.target.value }))}
                                        placeholder="Apt, Suite, etc."
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddressModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleAddressSave}>
                        Save Address
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default CheckoutPage;