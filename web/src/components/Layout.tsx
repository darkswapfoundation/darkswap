import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';
import { Footer } from './Footer';

export const Layout: React.FC = () => {
  return (
    <div className="layout">
      <Navigation />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
      
      <style>
        {`
          .layout {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
          }
          
          .main-content {
            flex: 1;
          }
        `}
      </style>
    </div>
  );
};