import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import routes from '../../routes/routes.js';

const LandingPage = () => {
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
                <Row xs={1} md={2} lg={3} className="g-4">
                    <Col>
                        <Card className="h-100 shadow-sm">
                            <Card.Img variant="top" src="https://www.meatburgergurme.com/wp-content/uploads/2023/10/Classic-Burger-0078-scaled.jpg" alt="Gourmet Burger" />
                            <Card.Body className="text-center">
                                <Card.Title className="fw-bold">The Classic Gourmet Burger</Card.Title>
                                <Card.Text>Juicy patty, melted cheddar, fresh veggies, and our secret sauce on a toasted brioche bun. A timeless favorite!</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col>
                        <Card className="h-100 shadow-sm">
                            <Card.Img variant="top" src="https://mojo.generalmills.c../../api/public/content/iEkDsPG26UKrIPjGfk5e0w_webp_base.webp?v=d798beef&t=191ddcab8d1c415fa10fa00a14351227" alt="Pasta Dish" />
                            <Card.Body className="text-center">
                                <Card.Title className="fw-bold">Creamy Tuscan Pasta</Card.Title>
                                <Card.Text>Al dente pasta tossed in a rich sun-dried tomato cream sauce with spinach and grilled chicken.</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col>
                        <Card className="h-100 shadow-sm">
                            <Card.Img variant="top" src="https://handletheheat.com/wp-content/uploads/2018/01/Chocolate-Lava-Cakes-SQUARE.png" alt="Dessert" />
                            <Card.Body className="text-center">
                                <Card.Title className="fw-bold">Decadent Chocolate Lava Cake</Card.Title>
                                <Card.Text>Warm, gooey chocolate cake with a molten center, served with a scoop of vanilla bean ice cream.</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
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
