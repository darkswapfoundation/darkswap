import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import axios from 'axios';
import { API_URL } from '@env';

// Define user type
export interface User {
  id: string;
  username: string;
}

// Define auth context type
export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        const credentials = await Keychain.getGenericPassword();

        if (userJson && credentials) {
          setUser(JSON.parse(userJson));
          setToken(credentials.password);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${API_URL}/auth/login`, {
        username,
        password,
      });

      const { token, user_id, username: userName } = response.data;

      // Save user and token
      const userData: User = {
        id: user_id,
        username: userName,
      };

      setUser(userData);
      setToken(token);

      // Save to storage
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await Keychain.setGenericPassword(userName, token);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (username: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        password,
      });

      const { token, user_id, username: userName } = response.data;

      // Save user and token
      const userData: User = {
        id: user_id,
        username: userName,
      };

      setUser(userData);
      setToken(token);

      // Save to storage
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await Keychain.setGenericPassword(userName, token);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Clear user and token
      setUser(null);
      setToken(null);

      // Clear storage
      await AsyncStorage.removeItem('user');
      await Keychain.resetGenericPassword();
    } catch (error: any) {
      setError('Logout failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        loading,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};