import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiClientOptions, ApiResponse } from '../utils/types';

// Define API context interface
interface ApiContextType {
  api: AxiosInstance;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  get: <T>(url: string, config?: AxiosRequestConfig) => Promise<ApiResponse<T>>;
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<ApiResponse<T>>;
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<ApiResponse<T>>;
  delete: <T>(url: string, config?: AxiosRequestConfig) => Promise<ApiResponse<T>>;
}

// Create API context
const ApiContext = createContext<ApiContextType | undefined>(undefined);

// API provider props
interface ApiProviderProps {
  children: React.ReactNode;
  options?: ApiClientOptions;
}

// API provider component
export const ApiProvider: React.FC<ApiProviderProps> = ({
  children,
  options = {
    baseURL: 'https://api.darkswap.io',
    timeout: 10000,
  },
}) => {
  // State
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Create API instance
  const api = axios.create({
    baseURL: options.baseURL,
    timeout: options.timeout || 10000,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    withCredentials: options.withCredentials || false,
  });
  
  // Add request interceptor
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        // Add authorization header if token exists
        try {
          // In a real app, you would use AsyncStorage
          // const token = await AsyncStorage.getItem('token');
          const token = null;
          
          if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error getting token:', error);
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    
    // Add response interceptor
    const responseInterceptor = api.interceptors.response.use(
      (response) => {
        return response;
      },
      (error: AxiosError) => {
        // Handle token expiration
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          // In a real app, you would use AsyncStorage
          // AsyncStorage.removeItem('token');
          
          // In a real app, you would use navigation
          // navigation.navigate('Login');
        }
        
        return Promise.reject(error);
      }
    );
    
    // Clean up interceptors on unmount
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [api]);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // GET request
  const get = useCallback(async <T,>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    setLoading(true);
    setError(null);
    
    try {
      const response: AxiosResponse<ApiResponse<T>> = await api.get(url, config);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'An error occurred';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
        code: error.response?.status || 500,
      };
    } finally {
      setLoading(false);
    }
  }, [api]);
  
  // POST request
  const post = useCallback(async <T,>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    setLoading(true);
    setError(null);
    
    try {
      const response: AxiosResponse<ApiResponse<T>> = await api.post(url, data, config);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'An error occurred';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
        code: error.response?.status || 500,
      };
    } finally {
      setLoading(false);
    }
  }, [api]);
  
  // PUT request
  const put = useCallback(async <T,>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    setLoading(true);
    setError(null);
    
    try {
      const response: AxiosResponse<ApiResponse<T>> = await api.put(url, data, config);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'An error occurred';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
        code: error.response?.status || 500,
      };
    } finally {
      setLoading(false);
    }
  }, [api]);
  
  // DELETE request
  const deleteRequest = useCallback(async <T,>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    setLoading(true);
    setError(null);
    
    try {
      const response: AxiosResponse<ApiResponse<T>> = await api.delete(url, config);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'An error occurred';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
        code: error.response?.status || 500,
      };
    } finally {
      setLoading(false);
    }
  }, [api]);
  
  // Context value
  const value: ApiContextType = {
    api,
    loading,
    error,
    clearError,
    get,
    post,
    put,
    delete: deleteRequest,
  };
  
  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
};

// Hook for using API context
export const useApi = (): ApiContextType => {
  const context = useContext(ApiContext);
  
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  
  return context;
};

// Default API provider with environment-specific URL
export const DefaultApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get API URL from environment
  const apiUrl = 'https://api.darkswap.io';
  
  return (
    <ApiProvider options={{ baseURL: apiUrl }}>
      {children}
    </ApiProvider>
  );
};