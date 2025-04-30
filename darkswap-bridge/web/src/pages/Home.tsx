import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Home page component
const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Container>
      <Row className="my-5">
        <Col>
          <div className="text-center">
            <h1 className="display-4">Welcome to DarkSwap Bridge</h1>
            <p className="lead">
              A secure bridge for decentralized trading of Bitcoin, Runes, and Alkanes
            </p>
            {!isAuthenticated && (
              <div className="mt-4">
                <Link to="/login">
                  <Button variant="primary" size="lg" className="me-3">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="outline-primary" size="lg">
                    Register
                  </Button>
                </Link>
              </div>
            )}
            {isAuthenticated && (
              <div className="mt-4">
                <Link to="/dashboard">
                  <Button variant="primary" size="lg">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Col>
      </Row>

      <Row className="my-5">
        <Col md={4} className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Secure Trading</Card.Title>
              <Card.Text>
                Trade Bitcoin, Runes, and Alkanes securely with our decentralized peer-to-peer
                network. No central authority, no intermediaries.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Wallet Integration</Card.Title>
              <Card.Text>
                Connect your Bitcoin wallet and manage your assets directly from the DarkSwap
                Bridge interface.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Real-time Updates</Card.Title>
              <Card.Text>
                Get real-time updates on your trades, orders, and network status with our WebSocket
                integration.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="my-5">
        <Col>
          <Card>
            <Card.Body>
              <h2>How It Works</h2>
              <p>
                DarkSwap Bridge uses a unique architecture to resolve dependency conflicts between
                wallet and networking components. The bridge layer uses inter-process communication
                (IPC) to enable these components to run in separate processes, each with its own
                dependencies, while still communicating effectively.
              </p>
              <h3>Key Features</h3>
              <ul>
                <li>Decentralized peer-to-peer trading</li>
                <li>Secure wallet integration</li>
                <li>Real-time order book updates</li>
                <li>Trade Bitcoin, Runes, and Alkanes</li>
                <li>No central authority or intermediaries</li>
                <li>Open-source and transparent</li>
              </ul>
              <h3>Getting Started</h3>
              <p>
                To get started with DarkSwap Bridge, simply create an account, connect your wallet,
                and start trading. It's that simple!
              </p>
              {!isAuthenticated && (
                <Link to="/register">
                  <Button variant="primary">Create Account</Button>
                </Link>
              )}
              {isAuthenticated && (
                <Link to="/dashboard">
                  <Button variant="primary">Go to Dashboard</Button>
                </Link>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="my-5">
        <Col>
          <div className="text-center">
            <h2>Ready to start trading?</h2>
            <p className="lead">
              Join the DarkSwap community and start trading Bitcoin, Runes, and Alkanes today.
            </p>
            {!isAuthenticated && (
              <div className="mt-4">
                <Link to="/register">
                  <Button variant="primary" size="lg">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
            {isAuthenticated && (
              <div className="mt-4">
                <Link to="/dashboard">
                  <Button variant="primary" size="lg">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default HomePage;