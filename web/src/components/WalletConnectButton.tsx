import React, { useState } from 'react';
import { useWalletConnect } from '../contexts/WalletConnectContext';
import '../styles/WalletConnectButton.css';

/**
 * WalletConnect button props
 */
interface WalletConnectButtonProps {
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
 * WalletConnect button
 * @param props Button props
 * @returns Button component
 */
const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({
  size = 'medium',
  variant = 'primary',
  text = 'Connect Wallet',
  showAddress = true,
  showNetwork = true,
  showBalance = true,
  showDisconnect = true,
  onConnect,
  onDisconnect,
}) => {
  // WalletConnect context
  const {
    isSupported,
    isConnected,
    address,
    networkName,
    balance,
    connect,
    disconnect,
  } = useWalletConnect();
  
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
      console.error('Failed to connect to WalletConnect:', error);
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
      console.error('Failed to disconnect from WalletConnect:', error);
    }
  };
  
  // If WalletConnect is not supported
  if (!isSupported) {
    return null;
  }
  
  // If WalletConnect is connected
  if (isConnected && address) {
    return (
      <div className={`walletconnect-connected walletconnect-connected-${size}`}>
        {showNetwork && (
          <div className="walletconnect-network">
            <div className={`walletconnect-network-indicator walletconnect-network-${networkName.toLowerCase().replace(/\s+/g, '-')}`} />
            <span>{networkName}</span>
          </div>
        )}
        
        {showAddress && (
          <div className="walletconnect-address">
            <img
              src="/images/walletconnect-logo.svg"
              alt="WalletConnect"
              className="walletconnect-connect-icon"
            />
            <span>{formatAddress(address)}</span>
          </div>
        )}
        
        {showBalance && balance && (
          <div className="walletconnect-balance">
            <span>{formatBalance(balance)} ETH</span>
          </div>
        )}
        
        {showDisconnect && (
          <button
            className={`walletconnect-disconnect walletconnect-disconnect-${size}`}
            onClick={handleDisconnectClick}
          >
            <span>Disconnect</span>
          </button>
        )}
      </div>
    );
  }
  
  // If WalletConnect is not connected
  return (
    <button
      className={`walletconnect-connect walletconnect-connect-${size} walletconnect-connect-${variant} ${isLoading ? 'walletconnect-connect-loading' : ''}`}
      onClick={handleConnectClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="walletconnect-connect-spinner" />
      ) : (
        <>
          <img
            src="/images/walletconnect-logo.svg"
            alt="WalletConnect"
            className="walletconnect-connect-icon"
          />
          <span>{text}</span>
        </>
      )}
    </button>
  );
};

export default WalletConnectButton;