import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LedgerWalletProvider, createLedgerWalletProvider } from '../utils/LedgerWalletProvider';
import { ErrorCode, DarkSwapError } from '../utils/ErrorHandling';

/**
 * Ledger context state
 */
interface LedgerContextState {
  provider: LedgerWalletProvider;
  isSupported: boolean;
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  networkName: string;
  balance: string | null;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  signTypedData: (typedData: any) => Promise<string>;
  sendTransaction: (transaction: {
    from: string;
    to: string;
    value?: string;
    data?: string;
    gas?: string;
    gasPrice?: string;
  }) => Promise<string>;
}

/**
 * Ledger context
 */
const LedgerContext = createContext<LedgerContextState | null>(null);

/**
 * Ledger provider props
 */
interface LedgerProviderProps {
  children: React.ReactNode;
  options?: {
    appName?: string;
    appDescription?: string;
    appIconUrl?: string;
    appUrl?: string;
  };
}

/**
 * Ledger provider
 * @param props Provider props
 * @returns Provider component
 */
export const LedgerProvider: React.FC<LedgerProviderProps> = ({ children, options }) => {
  // Create Ledger provider
  const [provider] = useState<LedgerWalletProvider>(() => createLedgerWalletProvider(options));
  
  // State
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [networkName, setNetworkName] = useState<string>('Unknown');
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  /**
   * Initialize provider
   */
  useEffect(() => {
    // Check if Ledger is supported
    const isLedgerSupported = provider.isLedgerSupported();
    setIsSupported(isLedgerSupported);
    
    // If Ledger is supported, check if it's connected
    if (isLedgerSupported) {
      // Check if connected
      const isConnected = provider.isConnected();
      setIsConnected(isConnected);
      
      // Get address
      const address = provider.getAddress();
      setAddress(address);
      
      // Get chain ID
      const chainId = provider.getChainId();
      setChainId(chainId);
      
      // Get network name
      const networkName = provider.getNetworkName();
      setNetworkName(networkName);
      
      // Get balance
      if (address) {
        provider.getBalance(address)
          .then(balance => setBalance(balance))
          .catch(error => console.error('Failed to get balance:', error));
      }
    }
  }, [provider]);
  
  /**
   * Set up event listeners
   */
  useEffect(() => {
    // Account change listener
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // Disconnected
        setIsConnected(false);
        setAddress(null);
        setBalance(null);
      } else {
        // Connected
        setIsConnected(true);
        setAddress(accounts[0]);
        
        // Get balance
        provider.getBalance(accounts[0])
          .then(balance => setBalance(balance))
          .catch(error => console.error('Failed to get balance:', error));
      }
    };
    
    // Chain change listener
    const handleChainChanged = (chainId: number) => {
      // Update chain ID
      setChainId(chainId);
      
      // Update network name
      setNetworkName(provider.getNetworkName());
      
      // Get balance
      if (address) {
        provider.getBalance(address)
          .then(balance => setBalance(balance))
          .catch(error => console.error('Failed to get balance:', error));
      }
    };
    
    // Connect listener
    const handleConnect = (connectInfo: { chainId: number }) => {
      // Update connected state
      setIsConnected(true);
      
      // Update chain ID
      setChainId(connectInfo.chainId);
      
      // Update network name
      setNetworkName(provider.getNetworkName());
    };
    
    // Disconnect listener
    const handleDisconnect = (error: { code: number; message: string }) => {
      // Update connected state
      setIsConnected(false);
      
      // Update address
      setAddress(null);
      
      // Update chain ID
      setChainId(null);
      
      // Update network name
      setNetworkName('Unknown');
      
      // Update balance
      setBalance(null);
      
      // Update error
      setError(new Error(error.message));
    };
    
    // Add event listeners
    provider.addAccountChangeListener(handleAccountsChanged);
    provider.addChainChangeListener(handleChainChanged);
    provider.addConnectListener(handleConnect);
    provider.addDisconnectListener(handleDisconnect);
    
    // Remove event listeners on cleanup
    return () => {
      provider.removeAccountChangeListener(handleAccountsChanged);
      provider.removeChainChangeListener(handleChainChanged);
      provider.removeConnectListener(handleConnect);
      provider.removeDisconnectListener(handleDisconnect);
    };
  }, [provider, address]);
  
  /**
   * Connect to Ledger
   */
  const connect = useCallback(async () => {
    try {
      // Reset error
      setError(null);
      
      // Connect to Ledger
      const accounts = await provider.connect();
      
      // Update connected state
      setIsConnected(true);
      
      // Update address
      setAddress(accounts[0]);
      
      // Update chain ID
      setChainId(provider.getChainId());
      
      // Update network name
      setNetworkName(provider.getNetworkName());
      
      // Get balance
      const balance = await provider.getBalance(accounts[0]);
      setBalance(balance);
    } catch (error) {
      console.error('Failed to connect to Ledger:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
      
      // If the error is not a user rejection, throw it
      if (!(error instanceof DarkSwapError && error.code === ErrorCode.USER_REJECTED)) {
        throw error;
      }
    }
  }, [provider]);
  
  /**
   * Disconnect from Ledger
   */
  const disconnect = useCallback(async () => {
    try {
      // Disconnect from Ledger
      await provider.disconnect();
      
      // Update connected state
      setIsConnected(false);
      
      // Update address
      setAddress(null);
      
      // Update chain ID
      setChainId(null);
      
      // Update network name
      setNetworkName('Unknown');
      
      // Update balance
      setBalance(null);
      
      // Reset error
      setError(null);
    } catch (error) {
      console.error('Failed to disconnect from Ledger:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }, [provider]);
  
  /**
   * Sign message
   * @param message Message to sign
   * @returns Signature
   */
  const signMessage = useCallback(async (message: string) => {
    try {
      // Reset error
      setError(null);
      
      // Sign message
      const signature = await provider.signMessage(message);
      
      return signature;
    } catch (error) {
      console.error('Failed to sign message:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
      
      // If the error is not a user rejection, throw it
      if (!(error instanceof DarkSwapError && error.code === ErrorCode.USER_REJECTED)) {
        throw error;
      }
      
      throw error;
    }
  }, [provider]);
  
  /**
   * Sign typed data
   * @param typedData Typed data to sign
   * @returns Signature
   */
  const signTypedData = useCallback(async (typedData: any) => {
    try {
      // Reset error
      setError(null);
      
      // Sign typed data
      const signature = await provider.signTypedData(typedData);
      
      return signature;
    } catch (error) {
      console.error('Failed to sign typed data:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
      
      // If the error is not a user rejection, throw it
      if (!(error instanceof DarkSwapError && error.code === ErrorCode.USER_REJECTED)) {
        throw error;
      }
      
      throw error;
    }
  }, [provider]);
  
  /**
   * Send transaction
   * @param transaction Transaction to send
   * @returns Transaction hash
   */
  const sendTransaction = useCallback(async (transaction: {
    from: string;
    to: string;
    value?: string;
    data?: string;
    gas?: string;
    gasPrice?: string;
  }) => {
    try {
      // Reset error
      setError(null);
      
      // Send transaction
      const txHash = await provider.sendTransaction(transaction);
      
      return txHash;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
      
      // If the error is not a user rejection, throw it
      if (!(error instanceof DarkSwapError && error.code === ErrorCode.USER_REJECTED)) {
        throw error;
      }
      
      throw error;
    }
  }, [provider]);
  
  // Context value
  const value: LedgerContextState = {
    provider,
    isSupported,
    isConnected,
    address,
    chainId,
    networkName,
    balance,
    error,
    connect,
    disconnect,
    signMessage,
    signTypedData,
    sendTransaction,
  };
  
  return (
    <LedgerContext.Provider value={value}>
      {children}
    </LedgerContext.Provider>
  );
};

/**
 * Use Ledger hook
 * @returns Ledger context
 */
export const useLedger = (): LedgerContextState => {
  const context = useContext(LedgerContext);
  
  if (!context) {
    throw new Error('useLedger must be used within a LedgerProvider');
  }
  
  return context;
};