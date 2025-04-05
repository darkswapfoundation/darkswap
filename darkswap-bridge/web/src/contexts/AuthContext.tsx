import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

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
  logout: () => void;
  loading: boolean;
  error: string | null;
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
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/api/auth/login', {
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

      // Save to local storage
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
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

      const response = await axios.post('/api/auth/register', {
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

      // Save to local storage
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = (): void => {
    setUser(null);
    setToken(null);

    // Remove from local storage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Return provider
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};