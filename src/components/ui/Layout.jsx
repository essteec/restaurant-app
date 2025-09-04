import {Container, Navbar, Nav, NavDropdown, Button, Row, Col, Image} from 'react-bootstrap'
import {Link, useLocation} from "react-router-dom";
import { HashLink } from 'react-router-hash-link';
import routes from "../../routes/routes.js";
import useAuth from "../../contexts/use-auth.js";

import { FaShoppingCart, FaFacebook, FaInstagram } from 'react-icons/fa';
import { FaXTwitter } from "react-icons/fa6";

import {useCart} from "../../contexts/use-cart.js";

function Layout({ children }) {
    const location = useLocation();
    const { isAuthenticated, user, logout } = useAuth();
    const { cartItems } = useCart();

    // Added safe derived role to avoid accessing user.role when user is null
    const userRole = user?.role;

    const isActive = (path) => location.pathname === path;

    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar bg="dark" variant="dark" expand="xl" className={`shadow ${!isAuthenticated ? 'py-4' : 'py-0'}`}>
                <Container>
                    <Navbar.Brand as={HashLink} to={routes.LANDING} smooth className={`py-4 ${location.hash === '#home' ? 'active' : ''}`}>
                        <Image src="/miniLogo.png" alt="Restaurant Logo" height="36px" className="me-2 rounded-circle" /> Babanın Yeri
                    </Navbar.Brand>

                    <Navbar.Toggle aria-controls="main-navbar"/>

                    <Navbar.Collapse id="main-navbar">
                        {!isAuthenticated ? (
                            // Unauthenticated Navbar
                            <Nav className="me-auto">
                                <Nav.Link as={HashLink} to="/#menu-highlights" smooth className={`py-4 ${location.hash === '#menu-highlights' ? 'nav-link-bold-active' : ''}`}>Menu</Nav.Link>
                                <Nav.Link as={HashLink} to="/#gallery" smooth className={`py-4 ${location.hash === '#gallery' ? 'nav-link-bold-active' : ''}`}>Gallery</Nav.Link>
                                <Nav.Link as={HashLink} to="/#contact" smooth className={`py-4 ${location.hash === '#contact' ? 'nav-link-bold-active' : ''}`}>Contact</Nav.Link>
                            </Nav>
                        ) : (
                            // Authenticated Navbar (existing structure)
                            <Nav className="me-auto">
                                <Nav.Link as={Link} to={routes.HOME}
                                          className={isActive(routes.HOME) ? 'active' : ''}>
                                    Home</Nav.Link>

                                <Nav.Link as={Link} to={routes.MENU}
                                          className={isActive(routes.MENU) ? 'active' : ''}>
                                    Menu</Nav.Link>

                                {/* show orders if authenticated and not admin*/}
                                {isAuthenticated && userRole && userRole !== 'ADMIN' && (
                                    <Nav.Link as={Link} to={userRole === 'WAITER' ? routes.WAITER_ORDERS_VIEW : userRole === 'CHEF' ? routes.CHEF_ORDERS_VIEW : routes.ORDERS}
                                              className={isActive(routes.ORDERS) ? 'active' : ''}>
                                        My Orders</Nav.Link>
                                )}

                                {/*employee navigation*/}
                                {isAuthenticated && ['ADMIN','WAITER','CHEF'].includes(userRole) && (
                                    <>
                                        {userRole === 'ADMIN' && (
                                            <>
                                                <NavDropdown title={"Monitor"} id="admin-nav-dropdown">
                                                    <NavDropdown.Item as={Link} to={routes.ADMIN_USERS}>
                                                        📋 Users</NavDropdown.Item>
                                                    <NavDropdown.Item as={Link} to={routes.ADMIN_ORDERS}>
                                                        🍽️ Orders</NavDropdown.Item>
                                                    <NavDropdown.Item as={Link} to={routes.ADMIN_CALL_REQUESTS}>
                                                        🪑 Call Requests</NavDropdown.Item>
                                                </NavDropdown>
                                                <NavDropdown title={"Manage"} id="admin-nav-dropdown">
                                                    <NavDropdown.Item as={Link} to={routes.ADMIN_MENUS}>
                                                        📋 Menus</NavDropdown.Item>
                                                    <NavDropdown.Item as={Link} to={routes.ADMIN_FOOD_ITEMS}>
                                                        🍽️ Food Items</NavDropdown.Item>
                                                    <NavDropdown.Item as={Link} to={routes.ADMIN_TABLES}>
                                                        🪑 Tables</NavDropdown.Item>
                                                    <NavDropdown.Item as={Link} to={routes.ADMIN_CATEGORIES}>
                                                        📂 Categories</NavDropdown.Item>
                                                </NavDropdown>
                                            </>
                                        )}

                                        <NavDropdown title={"Operate"} id="staff-nav-dropdown">
                                            {(userRole === 'WAITER' || userRole === 'ADMIN') && (
                                                <>
                                                    <NavDropdown.Item as={Link} to={routes.WAITER_OPERATIONS}>
                                                        🧑‍🍳 Operations</NavDropdown.Item>
                                                    <NavDropdown.Divider />
                                                    <NavDropdown.Item as={Link} to={routes.WAITER_ORDERS}>
                                                        📋 Orders</NavDropdown.Item>
                                                    <NavDropdown.Item as={Link} to={routes.WAITER_TABLES}>
                                                        🪑 Tables</NavDropdown.Item>
                                                    <NavDropdown.Item as={Link} to={routes.WAITER_CALL_REQUESTS}>
                                                        📞 Call Requests</NavDropdown.Item>
                                                </>
                                            )}
                                            {(userRole === 'CHEF') && (
                                                <>
                                                    <NavDropdown.Item as={Link} to={routes.CHEF_ORDERS}>
                                                        👨‍🍳 Orders</NavDropdown.Item>
                                                </>
                                            )}
                                        </NavDropdown>
                                    </>
                                )}

                                {(userRole === 'CUSTOMER') && (
                                    <Nav.Link as={Link} to={routes.ORDER_TRACKING}>
                                        Last Order
                                    </Nav.Link>
                                )}

                            </Nav>
                        )}

                        {/*right side nav*/}
                        <Nav className="ms-auto">
                            {(isAuthenticated || isActive(routes.MENU)) && (
                                <Nav.Link as={Link} to={routes.CART} className={isActive(routes.CART) ? 'active' : ''}>
                                    <FaShoppingCart /> Cart ({cartItems.reduce((acc, item) => acc + item.quantity, 0)})
                                </Nav.Link>
                            )}
                            <div className="d-flex align-items-center me-3">
                                <Nav.Link href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-white"><FaFacebook size={16} /></Nav.Link>
                                <Nav.Link href="https://www.twitter.com/" target="_blank" rel="noopener noreferrer" className="text-white ms-2"><FaXTwitter size={16} /></Nav.Link>
                                <Nav.Link href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="text-white ms-2"><FaInstagram size={16} /></Nav.Link>
                            </div>

                            {!isAuthenticated ? (
                                // Not logged in
                                <>
                                    <Nav.Link as={Link} to={routes.LOGIN} variant="light"
                                                        className={`btn btn-primary ${isActive(routes.LOGIN) ? 'active' : ''}`}>Login</Nav.Link>
                                    <Button as={Link} to={routes.REGISTER}
                                                    variant="dark" className="btn ms-2 btn-outline-info">Sign up</Button>
                                </>
                                ) : (
                                // Logged in
                                <NavDropdown title={`👤 ${user?.firstName || 'User'}`}
                                             id="user-nav-dropdown" align="end">
                                    <NavDropdown.Item as={Link} to={routes.PROFILE}>
                                        My Profile</NavDropdown.Item>
                                    {isAuthenticated && userRole && userRole !== 'ADMIN' && (
                                        <NavDropdown.Item as={Link} to={routes.ORDERS}>
                                        My Orders</NavDropdown.Item>
                                    )}
                                    <NavDropdown.Divider />
                                    <NavDropdown.Item onClick={logout}>
                                        Logout</NavDropdown.Item>

                                </NavDropdown>
                            )}
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            {/*main content*/}
            <main className={`flex-grow-1 ${isAuthenticated ? 'mt-4' : ''}`}>
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-dark text-white mt-5 p-4 pt-3">
                <Container>
                    <Row>
                        <Col md={4} className="mb-3 mb-md-0">
                            <h5>My Restaurant</h5>
                            <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
                        </Col>
                        <Col md={4} className="mb-3 mb-md-0">
                            <h5>Contact Us</h5>
                            <p>123 Restaurant St, Food City, FC 12345</p>
                            <p>Phone: (123) 456-7890</p>
                            <p>Email: info@restaurant.com</p>
                        </Col>
                        <Col md={4}>
                            <h5>Follow Us</h5>
                            <Nav className="flex-row">
                                <Nav.Link href="#" className="text-white me-3"><FaFacebook size={24} /></Nav.Link>
                                <Nav.Link href="#" className="text-white me-3"><FaXTwitter size={24} /></Nav.Link>
                                <Nav.Link href="#" className="text-white"><FaInstagram size={24} /></Nav.Link>
                            </Nav>
                        </Col>
                    </Row>
                </Container>
            </footer>
        </div>
    );
}

export default Layout;
