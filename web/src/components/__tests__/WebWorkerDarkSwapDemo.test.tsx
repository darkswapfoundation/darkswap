/**
 * Unit tests for WebWorkerDarkSwapDemo
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import WebWorkerDarkSwapDemo from '../WebWorkerDarkSwapDemo';
import { WebWorkerDarkSwapClient } from '../../utils/WebWorkerDarkSwapClient';
import { isWebWorkerSupported } from '../../utils/WebWorkerWasmLoader';
import { AssetType, OrderSide, BitcoinNetwork } from '../../utils/DarkSwapClient';

// Mock the WebWorkerDarkSwapClient
jest.mock('../../utils/WebWorkerDarkSwapClient');

// Mock the WebWorkerWasmLoader
jest.mock('../../utils/WebWorkerWasmLoader', () => ({
  isWebWorkerSupported: jest.fn().mockReturnValue(true),
}));

describe('WebWorkerDarkSwapDemo', () => {
  // Mock implementation of WebWorkerDarkSwapClient
  const mockWebWorkerDarkSwapClient = {
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

    // Mock the WebWorkerDarkSwapClient constructor
    (WebWorkerDarkSwapClient as jest.Mock).mockImplementation(() => mockWebWorkerDarkSwapClient);

    // Mock the performance API
    global.performance = {
      now: jest.fn().mockReturnValue(0),
    } as any;
  });

  it('should render the component', () => {
    render(<WebWorkerDarkSwapDemo />);
    expect(screen.getByText('Web Worker DarkSwap Demo')).toBeInTheDocument();
  });

  it('should initialize the client on mount', async () => {
    render(<WebWorkerDarkSwapDemo />);
    await waitFor(() => {
      expect(mockWebWorkerDarkSwapClient.initialize).toHaveBeenCalled();
    });
  });

  it('should display Web Worker support status', async () => {
    render(<WebWorkerDarkSwapDemo />);
    
    // Wait for the component to initialize
    await waitFor(() => {
      expect(mockWebWorkerDarkSwapClient.initialize).toHaveBeenCalled();
    });
    
    // Check that the Web Worker support status is displayed
    expect(screen.getByText(/Web Workers are supported in your browser./)).toBeInTheDocument();
  });

  it('should display Web Worker not supported status', async () => {
    // Mock isWebWorkerSupported to return false
    (isWebWorkerSupported as jest.Mock).mockReturnValue(false);
    
    render(<WebWorkerDarkSwapDemo />);
    
    // Wait for the component to initialize
    await waitFor(() => {
      expect(mockWebWorkerDarkSwapClient.initialize).toHaveBeenCalled();
    });
    
    // Check that the Web Worker not supported status is displayed
    expect(screen.getByText(/Web Workers are not supported in your browser./)).toBeInTheDocument();
    expect(screen.getByText(/Falling back to regular initialization./)).toBeInTheDocument();
  });

  it('should create a DarkSwap instance when the Create Instance button is clicked', async () => {
    render(<WebWorkerDarkSwapDemo />);
    
    // Wait for the component to initialize
    await waitFor(() => {
      expect(mockWebWorkerDarkSwapClient.initialize).toHaveBeenCalled();
    });
    
    // Click the Create Instance button
    fireEvent.click(screen.getByText('Create Instance'));
    
    // Wait for the client to be created
    await waitFor(() => {
      expect(mockWebWorkerDarkSwapClient.create).toHaveBeenCalled();
    });
  });

  it('should start DarkSwap when the Start DarkSwap button is clicked', async () => {
    render(<WebWorkerDarkSwapDemo />);
    
    // Wait for the component to initialize
    await waitFor(() => {
      expect(mockWebWorkerDarkSwapClient.initialize).toHaveBeenCalled();
    });
    
    // Click the Create Instance button
    fireEvent.click(screen.getByText('Create Instance'));
    
    // Wait for the client to be created
    await waitFor(() => {
      expect(mockWebWorkerDarkSwapClient.create).toHaveBeenCalled();
    });
    
    // Click the Start DarkSwap button
    fireEvent.click(screen.getByText('Start DarkSwap'));
    
    // Wait for DarkSwap to start
    await waitFor(() => {
      expect(mockWebWorkerDarkSwapClient.start).toHaveBeenCalled();
    });
  });

  it('should get wallet info when the Get Wallet Info button is clicked', async () => {
    render(<WebWorkerDarkSwapDemo />);
    
    // Wait for the component to initialize
    await waitFor(() => {
      expect(mockWebWorkerDarkSwapClient.initialize).toHaveBeenCalled();
    });
    
    // Click the Get Wallet Info button
    fireEvent.click(screen.getByText('Get Wallet Info'));
    
    // Wait for the wallet info to be loaded
    await waitFor(() => {
      expect(mockWebWorkerDarkSwapClient.getAddress).toHaveBeenCalled();
      expect(mockWebWorkerDarkSwapClient.getBalance).toHaveBeenCalled();
      expect(screen.getByText('Address: test-address')).toBeInTheDocument();
      expect(screen.getByText('Balance: 100000 satoshis')).toBeInTheDocument();
    });
  });

  it('should get market data when the Get Market Data button is clicked', async () => {
    render(<WebWorkerDarkSwapDemo />);
    
    // Wait for the component to initialize
    await waitFor(() => {
      expect(mockWebWorkerDarkSwapClient.initialize).toHaveBeenCalled();
    });
    
    // Click the Get Market Data button
    fireEvent.click(screen.getByText('Get Market Data'));
    
    // Wait for the market data to be loaded
    await waitFor(() => {
      expect(mockWebWorkerDarkSwapClient.getOrders).toHaveBeenCalled();
      expect(mockWebWorkerDarkSwapClient.getBestBidAsk).toHaveBeenCalled();
      expect(screen.getByText('Best bid: 19000')).toBeInTheDocument();
      expect(screen.getByText('Best ask: 21000')).toBeInTheDocument();
    });
  });

  it('should display performance metrics', async () => {
    // Mock the performance.now method to return different values
    (global.performance.now as jest.Mock)
      .mockReturnValueOnce(0)    // Start time for initialization
      .mockReturnValueOnce(100)  // End time for initialization
      .mockReturnValueOnce(100)  // Start time for creating instance
      .mockReturnValueOnce(200)  // End time for creating instance
      .mockReturnValueOnce(200)  // Start time for starting DarkSwap
      .mockReturnValueOnce(300)  // End time for starting DarkSwap
      .mockReturnValueOnce(300)  // Start time for getting wallet info
      .mockReturnValueOnce(400)  // End time for getting wallet info
      .mockReturnValueOnce(400)  // Start time for getting market data
      .mockReturnValueOnce(500); // End time for getting market data
    
    render(<WebWorkerDarkSwapDemo />);
    
    // Wait for the component to initialize
    await waitFor(() => {
      expect(mockWebWorkerDarkSwapClient.initialize).toHaveBeenCalled();
    });
    
    // Check that the initialization time is displayed
    expect(screen.getByText('Initialization time: 100.00 ms')).toBeInTheDocument();
    
    // Click the Create Instance button
    fireEvent.click(screen.getByText('Create Instance'));
    
    // Wait for the client to be created
    await waitFor(() => {
      expect(mockWebWorkerDarkSwapClient.create).toHaveBeenCalled();
    });
    
    // Check that the create instance time is displayed
    expect(screen.getByText('Create instance time: 100.00 ms')).toBeInTheDocument();
    
    // Click the Start DarkSwap button
    fireEvent.click(screen.getByText('Start DarkSwap'));
    
    // Wait for DarkSwap to start
    await waitFor(() => {
      expect(mockWebWorkerDarkSwapClient.start).toHaveBeenCalled();
    });
    
    // Check that the start time is displayed
    expect(screen.getByText('Start time: 100.00 ms')).toBeInTheDocument();
    
    // Click the Get Wallet Info button
    fireEvent.click(screen.getByText('Get Wallet Info'));
    
    // Wait for the wallet info to be loaded
    await waitFor(() => {
      expect(mockWebWorkerDarkSwapClient.getAddress).toHaveBeenCalled();
    });
    
    // Check that the wallet info operation time is displayed
    expect(screen.getByText('getWalletInfo: 100.00 ms')).toBeInTheDocument();
    
    // Click the Get Market Data button
    fireEvent.click(screen.getByText('Get Market Data'));
    
    // Wait for the market data to be loaded
    await waitFor(() => {
      expect(mockWebWorkerDarkSwapClient.getOrders).toHaveBeenCalled();
    });
    
    // Check that the market data operation time is displayed
    expect(screen.getByText('getMarketData: 100.00 ms')).toBeInTheDocument();
  });
});