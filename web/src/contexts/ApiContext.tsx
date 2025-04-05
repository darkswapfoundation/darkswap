import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiContextType } from '../utils/types';

// Create API context
export const ApiContext = createContext<ApiContextType | undefined>(undefined);

// API provider props
interface ApiProviderProps {
  children: ReactNode;
  baseURL?: string;
}

// API provider component
export const ApiProvider: React.FC<ApiProviderProps> = ({ 
  children, 
  baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Create API instance
  const api = React.useMemo(() => {
    const instance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });
    
    // Request interceptor
    instance.interceptors.request.use(
      (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        // Add authorization header if token exists
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    
    // Response interceptor
    instance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error: AxiosError) => {
        // Handle 401 Unauthorized errors
        if (error.response && error.response.status === 401) {
          // Clear token
          localStorage.removeItem('token');
          
          // Redirect to login page
          window.location.href = '/login';
        }
        
        return Promise.reject(error);
      }
    );
    
    return {
      get: <T = any>(url: string, config?: any) => instance.get<T>(url, config),
      post: <T = any>(url: string, data?: any, config?: any) => instance.post<T>(url, data, config),
      put: <T = any>(url: string, data?: any, config?: any) => instance.put<T>(url, data, config),
      delete: <T = any>(url: string, config?: any) => instance.delete<T>(url, config),
    };
  }, [baseURL]);
  
  // Clear error
  const clearError = () => {
    setError(null);
  };
  
  // Return provider
  return (
    <ApiContext.Provider
      value={{
        api,
        loading,
        error,
        clearError,
      }}
    >
      {children}
    </ApiContext.Provider>
  );
};

// Hook to use API context
export const useApi = (): ApiContextType => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

export default ApiContext;