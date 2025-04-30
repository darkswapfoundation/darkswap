/**
 * useWallet - React hook for using the Bitcoin wallet
 * 
 * This hook provides access to the Bitcoin wallet functionality from React components.
 */

import { useState, useEffect, useCallback } from 'react';
import { useDarkSwapContext } from '../contexts/DarkSwapContext';
import BitcoinWallet, { 
  Wallet, 
  WalletType, 
  BitcoinNetwork, 
  Transaction, 
  TransactionOutput 
} from '../wallet/BitcoinWallet';

// Wallet hook result interface
export interface UseWalletResult {
  // Wallet state
  wallet: Wallet | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  
  // Wallet actions
  createWallet: (type: WalletType, network: BitcoinNetwork, seed: string) => Promise<void>;
  importWallet: (type: WalletType, network: BitcoinNetwork, seed: string) => Promise<void>;
  connectHardwareWallet: (network: BitcoinNetwork) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  
  // Wallet information
  getAddress: () => string;
  getBalance: () => string;
  
  // Transaction actions
  createTransaction: (outputs: TransactionOutput[], fee: string) => Promise<string>;
  broadcastTransaction: (txHex: string) => Promise<string>;
  getTransactionHistory: () => Promise<Transaction[]>;
  
  // Transaction state
  transactions: Transaction[];
  isLoadingTransactions: boolean;
  transactionError: Error | null;
}

/**
 * useWallet hook
 * @returns Wallet hook result
 */
export function useWallet(): UseWalletResult {
  // DarkSwap context
  const darkswapContext = useDarkSwapContext();
  
  // Bitcoin wallet
  const [bitcoinWallet] = useState<BitcoinWallet>(() => new BitcoinWallet());
  
  // Wallet state
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Transaction state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState<boolean>(false);
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  
  // Set DarkSwap context
  useEffect(() => {
    bitcoinWallet.setDarkSwapContext(darkswapContext);
  }, [bitcoinWallet, darkswapContext]);
  
  // Create wallet
  const createWallet = useCallback(async (
    type: WalletType,
    network: BitcoinNetwork,
    seed: string,
  ): Promise<void> => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const newWallet = await bitcoinWallet.createWallet(type, network, seed);
      setWallet(newWallet);
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [bitcoinWallet]);
  
  // Import wallet
  const importWallet = useCallback(async (
    type: WalletType,
    network: BitcoinNetwork,
    seed: string,
  ): Promise<void> => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const newWallet = await bitcoinWallet.importWallet(type, network, seed);
      setWallet(newWallet);
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [bitcoinWallet]);
  
  // Connect hardware wallet
  const connectHardwareWallet = useCallback(async (
    network: BitcoinNetwork,
  ): Promise<void> => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const newWallet = await bitcoinWallet.connectHardwareWallet(network);
      setWallet(newWallet);
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [bitcoinWallet]);
  
  // Disconnect wallet
  const disconnectWallet = useCallback(async (): Promise<void> => {
    setError(null);
    
    try {
      await bitcoinWallet.disconnectWallet();
      setWallet(null);
      setIsConnected(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }, [bitcoinWallet]);
  
  // Get address
  const getAddress = useCallback((): string => {
    try {
      return bitcoinWallet.getAddress();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return '';
    }
  }, [bitcoinWallet]);
  
  // Get balance
  const getBalance = useCallback((): string => {
    try {
      return bitcoinWallet.getBalance();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return '0';
    }
  }, [bitcoinWallet]);
  
  // Create transaction
  const createTransaction = useCallback(async (
    outputs: TransactionOutput[],
    fee: string,
  ): Promise<string> => {
    setTransactionError(null);
    
    try {
      return await bitcoinWallet.createTransaction(outputs, fee);
    } catch (err) {
      setTransactionError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }, [bitcoinWallet]);
  
  // Broadcast transaction
  const broadcastTransaction = useCallback(async (
    txHex: string,
  ): Promise<string> => {
    setTransactionError(null);
    
    try {
      return await bitcoinWallet.broadcastTransaction(txHex);
    } catch (err) {
      setTransactionError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }, [bitcoinWallet]);
  
  // Get transaction history
  const getTransactionHistory = useCallback(async (): Promise<Transaction[]> => {
    setIsLoadingTransactions(true);
    setTransactionError(null);
    
    try {
      const history = await bitcoinWallet.getTransactionHistory();
      setTransactions(history);
      return history;
    } catch (err) {
      setTransactionError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [bitcoinWallet]);
  
  // Load transaction history when wallet is connected
  useEffect(() => {
    if (isConnected) {
      getTransactionHistory().catch(console.error);
    }
  }, [isConnected, getTransactionHistory]);
  
  return {
    wallet,
    isConnected,
    isConnecting,
    error,
    createWallet,
    importWallet,
    connectHardwareWallet,
    disconnectWallet,
    getAddress,
    getBalance,
    createTransaction,
    broadcastTransaction,
    getTransactionHistory,
    transactions,
    isLoadingTransactions,
    transactionError,
  };
}

export default useWallet;