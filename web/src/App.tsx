import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Trade } from './pages/Trade';
import { Settings } from './pages/Settings';
import { About } from './pages/About';
import { NotFound } from './pages/NotFound';
import { ApiProvider } from './contexts/ApiContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { DarkSwapProvider } from './contexts/DarkSwapContext';
import { WebSocketManager } from './components/WebSocketManager';
import { Notifications } from './components/Notifications';

// API and WebSocket URLs
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws';

export const App: React.FC = () => {
  return (
    <NotificationProvider>
      <ApiProvider options={{ baseUrl: API_URL }}>
        <WebSocketProvider url={WS_URL}>
          <DarkSwapProvider options={{ apiUrl: API_URL, wsUrl: WS_URL }}>
            <Router>
              <WebSocketManager />
              <Notifications position="top-right" />
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="trade" element={<Trade />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="about" element={<About />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
              
              <style>
                {`
                  /* Global styles */
                  * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                  }
                  
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
                      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                    line-height: 1.5;
                    color: #333;
                    background-color: #f8f9fa;
                  }
                  
                  a {
                    color: #007bff;
                    text-decoration: none;
                  }
                  
                  a:hover {
                    text-decoration: underline;
                  }
                  
                  button {
                    cursor: pointer;
                  }
                  
                  /* Utility classes */
                  .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 20px;
                  }
                  
                  .text-center {
                    text-align: center;
                  }
                  
                  .mt-1 { margin-top: 0.25rem; }
                  .mt-2 { margin-top: 0.5rem; }
                  .mt-3 { margin-top: 1rem; }
                  .mt-4 { margin-top: 1.5rem; }
                  .mt-5 { margin-top: 3rem; }
                  
                  .mb-1 { margin-bottom: 0.25rem; }
                  .mb-2 { margin-bottom: 0.5rem; }
                  .mb-3 { margin-bottom: 1rem; }
                  .mb-4 { margin-bottom: 1.5rem; }
                  .mb-5 { margin-bottom: 3rem; }
                  
                  /* Responsive utilities */
                  @media (max-width: 768px) {
                    .hide-sm {
                      display: none;
                    }
                  }
                  
                  @media (min-width: 769px) {
                    .hide-lg {
                      display: none;
                    }
                  }
                `}
              </style>
            </Router>
          </DarkSwapProvider>
        </WebSocketProvider>
      </ApiProvider>
    </NotificationProvider>
  );
};

export default App;