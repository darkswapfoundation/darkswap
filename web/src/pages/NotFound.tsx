/**
 * NotFound - 404 page component
 * 
 * This page is displayed when a user navigates to a route that doesn't exist.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/MemoizedComponents';

/**
 * NotFound component
 */
const NotFound: React.FC = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button variant="primary">
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;