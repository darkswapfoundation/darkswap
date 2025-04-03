import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  // Get the current year
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>DarkSwap</h3>
          <p>
            Decentralized P2P Trading for Bitcoin, Runes, and Alkanes.
            Trade directly with peers, no intermediaries, no custody of funds.
          </p>
        </div>
        
        <div className="footer-section">
          <h3>Navigation</h3>
          <ul className="footer-links">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/trade">Trade</Link>
            </li>
            <li>
              <Link to="/settings">Settings</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Resources</h3>
          <ul className="footer-links">
            <li>
              <a href="https://github.com/darkswap/darkswap" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </li>
            <li>
              <a href="https://docs.darkswap.io" target="_blank" rel="noopener noreferrer">
                Documentation
              </a>
            </li>
            <li>
              <a href="https://darkswap.io/faq" target="_blank" rel="noopener noreferrer">
                FAQ
              </a>
            </li>
            <li>
              <a href="https://darkswap.io/blog" target="_blank" rel="noopener noreferrer">
                Blog
              </a>
            </li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Community</h3>
          <ul className="footer-links">
            <li>
              <a href="https://twitter.com/darkswap" target="_blank" rel="noopener noreferrer">
                Twitter
              </a>
            </li>
            <li>
              <a href="https://discord.gg/darkswap" target="_blank" rel="noopener noreferrer">
                Discord
              </a>
            </li>
            <li>
              <a href="https://t.me/darkswap" target="_blank" rel="noopener noreferrer">
                Telegram
              </a>
            </li>
            <li>
              <a href="https://reddit.com/r/darkswap" target="_blank" rel="noopener noreferrer">
                Reddit
              </a>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="copyright">
          &copy; {currentYear} DarkSwap. All rights reserved.
        </div>
        <div className="footer-bottom-links">
          <a href="https://darkswap.io/privacy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
          <a href="https://darkswap.io/terms" target="_blank" rel="noopener noreferrer">
            Terms of Service
          </a>
        </div>
      </div>
      
      <style>
        {`
          .footer {
            background-color: #1a1a2e;
            color: #e2e2e2;
            padding: 50px 20px 20px;
            margin-top: 50px;
          }
          
          .footer-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            max-width: 1200px;
            margin: 0 auto;
            gap: 30px;
          }
          
          .footer-section {
            flex: 1;
            min-width: 200px;
          }
          
          .footer-section h3 {
            color: #fff;
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 1.2rem;
          }
          
          .footer-section p {
            line-height: 1.6;
            margin-bottom: 0;
          }
          
          .footer-links {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          
          .footer-links li {
            margin-bottom: 10px;
          }
          
          .footer-links a {
            color: #e2e2e2;
            text-decoration: none;
            transition: color 0.2s;
          }
          
          .footer-links a:hover {
            color: #fff;
            text-decoration: underline;
          }
          
          .footer-bottom {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 1200px;
            margin: 30px auto 0;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            flex-wrap: wrap;
            gap: 10px;
          }
          
          .copyright {
            font-size: 0.9rem;
          }
          
          .footer-bottom-links {
            display: flex;
            gap: 20px;
          }
          
          .footer-bottom-links a {
            color: #e2e2e2;
            text-decoration: none;
            font-size: 0.9rem;
            transition: color 0.2s;
          }
          
          .footer-bottom-links a:hover {
            color: #fff;
            text-decoration: underline;
          }
          
          @media (max-width: 768px) {
            .footer-container {
              flex-direction: column;
            }
            
            .footer-section {
              margin-bottom: 20px;
            }
            
            .footer-bottom {
              flex-direction: column;
              text-align: center;
            }
            
            .copyright {
              margin-bottom: 10px;
            }
          }
        `}
      </style>
    </footer>
  );
};