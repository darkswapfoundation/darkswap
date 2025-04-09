/**
 * Unit tests for DarkSwapDemo component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DarkSwapDemo from '../DarkSwapDemo';
import { DarkSwapClient } from '../../utils/DarkSwapClient';

// Mock the DarkSwapClient
jest.mock('../../utils/DarkSwapClient');

// Create a mock implementation
const mockInitialize = jest.fn().mockResolvedValue(undefined);
const mockCreate = jest.fn().mockResolvedValue(undefined);
const mockStart = jest.fn().mockResolvedValue(undefined);
const mockStop = jest.fn().mockResolvedValue(undefined);
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
const mockGetAddress = jest.fn().mockResolvedValue('tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx');
const mockGetBalance = jest.fn().mockResolvedValue(100000);
const mockGetOrders = jest.fn().mockResolvedValue([
  {
    id: '123',
    maker: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
    baseAsset: 'Bitcoin',
    quoteAsset: 'Bitcoin',
    side: 0,
    amount: '0.01',
    price: '20000',
    status: 0,
    timestamp: Date.now(),
    expiry: Date.now() + 3600000,
  },
]);
const mockGetBestBidAsk = jest.fn().mockResolvedValue({
  bid: '19000',
  ask: '21000',
});
const mockCreateOrder = jest.fn().mockResolvedValue({
  id: '456',
  maker: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
  baseAsset: 'Bitcoin',
  quoteAsset: 'Bitcoin',
  side: 0,
  amount: '0.01',
  price: '20000',
  status: 0,
  timestamp: Date.now(),
  expiry: Date.now() + 3600000,
});
const mockCancelOrder = jest.fn().mockResolvedValue(undefined);
const mockTakeOrder = jest.fn().mockResolvedValue({
  id: '789',
});

// Set up the mock implementation
(DarkSwapClient as jest.Mock).mockImplementation(() => ({
  initialize: mockInitialize,
  create: mockCreate,
  start: mockStart,
  stop: mockStop,
  addEventListener: mockAddEventListener,
  removeEventListener: mockRemoveEventListener,
  getAddress: mockGetAddress,
  getBalance: mockGetBalance,
  getOrders: mockGetOrders,
  getBestBidAsk: mockGetBestBidAsk,
  createOrder: mockCreateOrder,
  cancelOrder: mockCancelOrder,
  takeOrder: mockTakeOrder,
}));

describe('DarkSwapDemo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    render(<DarkSwapDemo />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should initialize the DarkSwap client', async () => {
    render(<DarkSwapDemo />);
    
    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(mockStart).toHaveBeenCalled();
    });
  });

  it('should display wallet information', async () => {
    render(<DarkSwapDemo />);
    
    await waitFor(() => {
      expect(screen.getByText(/Address: tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx/)).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Balance: 100000 satoshis/)).toBeInTheDocument();
    });
  });

  it('should display market information', async () => {
    render(<DarkSwapDemo />);
    
    await waitFor(() => {
      expect(screen.getByText(/Best bid: 19000/)).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Best ask: 21000/)).toBeInTheDocument();
    });
  });

  it('should display orders', async () => {
    render(<DarkSwapDemo />);
    
    await waitFor(() => {
      expect(screen.getByText(/123/)).toBeInTheDocument();
    });
  });

  it('should stop the DarkSwap client when unmounted', async () => {
    const { unmount } = render(<DarkSwapDemo />);
    
    await waitFor(() => {
      expect(mockStart).toHaveBeenCalled();
    });
    
    unmount();
    
    expect(mockStop).toHaveBeenCalled();
  });
});