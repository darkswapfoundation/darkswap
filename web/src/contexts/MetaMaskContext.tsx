import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MetaMaskWalletProvider, createMetaMaskWalletProvider } from '../utils/MetaMaskWalletProvider';
import { ErrorCode, DarkSwapError } from '../utils/ErrorHandling';

/**
 * MetaMask context state
 */
interface MetaMaskContextState {
  provider: MetaMaskWalletProvider;
  isInstalled: boolean;
  isConnected: boolean;
  address: string | null;
  chainId: string | null;
  networkName: string;
  balance: string | null;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: string) => Promise<boolean>;
  addChain: (chain: {
    chainId: string;
    chainName: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    rpcUrls: string[];
    blockExplorerUrls?: string[];
    iconUrls?: string[];
  }) => Promise<boolean>;
  addToken: (token: {
    address: string;
    symbol: string;
    decimals: number;
    image?: string;
  }) => Promise<boolean>;
  signMessage: (message: string) => Promise<string>;
  signTypedData: (typedData: any) => Promise<string>;
  sendTransaction: (transaction: {
    to: string;
    value?: string;
    data?: string;
    gas?: string;
    gasPrice?: string;
  }) => Promise<string>;
}

/**
 * MetaMask context
 */
const MetaMaskContext = createContext<MetaMaskContextState | null>(null);

/**
 * MetaMask provider props
 */
interface MetaMaskProviderProps {
  children: React.ReactNode;
}

/**
 * MetaMask provider
 * @param props Provider props
 * @returns Provider component
 */
export const MetaMaskProvider: React.FC<MetaMaskProviderProps> = ({ children }) => {
  // Create MetaMask wallet provider
  const [provider] = useState<MetaMaskWalletProvider>(() => createMetaMaskWalletProvider());
  
  // State
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [networkName, setNetworkName] = useState<string>('Unknown');
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  /**
   * Initialize provider
   */
  useEffect(() => {
    // Check if MetaMask is installed
    const isMetaMaskInstalled = provider.isMetaMaskInstalled();
    setIsInstalled(isMetaMaskInstalled);
    
    // If MetaMask is installed, check if it's connected
    if (isMetaMaskInstalled) {
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
    const handleChainChanged = (chainId: string) => {
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
    const handleConnect = (connectInfo: { chainId: string }) => {
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
   * Connect to MetaMask
   */
  const connect = useCallback(async () => {
    try {
      // Reset error
      setError(null);
      
      // Connect to MetaMask
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
      console.error('Failed to connect to MetaMask:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
      
      // If the error is not a user rejection, throw it
      if (!(error instanceof DarkSwapError && error.code === ErrorCode.USER_REJECTED)) {
        throw error;
      }
    }
  }, [provider]);
  
  /**
   * Disconnect from MetaMask
   */
  const disconnect = useCallback(() => {
    // Disconnect from MetaMask
    provider.disconnect();
    
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
  }, [provider]);
  
  /**
   * Switch chain
   * @param chainId Chain ID to switch to
   * @returns Whether the chain was switched
   */
  const switchChain = useCallback(async (chainId: string) => {
    try {
      // Reset error
      setError(null);
      
      // Switch chain
      const result = await provider.switchChain(chainId);
      
      return result;
    } catch (error) {
      console.error('Failed to switch chain:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
      
      // If the error is not a user rejection, throw it
      if (!(error instanceof DarkSwapError && error.code === ErrorCode.USER_REJECTED)) {
        throw error;
      }
      
      return false;
    }
  }, [provider]);
  
  /**
   * Add chain
   * @param chain Chain to add
   * @returns Whether the chain was added
   */
  const addChain = useCallback(async (chain: {
    chainId: string;
    chainName: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    rpcUrls: string[];
    blockExplorerUrls?: string[];
    iconUrls?: string[];
  }) => {
    try {
      // Reset error
      setError(null);
      
      // Add chain
      const result = await provider.addChain(chain);
      
      return result;
    } catch (error) {
      console.error('Failed to add chain:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
      
      // If the error is not a user rejection, throw it
      if (!(error instanceof DarkSwapError && error.code === ErrorCode.USER_REJECTED)) {
        throw error;
      }
      
      return false;
    }
  }, [provider]);
  
  /**
   * Add token
   * @param token Token to add
   * @returns Whether the token was added
   */
  const addToken = useCallback(async (token: {
    address: string;
    symbol: string;
    decimals: number;
    image?: string;
  }) => {
    try {
      // Reset error
      setError(null);
      
      // Add token
      const result = await provider.addToken(token);
      
      return result;
    } catch (error) {
      console.error('Failed to add token:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
      
      // If the error is not a user rejection, throw it
      if (!(error instanceof DarkSwapError && error.code === ErrorCode.USER_REJECTED)) {
        throw error;
      }
      
      return false;
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
  const value: MetaMaskContextState = {
    provider,
    isInstalled,
    isConnected,
    address,
    chainId,
    networkName,
    balance,
    error,
    connect,
    disconnect,
    switchChain,
    addChain,
    addToken,
    signMessage,
    signTypedData,
    sendTransaction,
  };
  
  return (
    <MetaMaskContext.Provider value={value}>
      {children}
    </MetaMaskContext.Provider>
  );
};

/**
 * Use MetaMask hook
 * @returns MetaMask context
 */
export const useMetaMask = (): MetaMaskContextState => {
  const context = useContext(MetaMaskContext);
  
  if (!context) {
    throw new Error('useMetaMask must be used within a MetaMaskProvider');
  }
  
  return context;
};