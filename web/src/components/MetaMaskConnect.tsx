import React, { useState } from 'react';
import { useMetaMask } from '../contexts/MetaMaskContext';
import '../styles/MetaMaskConnect.css';

/**
 * MetaMask connect button props
 */
interface MetaMaskConnectProps {
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
   * Show install button when MetaMask is not installed
   */
  showInstall?: boolean;
  
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
 * MetaMask connect button
 * @param props Button props
 * @returns Button component
 */
const MetaMaskConnect: React.FC<MetaMaskConnectProps> = ({
  size = 'medium',
  variant = 'primary',
  text = 'Connect MetaMask',
  showAddress = true,
  showNetwork = true,
  showBalance = true,
  showDisconnect = true,
  showInstall = true,
  onConnect,
  onDisconnect,
}) => {
  // MetaMask context
  const {
    isInstalled,
    isConnected,
    address,
    networkName,
    balance,
    connect,
    disconnect,
  } = useMetaMask();
  
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
      console.error('Failed to connect to MetaMask:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Handle disconnect click
   */
  const handleDisconnectClick = () => {
    disconnect();
    onDisconnect?.();
  };
  
  /**
   * Handle install click
   */
  const handleInstallClick = () => {
    window.open('https://metamask.io/download/', '_blank');
  };
  
  // If MetaMask is not installed
  if (!isInstalled) {
    return showInstall ? (
      <button
        className={`metamask-connect metamask-connect-${size} metamask-connect-${variant}`}
        onClick={handleInstallClick}
      >
        <img
          src="/images/metamask-fox.svg"
          alt="MetaMask"
          className="metamask-connect-icon"
        />
        <span>Install MetaMask</span>
      </button>
    ) : null;
  }
  
  // If MetaMask is connected
  if (isConnected && address) {
    return (
      <div className={`metamask-connected metamask-connected-${size}`}>
        {showNetwork && (
          <div className="metamask-network">
            <div className={`metamask-network-indicator metamask-network-${networkName.toLowerCase().replace(/\s+/g, '-')}`} />
            <span>{networkName}</span>
          </div>
        )}
        
        {showAddress && (
          <div className="metamask-address">
            <img
              src="/images/metamask-fox.svg"
              alt="MetaMask"
              className="metamask-connect-icon"
            />
            <span>{formatAddress(address)}</span>
          </div>
        )}
        
        {showBalance && balance && (
          <div className="metamask-balance">
            <span>{formatBalance(balance)} ETH</span>
          </div>
        )}
        
        {showDisconnect && (
          <button
            className={`metamask-disconnect metamask-disconnect-${size}`}
            onClick={handleDisconnectClick}
          >
            <span>Disconnect</span>
          </button>
        )}
      </div>
    );
  }
  
  // If MetaMask is not connected
  return (
    <button
      className={`metamask-connect metamask-connect-${size} metamask-connect-${variant} ${isLoading ? 'metamask-connect-loading' : ''}`}
      onClick={handleConnectClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="metamask-connect-spinner" />
      ) : (
        <>
          <img
            src="/images/metamask-fox.svg"
            alt="MetaMask"
            className="metamask-connect-icon"
          />
          <span>{text}</span>
        </>
      )}
    </button>
  );
};

export default MetaMaskConnect;