/**
 * Unit tests for StreamingDarkSwapClient
 */

import { StreamingDarkSwapClient } from '../StreamingDarkSwapClient';
import { loadWasmModuleStreaming, instantiateWasmModuleStreaming } from '../StreamingWasmLoader';
import { AssetType, OrderSide, BitcoinNetwork } from '../DarkSwapClient';
import { ErrorCode, DarkSwapError } from '../ErrorHandling';

// Mock the DarkSwapClient
jest.mock('../DarkSwapClient');

// Mock the StreamingWasmLoader
jest.mock('../StreamingWasmLoader', () => ({
  loadWasmModuleStreaming: jest.fn(),
  instantiateWasmModuleStreaming: jest.fn(),
  isStreamingCompilationSupported: jest.fn().mockReturnValue(true),
  isStreamingInstantiationSupported: jest.fn().mockReturnValue(true),
}));

// Mock the darkswap-wasm module
jest.mock('darkswap-wasm');

describe('StreamingDarkSwapClient', () => {
  let client: StreamingDarkSwapClient;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create a new client
    client = new StreamingDarkSwapClient('/test-path');

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

    // Mock WebAssembly.compileStreaming
    global.WebAssembly = {
      ...global.WebAssembly,
      compileStreaming: jest.fn(),
      instantiateStreaming: jest.fn(),
    };
  });

  describe('initialization', () => {
    it('should initialize the client using streaming compilation', async () => {
      // Mock the instantiateWasmModuleStreaming function
      (instantiateWasmModuleStreaming as jest.Mock).mockResolvedValue({});

      // Mock the initialize method of the parent class
      const mockInitialize = jest.spyOn(Object.getPrototypeOf(StreamingDarkSwapClient.prototype), 'initialize');
      mockInitialize.mockResolvedValue(undefined);

      // Initialize the client
      await client.initialize();

      // Check that the instantiateWasmModuleStreaming function was called
      expect(instantiateWasmModuleStreaming).toHaveBeenCalledWith('/test-path');

      // Check that the parent initialize method was called
      expect(mockInitialize).toHaveBeenCalledWith('/test-path');
    });

    it('should fall back to regular initialization if streaming compilation is not supported', async () => {
      // Mock WebAssembly.compileStreaming to be undefined
      global.WebAssembly.compileStreaming = undefined as any;

      // Mock the initialize method of the parent class
      const mockInitialize = jest.spyOn(Object.getPrototypeOf(StreamingDarkSwapClient.prototype), 'initialize');
      mockInitialize.mockResolvedValue(undefined);

      // Initialize the client
      await client.initialize();

      // Check that the instantiateWasmModuleStreaming function was not called
      expect(instantiateWasmModuleStreaming).not.toHaveBeenCalled();

      // Check that the parent initialize method was called
      expect(mockInitialize).toHaveBeenCalledWith('/test-path');

      // Check that the console.warn was called
      expect(console.warn).toHaveBeenCalledWith('Streaming compilation is not supported, falling back to regular initialization');
    });

    it('should fall back to regular initialization if streaming compilation fails', async () => {
      // Mock the instantiateWasmModuleStreaming function to throw an error
      (instantiateWasmModuleStreaming as jest.Mock).mockRejectedValue(new Error('Streaming compilation failed'));

      // Mock the initialize method of the parent class
      const mockInitialize = jest.spyOn(Object.getPrototypeOf(StreamingDarkSwapClient.prototype), 'initialize');
      mockInitialize.mockResolvedValue(undefined);

      // Initialize the client
      await client.initialize();

      // Check that the instantiateWasmModuleStreaming function was called
      expect(instantiateWasmModuleStreaming).toHaveBeenCalledWith('/test-path');

      // Check that the parent initialize method was called
      expect(mockInitialize).toHaveBeenCalledWith('/test-path');

      // Check that the console.error was called
      expect(console.error).toHaveBeenCalledWith('Failed to initialize streaming DarkSwap client:', expect.any(Error));

      // Check that the console.warn was called
      expect(console.warn).toHaveBeenCalledWith('Falling back to regular initialization');
    });
  });

  describe('preload', () => {
    it('should preload the WebAssembly module', async () => {
      // Mock the loadWasmModuleStreaming function
      (loadWasmModuleStreaming as jest.Mock).mockResolvedValue({});

      // Preload the WebAssembly module
      await client.preload();

      // Check that the loadWasmModuleStreaming function was called
      expect(loadWasmModuleStreaming).toHaveBeenCalledWith('/test-path');
    });

    it('should handle errors', async () => {
      // Mock the loadWasmModuleStreaming function to throw an error
      (loadWasmModuleStreaming as jest.Mock).mockRejectedValue(new Error('Preload failed'));

      // Preload the WebAssembly module
      await client.preload();

      // Check that the loadWasmModuleStreaming function was called
      expect(loadWasmModuleStreaming).toHaveBeenCalledWith('/test-path');

      // Check that the console.error was called
      expect(console.error).toHaveBeenCalledWith('Failed to preload WebAssembly module:', expect.any(Error));
    });

    it('should not preload if streaming compilation is not supported', async () => {
      // Mock WebAssembly.compileStreaming to be undefined
      global.WebAssembly.compileStreaming = undefined as any;

      // Preload the WebAssembly module
      await client.preload();

      // Check that the loadWasmModuleStreaming function was not called
      expect(loadWasmModuleStreaming).not.toHaveBeenCalled();

      // Check that the console.warn was called
      expect(console.warn).toHaveBeenCalledWith('Streaming compilation is not supported, preloading is not available');
    });
  });

  describe('other methods', () => {
    it('should log performance metrics when creating a DarkSwap instance', async () => {
      // Mock the create method of the parent class
      const mockCreate = jest.spyOn(Object.getPrototypeOf(StreamingDarkSwapClient.prototype), 'create');
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
      const mockStart = jest.spyOn(Object.getPrototypeOf(StreamingDarkSwapClient.prototype), 'start');
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
      const mockGetAddress = jest.spyOn(Object.getPrototypeOf(StreamingDarkSwapClient.prototype), 'getAddress');
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
});