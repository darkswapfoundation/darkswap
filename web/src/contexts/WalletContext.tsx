import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  balance: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnecting: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0.00');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check for saved wallet connection on mount
  useEffect(() => {
    const savedAddress = localStorage.getItem('walletAddress');
    const autoConnect = localStorage.getItem('autoConnect') === 'true';
    
    if (savedAddress && autoConnect) {
      // Attempt to reconnect
      connect();
    }
  }, []);

  // Mock wallet connection
  const connect = async (): Promise<void> => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a random address
      const mockAddress = `bc1q${Math.random().toString(36).substring(2, 15)}`;
      
      // Set mock balance
      const mockBalance = (Math.random() * 2).toFixed(8);
      
      setAddress(mockAddress);
      setBalance(mockBalance);
      setIsConnected(true);
      
      // Save to localStorage
      localStorage.setItem('walletAddress', mockAddress);
    } catch (err) {
      setError('Failed to connect wallet');
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnect = (): void => {
    setIsConnected(false);
    setAddress(null);
    setBalance('0.00');
    
    // Remove from localStorage
    localStorage.removeItem('walletAddress');
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        balance,
        connect,
        disconnect,
        isConnecting,
        error,
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