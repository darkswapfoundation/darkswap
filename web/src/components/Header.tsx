/**
 * Header - Component for the application header
 * 
 * This component displays the header of the application.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { withErrorBoundary } from './ErrorBoundary';
import { useErrorToast } from './ErrorToast';
import { DarkSwapError, ErrorCode } from '../utils/ErrorHandling';
import '../styles/Header.css';

// Header props
export interface HeaderProps {
  /** CSS class name */
  className?: string;
}

/**
 * Header component
 */
const Header: React.FC<HeaderProps> = ({
  className = '',
}) => {
  // Error toast
  const { addToast } = useErrorToast();
  
  // Handle error
  const handleError = () => {
    // Create error
    const error = new DarkSwapError(
      'This is a test error',
      ErrorCode.Unknown
    );
    
    // Add toast
    addToast({
      error,
      showDetails: true,
      autoDismiss: true,
    });
  };
  
  return (
    <header className={`header ${className}`}>
      <div className="container">
        <div className="header-content">
          <div className="header-logo">
            <Link to="/" className="logo-link">
              DarkSwap
            </Link>
          </div>
          
          <div className="header-actions">
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleError}
              title="Test Error"
            >
              Test Error
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Export with error boundary
export default withErrorBoundary(Header, {
  componentName: 'Header',
  showErrorDetails: false,
});