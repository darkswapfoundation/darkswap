/**
 * Navigation - Component for navigation menu
 * 
 * This component displays the navigation menu for the application.
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { withErrorBoundary } from './ErrorBoundary';
import { useErrorToast } from './ErrorToast';
import { DarkSwapError, ErrorCode } from '../utils/ErrorHandling';
import '../styles/Navigation.css';

// Navigation props
export interface NavigationProps {
  /** CSS class name */
  className?: string;
}

/**
 * Navigation component
 */
export const Navigation: React.FC<NavigationProps> = ({
  className = '',
}) => {
  // Error toast
  const { addToast } = useErrorToast();
  
  // Handle navigation error
  const handleNavigationError = (path: string) => {
    // Create error
    const error = new DarkSwapError(
      `Failed to navigate to ${path}`,
      ErrorCode.Unknown
    );
    
    // Add toast
    addToast({
      error,
      showDetails: false,
      autoDismiss: true,
    });
  };
  
  return (
    <nav className={`navigation ${className}`}>
      <ul className="navigation-list">
        <li className="navigation-item">
          <NavLink
            to="/"
            className={({ isActive }) => isActive ? 'active' : ''}
            end
          >
            Home
          </NavLink>
        </li>
        
        <li className="navigation-item">
          <NavLink
            to="/trade"
            className={({ isActive }) => isActive ? 'active' : ''}
            onClick={() => {
              try {
                // Navigation logic
              } catch (error) {
                handleNavigationError('/trade');
              }
            }}
          >
            Trade
          </NavLink>
        </li>
        
        <li className="navigation-item">
          <NavLink
            to="/orders"
            className={({ isActive }) => isActive ? 'active' : ''}
            onClick={() => {
              try {
                // Navigation logic
              } catch (error) {
                handleNavigationError('/orders');
              }
            }}
          >
            Orders
          </NavLink>
        </li>
        
        <li className="navigation-item">
          <NavLink
            to="/vault"
            className={({ isActive }) => isActive ? 'active' : ''}
            onClick={() => {
              try {
                // Navigation logic
              } catch (error) {
                handleNavigationError('/vault');
              }
            }}
          >
            Vault
          </NavLink>
        </li>
        
        <li className="navigation-item">
          <NavLink
            to="/settings"
            className={({ isActive }) => isActive ? 'active' : ''}
            onClick={() => {
              try {
                // Navigation logic
              } catch (error) {
                handleNavigationError('/settings');
              }
            }}
          >
            Settings
          </NavLink>
        </li>
        
        <li className="navigation-item">
          <NavLink
            to="/about"
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            About
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

// Export with error boundary
export default withErrorBoundary(Navigation, {
  componentName: 'Navigation',
  showErrorDetails: false,
});