import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OptimizedTradeForm from '../../components/OptimizedTradeForm';
import { ApiContext } from '../../contexts/ApiContext';
import { NotificationContext } from '../../contexts/NotificationContext';
import { WalletContext } from '../../contexts/WalletContext';
import { WebSocketContext } from '../../contexts/WebSocketContext';

// Mock the contexts
jest.mock('../../contexts/ApiContext', () => ({
  useApi: jest.fn()
}));

jest.mock('../../contexts/NotificationContext', () => ({
  useNotification: jest.fn()
}));

jest.mock('../../contexts/WalletContext', () => ({
  useWallet: jest.fn()
}));

jest.mock('../../contexts/WebSocketContext', () => ({
  useWebSocket: jest.fn()
}));

// Mock the utility functions
jest.mock('../../utils/memoization', () => ({
  useMemoizedValue: jest.fn((fn) => fn()),
  useRenderPerformance: jest.fn()
}));

jest.mock('../../utils/caching', () => ({
  cacheApiResponse: jest.fn((fn) => fn())
}));

jest.mock('../../utils/performanceMonitoring', () => ({
  measureApiCall: jest.fn((name, fn) => fn())
}));

jest.mock('../../utils/accessibilityChecker', () => ({
  withAccessibilityCheck: jest.fn((component) => component)
}));

jest.mock('../../utils/securityChecker', () => ({
  withSecurityCheck: jest.fn((component) => component)
}));

jest.mock('../../utils/crossBrowserTesting', () => ({
  withCrossBrowserCheck: jest.fn((component) => component)
}));

