/**
 * Settings - Settings page component
 * 
 * This page allows users to configure and initialize the DarkSwap WebAssembly module.
 */

import React, { useState } from 'react';
import { useDarkSwapContext } from '../contexts/DarkSwapContext';
import { BitcoinNetwork, Config } from '../wasm/DarkSwapWasm';
import { Card } from '../components/MemoizedComponents';

/**
 * Settings component
 */
const Settings: React.FC = () => {
  // DarkSwap context
  const { isInitialized, isInitializing, error, initialize, stop } = useDarkSwapContext();
  
  // Form state
  const [bitcoinNetwork, setBitcoinNetwork] = useState<BitcoinNetwork>(BitcoinNetwork.Testnet);
  const [relayUrl, setRelayUrl] = useState<string>('ws://localhost:8080');
  const [listenAddresses, setListenAddresses] = useState<string>('');
  const [bootstrapPeers, setBootstrapPeers] = useState<string>('');
  const [walletPath, setWalletPath] = useState<string>('');
  const [walletPassword, setWalletPassword] = useState<string>('');
  const [debug, setDebug] = useState<boolean>(false);
  
  // Handle initialize
  const handleInitialize = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create configuration
      const config: Config = {
        bitcoinNetwork,
        relayUrl,
        listenAddresses: listenAddresses.split(',').map(addr => addr.trim()).filter(Boolean),
        bootstrapPeers: bootstrapPeers.split(',').map(peer => peer.trim()).filter(Boolean),
        walletPath: walletPath || undefined,
        walletPassword: walletPassword || undefined,
        debug,
      };
      
      // Initialize DarkSwap
      await initialize(config);
    } catch (err) {
      console.error('Failed to initialize DarkSwap:', err);
    }
  };
  
  // Handle stop
  const handleStop = async () => {
    try {
      await stop();
    } catch (err) {
      console.error('Failed to stop DarkSwap:', err);
    }
  };
  
  return (
    <div className="settings-page">
      <h1>Settings</h1>
      
      <Card className="settings-form">
        <h2>DarkSwap Configuration</h2>
        
        {isInitialized ? (
          <div className="initialized">
            <p>DarkSwap is initialized.</p>
            
            <button
              className="btn btn-secondary"
              onClick={handleStop}
              disabled={isInitializing}
            >
              Stop DarkSwap
            </button>
          </div>
        ) : (
          <form onSubmit={handleInitialize}>
            <div className="form-group">
              <label htmlFor="bitcoinNetwork">Bitcoin Network</label>
              <select
                id="bitcoinNetwork"
                value={bitcoinNetwork}
                onChange={(e) => setBitcoinNetwork(Number(e.target.value) as BitcoinNetwork)}
                disabled={isInitializing}
              >
                <option value={BitcoinNetwork.Mainnet}>Mainnet</option>
                <option value={BitcoinNetwork.Testnet}>Testnet</option>
                <option value={BitcoinNetwork.Regtest}>Regtest</option>
                <option value={BitcoinNetwork.Signet}>Signet</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="relayUrl">Relay URL</label>
              <input
                type="text"
                id="relayUrl"
                value={relayUrl}
                onChange={(e) => setRelayUrl(e.target.value)}
                disabled={isInitializing}
                placeholder="ws://localhost:8080"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="listenAddresses">Listen Addresses (comma-separated)</label>
              <input
                type="text"
                id="listenAddresses"
                value={listenAddresses}
                onChange={(e) => setListenAddresses(e.target.value)}
                disabled={isInitializing}
                placeholder="/ip4/0.0.0.0/tcp/8081"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="bootstrapPeers">Bootstrap Peers (comma-separated)</label>
              <input
                type="text"
                id="bootstrapPeers"
                value={bootstrapPeers}
                onChange={(e) => setBootstrapPeers(e.target.value)}
                disabled={isInitializing}
                placeholder="/ip4/1.2.3.4/tcp/8081/p2p/QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="walletPath">Wallet Path (optional)</label>
              <input
                type="text"
                id="walletPath"
                value={walletPath}
                onChange={(e) => setWalletPath(e.target.value)}
                disabled={isInitializing}
                placeholder="/path/to/wallet.dat"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="walletPassword">Wallet Password (optional)</label>
              <input
                type="password"
                id="walletPassword"
                value={walletPassword}
                onChange={(e) => setWalletPassword(e.target.value)}
                disabled={isInitializing}
                placeholder="Password"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="debug">Debug Mode</label>
              <input
                type="checkbox"
                id="debug"
                checked={debug}
                onChange={(e) => setDebug(e.target.checked)}
                disabled={isInitializing}
              />
            </div>
            
            {error && (
              <div className="error-message">
                {error.message}
              </div>
            )}
            
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isInitializing}
              >
                {isInitializing ? 'Initializing...' : 'Initialize DarkSwap'}
              </button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default Settings;
