import React from 'react';
import { Navbar, Nav, Container, Badge } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import ThemeToggle from './ThemeToggle';
import WebSocketStatus from './WebSocketStatus';
import NotificationDropdown from './NotificationDropdown';

// Navigation component
const Navigation: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { unreadCount } = useNotification();
  const location = useLocation();

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/">
          DarkSwap Bridge
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" active={location.pathname === '/'}>
              Home
            </Nav.Link>
            {isAuthenticated && (
              <>
                <Nav.Link as={Link} to="/dashboard" active={location.pathname === '/dashboard'}>
                  Dashboard
                </Nav.Link>
                <Nav.Link as={Link} to="/wallet" active={location.pathname === '/wallet'}>
                  Wallet
                </Nav.Link>
                <Nav.Link as={Link} to="/network" active={location.pathname === '/network'}>
                  Network
                </Nav.Link>
                <Nav.Link as={Link} to="/orderbook" active={location.pathname === '/orderbook'}>
                  Order Book
                </Nav.Link>
                <Nav.Link as={Link} to="/trades" active={location.pathname === '/trades'}>
                  Trades
                </Nav.Link>
              </>
            )}
          </Nav>
          <Nav>
            {isAuthenticated ? (
              <>
                <WebSocketStatus />
                <NotificationDropdown />
                <Nav.Link as={Link} to="/settings" active={location.pathname === '/settings'}>
                  Settings
                </Nav.Link>
                <Nav.Link onClick={handleLogout}>Logout ({user?.username})</Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" active={location.pathname === '/login'}>
                  Login
                </Nav.Link>
                <Nav.Link as={Link} to="/register" active={location.pathname === '/register'}>
                  Register
                </Nav.Link>
              </>
            )}
            <ThemeToggle />
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;