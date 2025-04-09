import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

const Home: React.FC = () => {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to DarkSwap</h1>
          <p className="hero-subtitle">
            A decentralized exchange for Bitcoin, Runes, and Alkanes
          </p>
          <div className="hero-buttons">
            <Link to="/trade" className="btn btn-primary">Start Trading</Link>
            <Link to="/about" className="btn btn-secondary">Learn More</Link>
          </div>
        </div>
      </section>

      <section className="features">
        <h2>Key Features</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure Trading</h3>
            <p>Trade directly from your wallet with no custodial risk</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Fast Execution</h3>
            <p>Execute trades quickly with our optimized P2P network</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌐</div>
            <h3>Decentralized</h3>
            <p>No central authority or single point of failure</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Low Fees</h3>
            <p>Minimal fees compared to centralized exchanges</p>
          </div>
        </div>
      </section>

      <section className="demo-section">
        <h2>Try Our WebAssembly Demo</h2>
        <p>
          Experience the power of DarkSwap running directly in your browser with our
          WebAssembly integration. Create and take orders, view market data, and more.
        </p>
        <div className="demo-buttons">
          <Link to="/wasm-demo" className="btn btn-primary">Launch WebAssembly Demo</Link>
        </div>
      </section>

      <section className="demo-section webrtc-demo-section">
        <h2>Try Our WebRTC Demo</h2>
        <p>
          Experience peer-to-peer trading with our WebRTC integration. Connect directly
          to other traders, exchange messages, and trade without intermediaries.
        </p>
        <div className="demo-buttons">
          <Link to="/webrtc-demo" className="btn btn-primary">Launch WebRTC Demo</Link>
        </div>
      </section>

      <section className="demo-section lazy-demo-section">
        <h2>Try Our Lazy Loading Demo</h2>
        <p>
          Experience improved performance with our lazy loading WebAssembly integration.
          The WebAssembly module is only loaded when it's needed, which improves initial
          page load performance.
        </p>
        <div className="demo-buttons">
          <Link to="/lazy-demo" className="btn btn-primary">Launch Lazy Loading Demo</Link>
        </div>
      </section>

      <section className="demo-section streaming-demo-section">
        <h2>Try Our Streaming Demo</h2>
        <p>
          Experience even faster loading with our streaming WebAssembly integration.
          The WebAssembly module is compiled while it's being downloaded, which
          significantly improves loading times.
        </p>
        <div className="demo-buttons">
          <Link to="/streaming-demo" className="btn btn-primary">Launch Streaming Demo</Link>
        </div>
      </section>

      <section className="demo-section web-worker-demo-section">
        <h2>Try Our Web Worker Demo</h2>
        <p>
          Experience improved responsiveness with our Web Worker WebAssembly integration.
          The WebAssembly module is loaded and compiled in a background thread, which
          keeps the main thread free for user interactions.
        </p>
        <div className="demo-buttons">
          <Link to="/web-worker-demo" className="btn btn-primary">Launch Web Worker Demo</Link>
        </div>
      </section>

      <section className="demo-section code-split-demo-section">
        <h2>Try Our Code Split Demo</h2>
        <p>
          Experience improved initial load time with our code split WebAssembly integration.
          The WebAssembly module is split into smaller chunks that are loaded on demand,
          which significantly improves the initial page load time.
        </p>
        <div className="demo-buttons">
          <Link to="/code-split-demo" className="btn btn-primary">Launch Code Split Demo</Link>
        </div>
      </section>

      <section className="getting-started">
        <h2>Getting Started</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Connect Your Wallet</h3>
            <p>Connect your Bitcoin wallet to start trading</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Deposit Funds</h3>
            <p>Deposit Bitcoin, Runes, or Alkanes to your trading wallet</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Start Trading</h3>
            <p>Create or take orders on the trading page</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;