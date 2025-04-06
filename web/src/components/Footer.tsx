/**
 * Footer - Component for the application footer
 * 
 * This component displays the footer of the application.
 */

import React from 'react';
import { withErrorBoundary } from './ErrorBoundary';
import '../styles/Footer.css';

// Footer props
export interface FooterProps {
  /** CSS class name */
  className?: string;
}

/**
 * Footer component
 */
export const Footer: React.FC<FooterProps> = ({
  className = '',
}) => {
  // Get current year
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={`footer ${className}`}>
      <div className="container">
        <div className="footer-content">
          <div className="footer-copyright">
            &copy; {currentYear} DarkSwap. All rights reserved.
          </div>
          
          <div className="footer-links">
            <a href="/terms" className="footer-link">Terms of Service</a>
            <a href="/privacy" className="footer-link">Privacy Policy</a>
            <a href="/contact" className="footer-link">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Export with error boundary
export default withErrorBoundary(Footer, {
  componentName: 'Footer',
  showErrorDetails: false,
});