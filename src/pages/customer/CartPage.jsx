import { useState } from 'react';
import { 
    Container, 
    Row, 
    Col, 
    Card, 
    Button, 
    Alert, 
    Badge,
    Modal,
    Form,
    OverlayTrigger,
    Tooltip,
    Image
} from 'react-bootstrap';
import { useCart } from '../../contexts/use-cart.js';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast.js';
import { formatCurrency, getImageUrl, onImageError } from '../../utils/helpers.js';
import routes from '../../routes/routes.js';
import './CartPage.css';
import useAuth from '../../contexts/use-auth.js';

const CartPage = () => {
    const {
        cartItems,
        removeItem,
        updateQuantity,
        updateItemNotes,
        clearCart,
        cartTotal,
        itemCount,
        isEmpty
    } = useCart();

    const [showClearModal, setShowClearModal] = useState(false);
    const [itemNotesModal, setItemNotesModal] = useState({ show: false, item: null, notes: '' });

    const navigate = useNavigate();
    const { showSuccess, showWarning } = useToast();
    const { user, isAuthenticated } = useAuth();

    const handleQuantityChange = (foodName, change) => {
        const item = cartItems.find(item => item.foodName === foodName);
        if (item) {
            const newQuantity = item.quantity + change;
            updateQuantity(foodName, newQuantity);
            
            if (newQuantity === 0) {
                showSuccess(`${foodName} removed from cart`);
            }
        }
    };

    const handleRemoveItem = (foodName) => {
        removeItem(foodName);
        showSuccess(`${foodName} removed from cart`);
    };

    const handleClearCart = () => {
        clearCart();
        setShowClearModal(false);
        showSuccess('Cart cleared successfully');
    };

    const handleItemNotesUpdate = () => {
        updateItemNotes(itemNotesModal.item.foodName, itemNotesModal.notes);
        setItemNotesModal({ show: false, item: null, notes: '' });
        showSuccess('Item notes updated');
    };

    const handleCheckout = () => {
        if (isEmpty) {
            showWarning('Your cart is empty. Add some items first!');
            return;
        }
        navigate(routes.CHECKOUT);
    };

    const openItemNotesModal = (item) => {
        setItemNotesModal({
            show: true,
            item: item,
            notes: item.notes || ''
        });
    };

    const CartItemCard = ({ item }) => (
        <Card className="cart-item-card mb-3">
            <Card.Body>
                <Row className="align-items-center">
                    <Col md={2}>
                        {item.image ? (
                            <Image
                                src={getImageUrl(item.image)}
                                alt={item.foodName}
                                thumbnail
                                className="cart-item-image"
                                style={{ objectFit: 'cover' }}
                                onError={onImageError}
                            />
                        ) : null}
                        <Badge bg="secondary" style={{ display: item.image ? 'none' : 'block' }}>
                            No Image
                        </Badge>
                    </Col>
                    <Col md={4}>
                        <div className="item-details">
                            <h6 className="mb-1">{item.foodName}</h6>
                            <p className="text-muted mb-1 small">{item.description}</p>
                            <div className="price-info">
                                <span className="fw-bold text-primary">
                                    {formatCurrency(item.price)}
                                </span>
                                <span className="text-muted ms-2">each</span>
                            </div>
                        </div>
                    </Col>
                    <Col md={3}>
                        <div className="quantity-controls d-flex align-items-center justify-content-center">
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => handleQuantityChange(item.foodName, -1)}
                                disabled={item.quantity <= 1}
                            >
                                -
                            </Button>
                            <Badge bg="secondary" className="mx-2 quantity-badge">
                                {item.quantity}
                            </Badge>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => handleQuantityChange(item.foodName, 1)}
                            >
                                +
                            </Button>
                        </div>
                    </Col>
                    <Col md={2} className="text-center">
                        <div className="item-total">
                            <div className="fw-bold">
                                {formatCurrency(item.price * item.quantity)}
                            </div>
                        </div>
                    </Col>
                    <Col md={1} className="text-end">
                        <div className="item-actions">
                            <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip>Add special notes</Tooltip>}
                            >
                                <Button
                                    variant="outline-info"
                                    size="sm"
                                    className="me-1"
                                    onClick={() => openItemNotesModal(item)}
                                >
                                    <i className="bi bi-pencil"></i>
                                </Button>
                            </OverlayTrigger>
                            <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip>Remove item</Tooltip>}
                            >
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleRemoveItem(item.foodName)}
                                >
                                    <i className="bi bi-trash"></i>
                                </Button>
                            </OverlayTrigger>
                        </div>
                    </Col>
                </Row>
                {item.notes && (
                    <Row className="mt-2">
                        <Col md={12}>
                            <Alert variant="light" className="py-1 mb-0">
                                <small>
                                    <strong>Special Notes:</strong> {item.notes}
                                </small>
                            </Alert>
                        </Col>
                    </Row>
                )}
            </Card.Body>
        </Card>
    );

    const ItemNotesModal = () => (
        <Modal show={itemNotesModal.show} onHide={() => setItemNotesModal({ show: false, item: null, notes: '' })}>
            <Modal.Header closeButton>
                <Modal.Title>Add Special Notes</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <h6>{itemNotesModal.item?.foodName}</h6>
                <Form.Group className="mt-3">
                    <Form.Label>Special Instructions</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="e.g., No onions, extra spicy, on the side..."
                        value={itemNotesModal.notes}
                        onChange={(e) => setItemNotesModal(prev => ({ ...prev, notes: e.target.value }))}
                    />
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setItemNotesModal({ show: false, item: null, notes: '' })}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleItemNotesUpdate}>
                    Save Notes
                </Button>
            </Modal.Footer>
        </Modal>
    );

    return (
        <div className="cart-page">
            {/* Hero Section */}
            <Container fluid className="cart-hero-section bg-light py-4 mb-4">
                <Container>
                    <Row className="align-items-center">
                        <Col md={8}>
                            <h1 className="display-5 mb-2 text-primary">
                                Shopping Cart
                                {itemCount > 0 && (
                                    <Badge bg="primary" className="ms-3">
                                        {itemCount} item{itemCount !== 1 ? 's' : ''}
                                    </Badge>
                                )}
                            </h1>
                            <p className="lead text-muted">
                                Review your items and proceed to checkout
                            </p>
                        </Col>
                        <Col md={4} className="text-end">
                            <div className="cart-stats">
                                {itemCount > 0 && (
                                    <Badge bg="success" className="me-2">
                                        Total: {formatCurrency(cartTotal)}
                                    </Badge>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Container>
            </Container>

            <Container>
                {isEmpty ? (
                    <div className="empty-cart text-center py-5">
                        <div className="text-muted">
                            <i className="bi bi-cart-x" style={{ fontSize: '4rem' }}></i>
                            <h3 className="mt-3">Your cart is empty</h3>
                            <p className="mb-4">Discover our delicious menu and add some items to your cart!</p>
                            <Button variant="primary" as={Link} to={routes.MENU} size="lg">
                                Browse Menu
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Row>
                        <Col lg={8}>
                            <div className="cart-items-section">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h4>Cart Items ({itemCount})</h4>
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => setShowClearModal(true)}
                                    >
                                        <i className="bi bi-trash me-2"></i>
                                        Clear Cart
                                    </Button>
                                </div>

                                {cartItems.map((item) => (
                                    <CartItemCard key={item.foodName} item={item} />
                                ))}
                            </div>
                        </Col>

                        <Col lg={4}>
                            <div className="cart-summary-section">
                                <Card className="cart-summary-card">
                                    <Card.Header>
                                        <h5 className="mb-0">Order Summary</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        {/* Price Breakdown */}
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

                                        {/* Action Buttons */}
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            className="w-100 mb-2"
                                            onClick={isAuthenticated ? handleCheckout : () => navigate(routes.REGISTER)}
                                            disabled={isEmpty}
                                        >
                                            {isEmpty ? 'Cart is Empty' : isAuthenticated ? 'Proceed to Checkout' : 'Register to Checkout'}
                                        </Button>

                                        <Button
                                            variant="outline-secondary"
                                            className="w-100"
                                            as={Link}
                                            to={routes.MENU}
                                        >
                                            Continue Shopping
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </div>
                        </Col>
                    </Row>
                )}
            </Container>

            {/* Modals */}
            <ItemNotesModal />

            {/* Clear Cart Confirmation */}
            <Modal show={showClearModal} onHide={() => setShowClearModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Clear Cart</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to clear all items from your cart?</p>
                    <p className="text-muted">This action cannot be undone.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowClearModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleClearCart}>
                        Clear Cart
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default CartPage;
