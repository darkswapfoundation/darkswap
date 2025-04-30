import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import WasmWalletService, { WasmWalletEventType, WasmWalletEvent } from '../services/WasmWalletService';
import { useNotification } from './NotificationContext';

// Balance types
export interface RuneBalance {
  id: string;
  ticker: string;
  amount: string;
}

export interface AlkaneBalance {
  id: string;
  ticker: string;
  amount: string;
}

export interface WalletBalance {
  btc: string;
  runes: RuneBalance[];
  alkanes: AlkaneBalance[];
}

// Context type
interface WasmWalletContextType {
  isInitialized: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  address: string;
  balance: WalletBalance | null;
  error: string | null;
  initialize: () => Promise<boolean>;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string | null>;
  signTransaction: (txHex: string) => Promise<string | null>;
  createPsbt: (inputs: any[], outputs: any[]) => Promise<string | null>;
  signPsbt: (psbtBase64: string) => Promise<string | null>;
  finalizePsbt: (psbtBase64: string) => Promise<string | null>;
  extractTx: (psbtBase64: string) => Promise<string | null>;
  broadcastTx: (txHex: string) => Promise<string | null>;
  refreshBalance: () => Promise<void>;
}

// Create context
const WasmWalletContext = createContext<WasmWalletContextType | undefined>(undefined);

// Provider props
interface WasmWalletProviderProps {
  children: ReactNode;
  autoInitialize?: boolean;
}

