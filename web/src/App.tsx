/**
 * App - Main application component
 * 
 * This component is the root component of the application.
 * It provides the application layout and global providers.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DarkSwapProvider } from './contexts/DarkSwapContext';
import { ErrorToastManager } from './components/ErrorToast';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import { Footer } from './components/Footer';
import { Navigation } from './components/Navigation';
import Home from './pages/Home';
import Trade from './pages/Trade';
import Orders from './pages/Orders';
import Vault from './pages/Vault';
import Settings from './pages/Settings';
import About from './pages/About';
import NotFound from './pages/NotFound';
import { initializeErrorReporting } from './utils/ErrorReporting';
import './styles/App.css';

// Initialize error reporting
const cleanupErrorReporting = initializeErrorReporting({
  enabled: process.env.NODE_ENV === 'production',
  appVersion: process.env.REACT_APP_VERSION || '1.0.0',
  tags: {
    environment: process.env.NODE_ENV || 'development',
  },
});

/**
 * App component
 */
const App: React.FC = () => {
  // Clean up error reporting on unmount
  React.useEffect(() => {
    return () => {
      cleanupErrorReporting();
    };
  }, []);
  
  return (
    <ErrorBoundary
      componentName="App"
      showErrorDetails={process.env.NODE_ENV !== 'production'}
    >
      <ErrorToastManager>
        <DarkSwapProvider>
          <Router>
            <div className="app">
              <Header />
              
              <div className="app-content">
                <Navigation />
                
                <main className="main-content">
                  <ErrorBoundary
                    componentName="Routes"
                    showErrorDetails={process.env.NODE_ENV !== 'production'}
                  >
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/trade" element={<Trade />} />
                      <Route path="/orders" element={<Orders />} />
                      <Route path="/vault" element={<Vault />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/about" element={<About />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </ErrorBoundary>
                </main>
              </div>
              
              <Footer />
            </div>
          </Router>
        </DarkSwapProvider>
      </ErrorToastManager>
    </ErrorBoundary>
  );
};

export default App;