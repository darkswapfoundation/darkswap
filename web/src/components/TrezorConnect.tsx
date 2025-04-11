import React, { useState } from 'react';
import { useTrezor } from '../contexts/TrezorContext';
import '../styles/TrezorConnect.css';

/**
 * Trezor connect props
 */
interface TrezorConnectProps {
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
 * Trezor connect button
 * @param props Button props
 * @returns Button component
 */
const TrezorConnect: React.FC<TrezorConnectProps> = ({
  size = 'medium',
  variant = 'primary',
  text = 'Connect Trezor',
  showAddress = true,
  showNetwork = true,
  showBalance = true,
  showDisconnect = true,
  onConnect,
  onDisconnect,
}) => {
  // Trezor context
  const {
    isSupported,
    isConnected,
    address,
    networkName,
    balance,
    connect,
    disconnect,
  } = useTrezor();
  
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
      console.error('Failed to connect to Trezor:', error);
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
      console.error('Failed to disconnect from Trezor:', error);
    }
  };
  
  // If Trezor is not supported
  if (!isSupported) {
    return null;
  }
  
  // If Trezor is connected
  if (isConnected && address) {
    return (
      <div className={`trezor-connected trezor-connected-${size}`}>
        {showNetwork && (
          <div className="trezor-network">
            <div className={`trezor-network-indicator trezor-network-${networkName.toLowerCase().replace(/\s+/g, '-')}`} />
            <span>{networkName}</span>
          </div>
        )}
        
        {showAddress && (
          <div className="trezor-address">
            <img
              src="/images/trezor-logo.svg"
              alt="Trezor"
              className="trezor-connect-icon"
            />
            <span>{formatAddress(address)}</span>
          </div>
        )}
        
        {showBalance && balance && (
          <div className="trezor-balance">
            <span>{formatBalance(balance)} ETH</span>
          </div>
        )}
        
        {showDisconnect && (
          <button
            className={`trezor-disconnect trezor-disconnect-${size}`}
            onClick={handleDisconnectClick}
          >
            <span>Disconnect</span>
          </button>
        )}
      </div>
    );
  }
  
  // If Trezor is not connected
  return (
    <button
      className={`trezor-connect trezor-connect-${size} trezor-connect-${variant} ${isLoading ? 'trezor-connect-loading' : ''}`}
      onClick={handleConnectClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="trezor-connect-spinner" />
      ) : (
        <>
          <img
            src="/images/trezor-logo.svg"
            alt="Trezor"
            className="trezor-connect-icon"
          />
          <span>{text}</span>
        </>
      )}
    </button>
  );
};

export default TrezorConnect;