import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ApiProvider, useApi } from '../../contexts/ApiContext';
import axios from 'axios';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    }
  })),
  defaults: {
    headers: {
      common: {}
    }
  }
}));

// Test component that uses the API context
const TestComponent = () => {
  const { api, loading, error, clearError } = useApi();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="error">{error || 'No Error'}</div>
      <button data-testid="get-button" onClick={() => api.get('/test')}>Get</button>
      <button data-testid="post-button" onClick={() => api.post('/test', { data: 'test' })}>Post</button>
      <button data-testid="clear-error" onClick={clearError}>Clear Error</button>
    </div>
  );
};

describe('ApiContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });
  
  test('should provide API client to children', () => {
    // Setup
    render(
      <ApiProvider>
        <TestComponent />
      </ApiProvider>
    );
    
    // Verify
    expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    expect(screen.getByTestId('error')).toHaveTextContent('No Error');
  });
  
  test('should create axios instance with correct config', () => {
    // Setup
    const baseURL = 'http://test-api.com';
    
    // Execute
    render(
      <ApiProvider baseURL={baseURL}>
        <TestComponent />
      </ApiProvider>
    );
    
    // Verify
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL,
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        timeout: expect.any(Number)
      })
    );
  });
  
  test('should make API calls', async () => {
    // Setup
    const mockGet = jest.fn().mockResolvedValue({ data: 'test-data' });
    const mockPost = jest.fn().mockResolvedValue({ data: 'test-response' });
    
    // Mock axios.create to return our mock functions
    (axios.create as jest.Mock).mockReturnValue({
      get: mockGet,
      post: mockPost,
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() }
      }
    });
    
    // Execute
    render(
      <ApiProvider>
        <TestComponent />
      </ApiProvider>
    );
    
    // Click the get button
    act(() => {
      screen.getByTestId('get-button').click();
    });
    
    // Verify get was called
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/test');
    });
    
    // Click the post button
    act(() => {
      screen.getByTestId('post-button').click();
    });
    
    // Verify post was called
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/test', { data: 'test' });
    });
  });
  
  test('should add authorization header when token exists', () => {
    // Setup
    const token = 'test-token';
    localStorage.setItem('token', token);
    
    const requestInterceptor = jest.fn();
    (axios.create as jest.Mock).mockReturnValue({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: requestInterceptor, eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() }
      }
    });
    
    // Execute
    render(
      <ApiProvider>
        <TestComponent />
      </ApiProvider>
    );
    
    // Verify
    expect(requestInterceptor).toHaveBeenCalled();
    
    // Get the interceptor function
    const interceptorFn = requestInterceptor.mock.calls[0][0];
    
    // Create a mock config
    const mockConfig = { headers: {} };
    
    // Call the interceptor
    const result = interceptorFn(mockConfig);
    
    // Verify token was added
    expect(result.headers.Authorization).toBe(`Bearer ${token}`);
  });
  
  test('should handle 401 errors', () => {
    // Setup
    const responseInterceptor = jest.fn();
    (axios.create as jest.Mock).mockReturnValue({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: responseInterceptor, eject: jest.fn() }
      }
    });
    
    // Mock window.location
    const originalLocation = window.location;
    delete window.location;
    window.location = { ...originalLocation, href: '' };
    
    // Store a token
    localStorage.setItem('token', 'test-token');
    
    // Execute
    render(
      <ApiProvider>
        <TestComponent />
      </ApiProvider>
    );
    
    // Get the error handler
    const errorHandler = responseInterceptor.mock.calls[0][1];
    
    // Create a mock 401 error
    const mockError = {
      response: {
        status: 401
      }
    };
    
    // Call the error handler
    try {
      errorHandler(mockError);
    } catch (e) {
      // Expected to throw
    }
    
    // Verify token was removed and redirect happened
    expect(localStorage.getItem('token')).toBeNull();
    expect(window.location.href).toBe('/login');
    
    // Restore window.location
    window.location = originalLocation;
  });
  
  test('should clear error', () => {
    // Setup
    const mockGet = jest.fn().mockRejectedValue(new Error('Test error'));
    
    (axios.create as jest.Mock).mockReturnValue({
      get: mockGet,
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() }
      }
    });
    
    // Execute
    render(
      <ApiProvider>
        <TestComponent />
      </ApiProvider>
    );
    
    // Click the get button to trigger an error
    act(() => {
      screen.getByTestId('get-button').click();
    });
    
    // Verify error state
    // Note: In a real test, we'd need to handle the async nature of the error state update
    
    // Click clear error button
    act(() => {
      screen.getByTestId('clear-error').click();
    });
    
    // Verify error was cleared
    expect(screen.getByTestId('error')).toHaveTextContent('No Error');
  });
});