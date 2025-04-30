import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { useAuth } from './AuthContext';

// Define API context type
interface ApiContextType {
  api: AxiosInstance;
  loading: boolean;
  error: string | null;
}

// Create API context
const ApiContext = createContext<ApiContextType | undefined>(undefined);

// API provider props
interface ApiProviderProps {
  children: ReactNode;
}

// API provider component
export const ApiProvider: React.FC<ApiProviderProps> = ({ children }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Create API instance
  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || '/api',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add request interceptor
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        // Set loading state
        setLoading(true);
        setError(null);

        // Add authorization header if token exists
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => {
        // Handle request error
        setLoading(false);
        setError(error.message);
        return Promise.reject(error);
      }
    );

    // Add response interceptor
    const responseInterceptor = api.interceptors.response.use(
      (response) => {
        // Clear loading state
        setLoading(false);
        return response;
      },
      (error) => {
        // Handle response error
        setLoading(false);
        setError(error.response?.data?.message || error.message);
        return Promise.reject(error);
      }
    );

    // Clean up interceptors
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [api, token]);

  // Return provider
  return (
    <ApiContext.Provider value={{ api, loading, error }}>
      {children}
    </ApiContext.Provider>
  );
};

// Custom hook to use API context
export const useApi = (): ApiContextType => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};