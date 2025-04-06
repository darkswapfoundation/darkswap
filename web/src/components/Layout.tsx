/**
 * Layout - Main application layout component
 * 
 * This component provides the common layout structure for all pages,
 * including header, navigation, footer, and content area.
 */

import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './MemoizedComponents';
import ThemeToggle from './ThemeToggle';
import WebSocketStatus from './WebSocketStatus';
import PeerStatus from './PeerStatus';

export interface LayoutProps {
  /** Child components to render in the content area */
  children: ReactNode;
}

/**
 * Layout component
 */
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left">
          <Link to="/" className="logo">
            DarkSwap
          </Link>
        </div>
        <nav className="main-nav">
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/trade">Trade</Link>
            </li>
            <li>
              <Link to="/orders">Orders</Link>
            </li>
            <li>
              <Link to="/vault">Vault</Link>
            </li>
          </ul>
        </nav>
        <div className="header-right">
          <WebSocketStatus />
          <PeerStatus />
          <ThemeToggle />
          <Link to="/settings">
            <Button variant="outline" size="small">
              Settings
            </Button>
          </Link>
        </div>
      </header>

      <main className="app-content">{children}</main>

      <footer className="app-footer">
        <div className="footer-left">
          <p>&copy; {new Date().getFullYear()} DarkSwap</p>
        </div>
        <div className="footer-center">
          <ul>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <a href="https://docs.darkswap.io" target="_blank" rel="noopener noreferrer">
                Documentation
              </a>
            </li>
            <li>
              <a href="https://github.com/darkswap" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </li>
          </ul>
        </div>
        <div className="footer-right">
          <p>Version {process.env.REACT_APP_VERSION || '1.0.0'}</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;