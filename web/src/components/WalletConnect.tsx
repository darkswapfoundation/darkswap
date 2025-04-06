/**
 * WalletConnect - Component for connecting to Bitcoin wallets
 * 
 * This component provides a UI for connecting to Bitcoin wallets.
 */

import React, { useState } from 'react';
import { useWalletContext } from '../contexts/WalletContext';
import { WalletType, BitcoinNetwork } from '../wallet/BitcoinWallet';
import { Card } from './MemoizedComponents';

export interface WalletConnectProps {
  /** CSS class name */
  className?: string;
}

/**
 * WalletConnect component
 */
export const WalletConnect: React.FC<WalletConnectProps> = ({ 
  className = '',
}) => {
  // Wallet context
  const { 
    isConnected, 
    isConnecting, 
    error, 
    createWallet, 
    importWallet, 
    connectHardwareWallet, 
    disconnectWallet,
    getAddress,
    getBalance,
  } = useWalletContext();
  
  // Form state
  const [walletType, setWalletType] = useState<WalletType>(WalletType.BIP39);
  const [network, setNetwork] = useState<BitcoinNetwork>(BitcoinNetwork.Testnet);
  const [seed, setSeed] = useState<string>('');
  const [showSeed, setShowSeed] = useState<boolean>(false);
  
  // Handle connect
  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (walletType === WalletType.Hardware) {
        await connectHardwareWallet(network);
      } else if (walletType === WalletType.BIP39 || walletType === WalletType.WIF || walletType === WalletType.Xprv) {
        if (seed.trim() === '') {
          throw new Error('Please enter a seed phrase or private key');
        }
        
        await importWallet(walletType, network, seed);
      }
    } catch (err) {
      console.error('Failed to connect wallet:', err);
    }
  };
  
  // Handle disconnect
  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
    } catch (err) {
      console.error('Failed to disconnect wallet:', err);
    }
  };
  
  // Handle create wallet
  const handleCreateWallet = async () => {
    try {
      // Generate a random seed phrase
      const randomSeed = Array.from({ length: 12 }, () => {
        const words = [
          'abandon', 'ability', 'able', 'about', 'above', 'absent',
          'absorb', 'abstract', 'absurd', 'abuse', 'access', 'accident',
          'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire',
          'across', 'act', 'action', 'actor', 'actress', 'actual',
        ];
        return words[Math.floor(Math.random() * words.length)];
      }).join(' ');
      
      setSeed(randomSeed);
      await createWallet(WalletType.BIP39, network, randomSeed);
    } catch (err) {
      console.error('Failed to create wallet:', err);
    }
  };
  
  return (
    <Card className={`wallet-connect ${className}`}>
      <h2>Connect Wallet</h2>
      
      {isConnected ? (
        <div className="wallet-connected">
          <div className="wallet-info">
            <div className="wallet-address">
              <span className="label">Address:</span>
              <span className="value">{getAddress()}</span>
            </div>
            
            <div className="wallet-balance">
              <span className="label">Balance:</span>
              <span className="value">{getBalance()} BTC</span>
            </div>
          </div>
          
          <button
            className="btn btn-secondary"
            onClick={handleDisconnect}
          >
            Disconnect Wallet
          </button>
        </div>
      ) : (
        <div className="wallet-disconnected">
          <form onSubmit={handleConnect}>
            <div className="form-group">
              <label htmlFor="walletType">Wallet Type</label>
              <select
                id="walletType"
                value={walletType}
                onChange={(e) => setWalletType(e.target.value as WalletType)}
                disabled={isConnecting}
              >
                <option value={WalletType.BIP39}>BIP39 Seed Phrase</option>
                <option value={WalletType.WIF}>WIF Private Key</option>
                <option value={WalletType.Xprv}>Extended Private Key</option>
                <option value={WalletType.Hardware}>Hardware Wallet</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="network">Network</label>
              <select
                id="network"
                value={network}
                onChange={(e) => setNetwork(Number(e.target.value) as BitcoinNetwork)}
                disabled={isConnecting}
              >
                <option value={BitcoinNetwork.Mainnet}>Mainnet</option>
                <option value={BitcoinNetwork.Testnet}>Testnet</option>
                <option value={BitcoinNetwork.Regtest}>Regtest</option>
                <option value={BitcoinNetwork.Signet}>Signet</option>
              </select>
            </div>
            
            {walletType !== WalletType.Hardware && (
              <div className="form-group">
                <label htmlFor="seed">
                  {walletType === WalletType.BIP39 ? 'Seed Phrase' : 
                   walletType === WalletType.WIF ? 'WIF Private Key' : 
                   'Extended Private Key'}
                </label>
                <div className="seed-input-container">
                  <input
                    type={showSeed ? 'text' : 'password'}
                    id="seed"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    disabled={isConnecting}
                    placeholder={
                      walletType === WalletType.BIP39 ? 'Enter your 12/24 word seed phrase' : 
                      walletType === WalletType.WIF ? 'Enter your WIF private key' : 
                      'Enter your extended private key'
                    }
                  />
                  <button
                    type="button"
                    className="toggle-seed-visibility"
                    onClick={() => setShowSeed(!showSeed)}
                  >
                    {showSeed ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            )}
            
            {error && (
              <div className="error-message">
                {error.message}
              </div>
            )}
            
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isConnecting}
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
              
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCreateWallet}
                disabled={isConnecting}
              >
                Create New Wallet
              </button>
            </div>
          </form>
        </div>
      )}
    </Card>
  );
};

export default WalletConnect;