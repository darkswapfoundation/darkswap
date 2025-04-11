import React, { useState } from 'react';
import { useLedger } from '../contexts/LedgerContext';
import '../styles/LedgerConnect.css';

/**
 * Ledger connect props
 */
interface LedgerConnectProps {
  /**
   * Button size
   */
  size?: 'small' | 'medium' | 'large';
  
  /**
   * Button variant
   */
  variant?: 'primary' | 'secondary' | 'outline';
  
  /**
   * Button text
   */
  text?: string;
  
  /**
   * Show address when connected
   */
  showAddress?: boolean;
  
  /**
   * Show network when connected
   */
  showNetwork?: boolean;
  
  /**
   * Show balance when connected
   */
  showBalance?: boolean;
  
  /**
   * Show disconnect button when connected
   */
  showDisconnect?: boolean;
  
  /**
   * On connect callback
   */
  onConnect?: () => void;
  
  /**
   * On disconnect callback
   */
  onDisconnect?: () => void;
}

/**
 * Ledger connect button
 * @param props Button props
 * @returns Button component
 */
const LedgerConnect: React.FC<LedgerConnectProps> = ({
  size = 'medium',
  variant = 'primary',
  text = 'Connect Ledger',
  showAddress = true,
  showNetwork = true,
  showBalance = true,
  showDisconnect = true,
  onConnect,
  onDisconnect,
}) => {
  // Ledger context
  const {
    isSupported,
    isConnected,
    address,
    networkName,
    balance,
    connect,
    disconnect,
  } = useLedger();
  
  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  /**
   * Format address
   * @param address Address to format
   * @returns Formatted address
   */
  const formatAddress = (address: string): string => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  /**
   * Format balance
   * @param balance Balance to format
   * @returns Formatted balance
   */
  const formatBalance = (balance: string): string => {
    // Convert from wei to ether
    const ether = parseInt(balance, 16) / 1e18;
    
    // Format with 4 decimal places
    return ether.toFixed(4);
  };
  
  /**
   * Handle connect click
   */
  const handleConnectClick = async () => {
    try {
      setIsLoading(true);
      await connect();
      onConnect?.();
    } catch (error) {
      console.error('Failed to connect to Ledger:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Handle disconnect click
   */
  const handleDisconnectClick = async () => {
    try {
      await disconnect();
      onDisconnect?.();
    } catch (error) {
      console.error('Failed to disconnect from Ledger:', error);
    }
  };
  
  // If Ledger is not supported
  if (!isSupported) {
    return null;
  }
  
  // If Ledger is connected
  if (isConnected && address) {
    return (
      <div className={`ledger-connected ledger-connected-${size}`}>
        {showNetwork && (
          <div className="ledger-network">
            <div className={`ledger-network-indicator ledger-network-${networkName.toLowerCase().replace(/\s+/g, '-')}`} />
            <span>{networkName}</span>
          </div>
        )}
        
        {showAddress && (
          <div className="ledger-address">
            <img
              src="/images/ledger-logo.svg"
              alt="Ledger"
              className="ledger-connect-icon"
            />
            <span>{formatAddress(address)}</span>
          </div>
        )}
        
        {showBalance && balance && (
          <div className="ledger-balance">
            <span>{formatBalance(balance)} ETH</span>
          </div>
        )}
        
        {showDisconnect && (
          <button
            className={`ledger-disconnect ledger-disconnect-${size}`}
            onClick={handleDisconnectClick}
          >
            <span>Disconnect</span>
          </button>
        )}
      </div>
    );
  }
  
  // If Ledger is not connected
  return (
    <button
      className={`ledger-connect ledger-connect-${size} ledger-connect-${variant} ${isLoading ? 'ledger-connect-loading' : ''}`}
      onClick={handleConnectClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="ledger-connect-spinner" />
      ) : (
        <>
          <img
            src="/images/ledger-logo.svg"
            alt="Ledger"
            className="ledger-connect-icon"
          />
          <span>{text}</span>
        </>
      )}
    </button>
  );
};

export default LedgerConnect;