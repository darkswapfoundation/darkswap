import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNotification } from './NotificationContext';

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  balance: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string>;
  signTransaction: (txHex: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0.00');
  const { addNotification } = useNotification();

  // Check if wallet was previously connected
  useEffect(() => {
    const savedWalletState = localStorage.getItem('darkswap-wallet-connected');
    if (savedWalletState === 'true') {
      connectWallet();
    }
  }, []);

  // Connect to wallet
  const connectWallet = async () => {
    try {
      // In a real implementation, this would connect to a Bitcoin wallet
      // For now, we'll simulate a connection
      setIsConnected(true);
      setAddress('bc1q84nj8u6c82wz3pj3tvkf73085ej3qtgvzsy8r2');
      setBalance('0.12345');
      
      // Save connection state
      localStorage.setItem('darkswap-wallet-connected', 'true');
      
      addNotification('success', 'Wallet connected successfully');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      addNotification('error', `Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Disconnect from wallet
  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress(null);
    setBalance('0.00');
    
    // Clear connection state
    localStorage.removeItem('darkswap-wallet-connected');
    
    addNotification('info', 'Wallet disconnected');
  };

  // Sign message
  const signMessage = async (message: string): Promise<string> => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // In a real implementation, this would sign a message with the wallet
      // For now, we'll simulate a signature
      const signature = `simulated_signature_${Date.now()}`;
      
      addNotification('success', 'Message signed successfully');
      
      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      addNotification('error', `Failed to sign message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  // Sign transaction
  const signTransaction = async (txHex: string): Promise<string> => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // In a real implementation, this would sign a transaction with the wallet
      // For now, we'll simulate a signature
      const signedTx = `signed_${txHex}_${Date.now()}`;
      
      addNotification('success', 'Transaction signed successfully');
      
      return signedTx;
    } catch (error) {
      console.error('Error signing transaction:', error);
      addNotification('error', `Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        balance,
        connect: connectWallet,
        disconnect: disconnectWallet,
        signMessage,
        signTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export default WalletProvider;