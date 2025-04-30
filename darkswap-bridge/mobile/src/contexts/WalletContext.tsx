import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { Wallet, Balance, Transaction } from '../utils/types';
import { useApi } from './ApiContext';
import { formatBTC } from '../utils/formatters';

interface WalletContextType {
  wallet: Wallet | null;
  balance: Record<string, number>;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  sendTransaction: (to: string, amount: number, asset: string) => Promise<string>;
}

interface WalletProviderProps {
  children: React.ReactNode;
}

// Create context
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Wallet provider component
export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  // Hooks
  const { get, post } = useApi();
  
  // State
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [balance, setBalance] = useState<Record<string, number>>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if wallet is already connected
  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        // In a real app, you would use AsyncStorage
        // const walletData = await AsyncStorage.getItem('wallet');
        const walletData = null;
        
        if (walletData) {
          const parsedWallet = JSON.parse(walletData) as Wallet;
          
          // Verify wallet connection
          const response = await get<{ connected: boolean }>(`/wallet/${parsedWallet.id}/status`);
          
          if (response && response.success && response.data?.connected) {
            setWallet(parsedWallet);
            await fetchBalance(parsedWallet.id);
            await fetchTransactions(parsedWallet.id);
          } else {
            // Wallet is not connected, remove from storage
            // await AsyncStorage.removeItem('wallet');
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
        // await AsyncStorage.removeItem('wallet');
      }
    };
    
    checkWalletConnection();
  }, []);
  
  // Fetch wallet balance
  const fetchBalance = async (walletId: string) => {
    try {
      const response = await get<{ balances: Balance[] }>(`/wallet/${walletId}/balance`);
      
      if (response && response.success && response.data) {
        // Convert array of balances to record
        const balanceRecord: Record<string, number> = {};
        
        response.data.balances.forEach((item: Balance) => {
          balanceRecord[item.asset] = item.available;
        });
        
        setBalance(balanceRecord);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      setError('Failed to fetch wallet balance');
    }
  };
  
  // Fetch wallet transactions
  const fetchTransactions = async (walletId: string) => {
    try {
      const response = await get<{ transactions: Transaction[] }>(`/wallet/${walletId}/transactions`);
      
      if (response && response.success && response.data) {
        setTransactions(response.data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      setError('Failed to fetch wallet transactions');
    }
  };
  
  // Connect wallet
  const connect = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a mobile app, we would use a native module or deep linking
      // For this example, we'll simulate a wallet connection
      
      // Request wallet connection
      const accounts = ['bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq']; // Example address
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }
      
      // Get wallet information
      const walletInfo = await post<{ wallet: Wallet }>('/wallet/connect', {
        address: accounts[0],
        type: 'external'
      });
      
      if (!walletInfo || !walletInfo.success || !walletInfo.data?.wallet) {
        throw new Error('Failed to connect wallet');
      }
      
      const connectedWallet = walletInfo.data.wallet;
      
      // Store wallet in state and storage
      setWallet(connectedWallet);
      // In a real app, you would use AsyncStorage
      // await AsyncStorage.setItem('wallet', JSON.stringify(connectedWallet));
      
      // Fetch balance and transactions
      await fetchBalance(connectedWallet.id);
      await fetchTransactions(connectedWallet.id);
      
      // Show notification
      Alert.alert(
        'Wallet Connected',
        `Connected to wallet ${connectedWallet.name}`
      );
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect wallet');
      
      // Show notification
      Alert.alert(
        'Connection Failed',
        error instanceof Error ? error.message : 'Failed to connect wallet'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Disconnect wallet
  const disconnect = () => {
    // Clear wallet data
    setWallet(null);
    setBalance({});
    setTransactions([]);
    
    // Remove from storage
    // In a real app, you would use AsyncStorage
    // await AsyncStorage.removeItem('wallet');
    
    // Show notification
    Alert.alert(
      'Wallet Disconnected',
      'Your wallet has been disconnected'
    );
  };
  
  // Refresh wallet balance
  const refreshBalance = async () => {
    if (!wallet) {
      return;
    }
    
    setLoading(true);
    
    try {
      await fetchBalance(wallet.id);
      await fetchTransactions(wallet.id);
    } catch (error) {
      console.error('Error refreshing wallet:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh wallet');
    } finally {
      setLoading(false);
    }
  };
  
  // Send transaction
  const sendTransaction = async (to: string, amount: number, asset: string): Promise<string> => {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create transaction
      const createResponse = await post<{ transaction: { hex: string } }>('/wallet/transaction', {
        walletId: wallet.id,
        to,
        amount,
        asset
      });
      
      if (!createResponse || !createResponse.success || !createResponse.data?.transaction) {
        throw new Error('Failed to create transaction');
      }
      
      const transaction = createResponse.data.transaction;
      
      // Sign transaction
      // In a mobile app, we would use a native module or deep linking
      // For this example, we'll simulate signing
      const signedTx = `signed_${transaction.hex}`;
      
      // Broadcast transaction
      const broadcastResponse = await post<{ txid: string }>('/wallet/broadcast', {
        signedTransaction: signedTx
      });
      
      if (!broadcastResponse || !broadcastResponse.success || !broadcastResponse.data?.txid) {
        throw new Error('Failed to broadcast transaction');
      }
      
      const txid = broadcastResponse.data.txid;
      
      // Refresh balance and transactions
      await refreshBalance();
      
      // Show notification
      Alert.alert(
        'Transaction Sent',
        `Transaction ${txid.substring(0, 8)}... has been sent`
      );
      
      return txid;
    } catch (error: any) {
      console.error('Error sending transaction:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to send transaction';
      
      setError(errorMessage);
      
      // Show notification
      Alert.alert(
        'Transaction Failed',
        errorMessage
      );
      
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Context value
  const value: WalletContextType = {
    wallet,
    balance,
    transactions,
    loading,
    error,
    connect,
    disconnect,
    refreshBalance,
    sendTransaction
  };
  
  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// Hook for using wallet context
export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  
  return context;
};