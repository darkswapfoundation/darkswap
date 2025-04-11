import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TrezorWalletProvider, createTrezorWalletProvider } from '../utils/TrezorWalletProvider';
import { ErrorCode, DarkSwapError } from '../utils/ErrorHandling';

/**
 * Trezor context state
 */
interface TrezorContextState {
  provider: TrezorWalletProvider;
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
 * Trezor context
 */
const TrezorContext = createContext<TrezorContextState | null>(null);

/**
 * Trezor provider props
 */
interface TrezorProviderProps {
  children: React.ReactNode;
  options?: {
    appName?: string;
    appUrl?: string;
    email?: string;
    version?: string;
  };
}

/**
 * Trezor provider
 * @param props Provider props
 * @returns Provider component
 */
export const TrezorProvider: React.FC<TrezorProviderProps> = ({ children, options }) => {
  // Create Trezor provider
  const [provider] = useState<TrezorWalletProvider>(() => createTrezorWalletProvider(options));
  
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
    // Check if Trezor is supported
    const isTrezorSupported = provider.isTrezorSupported();
    setIsSupported(isTrezorSupported);
    
    // If Trezor is supported, check if it's connected
    if (isTrezorSupported) {
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
   * Connect to Trezor
   */
  const connect = useCallback(async () => {
    try {
      // Reset error
      setError(null);
      
      // Connect to Trezor
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
      console.error('Failed to connect to Trezor:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
      
      // If the error is not a user rejection, throw it
      if (!(error instanceof DarkSwapError && error.code === ErrorCode.USER_REJECTED)) {
        throw error;
      }
    }
  }, [provider]);
  
  /**
   * Disconnect from Trezor
   */
  const disconnect = useCallback(async () => {
    try {
      // Disconnect from Trezor
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
      console.error('Failed to disconnect from Trezor:', error);
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
  const value: TrezorContextState = {
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
    <TrezorContext.Provider value={value}>
      {children}
    </TrezorContext.Provider>
  );
};

/**
 * Use Trezor hook
 * @returns Trezor context
 */
export const useTrezor = (): TrezorContextState => {
  const context = useContext(TrezorContext);
  
  if (!context) {
    throw new Error('useTrezor must be used within a TrezorProvider');
  }
  
  return context;
};