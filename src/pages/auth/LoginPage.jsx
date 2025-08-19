import {Alert, Button, Card, Col, Container, Form, Row} from "react-bootstrap";
import {useState} from "react";
import {useNavigate} from "react-router-dom";
import routes from "../../routes/routes.js";
import useAuth from "../../contexts/use-auth.js";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Please enter both email and password.");
            return;
        }

        try {
            await login(email, password);

            navigate(routes.HOME);
        } catch (error) {
            setError("Failed to login. Please check your credentials.");
            console.log(error);
        }
    };
    
    return (
        <Container
            fluid
            className="d-flex align-items-center justify-content-center min-vh-100"
            style={{
                backgroundImage: 'url(https://images.unsplash.com/photo-1504712176114-cd2544620113?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                padding: '20px 0'
            }}
        >
            <Row className="justify-content-center w-100">
                <Col md={6} lg={4}>
                    <Card className="shadow-lg p-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)' }}>
                        <Card.Body>
                            <h2 className="text-center mb-4">Login</h2>
                            {error && <Alert variant="danger">{error}</Alert>}
                            <Form onSubmit={handleSubmit}>
                                <Form.Group id="email" className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control type="email" value={email}
                                                  onChange={(e) => setEmail(e.target.value)}
                                                  required/>
                                </Form.Group>
                                <Form.Group id="password">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control type="password" value={password}
                                                  onChange={(e) => setPassword(e.target.value)} required
                                    />
                                </Form.Group>
                                <Button type="submit" className="w-100 mt-4">
                                    Log In
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    )
}

export default LoginPage;