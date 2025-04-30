import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ApiProvider, useApi, useApiEndpoint } from '../contexts/ApiContext';
import ApiClient from '../utils/ApiClient';

// Mock ApiClient
jest.mock('../utils/ApiClient');
const MockApiClient = ApiClient as jest.MockedClass<typeof ApiClient>;

// Test component that uses the API context
const TestComponent: React.FC = () => {
  const { apiClient, isInitialized, error } = useApi();
  
  return (
    <div>
      <div data-testid="initialized">{isInitialized ? 'true' : 'false'}</div>
      <div data-testid="error">{error ? error.message : 'no error'}</div>
      <div data-testid="client-exists">{apiClient ? 'true' : 'false'}</div>
    </div>
  );
};

// Test component that uses the API endpoint hook
const TestEndpointComponent: React.FC<{ endpoint: string }> = ({ endpoint }) => {
  const { 
    data, 
    isLoading, 
    error, 
    getData, 
    createData, 
    updateData, 
    deleteData 
  } = useApiEndpoint(endpoint);
  
  return (
    <div>
      <div data-testid="endpoint-data">{data ? JSON.stringify(data) : 'no data'}</div>
      <div data-testid="endpoint-loading">{isLoading ? 'true' : 'false'}</div>
      <div data-testid="endpoint-error">{error || 'no error'}</div>
      <button data-testid="get-data" onClick={() => getData()}>Get Data</button>
      <button data-testid="create-data" onClick={() => createData({ test: 'data' })}>Create Data</button>
      <button data-testid="update-data" onClick={() => updateData('123', { test: 'updated' })}>Update Data</button>
      <button data-testid="delete-data" onClick={() => deleteData('123')}>Delete Data</button>
    </div>
  );
};

// Wrapper component with provider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ApiProvider options={{ baseUrl: 'https://api.example.com' }}>
      {children}
    </ApiProvider>
  );
};

