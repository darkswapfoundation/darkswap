import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from './WalletContext';
import { useNotification } from './NotificationContext';

interface SDKContextType {
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  shutdown: () => Promise<void>;
}

const SDKContext = createContext<SDKContextType | undefined>(undefined);

interface SDKProviderProps {
  children: ReactNode;
}

export const SDKProvider: React.FC<SDKProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { isConnected } = useWallet();
  const { addNotification } = useNotification();

  // Initialize SDK when wallet is connected
  useEffect(() => {
    if (isConnected && !isInitialized && !isInitializing) {
      initializeSDK();
    }
  }, [isConnected, isInitialized, isInitializing]);

  // Initialize SDK
  const initializeSDK = async () => {
    if (isInitializing || isInitialized) return;
    
    setIsInitializing(true);
    setError(null);
    
    try {
      // In a real implementation, this would initialize the DarkSwap SDK
      // For now, we'll simulate initialization
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsInitialized(true);
      addNotification('success', 'DarkSwap SDK initialized successfully');
    } catch (error) {
      console.error('Error initializing SDK:', error);
      setError(`Failed to initialize SDK: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addNotification('error', `Failed to initialize SDK: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsInitializing(false);
    }
  };

  // Shutdown SDK
  const shutdownSDK = async () => {
    if (!isInitialized) return;
    
    try {
      // In a real implementation, this would shutdown the DarkSwap SDK
      // For now, we'll simulate shutdown
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsInitialized(false);
      addNotification('info', 'DarkSwap SDK shutdown successfully');
    } catch (error) {
      console.error('Error shutting down SDK:', error);
      addNotification('error', `Failed to shutdown SDK: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Shutdown SDK when wallet is disconnected
  useEffect(() => {
    if (!isConnected && isInitialized) {
      shutdownSDK();
    }
  }, [isConnected, isInitialized]);

  return (
    <SDKContext.Provider
      value={{
        isInitialized,
        isInitializing,
        error,
        initialize: initializeSDK,
        shutdown: shutdownSDK,
      }}
    >
      {children}
    </SDKContext.Provider>
  );
};

export const useSDK = (): SDKContextType => {
  const context = useContext(SDKContext);
  if (context === undefined) {
    throw new Error('useSDK must be used within an SDKProvider');
  }
  return context;
};

export default SDKProvider;