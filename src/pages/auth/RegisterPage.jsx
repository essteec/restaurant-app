import {Alert, Button, Card, CardBody, Col, Container, Form, Row} from "react-bootstrap";
import {useState} from "react";
import {useNavigate} from "react-router-dom";
import useAuth from "../../contexts/use-auth.js";
import routes from "../../routes/routes.js";

const RegisterPage = () => {
    const [firstName, setFirstName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');

        if (!firstName || !email || !password) {
            setError('Please fill all fields.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        // Password policy: at least one uppercase, one lowercase, and one digit
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
        if (!passwordRegex.test(password)) {
            setError('Password must contain at least one uppercase letter, one lowercase letter, and one digit.');
            return;
        }

        try {
            await register({ firstName, email, password });

            navigate(routes.HOME);
        } catch (error) {
            setError('Failed to create an account. Please try again later');
            console.error(error);
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
                        <CardBody>
                            <h2 className="text-center mb-4">Create an Account</h2>
                            {error && <Alert variant="danger">{error}</Alert>}
                            <Form onSubmit={handleSubmit}>
                                <Form.Group id="firstName" className="mb-3">
                                    <Form.Label>First Name</Form.Label>
                                    <Form.Control type="text" value={firstName}
                                                  onChange={(e) => setFirstName(e.target.value)}
                                                  required/>
                                </Form.Group>
                                <Form.Group id="email" className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control type="email" value={email}
                                                  onChange={(e) => setEmail(e.target.value)}
                                                  required/>
                                </Form.Group>
                                <Form.Group id="password">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control type="password" value={password}
                                                  onChange={(e) => setPassword(e.target.value)}
                                                  required/>
                                </Form.Group>
                                <Button type="submit" className="w-100 mt-4">
                                    Sign up
                                </Button>
                            </Form>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </Container>
    )
}

export default RegisterPage;