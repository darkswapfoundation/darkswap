import React from 'react';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1>DarkSwap</h1>
          <p className="hero-subtitle">Decentralized P2P Trading for Bitcoin, Runes, and Alkanes</p>
          <div className="hero-actions">
            <Link to="/trade" className="trade-button">Start Trading</Link>
            <Link to="/about" className="learn-button">Learn More</Link>
          </div>
        </div>
      </div>
      
      <div className="features-section">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure</h3>
            <p>
              Trade directly with peers using atomic swaps and PSBTs.
              No intermediaries, no custody of funds.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌐</div>
            <h3>Decentralized</h3>
            <p>
              Fully peer-to-peer with WebRTC connections.
              No central servers or points of failure.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Private</h3>
            <p>
              No KYC, no registration, no personal information.
              Trade with complete privacy.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Fast</h3>
            <p>
              Direct peer-to-peer connections for low latency.
              Quick trade execution and settlement.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Multi-Asset</h3>
            <p>
              Trade Bitcoin, runes, and alkanes seamlessly.
              Support for more assets coming soon.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛠️</div>
            <h3>Open Source</h3>
            <p>
              Fully open source and transparent.
              Audit the code, contribute, and build on top.
            </p>
          </div>
        </div>
      </div>
      
      <div className="how-it-works-section">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Connect</h3>
            <p>
              Connect to the DarkSwap network using WebRTC.
              Find peers through the distributed network.
            </p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Create or Accept</h3>
            <p>
              Create a trade offer or accept an existing one.
              Specify the assets and amounts you want to trade.
            </p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Sign</h3>
            <p>
              Sign the transaction with your wallet.
              Verify the counterparty's signature.
            </p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Broadcast</h3>
            <p>
              Broadcast the transaction to the Bitcoin network.
              Wait for confirmation and enjoy your new assets.
            </p>
          </div>
        </div>
      </div>
      
      <div className="cta-section">
        <h2>Ready to Start Trading?</h2>
        <p>
          Join the decentralized trading revolution today.
          No registration, no KYC, just pure peer-to-peer trading.
        </p>
        <Link to="/trade" className="cta-button">Start Trading Now</Link>
      </div>
      
      <style>
        {`
          .home-page {
            padding: 0;
            max-width: 100%;
          }
          
          .hero-section {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #fff;
            padding: 100px 20px;
            text-align: center;
          }
          
          .hero-content {
            max-width: 800px;
            margin: 0 auto;
          }
          
          .hero-content h1 {
            font-size: 4rem;
            margin: 0 0 20px 0;
            color: #fff;
          }
          
          .hero-subtitle {
            font-size: 1.5rem;
            margin-bottom: 40px;
            color: #e2e2e2;
          }
          
          .hero-actions {
            display: flex;
            justify-content: center;
            gap: 20px;
          }
          
          .trade-button, .learn-button, .cta-button {
            display: inline-block;
            padding: 15px 30px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: 600;
            font-size: 1.1rem;
            transition: all 0.2s;
          }
          
          .trade-button {
            background-color: #28a745;
            color: #fff;
          }
          
          .trade-button:hover {
            background-color: #218838;
            transform: translateY(-2px);
          }
          
          .learn-button {
            background-color: transparent;
            color: #fff;
            border: 2px solid #fff;
          }
          
          .learn-button:hover {
            background-color: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
          }
          
          .features-section {
            padding: 80px 20px;
            max-width: 1200px;
            margin: 0 auto;
            text-align: center;
          }
          
          .features-section h2 {
            font-size: 2.5rem;
            margin-bottom: 50px;
            color: #333;
          }
          
          .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 30px;
          }
          
          .feature-card {
            background-color: #fff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            transition: transform 0.3s, box-shadow 0.3s;
          }
          
          .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
          }
          
          .feature-icon {
            font-size: 3rem;
            margin-bottom: 20px;
          }
          
          .feature-card h3 {
            font-size: 1.5rem;
            margin-bottom: 15px;
            color: #333;
          }
          
          .feature-card p {
            color: #555;
            line-height: 1.6;
          }
          
          .how-it-works-section {
            padding: 80px 20px;
            background-color: #f8f9fa;
            text-align: center;
          }
          
          .how-it-works-section h2 {
            font-size: 2.5rem;
            margin-bottom: 50px;
            color: #333;
          }
          
          .steps {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 30px;
            max-width: 1200px;
            margin: 0 auto;
          }
          
          .step {
            background-color: #fff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            flex: 1;
            min-width: 250px;
            max-width: 300px;
            position: relative;
          }
          
          .step-number {
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            width: 40px;
            height: 40px;
            background-color: #007bff;
            color: #fff;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 1.2rem;
            font-weight: 600;
          }
          
          .step h3 {
            font-size: 1.5rem;
            margin: 20px 0 15px 0;
            color: #333;
          }
          
          .step p {
            color: #555;
            line-height: 1.6;
          }
          
          .cta-section {
            padding: 80px 20px;
            background: linear-gradient(135deg, #16213e 0%, #1a1a2e 100%);
            color: #fff;
            text-align: center;
          }
          
          .cta-section h2 {
            font-size: 2.5rem;
            margin-bottom: 20px;
            color: #fff;
          }
          
          .cta-section p {
            font-size: 1.2rem;
            margin-bottom: 40px;
            color: #e2e2e2;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
          }
          
          .cta-button {
            background-color: #28a745;
            color: #fff;
            padding: 15px 40px;
          }
          
          .cta-button:hover {
            background-color: #218838;
            transform: translateY(-2px);
          }
          
          @media (max-width: 768px) {
            .hero-content h1 {
              font-size: 3rem;
            }
            
            .hero-subtitle {
              font-size: 1.2rem;
            }
            
            .hero-actions {
              flex-direction: column;
              gap: 15px;
            }
            
            .features-grid {
              grid-template-columns: 1fr;
            }
            
            .steps {
              flex-direction: column;
              align-items: center;
            }
            
            .step {
              width: 100%;
              max-width: 100%;
            }
          }
        `}
      </style>
    </div>
  );
};