import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Icons
import {
  ExclamationTriangleIcon,
  HomeIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <ExclamationTriangleIcon className="w-24 h-24 text-twilight-neon-orange mx-auto mb-6" />
        
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
          404
        </h1>
        
        <h2 className="text-2xl md:text-3xl font-display font-medium mb-6">
          Page Not Found
        </h2>
        
        <p className="text-gray-400 max-w-md mx-auto mb-8">
          The page you're looking for doesn't exist or has been moved.
          Please check the URL or navigate back to the home page.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/" className="btn btn-primary">
            <HomeIcon className="w-5 h-5 mr-2" />
            Go Home
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="btn btn-outline"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;