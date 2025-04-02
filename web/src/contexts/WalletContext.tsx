import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNotification } from './NotificationContext';

interface WalletContextType {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  address: string | null;
  balance: {
    btc: string;
    [key: string]: string;
  };
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendTransaction: (to: string, amount: string, asset: string) => Promise<string>;
  getAddress: () => string | null;
  getBalance: (asset?: string) => string;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const { addNotification } = useNotification();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<{ btc: string; [key: string]: string }>({
    btc: '0',
  });

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // In a real implementation, this would check if the wallet is already connected
        // For now, we'll just check if there's a stored address
        const storedAddress = localStorage.getItem('wallet-address');
        if (storedAddress) {
          setAddress(storedAddress);
          setIsConnected(true);
          await fetchBalance();
        }
      } catch (err) {
        console.error('Failed to check wallet connection:', err);
      }
    };

    checkConnection();
  }, []);

  // Connect to wallet
  const connect = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, this would connect to the wallet
      // For now, we'll just simulate a successful connection
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
      setAddress(mockAddress);
      setIsConnected(true);
      localStorage.setItem('wallet-address', mockAddress);

      await fetchBalance();

      addNotification('success', 'Wallet connected successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to connect wallet: ${errorMessage}`);
      addNotification('error', `Failed to connect wallet: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect from wallet
  const disconnect = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, this would disconnect from the wallet
      // For now, we'll just simulate a successful disconnection
      await new Promise(resolve => setTimeout(resolve, 1000));

      setAddress(null);
      setIsConnected(false);
      setBalance({ btc: '0' });
      localStorage.removeItem('wallet-address');

      addNotification('success', 'Wallet disconnected successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to disconnect wallet: ${errorMessage}`);
      addNotification('error', `Failed to disconnect wallet: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch balance
  const fetchBalance = async (): Promise<void> => {
    if (!isConnected) return;

    try {
      // In a real implementation, this would fetch the balance from the wallet
      // For now, we'll just simulate a successful balance fetch
      await new Promise(resolve => setTimeout(resolve, 500));

      setBalance({
        btc: '0.01234',
        'rune-1': '100',
        'rune-2': '200',
        'alkane-1': '50',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Failed to fetch balance: ${errorMessage}`);
    }
  };

  // Send transaction
  const sendTransaction = async (to: string, amount: string, asset: string): Promise<string> => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      // In a real implementation, this would send a transaction using the wallet
      // For now, we'll just simulate a successful transaction
      await new Promise(resolve => setTimeout(resolve, 2000));

      const txid = `tx-${Math.random().toString(36).substring(2, 15)}`;

      // Update balance
      if (asset === 'btc') {
        setBalance(prev => ({
          ...prev,
          btc: (parseFloat(prev.btc) - parseFloat(amount) - 0.0001).toFixed(8),
        }));
      } else {
        setBalance(prev => ({
          ...prev,
          [asset]: (parseFloat(prev[asset] || '0') - parseFloat(amount)).toFixed(8),
          btc: (parseFloat(prev.btc) - 0.0001).toFixed(8), // Subtract fee
        }));
      }

      addNotification('success', `Transaction sent successfully: ${txid}`);
      return txid;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addNotification('error', `Failed to send transaction: ${errorMessage}`);
      throw err;
    }
  };

  // Get address
  const getAddress = (): string | null => {
    return address;
  };

  // Get balance
  const getBalance = (asset: string = 'btc'): string => {
    return balance[asset] || '0';
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        isLoading,
        error,
        address,
        balance,
        connect,
        disconnect,
        sendTransaction,
        getAddress,
        getBalance,
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