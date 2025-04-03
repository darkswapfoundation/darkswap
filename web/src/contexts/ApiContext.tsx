import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import ApiClient, { ApiClientOptions } from '../utils/ApiClient';

// Define the API context type
interface ApiContextType {
  apiClient: ApiClient;
  isInitialized: boolean;
  error: Error | null;
}

// Create the API context
const ApiContext = createContext<ApiContextType | undefined>(undefined);

// Define the API provider props
interface ApiProviderProps {
  children: ReactNode;
  options: ApiClientOptions;
}

/**
 * API provider component
 * @param props Component props
 * @returns API provider component
 */
export const ApiProvider: React.FC<ApiProviderProps> = ({ children, options }) => {
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize the API client
  useEffect(() => {
    try {
      const client = new ApiClient(options);
      setApiClient(client);
      setIsInitialized(true);
    } catch (err) {
      console.error('Failed to initialize API client:', err);
      setError(err instanceof Error ? err : new Error('Failed to initialize API client'));
    }
  }, [options]);

  // Return null if the API client is not initialized
  if (!apiClient) {
    return null;
  }

  // Create the context value
  const contextValue: ApiContextType = {
    apiClient,
    isInitialized,
    error,
  };

  // Return the API provider
  return React.createElement(
    ApiContext.Provider,
    { value: contextValue },
    children
  );
};

/**
 * Hook to use the API client
 * @returns API client
 */
export const useApi = (): ApiContextType => {
  const context = useContext(ApiContext);

  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }

  return context;
};

/**
 * Hook to use the API client for a specific endpoint
 * @param endpoint API endpoint
 * @returns API client methods for the endpoint
 */
export const useApiEndpoint = <T extends {}>(endpoint: string) => {
  const { apiClient } = useApi();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  // Get data from the endpoint
  const getData = async (params?: Record<string, string>): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<T>(endpoint, params);

      if (!response.success) {
        setError(response.error || 'Failed to fetch data');
        return null;
      }

      setData(response.data || null);
      return response.data || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Create data at the endpoint
  const createData = async (data: Partial<T>): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<T>(endpoint, data);

      if (!response.success) {
        setError(response.error || 'Failed to create data');
        return null;
      }

      return response.data || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Update data at the endpoint
  const updateData = async (id: string, data: Partial<T>): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.put<T>(`${endpoint}/${id}`, data);

      if (!response.success) {
        setError(response.error || 'Failed to update data');
        return null;
      }

      return response.data || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete data at the endpoint
  const deleteData = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.delete<T>(`${endpoint}/${id}`);

      if (!response.success) {
        setError(response.error || 'Failed to delete data');
        return false;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    getData,
    createData,
    updateData,
    deleteData,
  };
};

export default ApiContext;