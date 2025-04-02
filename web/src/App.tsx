import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { WalletProvider } from './contexts/WalletContext';
import { SDKProvider } from './contexts/SDKContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ApiProvider } from './contexts/ApiContext';
import { WebRtcProvider } from './contexts/WebRtcContext';
import { OrderbookProvider } from './contexts/OrderbookContext';
import { TradeExecutionProvider } from './contexts/TradeExecutionContext';
import { WasmWalletProvider } from './contexts/WasmWalletContext';
import { PeerDiscoveryProvider } from './contexts/PeerDiscoveryContext';
import { CircuitRelayProvider } from './contexts/CircuitRelayContext';
import { PeerEncryptionProvider } from './contexts/PeerEncryptionContext';

// Pages
import WasmWalletPage from './pages/WasmWalletPage';
import WebRtcPage from './pages/WebRtcPage';
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
import WebRtc from './pages/WebRtc';
import P2PTrade from './pages/P2PTrade';
import Runes from './pages/Runes';
import Alkanes from './pages/Alkanes';
import Predicates from './pages/Predicates';
import P2POrderbookPage from './pages/P2POrderbookPage';
import WasmWalletDemo from './pages/WasmWalletDemo';
import P2PNetworkPage from './pages/P2PNetworkPage';
import Advanced from './pages/Advanced';

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
      <Route path="/webrtc" element={<WebRtcPage />} />
      <Route path="/p2p-orderbook" element={<P2POrderbookPage />} />
      <Route path="/p2p-trade" element={<P2PTrade />} />
      <Route path="/p2p-network" element={<P2PNetworkPage />} />
      <Route path="/wasm-wallet" element={<WasmWalletPage />} />
      <Route
        path="/runes"
        element={
          <Runes
            isWalletConnected={isConnected}
            isSDKInitialized={isInitialized}
            apiClient={client}
            isApiLoading={isApiLoading}
          />
        }
      />
      <Route
        path="/alkanes"
        element={
          <Alkanes
            isWalletConnected={isConnected}
            isSDKInitialized={isInitialized}
            apiClient={client}
            isApiLoading={isApiLoading}
          />
        }
      />
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
      <Route path="/advanced" element={<Advanced />} />
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
                <WebRtcProvider signalingServerUrl="ws://localhost:9001/signaling">
                  <PeerDiscoveryProvider
                    signalingServers={['ws://localhost:9001/signaling']}
                    bootstrapPeers={[]}
                    enableDht={true}
                    enableLocalDiscovery={true}
                    maxPeers={10}
                    autoStart={false}
                  >
                    <CircuitRelayProvider
                      relays={['relay-1.darkswap.io', 'relay-2.darkswap.io']}
                      maxRelays={3}
                      enableAutoRelay={true}
                      autoStart={false}
                    >
                      <PeerEncryptionProvider
                        keySize={2048}
                        algorithm="RSA-OAEP"
                        hashAlgorithm="SHA-256"
                        autoInitialize={true}
                      >
                        <WasmWalletProvider>
                          <OrderbookProvider>
                            <TradeExecutionProvider>
                              <WebSocketManager>
                              <Router>
                                <Layout>
                                  <PageWrapper />
                                </Layout>
                              </Router>
                              </WebSocketManager>
                            </TradeExecutionProvider>
                          </OrderbookProvider>
                        </WasmWalletProvider>
                      </PeerEncryptionProvider>
                    </CircuitRelayProvider>
                  </PeerDiscoveryProvider>
                </WebRtcProvider>
              </WebSocketProvider>
            </SDKProvider>
          </WalletProvider>
        </ApiProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default App;