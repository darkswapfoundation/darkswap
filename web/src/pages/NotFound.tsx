import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-6xl font-display font-bold mb-6">
        <span className="text-white">404</span>
      </h1>
      <h2 className="text-2xl font-display font-medium mb-4">
        <span className="text-white">Page Not Found</span>
      </h2>
      <p className="text-gray-400 mb-8 max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link 
        to="/" 
        className="btn btn-primary"
      >
        Return to Home
      </Link>
    </div>
  );
};

export default NotFound;