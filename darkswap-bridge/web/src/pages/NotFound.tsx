import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// Not found page component
const NotFoundPage: React.FC = () => {
  return (
    <Container>
      <Row className="justify-content-center mt-5">
        <Col md={8} className="text-center">
          <h1 className="display-1">404</h1>
          <h2 className="mb-4">Page Not Found</h2>
          <p className="lead mb-4">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link to="/">
            <Button variant="primary">Go to Home</Button>
          </Link>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFoundPage;