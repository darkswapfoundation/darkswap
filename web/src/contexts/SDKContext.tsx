import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from './WalletContext';

interface SDKContextType {
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
  peerCount: number;
  orderCount: number;
  connectionQuality: 'poor' | 'fair' | 'good' | 'excellent';
  initialize: () => Promise<void>;
  shutdown: () => Promise<void>;
}

const SDKContext = createContext<SDKContextType | undefined>(undefined);

interface SDKProviderProps {
  children: ReactNode;
}

export const SDKProvider: React.FC<SDKProviderProps> = ({ children }) => {
  const { isConnected } = useWallet();
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [peerCount, setPeerCount] = useState<number>(0);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [connectionQuality, setConnectionQuality] = useState<'poor' | 'fair' | 'good' | 'excellent'>('poor');

  // Auto-initialize when wallet is connected
  useEffect(() => {
    if (isConnected && !isInitialized && !isInitializing) {
      initialize();
    }
  }, [isConnected]);

  // Mock SDK initialization
  const initialize = async (): Promise<void> => {
    if (isInitialized || isInitializing) return;
    
    setIsInitializing(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Set mock values
      setPeerCount(Math.floor(Math.random() * 30) + 5);
      setOrderCount(Math.floor(Math.random() * 100) + 20);
      
      // Start peer count and order count simulation
      startSimulation();
      
      setIsInitialized(true);
    } catch (err) {
      setError('Failed to initialize SDK');
      console.error('SDK initialization error:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  // Mock SDK shutdown
  const shutdown = async (): Promise<void> => {
    if (!isInitialized) return;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset values
      setPeerCount(0);
      setOrderCount(0);
      setConnectionQuality('poor');
      
      setIsInitialized(false);
    } catch (err) {
      console.error('SDK shutdown error:', err);
    }
  };

  // Simulate peer count and order count changes
  const startSimulation = () => {
    const interval = setInterval(() => {
      if (!isInitialized) {
        clearInterval(interval);
        return;
      }
      
      // Randomly adjust peer count
      setPeerCount(prev => {
        const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        const newCount = Math.max(5, Math.min(50, prev + change));
        
        // Update connection quality based on peer count
        if (newCount < 10) {
          setConnectionQuality('poor');
        } else if (newCount < 20) {
          setConnectionQuality('fair');
        } else if (newCount < 30) {
          setConnectionQuality('good');
        } else {
          setConnectionQuality('excellent');
        }
        
        return newCount;
      });
      
      // Randomly adjust order count
      setOrderCount(prev => {
        const change = Math.floor(Math.random() * 5) - 2; // -2, -1, 0, 1, or 2
        return Math.max(10, prev + change);
      });
    }, 5000);
    
    return () => clearInterval(interval);
  };

  // Clean up when wallet is disconnected
  useEffect(() => {
    if (!isConnected && isInitialized) {
      shutdown();
    }
  }, [isConnected]);

  return (
    <SDKContext.Provider
      value={{
        isInitialized,
        isInitializing,
        error,
        peerCount,
        orderCount,
        connectionQuality,
        initialize,
        shutdown,
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