// Provider component
export const WasmWalletProvider: React.FC<WasmWalletProviderProps> = ({
  children,
  autoInitialize = true,
}) => {
  // Get the wallet service
  const walletService = WasmWalletService.getInstance();
  const { addNotification } = useNotification();
  
  // State
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [address, setAddress] = useState<string>('');
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize the wallet service
  useEffect(() => {
    if (autoInitialize) {
      initialize();
    }
    
    return () => {
      // Clean up event listeners
      walletService.removeEventListener(WasmWalletEventType.CONNECTED, handleConnected);
      walletService.removeEventListener(WasmWalletEventType.DISCONNECTED, handleDisconnected);
      walletService.removeEventListener(WasmWalletEventType.BALANCE_CHANGED, handleBalanceChanged);
      walletService.removeEventListener(WasmWalletEventType.ERROR, handleError);
    };
  }, [autoInitialize]);
  
  // Event handlers
  const handleConnected = (event: WasmWalletEvent) => {
    setIsConnected(true);
    setIsConnecting(false);
    setAddress(walletService.getAddress());
    addNotification('success', 'Wallet connected');
    refreshBalance();
  };
  
  const handleDisconnected = (event: WasmWalletEvent) => {
    setIsConnected(false);
    setAddress('');
    setBalance(null);
    addNotification('info', 'Wallet disconnected');
  };
  
  const handleBalanceChanged = (event: WasmWalletEvent) => {
    setBalance(event.data);
  };
  
  const handleError = (event: WasmWalletEvent) => {
    setError(event.data.message);
    addNotification('error', `Wallet error: ${event.data.message}`);
  };
  
  // Initialize the wallet service
  const initialize = async (): Promise<boolean> => {
    try {
      // Add event listeners
      walletService.addEventListener(WasmWalletEventType.CONNECTED, handleConnected);
      walletService.addEventListener(WasmWalletEventType.DISCONNECTED, handleDisconnected);
      walletService.addEventListener(WasmWalletEventType.BALANCE_CHANGED, handleBalanceChanged);
      walletService.addEventListener(WasmWalletEventType.ERROR, handleError);
      
      // Initialize the wallet service
      const result = await walletService.initialize();
      setIsInitialized(result);
      
      // Check if already connected
      if (result && walletService.isConnected()) {
        setIsConnected(true);
        setAddress(walletService.getAddress());
        refreshBalance();
      }
      
      return result;
    } catch (error) {
      console.error('Failed to initialize wallet service:', error);
      setError(`Failed to initialize wallet service: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addNotification('error', `Failed to initialize wallet service: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };
  
  // Connect to the wallet
  const connect = async (): Promise<boolean> => {
    if (!isInitialized) {
      const initialized = await initialize();
      if (!initialized) {
        return false;
      }
    }
    
    setIsConnecting(true);
    setError(null);
    
    try {
      const result = await walletService.connect();
      return result;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setError(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addNotification('error', `Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsConnecting(false);
      return false;
    }
  };
  
  // Disconnect from the wallet
  const disconnect = () => {
    setError(null);
    walletService.disconnect();
  };
  
  // Sign a message
  const signMessage = async (message: string): Promise<string | null> => {
    if (!isConnected) {
      setError('Wallet not connected');
      addNotification('error', 'Wallet not connected');
      return null;
    }
    
    setError(null);
    
    try {
      return await walletService.signMessage(message);
    } catch (error) {
      console.error('Failed to sign message:', error);
      setError(`Failed to sign message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addNotification('error', `Failed to sign message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };
  
  // Sign a transaction
  const signTransaction = async (txHex: string): Promise<string | null> => {
    if (!isConnected) {
      setError('Wallet not connected');
      addNotification('error', 'Wallet not connected');
      return null;
    }
    
    setError(null);
    
    try {
      return await walletService.signTransaction(txHex);
    } catch (error) {
      console.error('Failed to sign transaction:', error);
      setError(`Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addNotification('error', `Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };
  
  // Create a PSBT
  const createPsbt = async (inputs: any[], outputs: any[]): Promise<string | null> => {
    if (!isConnected) {
      setError('Wallet not connected');
      addNotification('error', 'Wallet not connected');
      return null;
    }
    
    setError(null);
    
    try {
      return await walletService.createPsbt(inputs, outputs);
    } catch (error) {
      console.error('Failed to create PSBT:', error);
      setError(`Failed to create PSBT: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addNotification('error', `Failed to create PSBT: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };
  
  // Sign a PSBT
  const signPsbt = async (psbtBase64: string): Promise<string | null> => {
    if (!isConnected) {
      setError('Wallet not connected');
      addNotification('error', 'Wallet not connected');
      return null;
    }
    
    setError(null);
    
    try {
      return await walletService.signPsbt(psbtBase64);
    } catch (error) {
      console.error('Failed to sign PSBT:', error);
      setError(`Failed to sign PSBT: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addNotification('error', `Failed to sign PSBT: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };
  
  // Finalize a PSBT
  const finalizePsbt = async (psbtBase64: string): Promise<string | null> => {
    if (!isConnected) {
      setError('Wallet not connected');
      addNotification('error', 'Wallet not connected');
      return null;
    }
    
    setError(null);
    
    try {
      return await walletService.finalizePsbt(psbtBase64);
    } catch (error) {
      console.error('Failed to finalize PSBT:', error);
      setError(`Failed to finalize PSBT: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addNotification('error', `Failed to finalize PSBT: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };
  
  // Extract transaction from a PSBT
  const extractTx = async (psbtBase64: string): Promise<string | null> => {
    if (!isConnected) {
      setError('Wallet not connected');
      addNotification('error', 'Wallet not connected');
      return null;
    }
    
    setError(null);
    
    try {
      return await walletService.extractTx(psbtBase64);
    } catch (error) {
      console.error('Failed to extract transaction:', error);
      setError(`Failed to extract transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addNotification('error', `Failed to extract transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };
  
  // Broadcast a transaction
  const broadcastTx = async (txHex: string): Promise<string | null> => {
    if (!isConnected) {
      setError('Wallet not connected');
      addNotification('error', 'Wallet not connected');
      return null;
    }
    
    setError(null);
    
    try {
      return await walletService.broadcastTx(txHex);
    } catch (error) {
      console.error('Failed to broadcast transaction:', error);
      setError(`Failed to broadcast transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addNotification('error', `Failed to broadcast transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };
  
  // Refresh balance
  const refreshBalance = async (): Promise<void> => {
    if (!isConnected) {
      return;
    }
    
    try {
      const newBalance = await walletService.getBalance();
      if (newBalance) {
        setBalance(newBalance);
      }
    } catch (error) {
      console.error('Failed to refresh balance:', error);
      setError(`Failed to refresh balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addNotification('error', `Failed to refresh balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  return (
    <WasmWalletContext.Provider
      value={{
        isInitialized,
        isConnected,
        isConnecting,
        address,
        balance,
        error,
        initialize,
        connect,
        disconnect,
        signMessage,
        signTransaction,
        createPsbt,
        signPsbt,
        finalizePsbt,
        extractTx,
        broadcastTx,
        refreshBalance,
      }}
    >
      {children}
    </WasmWalletContext.Provider>
  );
};

// Hook for using the wallet context
export const useWasmWallet = (): WasmWalletContextType => {
  const context = useContext(WasmWalletContext);
  if (context === undefined) {
    throw new Error('useWasmWallet must be used within a WasmWalletProvider');
  }
  return context;
};

export default WasmWalletProvider;