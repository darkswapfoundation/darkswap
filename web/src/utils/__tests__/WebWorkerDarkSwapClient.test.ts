/**
 * Unit tests for WebWorkerDarkSwapClient
 */

import { WebWorkerDarkSwapClient } from '../WebWorkerDarkSwapClient';
import { loadWasmModuleInWorker, isWebWorkerSupported } from '../WebWorkerWasmLoader';
import { AssetType, OrderSide, BitcoinNetwork } from '../DarkSwapClient';
import { ErrorCode, DarkSwapError } from '../ErrorHandling';

// Mock the DarkSwapClient
jest.mock('../DarkSwapClient');

// Mock the WebWorkerWasmLoader
jest.mock('../WebWorkerWasmLoader', () => ({
  loadWasmModuleInWorker: jest.fn(),
  isWebWorkerSupported: jest.fn().mockReturnValue(true),
}));

// Mock the darkswap-wasm module
jest.mock('darkswap-wasm');

describe('WebWorkerDarkSwapClient', () => {
  let client: WebWorkerDarkSwapClient;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create a new client
    client = new WebWorkerDarkSwapClient('/test-path');

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
    it('should initialize the client using Web Workers', async () => {
      // Mock the loadWasmModuleInWorker function
      (loadWasmModuleInWorker as jest.Mock).mockResolvedValue({
        module: {},
        instance: {},
      });

      // Mock the initialize method of the parent class
      const mockInitialize = jest.spyOn(Object.getPrototypeOf(WebWorkerDarkSwapClient.prototype), 'initialize');
      mockInitialize.mockResolvedValue(undefined);

      // Initialize the client
      await client.initialize();

      // Check that the loadWasmModuleInWorker function was called
      expect(loadWasmModuleInWorker).toHaveBeenCalledWith('/test-path');

      // Check that the parent initialize method was called
      expect(mockInitialize).toHaveBeenCalledWith('/test-path');
    });

    it('should fall back to regular initialization if Web Workers are not supported', async () => {
      // Mock isWebWorkerSupported to return false
      (isWebWorkerSupported as jest.Mock).mockReturnValue(false);

      // Mock the initialize method of the parent class
      const mockInitialize = jest.spyOn(Object.getPrototypeOf(WebWorkerDarkSwapClient.prototype), 'initialize');
      mockInitialize.mockResolvedValue(undefined);

      // Initialize the client
      await client.initialize();

      // Check that the loadWasmModuleInWorker function was not called
      expect(loadWasmModuleInWorker).not.toHaveBeenCalled();

      // Check that the parent initialize method was called
      expect(mockInitialize).toHaveBeenCalledWith('/test-path');

      // Check that the console.warn was called
      expect(console.warn).toHaveBeenCalledWith('Web Workers are not supported, falling back to regular initialization');
    });

    it('should fall back to regular initialization if Web Worker initialization fails', async () => {
      // Mock the loadWasmModuleInWorker function to throw an error
      (loadWasmModuleInWorker as jest.Mock).mockRejectedValue(new Error('Web Worker initialization failed'));

      // Mock the initialize method of the parent class
      const mockInitialize = jest.spyOn(Object.getPrototypeOf(WebWorkerDarkSwapClient.prototype), 'initialize');
      mockInitialize.mockResolvedValue(undefined);

      // Initialize the client
      await client.initialize();

      // Check that the loadWasmModuleInWorker function was called
      expect(loadWasmModuleInWorker).toHaveBeenCalledWith('/test-path');

      // Check that the parent initialize method was called
      expect(mockInitialize).toHaveBeenCalledWith('/test-path');

      // Check that the console.error was called
      expect(console.error).toHaveBeenCalledWith('Failed to initialize Web Worker DarkSwap client:', expect.any(Error));

      // Check that the console.warn was called
      expect(console.warn).toHaveBeenCalledWith('Falling back to regular initialization');
    });
  });

  describe('other methods', () => {
    it('should log performance metrics when creating a DarkSwap instance', async () => {
      // Mock the create method of the parent class
      const mockCreate = jest.spyOn(Object.getPrototypeOf(WebWorkerDarkSwapClient.prototype), 'create');
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
      const mockStart = jest.spyOn(Object.getPrototypeOf(WebWorkerDarkSwapClient.prototype), 'start');
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
      const mockGetAddress = jest.spyOn(Object.getPrototypeOf(WebWorkerDarkSwapClient.prototype), 'getAddress');
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