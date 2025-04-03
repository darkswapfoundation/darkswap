import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLocalPeerId } from '../hooks/useDarkSwap';

export const Navigation: React.FC = () => {
  // Get the current location
  const location = useLocation();
  
  // Get the local peer ID
  const localPeerId = useLocalPeerId();
  
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  // Close mobile menu
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };
  
  // Check if a path is active
  const isActive = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-logo">
          <Link to="/" onClick={closeMobileMenu}>
            <span className="logo-text">DarkSwap</span>
          </Link>
        </div>
        
        <div className="nav-links-desktop">
          <Link to="/" className={isActive('/') ? 'active' : ''}>
            Home
          </Link>
          <Link to="/trade" className={isActive('/trade') ? 'active' : ''}>
            Trade
          </Link>
          <Link to="/settings" className={isActive('/settings') ? 'active' : ''}>
            Settings
          </Link>
          <Link to="/about" className={isActive('/about') ? 'active' : ''}>
            About
          </Link>
        </div>
        
        <div className="nav-peer-id">
          <span className="peer-id-label">Peer ID:</span>
          <span className="peer-id-value" title={localPeerId}>
            {localPeerId.substring(0, 8)}...
          </span>
        </div>
        
        <div className="nav-mobile-toggle" onClick={toggleMobileMenu}>
          <div className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
      
      <div className={`nav-links-mobile ${mobileMenuOpen ? 'open' : ''}`}>
        <Link to="/" className={isActive('/') ? 'active' : ''} onClick={closeMobileMenu}>
          Home
        </Link>
        <Link to="/trade" className={isActive('/trade') ? 'active' : ''} onClick={closeMobileMenu}>
          Trade
        </Link>
        <Link to="/settings" className={isActive('/settings') ? 'active' : ''} onClick={closeMobileMenu}>
          Settings
        </Link>
        <Link to="/about" className={isActive('/about') ? 'active' : ''} onClick={closeMobileMenu}>
          About
        </Link>
      </div>
      
      <style>
        {`
          .navigation {
            background-color: #1a1a2e;
            color: #fff;
            position: sticky;
            top: 0;
            z-index: 1000;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          .nav-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 20px;
            height: 60px;
            max-width: 1200px;
            margin: 0 auto;
          }
          
          .nav-logo {
            font-size: 1.5rem;
            font-weight: 700;
          }
          
          .nav-logo a {
            color: #fff;
            text-decoration: none;
          }
          
          .logo-text {
            background: linear-gradient(45deg, #28a745, #007bff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-weight: 800;
          }
          
          .nav-links-desktop {
            display: flex;
            gap: 20px;
          }
          
          .nav-links-desktop a {
            color: #e2e2e2;
            text-decoration: none;
            font-weight: 500;
            padding: 5px 10px;
            border-radius: 4px;
            transition: all 0.2s;
          }
          
          .nav-links-desktop a:hover {
            color: #fff;
            background-color: rgba(255, 255, 255, 0.1);
          }
          
          .nav-links-desktop a.active {
            color: #fff;
            background-color: rgba(255, 255, 255, 0.2);
          }
          
          .nav-peer-id {
            display: flex;
            align-items: center;
            gap: 5px;
            background-color: rgba(255, 255, 255, 0.1);
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 0.9rem;
          }
          
          .peer-id-label {
            color: #e2e2e2;
          }
          
          .peer-id-value {
            font-family: monospace;
            color: #fff;
          }
          
          .nav-mobile-toggle {
            display: none;
            cursor: pointer;
          }
          
          .hamburger {
            width: 30px;
            height: 20px;
            position: relative;
            transform: rotate(0deg);
            transition: .5s ease-in-out;
          }
          
          .hamburger span {
            display: block;
            position: absolute;
            height: 3px;
            width: 100%;
            background: #fff;
            border-radius: 3px;
            opacity: 1;
            left: 0;
            transform: rotate(0deg);
            transition: .25s ease-in-out;
          }
          
          .hamburger span:nth-child(1) {
            top: 0px;
          }
          
          .hamburger span:nth-child(2) {
            top: 8px;
          }
          
          .hamburger span:nth-child(3) {
            top: 16px;
          }
          
          .hamburger.open span:nth-child(1) {
            top: 8px;
            transform: rotate(135deg);
          }
          
          .hamburger.open span:nth-child(2) {
            opacity: 0;
            left: -60px;
          }
          
          .hamburger.open span:nth-child(3) {
            top: 8px;
            transform: rotate(-135deg);
          }
          
          .nav-links-mobile {
            display: none;
            flex-direction: column;
            background-color: #1a1a2e;
            padding: 0;
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-in-out, padding 0.3s ease-in-out;
          }
          
          .nav-links-mobile.open {
            padding: 10px 0;
            max-height: 300px;
          }
          
          .nav-links-mobile a {
            color: #e2e2e2;
            text-decoration: none;
            font-weight: 500;
            padding: 15px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.2s;
          }
          
          .nav-links-mobile a:last-child {
            border-bottom: none;
          }
          
          .nav-links-mobile a:hover {
            color: #fff;
            background-color: rgba(255, 255, 255, 0.1);
          }
          
          .nav-links-mobile a.active {
            color: #fff;
            background-color: rgba(255, 255, 255, 0.2);
          }
          
          @media (max-width: 768px) {
            .nav-links-desktop {
              display: none;
            }
            
            .nav-peer-id {
              display: none;
            }
            
            .nav-mobile-toggle {
              display: block;
            }
            
            .nav-links-mobile {
              display: flex;
            }
          }
        `}
      </style>
    </nav>
  );
};