/**
 * Home - Home page component
 * 
 * This is the main landing page for the DarkSwap application.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../components/MemoizedComponents';
import LazyImage from '../components/LazyImage';

/**
 * Home component
 */
const Home: React.FC = () => {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1>DarkSwap</h1>
          <p className="hero-subtitle">
            Decentralized trading for Bitcoin, runes, and alkanes
          </p>
          <div className="hero-buttons">
            <Link to="/trade">
              <Button variant="primary" size="large">
                Start Trading
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="outline" size="large">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <LazyImage
            src="/images/hero-image.png"
            alt="DarkSwap Trading Interface"
            placeholder="/images/hero-image-placeholder.png"
            width="100%"
            height="auto"
          />
        </div>
      </section>

      <section className="features-section">
        <h2>Key Features</h2>
        <div className="features-grid">
          <Card
            title="Decentralized"
            className="feature-card"
          >
            <p>
              Trade directly with peers without intermediaries. Your keys, your coins.
            </p>
          </Card>
          <Card
            title="Private"
            className="feature-card"
          >
            <p>
              Enhanced privacy features protect your trading activity and personal information.
            </p>
          </Card>
          <Card
            title="Secure"
            className="feature-card"
          >
            <p>
              Built on proven cryptographic protocols with comprehensive security measures.
            </p>
          </Card>
          <Card
            title="Fast"
            className="feature-card"
          >
            <p>
              Optimized performance with WebRTC for direct peer connections and minimal latency.
            </p>
          </Card>
        </div>
      </section>

      <section className="assets-section">
        <h2>Supported Assets</h2>
        <div className="assets-grid">
          <div className="asset-item">
            <h3>Bitcoin</h3>
            <p>The original cryptocurrency</p>
          </div>
          <div className="asset-item">
            <h3>Runes</h3>
            <p>Bitcoin-native tokens</p>
          </div>
          <div className="asset-item">
            <h3>Alkanes</h3>
            <p>Advanced digital assets</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to start trading?</h2>
        <p>
          Join the decentralized trading revolution with DarkSwap.
        </p>
        <Link to="/trade">
          <Button variant="primary" size="large">
            Launch App
          </Button>
        </Link>
      </section>
    </div>
  );
};

export default Home;