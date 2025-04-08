import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/Footer.css';

const Footer: React.FC = () => {
  const { theme } = useTheme();
  const year = new Date().getFullYear();
  
  return (
    <footer className={`footer footer-${theme}`}>
      <div className="footer-container">
        <div className="footer-logo">
          <Link to="/">
            <img src="/logo.svg" alt="DarkSwap" />
            <span>DarkSwap</span>
          </Link>
        </div>
        
        <div className="footer-links">
          <div className="footer-links-section">
            <h4>Product</h4>
            <ul>
              <li><Link to="/trade">Trade</Link></li>
              <li><Link to="/orders">Orders</Link></li>
              <li><Link to="/vault">Vault</Link></li>
            </ul>
          </div>
          
          <div className="footer-links-section">
            <h4>Resources</h4>
            <ul>
              <li><Link to="/about">About</Link></li>
              <li><a href="https://github.com/darkswap" target="_blank" rel="noopener noreferrer">GitHub</a></li>
              <li><a href="https://docs.darkswap.io" target="_blank" rel="noopener noreferrer">Documentation</a></li>
            </ul>
          </div>
          
          <div className="footer-links-section">
            <h4>Legal</h4>
            <ul>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {year} DarkSwap. All rights reserved.</p>
          <div className="footer-social">
            <a href="https://twitter.com/darkswap" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
              </svg>
            </a>
            <a href="https://github.com/darkswap" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
            </a>
            <a href="https://discord.gg/darkswap" target="_blank" rel="noopener noreferrer" aria-label="Discord">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 9a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v7a5 5 0 0 0 5 5h4"></path>
                <circle cx="12" cy="11" r="1"></circle>
                <circle cx="17" cy="11" r="1"></circle>
                <circle cx="7" cy="11" r="1"></circle>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;