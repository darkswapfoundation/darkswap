import React, { createContext, useContext, useState, ReactNode } from 'react';
import ApiClient from '../utils/ApiClient';

interface ApiContextType {
  api: ApiClient;
  setBaseUrl: (url: string) => void;
  setUseWebSocket: (use: boolean) => void;
}

const ApiContext = createContext<ApiContextType>({
  api: new ApiClient(),
  setBaseUrl: () => {},
  setUseWebSocket: () => {},
});

interface ApiProviderProps {
  baseUrl?: string;
  useWebSocket?: boolean;
  children: ReactNode;
}

export const ApiProvider: React.FC<ApiProviderProps> = ({
  baseUrl = '/api',
  useWebSocket = false,
  children,
}) => {
  const [api] = useState<ApiClient>(() => {
    const client = new ApiClient(baseUrl);
    client.setUseWebSocket(useWebSocket);
    return client;
  });
  
  const setBaseUrl = (url: string) => {
    // Create a new ApiClient with the new base URL
    const newClient = new ApiClient(url);
    newClient.setUseWebSocket(useWebSocket);
    // Replace the api instance
    Object.assign(api, newClient);
  };
  
  const setUseWebSocket = (use: boolean) => {
    api.setUseWebSocket(use);
  };
  
  return (
    <ApiContext.Provider value={{ api, setBaseUrl, setUseWebSocket }}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => useContext(ApiContext);

export default ApiContext;