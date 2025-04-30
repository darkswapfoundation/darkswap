/**
 * WalletIntegration - Component for integrating with Bitcoin wallets
 * 
 * This component provides a UI for connecting to Bitcoin wallets and
 * displaying wallet information.
 */

import React, { useState, useEffect } from 'react';
import { useDarkSwapContext } from '../contexts/DarkSwapContext';
import { useWalletContext } from '../contexts/WalletContext';
import { Card } from './MemoizedComponents';
import { EventType, WalletConnectedEvent, WalletDisconnectedEvent, WalletBalanceChangedEvent } from '../wasm/EventTypes';

export interface WalletIntegrationProps {
  /** CSS class name */
  className?: string;
}

/**
 * WalletIntegration component
 */
export const WalletIntegration: React.FC<WalletIntegrationProps> = ({ 
  className = '',
}) => {
  // DarkSwap context
  const { isInitialized, on, off } = useDarkSwapContext();
  
  // Wallet context
  const { isConnected, isConnecting, error, getAddress, getBalance } = useWalletContext();
  
  // Wallet state
  const [address, setAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');
  
  // Update wallet information
  useEffect(() => {
    if (isConnected) {
      try {
        setAddress(getAddress());
        setBalance(getBalance());
      } catch (err) {
        console.error('Failed to get wallet information:', err);
      }
    } else {
      setAddress('');
      setBalance('0');
    }
  }, [isConnected, getAddress, getBalance]);
  
  // Handle wallet events
  useEffect(() => {
    if (!isInitialized) return;
    
    // Define event handlers
    const handleWalletConnected = (event: WalletConnectedEvent) => {
      setAddress(event.data.address);
    };
    
    const handleWalletDisconnected = (event: WalletDisconnectedEvent) => {
      if (event.data.address === address) {
        setAddress('');
        setBalance('0');
      }
    };
    
    const handleBalanceChanged = (event: WalletBalanceChangedEvent) => {
      if (event.data.address === address) {
        setBalance(event.data.balance);
      }
    };
    
    // Register event handlers
    on<WalletConnectedEvent>(EventType.WalletConnected, handleWalletConnected);
    on<WalletDisconnectedEvent>(EventType.WalletDisconnected, handleWalletDisconnected);
    on<WalletBalanceChangedEvent>(EventType.WalletBalanceChanged, handleBalanceChanged);
    
    // Clean up event handlers
    return () => {
      off<WalletConnectedEvent>(EventType.WalletConnected, handleWalletConnected);
      off<WalletDisconnectedEvent>(EventType.WalletDisconnected, handleWalletDisconnected);
      off<WalletBalanceChangedEvent>(EventType.WalletBalanceChanged, handleBalanceChanged);
    };
  }, [isInitialized, address, on, off]);
  
  // Format balance
  const formatBalance = (balance: string): string => {
    return parseFloat(balance).toFixed(8);
  };
  
  // Format address
  const formatAddress = (address: string): string => {
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };
  
  return (
    <Card className={`wallet-integration ${className}`}>
      <h2>Wallet</h2>
      
      {isConnecting && (
        <div className="loading">Connecting to wallet...</div>
      )}
      
      {error && (
        <div className="error-message">
          {error.message}
        </div>
      )}
      
      {isConnected ? (
        <div className="wallet-info">
          <div className="wallet-address">
            <span className="label">Address:</span>
            <span className="value" title={address}>{formatAddress(address)}</span>
          </div>
          
          <div className="wallet-balance">
            <span className="label">Balance:</span>
            <span className="value">{formatBalance(balance)} BTC</span>
          </div>
        </div>
      ) : (
        <div className="wallet-not-connected">
          <p>No wallet connected.</p>
          <p>Please go to the Vault page to connect a wallet.</p>
        </div>
      )}
    </Card>
  );
};

export default WalletIntegration;