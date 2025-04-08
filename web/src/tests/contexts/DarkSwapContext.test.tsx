/**
 * DarkSwapContext.test.tsx - Tests for DarkSwapContext
 * 
 * This file contains tests for the DarkSwapContext component.
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { DarkSwapProvider, useDarkSwap } from '../../contexts/DarkSwapContext';
import DarkSwapWasm, { BitcoinNetwork, AssetType, OrderSide } from '../../wasm/DarkSwapWasm';
import { WasmError, ErrorCode } from '../../utils/ErrorHandling';
import { reportError } from '../../utils/ErrorReporting';

// Mock DarkSwapWasm
jest.mock('../../wasm/DarkSwapWasm');
const MockDarkSwapWasm = DarkSwapWasm as jest.MockedClass<typeof DarkSwapWasm>;

// Mock reportError
jest.mock('../../utils/ErrorReporting', () => ({
  reportError: jest.fn(),
}));

// Test component that uses the DarkSwap context
const TestComponent: React.FC = () => {
  const { isInitialized, isInitializing, error, initialize } = useDarkSwap();
  
  return (
    <div>
      <div data-testid="initialized">{isInitialized.toString()}</div>
      <div data-testid="initializing">{isInitializing.toString()}</div>
      <div data-testid="error">{error?.message || 'no error'}</div>
      <button
        data-testid="initialize"
        onClick={() => {
          initialize({
            bitcoinNetwork: BitcoinNetwork.Testnet,
            relayUrl: 'ws://localhost:8080',
            listenAddresses: [],
            bootstrapPeers: [],
          });
        }}
      >
        Initialize
      </button>
    </div>
  );
};

describe('DarkSwapContext', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock DarkSwapWasm implementation
    MockDarkSwapWasm.mockImplementation(() => ({
      isInitialized: false,
      initialize: jest.fn().mockResolvedValue(undefined),
      createOrder: jest.fn().mockResolvedValue('order-id'),
      cancelOrder: jest.fn().mockResolvedValue(undefined),
      getOrder: jest.fn().mockResolvedValue({
        id: 'order-id',
        side: OrderSide.Buy,
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        amount: '1.0',
        price: '50000',
        timestamp: Date.now(),
        status: 0,
        maker: 'maker-id',
      }),
      getOrders: jest.fn().mockResolvedValue([]),
      takeOrder: jest.fn().mockResolvedValue('trade-id'),
      on: jest.fn().mockReturnValue(() => {}),
    } as unknown as DarkSwapWasm));
  });
  
  it('should provide the DarkSwap context', () => {
    // Render the test component
    render(
      <DarkSwapProvider>
        <TestComponent />
      </DarkSwapProvider>
    );
    
    // Check initial state
    expect(screen.getByTestId('initialized').textContent).toBe('false');
    expect(screen.getByTestId('initializing').textContent).toBe('false');
    expect(screen.getByTestId('error').textContent).toBe('no error');
  });
  
  it('should initialize DarkSwap', async () => {
    // Render the test component
    render(
      <DarkSwapProvider>
        <TestComponent />
      </DarkSwapProvider>
    );
    
    // Click the initialize button
    act(() => {
      screen.getByTestId('initialize').click();
    });
    
    // Check initializing state
    expect(screen.getByTestId('initializing').textContent).toBe('true');
    
    // Wait for initialization to complete
    await waitFor(() => {
      expect(screen.getByTestId('initializing').textContent).toBe('false');
    });
    
    // Check that initialize was called
    const mockDarkSwap = MockDarkSwapWasm.mock.instances[0];
    expect(mockDarkSwap.initialize).toHaveBeenCalledWith({
      bitcoinNetwork: BitcoinNetwork.Testnet,
      relayUrl: 'ws://localhost:8080',
      listenAddresses: [],
      bootstrapPeers: [],
    });
  });
  
  it('should handle initialization error', async () => {
    // Mock initialization error
    const error = new WasmError('Initialization failed', ErrorCode.WasmInitFailed);
    MockDarkSwapWasm.mockImplementation(() => ({
      isInitialized: false,
      initialize: jest.fn().mockRejectedValue(error),
    } as unknown as DarkSwapWasm));
    
    // Render the test component
    render(
      <DarkSwapProvider>
        <TestComponent />
      </DarkSwapProvider>
    );
    
    // Click the initialize button
    act(() => {
      screen.getByTestId('initialize').click();
    });
    
    // Check initializing state
    expect(screen.getByTestId('initializing').textContent).toBe('true');
    
    // Wait for initialization to complete
    await waitFor(() => {
      expect(screen.getByTestId('initializing').textContent).toBe('false');
    });
    
    // Check error state
    expect(screen.getByTestId('error').textContent).toBe('Initialization failed');
    
    // Check that reportError was called
    expect(reportError).toHaveBeenCalledWith(error, 'DarkSwapContext.initialize');
  });
  
  it('should throw an error when useDarkSwap is used outside of DarkSwapProvider', () => {
    // Mock console.error to prevent error output
    const consoleError = console.error;
    console.error = jest.fn();
    
    // Expect an error when rendering TestComponent outside of DarkSwapProvider
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useDarkSwap must be used within a DarkSwapProvider');
    
    // Restore console.error
    console.error = consoleError;
  });
});

describe('DarkSwapContext - Order Operations', () => {
  // Test component that uses the DarkSwap context for order operations
  const OrderTestComponent: React.FC = () => {
    const { createOrder, cancelOrder, getOrder, getOrders, takeOrder } = useDarkSwap();
    
    return (
      <div>
        <button
          data-testid="create-order"
          onClick={() => {
            createOrder(
              OrderSide.Buy,
              AssetType.Bitcoin,
              'BTC',
              AssetType.Bitcoin,
              'USD',
              '1.0',
              '50000',
            );
          }}
        >
          Create Order
        </button>
        <button
          data-testid="cancel-order"
          onClick={() => {
            cancelOrder('order-id');
          }}
        >
          Cancel Order
        </button>
        <button
          data-testid="get-order"
          onClick={() => {
            getOrder('order-id');
          }}
        >
          Get Order
        </button>
        <button
          data-testid="get-orders"
          onClick={() => {
            getOrders();
          }}
        >
          Get Orders
        </button>
        <button
          data-testid="take-order"
          onClick={() => {
            takeOrder('order-id', '1.0');
          }}
        >
          Take Order
        </button>
      </div>
    );
  };
  
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock DarkSwapWasm implementation
    MockDarkSwapWasm.mockImplementation(() => ({
      isInitialized: false,
      initialize: jest.fn().mockResolvedValue(undefined),
      createOrder: jest.fn().mockResolvedValue('order-id'),
      cancelOrder: jest.fn().mockResolvedValue(undefined),
      getOrder: jest.fn().mockResolvedValue({
        id: 'order-id',
        side: OrderSide.Buy,
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        amount: '1.0',
        price: '50000',
        timestamp: Date.now(),
        status: 0,
        maker: 'maker-id',
      }),
      getOrders: jest.fn().mockResolvedValue([]),
      takeOrder: jest.fn().mockResolvedValue('trade-id'),
      on: jest.fn().mockReturnValue(() => {}),
    } as unknown as DarkSwapWasm));
  });
  
  it('should create an order', async () => {
    // Render the test component
    render(
      <DarkSwapProvider>
        <OrderTestComponent />
      </DarkSwapProvider>
    );
    
    // Click the create order button
    act(() => {
      screen.getByTestId('create-order').click();
    });
    
    // Wait for the operation to complete
    await waitFor(() => {
      const mockDarkSwap = MockDarkSwapWasm.mock.instances[0];
      expect(mockDarkSwap.createOrder).toHaveBeenCalledWith(
        OrderSide.Buy,
        AssetType.Bitcoin,
        'BTC',
        AssetType.Bitcoin,
        'USD',
        '1.0',
        '50000',
      );
    });
  });
  
  it('should cancel an order', async () => {
    // Render the test component
    render(
      <DarkSwapProvider>
        <OrderTestComponent />
      </DarkSwapProvider>
    );
    
    // Click the cancel order button
    act(() => {
      screen.getByTestId('cancel-order').click();
    });
    
    // Wait for the operation to complete
    await waitFor(() => {
      const mockDarkSwap = MockDarkSwapWasm.mock.instances[0];
      expect(mockDarkSwap.cancelOrder).toHaveBeenCalledWith('order-id');
    });
  });
  
  it('should get an order', async () => {
    // Render the test component
    render(
      <DarkSwapProvider>
        <OrderTestComponent />
      </DarkSwapProvider>
    );
    
    // Click the get order button
    act(() => {
      screen.getByTestId('get-order').click();
    });
    
    // Wait for the operation to complete
    await waitFor(() => {
      const mockDarkSwap = MockDarkSwapWasm.mock.instances[0];
      expect(mockDarkSwap.getOrder).toHaveBeenCalledWith('order-id');
    });
  });
  
  it('should get orders', async () => {
    // Render the test component
    render(
      <DarkSwapProvider>
        <OrderTestComponent />
      </DarkSwapProvider>
    );
    
    // Click the get orders button
    act(() => {
      screen.getByTestId('get-orders').click();
    });
    
    // Wait for the operation to complete
    await waitFor(() => {
      const mockDarkSwap = MockDarkSwapWasm.mock.instances[0];
      expect(mockDarkSwap.getOrders).toHaveBeenCalled();
    });
  });
  
  it('should take an order', async () => {
    // Render the test component
    render(
      <DarkSwapProvider>
        <OrderTestComponent />
      </DarkSwapProvider>
    );
    
    // Click the take order button
    act(() => {
      screen.getByTestId('take-order').click();
    });
    
    // Wait for the operation to complete
    await waitFor(() => {
      const mockDarkSwap = MockDarkSwapWasm.mock.instances[0];
      expect(mockDarkSwap.takeOrder).toHaveBeenCalledWith('order-id', '1.0');
    });
  });
});