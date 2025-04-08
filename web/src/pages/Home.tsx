import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import WebSocketStatus from '../components/WebSocketStatus';
import '../styles/Home.css';

const Home: React.FC = () => {
  const { theme } = useTheme();
  const { connected } = useWebSocket();
  
  return (
    <div className={`home home-${theme}`}>
      <section className="home-hero">
        <div className="home-hero-content">
          <h1>Trade Bitcoin, Runes, and Alkanes Securely and Privately</h1>
          <p className="home-hero-subtitle">
            DarkSwap is a decentralized peer-to-peer trading platform built for security, privacy, and ease of use.
          </p>
          <div className="home-hero-actions">
            <Link to="/trade" className="home-hero-button primary">
              Start Trading
            </Link>
            <Link to="/about" className="home-hero-button secondary">
              Learn More
            </Link>
          </div>
          <div className="home-connection-status">
            <WebSocketStatus showLabel={true} />
            <span className="home-connection-message">
              {connected ? 'Connected to the network' : 'Not connected to the network'}
            </span>
          </div>
        </div>
        <div className="home-hero-image">
          <img src="/images/hero-illustration.svg" alt="DarkSwap Trading Platform" />
        </div>
      </section>
      
      <section className="home-features">
        <h2>Key Features</h2>
        <div className="home-features-grid">
          <div className="home-feature">
            <div className="home-feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <h3>Secure Trading</h3>
            <p>
              Trade with confidence using our secure platform built with PSBTs (Partially Signed Bitcoin Transactions).
            </p>
          </div>
          
          <div className="home-feature">
            <div className="home-feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
            </div>
            <h3>Bitcoin Integration</h3>
            <p>
              Seamlessly trade Bitcoin and Bitcoin-based assets like Runes and Alkanes.
            </p>
          </div>
          
          <div className="home-feature">
            <div className="home-feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3>Peer-to-Peer</h3>
            <p>
              Trade directly with other users without intermediaries using our P2P network.
            </p>
          </div>
          
          <div className="home-feature">
            <div className="home-feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </div>
            <h3>Privacy-Focused</h3>
            <p>
              Your data stays with you. No account creation or personal information required.
            </p>
          </div>
        </div>
      </section>
      
      <section className="home-cta">
        <h2>Ready to start trading?</h2>
        <p>
          Join the DarkSwap community and experience secure, private trading today.
        </p>
        <Link to="/trade" className="home-cta-button">
          Launch Trading Platform
        </Link>
      </section>
    </div>
  );
};

export default Home;