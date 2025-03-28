import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { WalletProvider } from './contexts/WalletContext';
import { SDKProvider } from './contexts/SDKContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ApiProvider } from './contexts/ApiContext';
import Layout from './components/Layout';
import { useWallet } from './contexts/WalletContext';
import { useSDK } from './contexts/SDKContext';
import { useApi } from './contexts/ApiContext';
import WebSocketManager from './components/WebSocketManager';

// Pages
import Home from './pages/Home';
import Trade from './pages/Trade';
import Orders from './pages/Orders';
import Vault from './pages/Vault';
import About from './pages/About';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Wrapper component to provide context values to pages
const PageWrapper: React.FC = () => {
  const { isConnected } = useWallet();
  const { isInitialized } = useSDK();
  const { client, isLoading: isApiLoading } = useApi();
  
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/trade"
        element={
          <Trade
            isWalletConnected={isConnected}
            isSDKInitialized={isInitialized}
            apiClient={client}
            isApiLoading={isApiLoading}
          />
        }
      />
      <Route
        path="/orders"
        element={
          <Orders
            isWalletConnected={isConnected}
            isSDKInitialized={isInitialized}
            apiClient={client}
            isApiLoading={isApiLoading}
          />
        }
      />
      <Route
        path="/vault"
        element={
          <Vault
            isWalletConnected={isConnected}
            isSDKInitialized={isInitialized}
            apiClient={client}
            isApiLoading={isApiLoading}
          />
        }
      />
      <Route path="/about" element={<About />} />
      <Route
        path="/settings"
        element={
          <Settings
            isWalletConnected={isConnected}
            isSDKInitialized={isInitialized}
            apiClient={client}
            isApiLoading={isApiLoading}
          />
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <ApiProvider baseUrl="http://localhost:3000">
          <WalletProvider>
            <SDKProvider>
              <WebSocketProvider url="ws://localhost:3000/ws">
                <WebSocketManager>
                  <Router>
                    <Layout>
                      <PageWrapper />
                    </Layout>
                  </Router>
                </WebSocketManager>
              </WebSocketProvider>
            </SDKProvider>
          </WalletProvider>
        </ApiProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default App;