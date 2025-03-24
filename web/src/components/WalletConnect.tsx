import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../contexts/WalletContext';
import { useNotification } from '../contexts/NotificationContext';

// Icons
import {
  WalletIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

interface WalletConnectProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
  isConnected?: boolean;
  address?: string;
}

const WalletConnect: React.FC<WalletConnectProps> = ({
  onConnect,
  onDisconnect,
  isConnected: isConnectedProp,
  address: addressProp,
}) => {
  const walletContext = useWallet();
  const { addNotification } = useNotification();
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Use props if provided, otherwise use context
  const isConnected = isConnectedProp !== undefined ? isConnectedProp : walletContext.isConnected;
  const address = addressProp || walletContext.address;
  const isConnecting = walletContext.isConnecting;

  const handleConnect = async () => {
    if (isConnected) {
      setIsDropdownOpen(!isDropdownOpen);
      return;
    }

    try {
      await walletContext.connect();
      if (onConnect && walletContext.address) {
        onConnect(walletContext.address);
      }
      addNotification('success', 'Wallet connected successfully');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      addNotification('error', 'Failed to connect wallet');
    }
  };

  const handleDisconnect = () => {
    walletContext.disconnect();
    if (onDisconnect) {
      onDisconnect();
    }
    setIsDropdownOpen(false);
    addNotification('info', 'Wallet disconnected');
  };

  const copyToClipboard = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      addNotification('success', 'Address copied to clipboard');
    }
  };

  // Format address for display
  const formatAddress = (addr: string) => {
    if (!addr) return '';
    if (addr.length < 10) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="relative">
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className={`btn ${
          isConnected ? 'btn-secondary' : 'btn-neon'
        } flex items-center justify-center`}
      >
        {isConnecting ? (
          <div className="flex items-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Connecting...
          </div>
        ) : isConnected ? (
          <div className="flex items-center">
            <WalletIcon className="w-4 h-4 mr-2" />
            <span>{formatAddress(address || '')}</span>
            <ChevronDownIcon className="w-4 h-4 ml-2" />
          </div>
        ) : (
          <div className="flex items-center">
            <WalletIcon className="w-4 h-4 mr-2" />
            Connect Wallet
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isConnected && isDropdownOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute right-0 mt-2 w-56 rounded-lg bg-twilight-primary border border-twilight-accent shadow-lg z-50"
        >
          <div className="p-3 border-b border-twilight-dark">
            <div className="text-sm text-gray-400">Connected Wallet</div>
            <div className="font-medium flex items-center justify-between">
              <span>{formatAddress(address || '')}</span>
              <button
                onClick={copyToClipboard}
                className="p-1 hover:bg-twilight-dark rounded-md transition-colors duration-200"
                title="Copy address"
              >
                {isCopied ? (
                  <CheckIcon className="w-4 h-4 text-green-400" />
                ) : (
                  <DocumentDuplicateIcon className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
          <div className="p-3 border-b border-twilight-dark">
            <div className="text-sm text-gray-400">Balance</div>
            <div className="font-medium">{walletContext.balance} BTC</div>
          </div>
          <div className="p-2">
            <button
              onClick={handleDisconnect}
              className="w-full text-left px-3 py-2 text-red-400 hover:bg-twilight-dark rounded-md transition-colors duration-200 flex items-center"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
              Disconnect
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default WalletConnect;