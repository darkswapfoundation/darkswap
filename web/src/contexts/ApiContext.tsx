import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import ApiClient from '../utils/ApiClient';
import { useNotification } from './NotificationContext';
import { Peer } from './WebSocketContext';

export interface RelayInfo {
  id: string;
  address: string;
  connected: boolean;
  latency: number;
  connectedPeers: string[];
}

export interface RelayStatus {
  relays: RelayInfo[];
  timestamp: number;
}

interface ApiContextType {
  client: ApiClient;
  isLoading: boolean;
  error: string | null;
  setBaseUrl: (url: string) => void;
  getRelayStatus: () => Promise<RelayStatus>;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

interface ApiProviderProps {
  children: ReactNode;
  baseUrl?: string;
}

export const ApiProvider: React.FC<ApiProviderProps> = ({ 
  children, 
  baseUrl = 'http://localhost:3000' 
}) => {
  const [client] = useState<ApiClient>(new ApiClient(baseUrl));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotification();

  // Check API health on mount
  useEffect(() => {
    const checkHealth = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await client.getHealth();
        
        if (response.error) {
          setError(`API error: ${response.error}`);
          addNotification('error', `Failed to connect to API: ${response.error}`);
        } else {
          addNotification('success', `Connected to DarkSwap API v${response.data?.version}`);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`API error: ${errorMessage}`);
        addNotification('error', `Failed to connect to API: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkHealth();
  }, [baseUrl, client, addNotification]);

  // Set base URL
  const setBaseUrl = (url: string) => {
    client.setBaseUrl(url);
  };

  // Get relay status
  const getRelayStatus = async (): Promise<RelayStatus> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await client.getRelayStatus();
      
      if (response.error) {
        setError(`API error: ${response.error}`);
        throw new Error(response.error);
      }
      
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      
      // Create a default relay status if the API doesn't return one
      const relayStatus: RelayStatus = {
        relays: response.data.relays || [],
        timestamp: response.data.timestamp || Date.now(),
      };
      
      return relayStatus;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`API error: ${errorMessage}`);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ApiContext.Provider
      value={{
        client,
        isLoading,
        error,
        setBaseUrl,
        getRelayStatus,
      }}
    >
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = (): ApiContextType => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

export default ApiProvider;