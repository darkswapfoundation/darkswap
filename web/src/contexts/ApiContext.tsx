import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ApiContextType {
  get: <T>(url: string) => Promise<T>;
  post: <T>(url: string, data: any) => Promise<T>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

interface ApiProviderProps {
  children: ReactNode;
  baseUrl?: string;
}

export const ApiProvider: React.FC<ApiProviderProps> = ({ 
  children, 
  baseUrl = 'https://api.darkswap.io' 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const get = async <T,>(url: string): Promise<T> => {
    setLoading(true);
    clearError();
    
    try {
      const response = await fetch(`${baseUrl}${url}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An error occurred');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const post = async <T,>(url: string, data: any): Promise<T> => {
    setLoading(true);
    clearError();
    
    try {
      const response = await fetch(`${baseUrl}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An error occurred');
      }
      
      const responseData = await response.json();
      return responseData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    get,
    post,
    loading,
    error,
    clearError,
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};

export const useApi = (): ApiContextType => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};