describe('ApiContext', () => {
  let mockApiClient: jest.Mocked<ApiClient>;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Set up mock ApiClient
    mockApiClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      setAuthToken: jest.fn(),
      clearAuthToken: jest.fn(),
    } as unknown as jest.Mocked<ApiClient>;
    
    MockApiClient.mockImplementation(() => mockApiClient);
  });
  
  describe('ApiProvider', () => {
    it('should initialize ApiClient with correct options', () => {
      render(
        <ApiProvider options={{ baseUrl: 'https://api.example.com', timeout: 5000 }}>
          <div />
        </ApiProvider>
      );
      
      expect(MockApiClient).toHaveBeenCalledWith({
        baseUrl: 'https://api.example.com',
        timeout: 5000,
      });
    });
    
    it('should provide ApiClient to children', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      expect(screen.getByTestId('initialized').textContent).toBe('true');
      expect(screen.getByTestId('error').textContent).toBe('no error');
      expect(screen.getByTestId('client-exists').textContent).toBe('true');
    });
    
    it('should handle initialization errors', () => {
      // Mock ApiClient constructor to throw an error
      const error = new Error('Initialization error');
      MockApiClient.mockImplementation(() => {
        throw error;
      });
      
      // Suppress console.error for this test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      expect(screen.getByTestId('initialized').textContent).toBe('false');
      expect(screen.getByTestId('error').textContent).toBe('Initialization error');
      
      consoleErrorSpy.mockRestore();
    });
  });
  
  describe('useApi', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useApi must be used within an ApiProvider');
      
      consoleErrorSpy.mockRestore();
    });
  });
  
  describe('useApiEndpoint', () => {
    it('should call ApiClient.get when getData is called', async () => {
      const mockResponse = {
        success: true,
        data: { test: 'data' },
      };
      
      mockApiClient.get.mockResolvedValue(mockResponse);
      
      render(
        <TestWrapper>
          <TestEndpointComponent endpoint="/test" />
        </TestWrapper>
      );
      
      expect(screen.getByTestId('endpoint-data').textContent).toBe('no data');
      expect(screen.getByTestId('endpoint-loading').textContent).toBe('false');
      
      await act(async () => {
        screen.getByTestId('get-data').click();
      });
      
      expect(mockApiClient.get).toHaveBeenCalledWith('/test', undefined);
      expect(screen.getByTestId('endpoint-data').textContent).toBe(JSON.stringify({ test: 'data' }));
      expect(screen.getByTestId('endpoint-loading').textContent).toBe('false');
    });
    
    it('should call ApiClient.get with params', async () => {
      const mockResponse = {
        success: true,
        data: { test: 'data' },
      };
      
      mockApiClient.get.mockResolvedValue(mockResponse);
      
      render(
        <TestWrapper>
          <TestEndpointComponent endpoint="/test" />
        </TestWrapper>
      );
      
      const params = { param1: 'value1', param2: 'value2' };
      
      await act(async () => {
        // @ts-ignore - accessing function with params
        screen.getByTestId('get-data').onclick = () => useApiEndpoint('/test').getData(params);
        screen.getByTestId('get-data').click();
      });
      
      expect(mockApiClient.get).toHaveBeenCalledWith('/test', params);
    });
    
    it('should handle error in getData', async () => {
      const mockResponse = {
        success: false,
        error: 'API error',
      };
      
      mockApiClient.get.mockResolvedValue(mockResponse);
      
      render(
        <TestWrapper>
          <TestEndpointComponent endpoint="/test" />
        </TestWrapper>
      );
      
      await act(async () => {
        screen.getByTestId('get-data').click();
      });
      
      expect(screen.getByTestId('endpoint-error').textContent).toBe('API error');
      expect(screen.getByTestId('endpoint-data').textContent).toBe('no data');
    });
    
    it('should call ApiClient.post when createData is called', async () => {
      const mockResponse = {
        success: true,
        data: { id: '123', test: 'data' },
      };
      
      mockApiClient.post.mockResolvedValue(mockResponse);
      
      render(
        <TestWrapper>
          <TestEndpointComponent endpoint="/test" />
        </TestWrapper>
      );
      
      await act(async () => {
        screen.getByTestId('create-data').click();
      });
      
      expect(mockApiClient.post).toHaveBeenCalledWith('/test', { test: 'data' });
      expect(screen.getByTestId('endpoint-loading').textContent).toBe('false');
    });
    
    it('should call ApiClient.put when updateData is called', async () => {
      const mockResponse = {
        success: true,
        data: { id: '123', test: 'updated' },
      };
      
      mockApiClient.put.mockResolvedValue(mockResponse);
      
      render(
        <TestWrapper>
          <TestEndpointComponent endpoint="/test" />
        </TestWrapper>
      );
      
      await act(async () => {
        screen.getByTestId('update-data').click();
      });
      
      expect(mockApiClient.put).toHaveBeenCalledWith('/test/123', { test: 'updated' });
      expect(screen.getByTestId('endpoint-loading').textContent).toBe('false');
    });
    
    it('should call ApiClient.delete when deleteData is called', async () => {
      const mockResponse = {
        success: true,
        data: { success: true },
      };
      
      mockApiClient.delete.mockResolvedValue(mockResponse);
      
      render(
        <TestWrapper>
          <TestEndpointComponent endpoint="/test" />
        </TestWrapper>
      );
      
      await act(async () => {
        screen.getByTestId('delete-data').click();
      });
      
      expect(mockApiClient.delete).toHaveBeenCalledWith('/test/123');
      expect(screen.getByTestId('endpoint-loading').textContent).toBe('false');
    });
    
    it('should handle network errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));
      
      render(
        <TestWrapper>
          <TestEndpointComponent endpoint="/test" />
        </TestWrapper>
      );
      
      await act(async () => {
        screen.getByTestId('get-data').click();
      });
      
      expect(screen.getByTestId('endpoint-error').textContent).toBe('Network error');
      expect(screen.getByTestId('endpoint-loading').textContent).toBe('false');
    });
  });
});