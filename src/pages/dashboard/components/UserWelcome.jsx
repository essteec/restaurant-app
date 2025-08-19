import { Row, Col } from 'react-bootstrap';

const UserWelcome = ({ title, subtitle }) => {
    return (
        <Row className="text-center mb-4">
            <Col>
                { title && <h1 className="display-4 mb-3">{title}</h1>}
                { subtitle && <p className="lead">{subtitle}</p>}
            </Col>
        </Row>
    );
};

export default UserWelcome;
