import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import routes from '../../routes/routes.js';
import { publicApiClient } from '../../api/index.js';
import { API_CONFIG } from '../../utils/constants.js';

const LandingPage = () => {
    const [featuredFoodItems, setFeaturedFoodItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        
        const fetchLandingPageFoodItems = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await publicApiClient.get('/food-items/landing');
                setFeaturedFoodItems(response.data || []);
            } catch (err) {
                error('Failed to fetch landing page food items:', err);
                setError('Failed to load featured dishes. Please try again later.');
                // Fallback to empty array so the rest of the page still renders
                setFeaturedFoodItems([]);
            } finally {
                setLoading(false);
            }
        };
        fetchLandingPageFoodItems();
    }, []);
        
    const getImageUrl = (imageName) => {
        if (!imageName) {
            // Fallback image URL for items without images
            return 'https://via.placeholder.com/300x200?text=No+Image+Available';
        }
        return `${API_CONFIG.IMAGE_BASE_URL}${imageName}`;
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    };
    return (
        <Container className="mt-4">
            {/* Hero Section */}
            <section id="home" className="hero-section text-center text-white py-5 mb-5 d-flex align-items-center justify-content-center"
                style={{
                    backgroundImage: 'url(https://www.tinbuilding.com/wp-content/uploads/2024/09/download-6-scaled-920x518.webp)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    minHeight: '60vh',
                    position: 'relative',
                    zIndex: 1
                }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: -1 }}></div>
                <div>
                    <h1 className="display-2 fw-bold mb-3">Taste the Tradition</h1>
                    <p className="lead fs-4 mb-4">Authentic Flavors, Unforgettable Moments</p>
                    <Button as={Link} to={routes.MENU} variant="primary" size="lg" className="shadow-lg">Explore Our Menu</Button>
                </div>
            </section>

            {/* About Us Section */}
            <section id="about" className="about-section py-5 mb-5 bg-light rounded shadow-sm">
                <Row className="justify-content-center">
                    <Col md={8} className="text-center">
                        <h2 className="mb-4 display-5 fw-bold">Our Story</h2>
                        <p className="lead">At [Restaurant Name], we believe in crafting more than just meals; we create experiences. Founded in [Year], our passion for authentic flavors and warm hospitality has driven us to become a beloved culinary destination. We source the freshest local ingredients to bring you dishes that tell a story, inspired by [Cuisine Type] traditions and modern innovation. Join us and become a part of our delicious journey.</p>
                    </Col>
                </Row>
            </section>

            {/* Menu Highlights Section */}
            <section id="menu-highlights" className="menu-highlights-section py-5 mb-5">
                <h2 className="text-center mb-5 display-5 fw-bold">Our Signature Dishes</h2>
                
                {loading && (
                    <div className="text-center">
                        <Spinner animation="border" role="status" variant="primary">
                            <span className="visually-hidden">Loading featured dishes...</span>
                        </Spinner>
                        <p className="mt-2">Loading our signature dishes...</p>
                    </div>
                )}
                
                {error && (
                    <Alert variant="warning" className="text-center">
                        {error}
                    </Alert>
                )}
                
                {!loading && !error && featuredFoodItems.length === 0 && (
                    <Alert variant="info" className="text-center">
                        No featured dishes available at the moment. Please check back later!
                    </Alert>
                )}
                
                {!loading && featuredFoodItems.length > 0 && (
                    <Row xs={1} md={2} lg={3} className="g-4">
                        {featuredFoodItems.map((item, index) => (
                            <Col key={item.foodName || index} xs={6} sm={6} md={4} lg={4}>
                                <Card className="h-100 shadow-sm">
                                    <Card.Img 
                                        variant="top" 
                                        src={getImageUrl(item.image)} 
                                        alt={item.foodName}
                                        style={{ objectFit: 'cover' }}
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/300x200?text=No+Image+Available';
                                        }}
                                    />
                                    <Card.Body className="text-center d-flex flex-column">
                                        <Card.Title className="fw-bold">{item.foodName}</Card.Title>
                                        <Card.Text className="flex-grow-1 small">{item.description}</Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
                
                <div className="text-center mt-5">
                    <Button as={Link} to={routes.MENU} variant="outline-primary" size="lg">View Full Menu</Button>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="testimonials-section bg-light py-5 mb-5 rounded shadow-sm">
                <h2 className="text-center mb-4 display-5 fw-bold">What Our Customers Say</h2>
                <Row className="justify-content-center">
                    <Col md={8} className="text-center">
                        <p className="fst-italic fs-5">"The best restaurant experience I've ever had! The food was exquisite and the service was impeccable. A true culinary gem!"</p>
                        <p className="fw-bold fs-6">- Alex P., Food Critic</p>
                        <p className="fst-italic fs-5 mt-4">"Every dish is a masterpiece. The ambiance is perfect for any occasion, and the staff makes you feel right at home."</p>
                        <p className="fw-bold fs-6">- Maria S., Local Resident</p>
                    </Col>
                </Row>
            </section>

            {/* Gallery Section */}
            <section id="gallery" className="gallery-section py-5 mb-5">
                <h2 className="text-center mb-5 display-5 fw-bold">Our Gallery</h2>
                <Row xs={1} md={2} lg={3} className="g-4">
                    <Col>
                        <Card className="h-100 shadow-sm">
                            <Card.Img variant="top" src="https://www.venetianlasvegas.com/adobe/dynamicmedia/deliver/dm-aid--4c225213-f12b-461a-86cb-9acea8e06788/interior-1-1920x1080.jpg?quality=64&preferwebp=true" alt="Restaurant Interior" />
                        </Card>
                    </Col>
                    <Col>
                        <Card className="h-100 shadow-sm">
                            <Card.Img variant="top" src="https://www.blinkco.io/wp-content/uploads/2022/03/family-restaurant.webp" alt="Chef Cooking" />
                        </Card>
                    </Col>
                    <Col>
                        <Card className="h-100 shadow-sm">
                            <Card.Img variant="top" src="https://www.interninow.it/wp-content/uploads/2021/04/10-Stylish-Restaurant-Interior-Design-Ideas-Around-the-World_OR.jpg" alt="Dining Area" />
                        </Card>
                    </Col>
                    <Col>
                        <Card className="h-100 shadow-sm">
                            <Card.Img variant="top" src="https://i.vimeocdn.com/video/2010026468-c71fc5b5697b49ed6d6793147a507419c8073e5f2c034467e9885f6e12f20eef-d?f=webp" alt="Cocktails" />
                        </Card>
                    </Col>
                    <Col>
                        <Card className="h-100 shadow-sm">
                            <Card.Img variant="top" src="https://www.hurawalhi.com/wp-content/uploads/2019/04/5.8-1.jpg" alt="Dessert Platter" />
                        </Card>
                    </Col>
                    <Col>
                        <Card className="h-100 shadow-sm">
                            <Card.Img variant="top" src="https://media.istockphoto.com/id/478432824/tr/foto%C4%9Fraf/fashion-stylish-restaurant-interior.jpg?s=612x612&w=0&k=20&c=n2aRnM0IgknJEXEh0cqsgW-ubhW4Jd0gvsz3jMm90ng=" alt="Wine Selection" />
                        </Card>
                    </Col>
                </Row>
            </section>

            {/* Contact & Location Section */}
            <section id="contact" className="contact-section py-5 bg-light rounded shadow-sm">
                <h2 className="text-center mb-4 display-5 fw-bold">Contact Us & Find Us</h2>
                <Row className="justify-content-center">
                    <Col md={5} className="text-center mb-4 mb-md-0">
                        <h3>Our Location</h3>
                        <p className="lead"><strong>Address:</strong> 123 Culinary Lane, Flavor Town, FT 54321</p>
                        <p className="lead"><strong>Phone:</strong> (555) 123-4567</p>
                        <p className="lead"><strong>Email:</strong> info@restaurantname.com</p>
                    </Col>
                    <Col md={5} className="text-center">
                        <h3>Opening Hours</h3>
                        <ul className="list-unstyled lead">
                            <li>Monday - Thursday: 11:00 AM - 9:00 PM</li>
                            <li>Friday - Saturday: 11:00 AM - 10:00 PM</li>
                            <li>Sunday: 12:00 PM - 8:00 PM</li>
                        </ul>
                    </Col>
                </Row>
                <Row className="mt-4">
                    <Col>
                        <div className="map-container"
                             style={{height: '400px', width: '100%', borderRadius: '8px', overflow: 'hidden'}}>
                            {/* Google Maps Embed - Placeholder */}

                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6021.341210480089!2d28.95838192304266!3d41.01058232165296!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cab98fe9d1fd7d%3A0x55100f150db7b476!2sBaban%C4%B1n%20Yeri%20Restaurant!5e0!3m2!1str!2str!4v1756472672436!5m2!1str!2str"
                                width="100%"
                                height="100%"
                                style={{border: 0}}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Restaurant Location Map"
                            ></iframe>
                        </div>
                    </Col>
                </Row>
            </section>
        </Container>
    );
};

export default LandingPage;
