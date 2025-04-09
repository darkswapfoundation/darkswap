/**
 * Unit tests for LazyDarkSwapClient
 */

import { LazyDarkSwapClient } from '../LazyDarkSwapClient';
import { loadWasmModule, clearWasmModuleCache } from '../WasmLoader';
import { AssetType, OrderSide, BitcoinNetwork } from '../DarkSwapClient';
import { ErrorCode, DarkSwapError } from '../ErrorHandling';

// Mock the DarkSwapClient
jest.mock('../DarkSwapClient');

// Mock the WasmLoader
jest.mock('../WasmLoader', () => ({
  loadWasmModule: jest.fn(),
  clearWasmModuleCache: jest.fn(),
  getWasmModuleCacheSize: jest.fn(),
  isWasmModuleCached: jest.fn(),
  preloadWasmModule: jest.fn(),
}));

// Mock the darkswap-wasm module
jest.mock('darkswap-wasm');

describe('LazyDarkSwapClient', () => {
  let client: LazyDarkSwapClient;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create a new client
    client = new LazyDarkSwapClient('/test-path', 'test-import');
  });

  describe('initialization', () => {
    it('should initialize the client without loading the WebAssembly module', async () => {
      // Initialize the client
      await client.initialize();

      // Check that the loadWasmModule function was not called
      expect(loadWasmModule).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should load the WebAssembly module when creating a DarkSwap instance', async () => {
      // Mock the loadWasmModule function
      (loadWasmModule as jest.Mock).mockResolvedValue({});

      // Mock the initialize method of the parent class
      const mockInitialize = jest.spyOn(Object.getPrototypeOf(LazyDarkSwapClient.prototype), 'initialize');
      mockInitialize.mockResolvedValue(undefined);

      // Mock the create method of the parent class
      const mockCreate = jest.spyOn(Object.getPrototypeOf(LazyDarkSwapClient.prototype), 'create');
      mockCreate.mockResolvedValue(undefined);

      // Initialize the client
      await client.initialize();

      // Create a DarkSwap instance
      await client.create({
        network: BitcoinNetwork.Testnet,
        walletType: 'simple',
        enableWebRTC: true,
        iceServers: [
          'stun:stun.l.google.com:19302',
        ],
      });

      // Check that the loadWasmModule function was called
      expect(loadWasmModule).toHaveBeenCalledWith('/test-path', 'test-import');

      // Check that the parent initialize method was called
      expect(mockInitialize).toHaveBeenCalledWith('/test-path');

      // Check that the parent create method was called
      expect(mockCreate).toHaveBeenCalledWith({
        network: BitcoinNetwork.Testnet,
        walletType: 'simple',
        enableWebRTC: true,
        iceServers: [
          'stun:stun.l.google.com:19302',
        ],
      });
    });

    it('should throw an error if the client is not initialized', async () => {
      // Try to create a DarkSwap instance without initializing the client
      await expect(client.create({
        network: BitcoinNetwork.Testnet,
        walletType: 'simple',
        enableWebRTC: true,
        iceServers: [
          'stun:stun.l.google.com:19302',
        ],
      })).rejects.toThrow(DarkSwapError);
    });
  });

  describe('other methods', () => {
    beforeEach(async () => {
      // Mock the loadWasmModule function
      (loadWasmModule as jest.Mock).mockResolvedValue({});

      // Mock the initialize method of the parent class
      const mockInitialize = jest.spyOn(Object.getPrototypeOf(LazyDarkSwapClient.prototype), 'initialize');
      mockInitialize.mockResolvedValue(undefined);

      // Initialize the client
      await client.initialize();
    });

    it('should load the WebAssembly module when calling getAddress', async () => {
      // Mock the getAddress method of the parent class
      const mockGetAddress = jest.spyOn(Object.getPrototypeOf(LazyDarkSwapClient.prototype), 'getAddress');
      mockGetAddress.mockResolvedValue('test-address');

      // Call getAddress
      const address = await client.getAddress();

      // Check that the loadWasmModule function was called
      expect(loadWasmModule).toHaveBeenCalledWith('/test-path', 'test-import');

      // Check that the parent getAddress method was called
      expect(mockGetAddress).toHaveBeenCalled();

      // Check that the address was returned
      expect(address).toBe('test-address');
    });

    it('should load the WebAssembly module when calling getBalance', async () => {
      // Mock the getBalance method of the parent class
      const mockGetBalance = jest.spyOn(Object.getPrototypeOf(LazyDarkSwapClient.prototype), 'getBalance');
      mockGetBalance.mockResolvedValue(100000);

      // Call getBalance
      const balance = await client.getBalance();

      // Check that the loadWasmModule function was called
      expect(loadWasmModule).toHaveBeenCalledWith('/test-path', 'test-import');

      // Check that the parent getBalance method was called
      expect(mockGetBalance).toHaveBeenCalled();

      // Check that the balance was returned
      expect(balance).toBe(100000);
    });

    it('should load the WebAssembly module when calling createOrder', async () => {
      // Mock the createOrder method of the parent class
      const mockCreateOrder = jest.spyOn(Object.getPrototypeOf(LazyDarkSwapClient.prototype), 'createOrder');
      mockCreateOrder.mockResolvedValue({
        id: 'test-order-id',
      });

      // Call createOrder
      const order = await client.createOrder(
        { type: AssetType.Bitcoin },
        { type: AssetType.Bitcoin },
        OrderSide.Buy,
        '0.01',
        '20000',
        'test-address',
        3600
      );

      // Check that the loadWasmModule function was called
      expect(loadWasmModule).toHaveBeenCalledWith('/test-path', 'test-import');

      // Check that the parent createOrder method was called
      expect(mockCreateOrder).toHaveBeenCalledWith(
        { type: AssetType.Bitcoin },
        { type: AssetType.Bitcoin },
        OrderSide.Buy,
        '0.01',
        '20000',
        'test-address',
        3600
      );

      // Check that the order was returned
      expect(order).toEqual({
        id: 'test-order-id',
      });
    });

    it('should only load the WebAssembly module once', async () => {
      // Mock the getAddress method of the parent class
      const mockGetAddress = jest.spyOn(Object.getPrototypeOf(LazyDarkSwapClient.prototype), 'getAddress');
      mockGetAddress.mockResolvedValue('test-address');

      // Call getAddress multiple times
      await client.getAddress();
      await client.getAddress();
      await client.getAddress();

      // Check that the loadWasmModule function was only called once
      expect(loadWasmModule).toHaveBeenCalledTimes(1);
    });
  });
});