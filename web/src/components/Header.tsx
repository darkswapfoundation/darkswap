import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';
import WebSocketStatus from './WebSocketStatus';
import '../styles/Header.css';

const Header: React.FC = () => {
  const { theme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  
  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  // Close mobile menu
  const closeMenu = () => {
    setIsMenuOpen(false);
  };
  
  return (
    <header className={`header header-${theme}`}>
      <div className="header-container">
        <div className="header-logo">
          <Link to="/" onClick={closeMenu}>
            <img src="/logo.svg" alt="DarkSwap" />
            <span>DarkSwap</span>
          </Link>
        </div>
        
        <button
          className={`header-menu-toggle ${isMenuOpen ? 'open' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        <nav className={`header-nav ${isMenuOpen ? 'open' : ''}`}>
          <ul className="header-nav-list">
            <li className="header-nav-item">
              <NavLink to="/trade" onClick={closeMenu}>Trade</NavLink>
            </li>
            <li className="header-nav-item">
              <NavLink to="/orders" onClick={closeMenu}>Orders</NavLink>
            </li>
            <li className="header-nav-item">
              <NavLink to="/vault" onClick={closeMenu}>Vault</NavLink>
            </li>
            <li className="header-nav-item dropdown">
              <span className="dropdown-toggle">Demos</span>
              <div className="dropdown-menu">
                <NavLink to="/wasm-demo" onClick={closeMenu}>WebAssembly Demo</NavLink>
                <NavLink to="/webrtc-demo" onClick={closeMenu}>WebRTC Demo</NavLink>
                <NavLink to="/lazy-demo" onClick={closeMenu}>Lazy Loading Demo</NavLink>
                <NavLink to="/streaming-demo" onClick={closeMenu}>Streaming Demo</NavLink>
                <NavLink to="/web-worker-demo" onClick={closeMenu}>Web Worker Demo</NavLink>
                <NavLink to="/code-split-demo" onClick={closeMenu}>Code Split Demo</NavLink>
              </div>
            </li>
            <li className="header-nav-item">
              <NavLink to="/settings" onClick={closeMenu}>Settings</NavLink>
            </li>
            <li className="header-nav-item">
              <NavLink to="/about" onClick={closeMenu}>About</NavLink>
            </li>
          </ul>
        </nav>
        
        <div className="header-actions">
          <WebSocketStatus size="small" />
          <ThemeToggle size="small" />
        </div>
      </div>
    </header>
  );
};

export default Header;