import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/About.css';

const About: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <div className={`about about-${theme}`}>
      <div className="about-header">
        <h1>About DarkSwap</h1>
        <p className="about-subtitle">
          A decentralized trading platform for Bitcoin, Runes, and Alkanes
        </p>
      </div>
      
      <div className="about-section">
        <h2>Our Mission</h2>
        <p>
          DarkSwap is built on the belief that trading should be accessible, secure, and private. 
          We're creating a platform that enables peer-to-peer trading without intermediaries, 
          giving users full control over their assets and trading experience.
        </p>
      </div>
      
      <div className="about-section">
        <h2>Key Features</h2>
        <div className="about-features">
          <div className="about-feature">
            <div className="about-feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h3>Secure Trading</h3>
            <p>
              Built with security as a priority, using PSBTs (Partially Signed Bitcoin Transactions) 
              for secure trade execution and robust wallet integration.
            </p>
          </div>
          
          <div className="about-feature">
            <div className="about-feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3>Peer-to-Peer</h3>
            <p>
              Trade directly with other users without intermediaries. Our P2P network uses 
              WebRTC for direct connections and circuit relay for NAT traversal.
            </p>
          </div>
          
          <div className="about-feature">
            <div className="about-feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <h3>Privacy-Focused</h3>
            <p>
              Your data stays with you. DarkSwap doesn't collect personal information or 
              require account creation, giving you a private trading experience.
            </p>
          </div>
        </div>
      </div>
      
      <div className="about-section">
        <h2>Technology</h2>
        <p>
          DarkSwap is built using modern technologies to ensure performance, security, and usability:
        </p>
        <ul className="about-tech-list">
          <li>Rust for core functionality and performance-critical components</li>
          <li>WebRTC for peer-to-peer communication</li>
          <li>React and TypeScript for the web interface</li>
          <li>Bitcoin libraries for wallet integration and transaction handling</li>
          <li>WebAssembly (WASM) for running Rust code in the browser</li>
        </ul>
      </div>
      
      <div className="about-section">
        <h2>Open Source</h2>
        <p>
          DarkSwap is an open-source project. We believe in transparency and community collaboration.
          You can find our code on <a href="https://github.com/darkswap" target="_blank" rel="noopener noreferrer">GitHub</a>.
        </p>
      </div>
      
      <div className="about-section">
        <h2>Get Involved</h2>
        <p>
          We welcome contributions from developers, designers, and anyone interested in improving DarkSwap.
          Join our community on <a href="https://discord.gg/darkswap" target="_blank" rel="noopener noreferrer">Discord</a> to get started.
        </p>
      </div>
    </div>
  );
};

export default About;
