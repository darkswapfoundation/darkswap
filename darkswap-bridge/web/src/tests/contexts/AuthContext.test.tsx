import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Test component that uses the auth context
const TestComponent: React.FC = () => {
  const { isAuthenticated, user, login, register, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="user-info">{user ? user.username : 'No User'}</div>
      <button data-testid="login-button" onClick={() => login('testuser', 'password')}>Login</button>
      <button data-testid="register-button" onClick={() => register('testuser', 'password')}>Register</button>
      <button data-testid="logout-button" onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Clear localStorage
    localStorage.clear();
  });
  
  test('provides authentication state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Check initial state
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('user-info')).toHaveTextContent('No User');
  });
  
  test('handles login', async () => {
    // Mock axios post response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        token: 'test-token',
        user_id: '123',
        username: 'testuser',
      },
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Click login button
    fireEvent.click(screen.getByTestId('login-button'));
    
    // Wait for state update
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('testuser');
    });
    
    // Check if axios was called with correct arguments
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/login', {
      username: 'testuser',
      password: 'password',
    });
    
    // Check if localStorage was updated
    expect(localStorage.getItem('token')).toBe('test-token');
    expect(localStorage.getItem('user')).toBe(JSON.stringify({
      id: '123',
      username: 'testuser',
    }));
  });
  
  test('handles register', async () => {
    // Mock axios post response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        token: 'test-token',
        user_id: '123',
        username: 'testuser',
      },
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Click register button
    fireEvent.click(screen.getByTestId('register-button'));
    
    // Wait for state update
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('testuser');
    });
    
    // Check if axios was called with correct arguments
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/register', {
      username: 'testuser',
      password: 'password',
    });
    
    // Check if localStorage was updated
    expect(localStorage.getItem('token')).toBe('test-token');
    expect(localStorage.getItem('user')).toBe(JSON.stringify({
      id: '123',
      username: 'testuser',
    }));
  });
  
  test('handles logout', async () => {
    // Set initial state
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({
      id: '123',
      username: 'testuser',
    }));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for state update
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('testuser');
    });
    
    // Click logout button
    fireEvent.click(screen.getByTestId('logout-button'));
    
    // Wait for state update
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('No User');
    });
    
    // Check if localStorage was cleared
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
  
  test('loads user from localStorage on mount', async () => {
    // Set initial state
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({
      id: '123',
      username: 'testuser',
    }));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for state update
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('testuser');
    });
  });
});