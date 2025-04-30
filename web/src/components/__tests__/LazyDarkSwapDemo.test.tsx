/**
 * Unit tests for LazyDarkSwapDemo
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LazyDarkSwapDemo from '../LazyDarkSwapDemo';
import { LazyDarkSwapClient } from '../../utils/LazyDarkSwapClient';
import { AssetType, OrderSide, BitcoinNetwork } from '../../utils/DarkSwapClient';

// Mock the LazyDarkSwapClient
jest.mock('../../utils/LazyDarkSwapClient');

describe('LazyDarkSwapDemo', () => {
  // Mock implementation of LazyDarkSwapClient
  const mockLazyDarkSwapClient = {
    initialize: jest.fn().mockResolvedValue(undefined),
    create: jest.fn().mockResolvedValue(undefined),
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    getAddress: jest.fn().mockResolvedValue('test-address'),
    getBalance: jest.fn().mockResolvedValue(100000),
    getOrders: jest.fn().mockResolvedValue([]),
    getBestBidAsk: jest.fn().mockResolvedValue({ bid: '19000', ask: '21000' }),
    createOrder: jest.fn().mockResolvedValue({ id: 'test-order-id' }),
    cancelOrder: jest.fn().mockResolvedValue(undefined),
    takeOrder: jest.fn().mockResolvedValue({ id: 'test-trade-id' }),
    addEventListener: jest.fn(),
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Mock the LazyDarkSwapClient constructor
    (LazyDarkSwapClient as jest.Mock).mockImplementation(() => mockLazyDarkSwapClient);

    // Mock the performance API
    global.performance = {
      now: jest.fn().mockReturnValue(0),
    } as any;
  });

  it('should render the component', () => {
    render(<LazyDarkSwapDemo />);
    expect(screen.getByText('Lazy-loaded DarkSwap Demo')).toBeInTheDocument();
  });

  it('should initialize the client on mount', async () => {
    render(<LazyDarkSwapDemo />);
    await waitFor(() => {
      expect(mockLazyDarkSwapClient.initialize).toHaveBeenCalled();
    });
  });

  it('should load the client when the Load Client button is clicked', async () => {
    render(<LazyDarkSwapDemo />);
    
    // Wait for the component to initialize
    await waitFor(() => {
      expect(mockLazyDarkSwapClient.initialize).toHaveBeenCalled();
    });
    
    // Click the Load Client button
    fireEvent.click(screen.getByText('Load Client'));
    
    // Wait for the client to be loaded
    await waitFor(() => {
      expect(mockLazyDarkSwapClient.create).toHaveBeenCalled();
      expect(mockLazyDarkSwapClient.start).toHaveBeenCalled();
    });
  });

  it('should get wallet info when the Get Wallet Info button is clicked', async () => {
    render(<LazyDarkSwapDemo />);
    
    // Wait for the component to initialize
    await waitFor(() => {
      expect(mockLazyDarkSwapClient.initialize).toHaveBeenCalled();
    });
    
    // Click the Load Client button
    fireEvent.click(screen.getByText('Load Client'));
    
    // Wait for the client to be loaded
    await waitFor(() => {
      expect(mockLazyDarkSwapClient.create).toHaveBeenCalled();
    });
    
    // Click the Get Wallet Info button
    fireEvent.click(screen.getByText('Get Wallet Info'));
    
    // Wait for the wallet info to be loaded
    await waitFor(() => {
      expect(mockLazyDarkSwapClient.getAddress).toHaveBeenCalled();
      expect(mockLazyDarkSwapClient.getBalance).toHaveBeenCalled();
      expect(screen.getByText('Address: test-address')).toBeInTheDocument();
      expect(screen.getByText('Balance: 100000 satoshis')).toBeInTheDocument();
    });
  });

  it('should get market data when the Get Market Data button is clicked', async () => {
    render(<LazyDarkSwapDemo />);
    
    // Wait for the component to initialize
    await waitFor(() => {
      expect(mockLazyDarkSwapClient.initialize).toHaveBeenCalled();
    });
    
    // Click the Load Client button
    fireEvent.click(screen.getByText('Load Client'));
    
    // Wait for the client to be loaded
    await waitFor(() => {
      expect(mockLazyDarkSwapClient.create).toHaveBeenCalled();
    });
    
    // Click the Get Market Data button
    fireEvent.click(screen.getByText('Get Market Data'));
    
    // Wait for the market data to be loaded
    await waitFor(() => {
      expect(mockLazyDarkSwapClient.getOrders).toHaveBeenCalled();
      expect(mockLazyDarkSwapClient.getBestBidAsk).toHaveBeenCalled();
      expect(screen.getByText('Best bid: 19000')).toBeInTheDocument();
      expect(screen.getByText('Best ask: 21000')).toBeInTheDocument();
    });
  });

  it('should create an order when the order form is submitted', async () => {
    // Mock the getAddress method to return a value immediately
    mockLazyDarkSwapClient.getAddress.mockResolvedValueOnce('test-address');
    
    render(<LazyDarkSwapDemo />);
    
    // Wait for the component to initialize
    await waitFor(() => {
      expect(mockLazyDarkSwapClient.initialize).toHaveBeenCalled();
    });
    
    // Click the Load Client button
    fireEvent.click(screen.getByText('Load Client'));
    
    // Wait for the client to be loaded
    await waitFor(() => {
      expect(mockLazyDarkSwapClient.create).toHaveBeenCalled();
    });
    
    // Click the Get Wallet Info button to get the address
    fireEvent.click(screen.getByText('Get Wallet Info'));
    
    // Wait for the wallet info to be loaded
    await waitFor(() => {
      expect(screen.getByText('Address: test-address')).toBeInTheDocument();
    });
    
    // Fill in the order form
    fireEvent.change(screen.getByLabelText('Side:'), { target: { value: OrderSide.Buy.toString() } });
    fireEvent.change(screen.getByLabelText('Amount:'), { target: { value: '0.01' } });
    fireEvent.change(screen.getByLabelText('Price:'), { target: { value: '20000' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Create Order'));
    
    // Wait for the order to be created
    await waitFor(() => {
      expect(mockLazyDarkSwapClient.createOrder).toHaveBeenCalledWith(
        { type: AssetType.Bitcoin },
        { type: AssetType.Bitcoin },
        OrderSide.Buy,
        '0.01',
        '20000',
        'test-address',
        3600
      );
    });
  });

  it('should display performance metrics', async () => {
    // Mock the performance.now method to return different values
    (global.performance.now as jest.Mock)
      .mockReturnValueOnce(0)    // Start time for initialization
      .mockReturnValueOnce(100)  // End time for initialization
      .mockReturnValueOnce(100)  // Start time for loading
      .mockReturnValueOnce(300)  // End time for loading
      .mockReturnValueOnce(300)  // Start time for wallet info
      .mockReturnValueOnce(400)  // End time for wallet info
      .mockReturnValueOnce(400)  // Start time for market data
      .mockReturnValueOnce(500); // End time for market data
    
    render(<LazyDarkSwapDemo />);
    
    // Wait for the component to initialize
    await waitFor(() => {
      expect(mockLazyDarkSwapClient.initialize).toHaveBeenCalled();
    });
    
    // Check that the initialization time is displayed
    expect(screen.getByText('Initialization time: 100.00 ms')).toBeInTheDocument();
    
    // Click the Load Client button
    fireEvent.click(screen.getByText('Load Client'));
    
    // Wait for the client to be loaded
    await waitFor(() => {
      expect(mockLazyDarkSwapClient.create).toHaveBeenCalled();
    });
    
    // Check that the loading time is displayed
    expect(screen.getByText('Loading time: 200.00 ms')).toBeInTheDocument();
    
    // Click the Get Wallet Info button
    fireEvent.click(screen.getByText('Get Wallet Info'));
    
    // Wait for the wallet info to be loaded
    await waitFor(() => {
      expect(mockLazyDarkSwapClient.getAddress).toHaveBeenCalled();
    });
    
    // Check that the wallet info operation time is displayed
    expect(screen.getByText('getWalletInfo: 100.00 ms')).toBeInTheDocument();
    
    // Click the Get Market Data button
    fireEvent.click(screen.getByText('Get Market Data'));
    
    // Wait for the market data to be loaded
    await waitFor(() => {
      expect(mockLazyDarkSwapClient.getOrders).toHaveBeenCalled();
    });
    
    // Check that the market data operation time is displayed
    expect(screen.getByText('getMarketData: 100.00 ms')).toBeInTheDocument();
  });
});