describe('OptimizedTradeForm', () => {
  // Setup mock data and functions
  const mockApi = {
    get: jest.fn(),
    post: jest.fn()
  };
  
  const mockAddNotification = jest.fn();
  
  const mockWallet = {
    address: '0x123',
    publicKey: '0xabc',
    isOpen: true,
    open: jest.fn(),
    close: jest.fn(),
    sign: jest.fn()
  };
  
  const mockBalance = {
    BTC: 1.5,
    ETH: 10,
    USDT: 1000,
    RUNE1: 500,
    RUNE2: 300,
    ALKANE1: 200,
    ALKANE2: 100
  };
  
  const mockSubscribe = jest.fn();
  const mockUnsubscribe = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    require('../../contexts/ApiContext').useApi.mockReturnValue({
      api: mockApi,
      loading: false,
      error: null,
      clearError: jest.fn()
    });
    
    require('../../contexts/NotificationContext').useNotification.mockReturnValue({
      addNotification: mockAddNotification,
      removeNotification: jest.fn(),
      clearNotifications: jest.fn(),
      notifications: []
    });
    
    require('../../contexts/WalletContext').useWallet.mockReturnValue({
      wallet: mockWallet,
      balance: mockBalance,
      transactions: [],
      loading: false,
      error: null,
      refreshBalance: jest.fn(),
      sendTransaction: jest.fn()
    });
    
    require('../../contexts/WebSocketContext').useWebSocket.mockReturnValue({
      connected: true,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
      send: jest.fn()
    });
    
    // Mock API responses
    mockApi.get.mockResolvedValue({
      data: {
        buyAmount: 0.5,
        price: 0.1
      }
    });
    
    mockApi.post.mockResolvedValue({
      data: {
        tradeId: 'trade123'
      }
    });
  });
  
  test('renders the form correctly', () => {
    render(<OptimizedTradeForm />);
    
    // Check form elements
    expect(screen.getByLabelText(/Sell Asset/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Sell Amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Buy Asset/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Buy Amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Price/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Trade/i })).toBeInTheDocument();
  });
  
  test('shows balance information', () => {
    render(<OptimizedTradeForm initialAsset="BTC" />);
    
    // Check balance display
    expect(screen.getByText(/Balance: 1.5 BTC/i)).toBeInTheDocument();
  });
  
  test('updates price when sell asset, buy asset, or sell amount changes', async () => {
    render(<OptimizedTradeForm />);
    
    // Select sell asset
    fireEvent.change(screen.getByLabelText(/Sell Asset/i), { target: { value: 'BTC' } });
    
    // Select buy asset
    fireEvent.change(screen.getByLabelText(/Buy Asset/i), { target: { value: 'ETH' } });
    
    // Enter sell amount
    fireEvent.change(screen.getByLabelText(/Sell Amount/i), { target: { value: '1' } });
    
    // Wait for price update
    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/price?sellAsset=BTC&buyAsset=ETH&amount=1')
      );
    });
    
    // Check if buy amount and price are updated
    await waitFor(() => {
      expect(screen.getByLabelText(/Buy Amount/i)).toHaveValue('0.5');
      expect(screen.getByLabelText(/Price/i)).toHaveValue('0.1');
    });
  });
  
  test('validates form before submission', async () => {
    render(<OptimizedTradeForm />);
    
    // Try to submit without filling the form
    fireEvent.click(screen.getByRole('button', { name: /Create Trade/i }));
    
    // Check for validation errors
    expect(screen.getByText(/Sell asset is required/i)).toBeInTheDocument();
    
    // Fill the form partially
    fireEvent.change(screen.getByLabelText(/Sell Asset/i), { target: { value: 'BTC' } });
    fireEvent.change(screen.getByLabelText(/Sell Amount/i), { target: { value: '10' } });
    
    // Try to submit again
    fireEvent.click(screen.getByRole('button', { name: /Create Trade/i }));
    
    // Check for new validation errors
    expect(screen.getByText(/Insufficient balance/i)).toBeInTheDocument();
    expect(screen.getByText(/Buy asset is required/i)).toBeInTheDocument();
  });
  
  test('submits the form successfully', async () => {
    render(<OptimizedTradeForm />);
    
    // Fill the form correctly
    fireEvent.change(screen.getByLabelText(/Sell Asset/i), { target: { value: 'BTC' } });
    fireEvent.change(screen.getByLabelText(/Buy Asset/i), { target: { value: 'ETH' } });
    fireEvent.change(screen.getByLabelText(/Sell Amount/i), { target: { value: '1' } });
    
    // Wait for price update
    await waitFor(() => {
      expect(screen.getByLabelText(/Buy Amount/i)).toHaveValue('0.5');
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Create Trade/i }));
    
    // Check if API was called
    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/api/trades', {
        sellAsset: 'BTC',
        sellAmount: 1,
        buyAsset: 'ETH',
        buyAmount: 0.5,
        price: 0.1
      });
    });
    
    // Check if notification was shown
    expect(mockAddNotification).toHaveBeenCalledWith('success', 'Trade created successfully');
  });
  
  test('handles API errors', async () => {
    // Mock API error
    mockApi.post.mockRejectedValue(new Error('API Error'));
    
    render(<OptimizedTradeForm />);
    
    // Fill the form correctly
    fireEvent.change(screen.getByLabelText(/Sell Asset/i), { target: { value: 'BTC' } });
    fireEvent.change(screen.getByLabelText(/Buy Asset/i), { target: { value: 'ETH' } });
    fireEvent.change(screen.getByLabelText(/Sell Amount/i), { target: { value: '1' } });
    
    // Wait for price update
    await waitFor(() => {
      expect(screen.getByLabelText(/Buy Amount/i)).toHaveValue('0.5');
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Create Trade/i }));
    
    // Check if error notification was shown
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith('error', 'Failed to create trade');
    });
  });
  
  test('subscribes to orderbook updates', async () => {
    render(<OptimizedTradeForm initialAsset="BTC" />);
    
    // Select buy asset
    fireEvent.change(screen.getByLabelText(/Buy Asset/i), { target: { value: 'ETH' } });
    
    // Check if subscribed to orderbook topic
    expect(mockSubscribe).toHaveBeenCalledWith('orderbook/BTC/ETH');
    
    // Change sell asset
    fireEvent.change(screen.getByLabelText(/Sell Asset/i), { target: { value: 'ETH' } });
    
    // Check if unsubscribed from old topic and subscribed to new one
    expect(mockUnsubscribe).toHaveBeenCalledWith('orderbook/BTC/ETH');
    expect(mockSubscribe).toHaveBeenCalledWith('orderbook/ETH/ETH');
  });
});