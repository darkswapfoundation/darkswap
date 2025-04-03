import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you are looking for does not exist or has been moved.</p>
        <div className="not-found-actions">
          <Link to="/" className="home-button">Go to Home</Link>
          <Link to="/trade" className="trade-button">Go to Trade</Link>
        </div>
      </div>
      
      <style>
        {`
          .not-found-page {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: calc(100vh - 100px);
            padding: 20px;
          }
          
          .not-found-content {
            text-align: center;
            max-width: 500px;
            background-color: #fff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }
          
          .not-found-content h1 {
            font-size: 6rem;
            margin: 0;
            color: #dc3545;
            line-height: 1;
          }
          
          .not-found-content h2 {
            font-size: 2rem;
            margin: 0 0 20px 0;
            color: #333;
          }
          
          .not-found-content p {
            margin-bottom: 30px;
            color: #555;
            font-size: 1.1rem;
          }
          
          .not-found-actions {
            display: flex;
            justify-content: center;
            gap: 20px;
          }
          
          .home-button, .trade-button {
            display: inline-block;
            padding: 10px 20px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: 500;
            transition: background-color 0.2s;
          }
          
          .home-button {
            background-color: #007bff;
            color: #fff;
          }
          
          .home-button:hover {
            background-color: #0069d9;
          }
          
          .trade-button {
            background-color: #28a745;
            color: #fff;
          }
          
          .trade-button:hover {
            background-color: #218838;
          }
        `}
      </style>
    </div>
  );
};