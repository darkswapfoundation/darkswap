import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { useAuth } from './contexts/AuthContext';

// Import components
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';

// Import pages
import HomePage from './pages/Home';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardPage from './pages/Dashboard';
import WalletPage from './pages/Wallet';
import NetworkPage from './pages/Network';
import OrderBookPage from './pages/OrderBook';
import TradesPage from './pages/Trades';
import SettingsPage from './pages/Settings';
import NotFoundPage from './pages/NotFound';

// Import styles
import './App.css';

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="App">
      <Navigation />
      <Container className="mt-4">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute element={<DashboardPage />} />} />
          <Route path="/wallet" element={<ProtectedRoute element={<WalletPage />} />} />
          <Route path="/network" element={<ProtectedRoute element={<NetworkPage />} />} />
          <Route path="/orderbook" element={<ProtectedRoute element={<OrderBookPage />} />} />
          <Route path="/trades" element={<ProtectedRoute element={<TradesPage />} />} />
          <Route path="/settings" element={<ProtectedRoute element={<SettingsPage />} />} />

          {/* 404 route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Container>
    </div>
  );
};

export default App;