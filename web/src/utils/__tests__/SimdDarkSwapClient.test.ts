/**
 * Unit tests for SimdDarkSwapClient
 */

import { SimdDarkSwapClient } from '../SimdDarkSwapClient';
import { loadWasmModuleWithSimd, isSimdSupported } from '../SimdWasmLoader';
import { AssetType, OrderSide, BitcoinNetwork } from '../DarkSwapClient';
import { ErrorCode, DarkSwapError } from '../ErrorHandling';

// Mock the DarkSwapClient
jest.mock('../DarkSwapClient');

// Mock the SimdWasmLoader
jest.mock('../SimdWasmLoader', () => ({
  loadWasmModuleWithSimd: jest.fn(),
  isSimdSupported: jest.fn().mockResolvedValue(true),
}));

// Mock the darkswap-wasm module
jest.mock('darkswap-wasm');

describe('SimdDarkSwapClient', () => {
  let client: SimdDarkSwapClient;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create a new client
    client = new SimdDarkSwapClient('/simd-path', '/fallback-path');

    // Mock the performance API
    global.performance = {
      now: jest.fn().mockReturnValue(0),
    } as any;

    // Mock the console
    global.console = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;
  });

  describe('initialization', () => {
    it('should initialize the client using SIMD if supported', async () => {
      // Mock the isSimdSupported function
      (isSimdSupported as jest.Mock).mockResolvedValue(true);

      // Mock the loadWasmModuleWithSimd function
      (loadWasmModuleWithSimd as jest.Mock).mockResolvedValue({
        module: {},
        instance: {},
      });

      // Mock the initialize method of the parent class
      const mockInitialize = jest.spyOn(Object.getPrototypeOf(SimdDarkSwapClient.prototype), 'initialize');
      mockInitialize.mockResolvedValue(undefined);

      // Initialize the client
      await client.initialize();

      // Check that the isSimdSupported function was called
      expect(isSimdSupported).toHaveBeenCalled();

      // Check that the loadWasmModuleWithSimd function was called
      expect(loadWasmModuleWithSimd).toHaveBeenCalledWith('/simd-path', '/fallback-path');

      // Check that the parent initialize method was called with the SIMD path
      expect(mockInitialize).toHaveBeenCalledWith('/simd-path');

      // Check that the console.log was called
      expect(console.log).toHaveBeenCalledWith('SIMD support: enabled');
    });

    it('should initialize the client using fallback if SIMD is not supported', async () => {
      // Mock the isSimdSupported function
      (isSimdSupported as jest.Mock).mockResolvedValue(false);

      // Mock the loadWasmModuleWithSimd function
      (loadWasmModuleWithSimd as jest.Mock).mockResolvedValue({
        module: {},
        instance: {},
      });

      // Mock the initialize method of the parent class
      const mockInitialize = jest.spyOn(Object.getPrototypeOf(SimdDarkSwapClient.prototype), 'initialize');
      mockInitialize.mockResolvedValue(undefined);

      // Initialize the client
      await client.initialize();

      // Check that the isSimdSupported function was called
      expect(isSimdSupported).toHaveBeenCalled();

      // Check that the loadWasmModuleWithSimd function was called
      expect(loadWasmModuleWithSimd).toHaveBeenCalledWith('/simd-path', '/fallback-path');

      // Check that the parent initialize method was called with the fallback path
      expect(mockInitialize).toHaveBeenCalledWith('/fallback-path');

      // Check that the console.log was called
      expect(console.log).toHaveBeenCalledWith('SIMD support: disabled');
    });

    it('should fall back to regular initialization if SIMD initialization fails', async () => {
      // Mock the loadWasmModuleWithSimd function to throw an error
      (loadWasmModuleWithSimd as jest.Mock).mockRejectedValue(new Error('SIMD initialization failed'));

      // Mock the initialize method of the parent class
      const mockInitialize = jest.spyOn(Object.getPrototypeOf(SimdDarkSwapClient.prototype), 'initialize');
      mockInitialize.mockResolvedValue(undefined);

      // Initialize the client
      await client.initialize();

      // Check that the loadWasmModuleWithSimd function was called
      expect(loadWasmModuleWithSimd).toHaveBeenCalledWith('/simd-path', '/fallback-path');

      // Check that the parent initialize method was called with the fallback path
      expect(mockInitialize).toHaveBeenCalledWith('/fallback-path');

      // Check that the console.error was called
      expect(console.error).toHaveBeenCalledWith('Failed to initialize SIMD-enabled DarkSwap client:', expect.any(Error));

      // Check that the console.warn was called
      expect(console.warn).toHaveBeenCalledWith('Falling back to regular initialization');
    });
  });

  describe('preload', () => {
    it('should preload the WebAssembly module with SIMD support if available', async () => {
      // Mock the isSimdSupported function
      (isSimdSupported as jest.Mock).mockResolvedValue(true);

      // Mock the loadWasmModuleWithSimd function
      (loadWasmModuleWithSimd as jest.Mock).mockResolvedValue({
        module: {},
        instance: {},
      });

      // Preload the WebAssembly module
      await client.preload();

      // Check that the isSimdSupported function was called
      expect(isSimdSupported).toHaveBeenCalled();

      // Check that the loadWasmModuleWithSimd function was called
      expect(loadWasmModuleWithSimd).toHaveBeenCalledWith('/simd-path', '/fallback-path');

      // Check that the console.log was called
      expect(console.log).toHaveBeenCalledWith('SIMD support: enabled');
      expect(console.log).toHaveBeenCalledWith('WebAssembly module preloaded in 0ms');
    });

    it('should handle errors', async () => {
      // Mock the loadWasmModuleWithSimd function to throw an error
      (loadWasmModuleWithSimd as jest.Mock).mockRejectedValue(new Error('Preload failed'));

      // Preload the WebAssembly module
      await client.preload();

      // Check that the loadWasmModuleWithSimd function was called
      expect(loadWasmModuleWithSimd).toHaveBeenCalledWith('/simd-path', '/fallback-path');

      // Check that the console.error was called
      expect(console.error).toHaveBeenCalledWith('Failed to preload WebAssembly module:', expect.any(Error));
    });
  });

  describe('other methods', () => {
    it('should log performance metrics when creating a DarkSwap instance', async () => {
      // Mock the create method of the parent class
      const mockCreate = jest.spyOn(Object.getPrototypeOf(SimdDarkSwapClient.prototype), 'create');
      mockCreate.mockResolvedValue(undefined);

      // Mock the performance.now method to return different values
      (global.performance.now as jest.Mock)
        .mockReturnValueOnce(0)    // Start time
        .mockReturnValueOnce(100); // End time

      // Create a DarkSwap instance
      await client.create({
        network: BitcoinNetwork.Testnet,
        walletType: 'simple',
      });

      // Check that the parent create method was called
      expect(mockCreate).toHaveBeenCalledWith({
        network: BitcoinNetwork.Testnet,
        walletType: 'simple',
      });

      // Check that the console.log was called
      expect(console.log).toHaveBeenCalledWith('DarkSwap instance created in 100ms');
    });

    it('should log performance metrics when starting DarkSwap', async () => {
      // Mock the start method of the parent class
      const mockStart = jest.spyOn(Object.getPrototypeOf(SimdDarkSwapClient.prototype), 'start');
      mockStart.mockResolvedValue(undefined);

      // Mock the performance.now method to return different values
      (global.performance.now as jest.Mock)
        .mockReturnValueOnce(0)    // Start time
        .mockReturnValueOnce(100); // End time

      // Start DarkSwap
      await client.start();

      // Check that the parent start method was called
      expect(mockStart).toHaveBeenCalled();

      // Check that the console.log was called
      expect(console.log).toHaveBeenCalledWith('DarkSwap started in 100ms');
    });

    it('should log performance metrics when getting wallet address', async () => {
      // Mock the getAddress method of the parent class
      const mockGetAddress = jest.spyOn(Object.getPrototypeOf(SimdDarkSwapClient.prototype), 'getAddress');
      mockGetAddress.mockResolvedValue('test-address');

      // Mock the performance.now method to return different values
      (global.performance.now as jest.Mock)
        .mockReturnValueOnce(0)    // Start time
        .mockReturnValueOnce(100); // End time

      // Get wallet address
      const address = await client.getAddress();

      // Check that the parent getAddress method was called
      expect(mockGetAddress).toHaveBeenCalled();

      // Check that the console.log was called
      expect(console.log).toHaveBeenCalledWith('Got wallet address in 100ms');

      // Check that the address was returned
      expect(address).toBe('test-address');
    });
  });

  describe('isSimdSupported', () => {
    it('should return whether SIMD is supported', async () => {
      // Mock the simdSupported property
      (client as any).simdSupported = true;

      // Check if SIMD is supported
      const result = client.isSimdSupported();

      // Check that the result is true
      expect(result).toBe(true);
    });
  });
});