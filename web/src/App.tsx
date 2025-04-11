import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { ApiProvider } from './contexts/ApiContext';
import { MetaMaskProvider } from './contexts/MetaMaskContext';
import { WalletConnectProvider } from './contexts/WalletConnectContext';
import { LedgerProvider } from './contexts/LedgerContext';
import { TrezorProvider } from './contexts/TrezorContext';
import NotificationList from './components/NotificationList';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Trade from './pages/Trade';
import Orders from './pages/Orders';
import Vault from './pages/Vault';
import Settings from './pages/Settings';
import About from './pages/About';
import WasmDemo from './pages/WasmDemo';
import WebRtcDarkSwapDemo from './pages/WebRtcDarkSwapDemo';
import LazyDarkSwapDemo from './pages/LazyDarkSwapDemo';
import StreamingDarkSwapDemo from './pages/StreamingDarkSwapDemo';
import WebWorkerDarkSwapDemo from './pages/WebWorkerDarkSwapDemo';
import CodeSplitDarkSwapDemo from './pages/CodeSplitDarkSwapDemo';
import SimdDarkSwapDemo from './pages/SimdDarkSwapDemo';
import SharedMemoryDarkSwapDemo from './pages/SharedMemoryDarkSwapDemo';
import DynamicChunkSizeDarkSwapDemo from './pages/DynamicChunkSizeDarkSwapDemo';
import CombinedOptimizationsDarkSwapDemo from './pages/CombinedOptimizationsDarkSwapDemo';
import MnemonicGeneratorPage from './pages/MnemonicGeneratorPage';
import NotFound from './pages/NotFound';
import './styles/App.css';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <WebSocketProvider>
          <ApiProvider>
            <MetaMaskProvider>
              <WalletConnectProvider>
                <LedgerProvider>
                  <TrezorProvider>
                    <Router>
                      <div className="app">
                        <Header />
                        <main className="main-content">
                          <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/trade" element={<Trade />} />
                            <Route path="/trade/:baseAsset/:quoteAsset" element={<Trade />} />
                            <Route path="/orders" element={<Orders />} />
                            <Route path="/vault" element={<Vault />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/about" element={<About />} />
                            <Route path="/wasm-demo" element={<WasmDemo />} />
                            <Route path="/webrtc-demo" element={<WebRtcDarkSwapDemo />} />
                            <Route path="/lazy-demo" element={<LazyDarkSwapDemo />} />
                            <Route path="/streaming-demo" element={<StreamingDarkSwapDemo />} />
                            <Route path="/web-worker-demo" element={<WebWorkerDarkSwapDemo />} />
                            <Route path="/code-split-demo" element={<CodeSplitDarkSwapDemo />} />
                            <Route path="/simd-demo" element={<SimdDarkSwapDemo />} />
                            <Route path="/shared-memory-demo" element={<SharedMemoryDarkSwapDemo />} />
                            <Route path="/dynamic-chunk-size-demo" element={<DynamicChunkSizeDarkSwapDemo />} />
                            <Route path="/combined-optimizations-demo" element={<CombinedOptimizationsDarkSwapDemo />} />
                            <Route path="/mnemonic-generator" element={<MnemonicGeneratorPage />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </main>
                        <Footer />
                        <NotificationList position="top-right" />
                      </div>
                    </Router>
                  </TrezorProvider>
                </LedgerProvider>
              </WalletConnectProvider>
            </MetaMaskProvider>
          </ApiProvider>
        </WebSocketProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default App;