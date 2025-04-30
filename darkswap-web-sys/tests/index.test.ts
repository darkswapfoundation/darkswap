import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import darkswap from '../src/index';

// Mock the WebAssembly module
vi.mock('../src/wasm/darkswap_sdk', () => {
  return {
    default: vi.fn().mockResolvedValue({
      initialize: vi.fn().mockResolvedValue(undefined),
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(true),
      getPeers: vi.fn().mockResolvedValue('[]'),
      connectToPeer: vi.fn().mockResolvedValue(undefined),
      connectToRelay: vi.fn().mockResolvedValue(undefined),
      createOrder: vi.fn().mockResolvedValue('order-id'),
      cancelOrder: vi.fn().mockResolvedValue(undefined),
      getOrders: vi.fn().mockResolvedValue('[]'),
      getOrdersForPair: vi.fn().mockResolvedValue('[]'),
      takeOrder: vi.fn().mockResolvedValue('trade-id'),
      getTrades: vi.fn().mockResolvedValue('[]'),
      getTrade: vi.fn().mockResolvedValue(null),
      getTradeStatus: vi.fn().mockResolvedValue('{"status":"pending"}'),
      connectWallet: vi.fn().mockResolvedValue(undefined),
      disconnectWallet: vi.fn().mockResolvedValue(undefined),
      isWalletConnected: vi.fn().mockReturnValue(false),
      getWalletInfo: vi.fn().mockResolvedValue(null),
      getBalances: vi.fn().mockResolvedValue('[]'),
      getRuneInfo: vi.fn().mockResolvedValue(null),
      getAlkaneInfo: vi.fn().mockResolvedValue(null),
      createPredicate: vi.fn().mockResolvedValue('predicate-id'),
      getPredicateInfo: vi.fn().mockResolvedValue(null),
      setNetworkEventCallback: vi.fn(),
      setOrderEventCallback: vi.fn(),
      setTradeEventCallback: vi.fn(),
      setWalletEventCallback: vi.fn(),
    }),
  };
});

describe('DarkSwap SDK', () => {
  // Reset the SDK instance before each test
  beforeEach(async () => {
    // @ts-ignore - Access private property for testing
    darkswap._isInitialized = false;
    // @ts-ignore - Access private property for testing
    darkswap.wasmModule = null;
    
    // Clear all event listeners
    // @ts-ignore - Access private property for testing
    darkswap.eventListeners = {};
  });
  
  describe('Initialization', () => {
    it('should initialize the SDK', async () => {
      await darkswap.initialize();
      expect(darkswap.isInitialized()).toBe(true);
    });
    
    it('should initialize with custom configuration', async () => {
      const config = {
        network: {
          bootstrapPeers: ['peer-1', 'peer-2'],
          relays: ['ws://relay.darkswap.io/ws'],
          maxPeers: 20,
          enableDht: false,
          enableMdns: false,
          enableWebRtc: true,
        },
      };
      
      await darkswap.initialize(config);
      expect(darkswap.isInitialized()).toBe(true);
      
      // @ts-ignore - Access private property for testing
      const sdkConfig = darkswap.config;
      expect(sdkConfig.network.bootstrapPeers).toEqual(config.network.bootstrapPeers);
      expect(sdkConfig.network.relays).toEqual(config.network.relays);
      expect(sdkConfig.network.maxPeers).toBe(config.network.maxPeers);
      expect(sdkConfig.network.enableDht).toBe(config.network.enableDht);
      expect(sdkConfig.network.enableMdns).toBe(config.network.enableMdns);
      expect(sdkConfig.network.enableWebRtc).toBe(config.network.enableWebRtc);
    });
    
    it('should not initialize twice', async () => {
      await darkswap.initialize();
      
      // Mock console.warn
      const consoleWarnMock = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      await darkswap.initialize();
      
      expect(consoleWarnMock).toHaveBeenCalledWith('DarkSwap SDK is already initialized');
      consoleWarnMock.mockRestore();
    });
    
    it('should throw an error if initialization fails', async () => {
      // Mock the WebAssembly module to throw an error
      const mockWasmModule = await import('../src/wasm/darkswap_sdk');
      (mockWasmModule.default as Mock).mockResolvedValueOnce({
        initialize: vi.fn().mockRejectedValue(new Error('Initialization failed')),
      });
      
      await expect(darkswap.initialize()).rejects.toThrow('Failed to initialize DarkSwap SDK: Error: Initialization failed');
    });
  });
  
  describe('Network', () => {
    beforeEach(async () => {
      await darkswap.initialize();
    });
    
    it('should connect to the P2P network', async () => {
      await darkswap.connect();
      expect(darkswap.isConnected()).toBe(true);
    });
    
    it('should disconnect from the P2P network', async () => {
      // Mock isConnected to return false after disconnect
      const mockWasmModule = await import('../src/wasm/darkswap_sdk');
      const mockModule = await (mockWasmModule.default as Mock).mock.results[0].value;
      mockModule.isConnected.mockReturnValueOnce(true).mockReturnValueOnce(false);
      
      await darkswap.connect();
      expect(darkswap.isConnected()).toBe(true);
      
      await darkswap.disconnect();
      expect(darkswap.isConnected()).toBe(false);
    });
    
    it('should get peers', async () => {
      // Mock getPeers to return some peers
      const mockWasmModule = await import('../src/wasm/darkswap_sdk');
      const mockModule = await (mockWasmModule.default as Mock).mock.results[0].value;
      mockModule.getPeers.mockResolvedValueOnce(JSON.stringify([
        { id: 'peer-1', address: '/ip4/192.168.1.1/tcp/9000', connected: true },
        { id: 'peer-2', address: '/ip4/192.168.1.2/tcp/9000', connected: true },
      ]));
      
      const peers = await darkswap.getPeers();
      expect(peers).toHaveLength(2);
      expect(peers[0].id).toBe('peer-1');
      expect(peers[1].id).toBe('peer-2');
    });
    
    it('should connect to a peer', async () => {
      await darkswap.connectToPeer('peer-id');
      
      // Verify that connectToPeer was called with the correct argument
      const mockWasmModule = await import('../src/wasm/darkswap_sdk');
      const mockModule = await (mockWasmModule.default as Mock).mock.results[0].value;
      expect(mockModule.connectToPeer).toHaveBeenCalledWith('peer-id');
    });
    
    it('should connect to a relay', async () => {
      await darkswap.connectToRelay('ws://relay.darkswap.io/ws');
      
      // Verify that connectToRelay was called with the correct argument
      const mockWasmModule = await import('../src/wasm/darkswap_sdk');
      const mockModule = await (mockWasmModule.default as Mock).mock.results[0].value;
      expect(mockModule.connectToRelay).toHaveBeenCalledWith('ws://relay.darkswap.io/ws');
    });
    
    it('should throw an error if not initialized', async () => {
      // Reset the SDK instance
      // @ts-ignore - Access private property for testing
      darkswap._isInitialized = false;
      
      await expect(darkswap.connect()).rejects.toThrow('DarkSwap SDK is not initialized. Call initialize() first.');
    });
  });
  
  describe('Orders', () => {
    beforeEach(async () => {
      await darkswap.initialize();
    });
    
    it('should create an order', async () => {
      const order = {
        baseAsset: 'BTC',
        quoteAsset: 'RUNE1',
        side: 'buy',
        type: 'limit',
        price: '0.0001',
        amount: '1.0',
      };
      
      const orderId = await darkswap.createOrder(order);
      expect(orderId).toBe('order-id');
      
      // Verify that createOrder was called with the correct argument
      const mockWasmModule = await import('../src/wasm/darkswap_sdk');
      const mockModule = await (mockWasmModule.default as Mock).mock.results[0].value;
      expect(mockModule.createOrder).toHaveBeenCalledWith(JSON.stringify(order));
    });
    
    it('should cancel an order', async () => {
      await darkswap.cancelOrder('order-id');
      
      // Verify that cancelOrder was called with the correct argument
      const mockWasmModule = await import('../src/wasm/darkswap_sdk');
      const mockModule = await (mockWasmModule.default as Mock).mock.results[0].value;
      expect(mockModule.cancelOrder).toHaveBeenCalledWith('order-id');
    });
    
    it('should get orders', async () => {
      // Mock getOrders to return some orders
      const mockWasmModule = await import('../src/wasm/darkswap_sdk');
      const mockModule = await (mockWasmModule.default as Mock).mock.results[0].value;
      mockModule.getOrders.mockResolvedValueOnce(JSON.stringify([
        {
          order: {
            id: 'order-1',
            baseAsset: 'BTC',
            quoteAsset: 'RUNE1',
            side: 'buy',
            type: 'limit',
            price: '0.0001',
            amount: '1.0',
          },
          peerId: 'peer-1',
          isLocal: true,
          isActive: true,
          remainingAmount: '1.0',
          filledAmount: '0.0',
          updatedAt: 1617235200000,
        },
      ]));
      
      const orders = await darkswap.getOrders();
      expect(orders).toHaveLength(1);
      expect(orders[0].order.id).toBe('order-1');
    });
    
    it('should get orders for a pair', async () => {
      // Mock getOrdersForPair to return some orders
      const mockWasmModule = await import('../src/wasm/darkswap_sdk');
      const mockModule = await (mockWasmModule.default as Mock).mock.results[0].value;
      mockModule.getOrdersForPair.mockResolvedValueOnce(JSON.stringify([
        {
          order: {
            id: 'order-1',
            baseAsset: 'BTC',
            quoteAsset: 'RUNE1',
            side: 'buy',
            type: 'limit',
            price: '0.0001',
            amount: '1.0',
          },
          peerId: 'peer-1',
          isLocal: true,
          isActive: true,
          remainingAmount: '1.0',
          filledAmount: '0.0',
          updatedAt: 1617235200000,
        },
      ]));
      
      const orders = await darkswap.getOrdersForPair('BTC', 'RUNE1');
      expect(orders).toHaveLength(1);
      expect(orders[0].order.baseAsset).toBe('BTC');
      expect(orders[0].order.quoteAsset).toBe('RUNE1');
      
      // Verify that getOrdersForPair was called with the correct arguments
      expect(mockModule.getOrdersForPair).toHaveBeenCalledWith('BTC', 'RUNE1');
    });
  });
  
  describe('Trades', () => {
    beforeEach(async () => {
      await darkswap.initialize();
    });
    
    it('should take an order', async () => {
      const tradeId = await darkswap.takeOrder('order-id', '0.5');
      expect(tradeId).toBe('trade-id');
      
      // Verify that takeOrder was called with the correct arguments
      const mockWasmModule = await import('../src/wasm/darkswap_sdk');
      const mockModule = await (mockWasmModule.default as Mock).mock.results[0].value;
      expect(mockModule.takeOrder).toHaveBeenCalledWith('order-id', '0.5');
    });
    
    it('should get trades', async () => {
      // Mock getTrades to return some trades
      const mockWasmModule = await import('../src/wasm/darkswap_sdk');
      const mockModule = await (mockWasmModule.default as Mock).mock.results[0].value;
      mockModule.getTrades.mockResolvedValueOnce(JSON.stringify([
        {
          id: 'trade-1',
          orderId: 'order-1',
          baseAsset: 'BTC',
          quoteAsset: 'RUNE1',
          side: 'buy',
          price: '0.0001',
          amount: '1.0',
          total: '0.0001',
          makerId: 'peer-1',
          takerId: 'peer-2',
          status: 'completed',
          createdAt: 1617235200000,
          completedAt: 1617235300000,
        },
      ]));
      
      const trades = await darkswap.getTrades();
      expect(trades).toHaveLength(1);
      expect(trades[0].id).toBe('trade-1');
    });
    
    it('should get a trade', async () => {
      // Mock getTrade to return a trade
      const mockWasmModule = await import('../src/wasm/darkswap_sdk');
      const mockModule = await (mockWasmModule.default as Mock).mock.results[0].value;
      mockModule.getTrade.mockResolvedValueOnce(JSON.stringify({
        id: 'trade-1',
        orderId: 'order-1',
        baseAsset: 'BTC',
        quoteAsset: 'RUNE1',
        side: 'buy',
        price: '0.0001',
        amount: '1.0',
        total: '0.0001',
        makerId: 'peer-1',
        takerId: 'peer-2',
        status: 'completed',
        createdAt: 1617235200000,
        completedAt: 1617235300000,
      }));
      
      const trade = await darkswap.getTrade('trade-1');
      expect(trade).not.toBeNull();
      expect(trade?.id).toBe('trade-1');
      
      // Verify that getTrade was called with the correct argument
      expect(mockModule.getTrade).toHaveBeenCalledWith('trade-1');
    });
    
    it('should return null for a non-existent trade', async () => {
      // Mock getTrade to return null
      const mockWasmModule = await import('../src/wasm/darkswap_sdk');
      const mockModule = await (mockWasmModule.default as Mock).mock.results[0].value;
      mockModule.getTrade.mockResolvedValueOnce(null);
      
      const trade = await darkswap.getTrade('non-existent-trade');
      expect(trade).toBeNull();
    });
    
    it('should get trade status', async () => {
      // Mock getTradeStatus to return a status
      const mockWasmModule = await import('../src/wasm/darkswap_sdk');
      const mockModule = await (mockWasmModule.default as Mock).mock.results[0].value;
      mockModule.getTradeStatus.mockResolvedValueOnce(JSON.stringify({
        status: 'completed',
      }));
      
      const status = await darkswap.getTradeStatus('trade-1');
      expect(status).toBe('completed');
      
      // Verify that getTradeStatus was called with the correct argument
      expect(mockModule.getTradeStatus).toHaveBeenCalledWith('trade-1');
    });
  });
  
  describe('Wallet', () => {
    beforeEach(async () => {
      await darkswap.initialize();
    });
    
    it('should connect a wallet', async () => {
      const walletConfig = {
        type: 'wasm',
        network: 'testnet',
        enableRunes: true,
        enableAlkanes: true,
      };
      
      await darkswap.connectWallet(walletConfig);
      
      // Verify that connectWallet was called with the correct argument
      const mockWasmModule = await import('../src/wasm/darkswap_sdk');
      const mockModule = await (mockWasmModule.default as Mock).mock.results[0].value;
      expect(mockModule.connectWallet).toHaveBeenCalledWith(JSON.stringify(walletConfig));
    });
    
    it('should disconnect a wallet', async () => {
      await darkswap.disconnectWallet();
      
      // Verify that disconnectWallet was called
      const mockWasmModule = await import('../src/wasm/darkswap_sdk');
      const mockModule = await (mockWasmModule.default as Mock).mock.results[0].value;
      expect(mockModule.disconnectWallet).toHaveBeenCalled();
    });
    
    it('should check if a wallet is connected', () => {
      // Mock isWalletConnected to return true
      const mockWasmModule = import('../src/wasm/darkswap_sdk');
      const mockModule = vi.fn().mockReturnValue({
        isWalletConnected: vi.fn().mockReturnValue(true),
      });
      
      // @ts-ignore - Set the mock module
      darkswap.wasmModule = {
        isWalletConnected: vi.fn().mockReturnValue(true),
      };
      
      const isConnected = darkswap.isWalletConnected();
      expect(isConnected).toBe(true);
    });
    
    it('should get wallet info', async () => {
      // Mock getWalletInfo to return wallet info
      const mockWasmModule = await import('../src/wasm/darkswap_sdk');
      const mockModule = await (mockWasmModule.default as Mock).mock.results[0].value;
      mockModule.getWalletInfo.mockResolvedValueOnce(JSON.stringify({
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        type: 'wasm',
        network: 'testnet',
        supportsRunes: true,
        supportsAlkanes: true,
      }));
      
      const walletInfo = await darkswap.getWalletInfo();
      expect(walletInfo).not.toBeNull();
      expect(walletInfo?.address).toBe('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
    });
    
    it('should get balances', async () => {
      // Mock getBalances to return balances
      const mockWasmModule = await import('../src/wasm/darkswap_sdk');
      const mockModule = await (mockWasmModule.default as Mock).mock.results[0].value;
      mockModule.getBalances.mockResolvedValueOnce(JSON.stringify([
        {
          asset: 'BTC',
          name: 'Bitcoin',
          type: 'btc',
          amount: '1.0',
          available: '0.9',
          locked: '0.1',
        },
        {
          asset: 'RUNE1',
          name: 'Rune 1',
          type: 'rune',
          amount: '100.0',
          available: '100.0',
          locked: '0.0',
        },
      ]));
      
      const balances = await darkswap.getBalances();
      expect(balances).toHaveLength(2);
      expect(balances[0].asset).toBe('BTC');
      expect(balances[1].asset).toBe('RUNE1');
    });
  });
  
  describe('Runes and Alkanes', () => {
    beforeEach(async () => {
      await darkswap.initialize();
    });
    
    it('should get rune info', async () => {
      // Mock getRuneInfo to return rune info
      const mockWasmModule = await import('../src/wasm/darkswap_sdk');
      const mockModule = await (mockWasmModule.default as Mock).mock.results[0].value;
      mockModule.getRuneInfo.mockResolvedValueOnce(JSON.stringify({
        id: 'rune-1',
        name: 'Rune 1',
        symbol: 'RUNE1',
        decimals: 8,
        supply: '1000000',
        creator: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        createdAt: 1617235200000,
      }));
      
      const runeInfo = await darkswap.getRuneInfo('rune-1');
      expect(runeInfo).not.toBeNull();
      expect(runeInfo?.id).toBe('rune-1');
      
      // Verify that getRuneInfo was called with the correct argument
      expect(mockModule.getRuneInfo).toHaveBeenCalledWith('rune-1');
    });
    
    it('should get alkane info', async () => {
      // Mock getAlkaneInfo to return alkane info
      const mockWasmModule = await import('../src/wasm/darkswap_sdk');
      const mockModule = await (mockWasmModule.default as Mock).mock.results[0].value;
      mockModule.getAlkaneInfo.mockResolvedValueOnce(JSON.stringify({
        id: 'alkane-1',
        name: 'Alkane 1',
        symbol: 'ALK1',
        decimals: 8,
        supply: '1000000',
        creator: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        createdAt: 1617235200000,
        isPredicate: false,
      }));
      
      const alkaneInfo = await darkswap.getAlkaneInfo('alkane-1');
      expect(alkaneInfo).not.toBeNull();
      expect(alkaneInfo?.id).toBe('alkane-1');
      
      // Verify that getAlkaneInfo was called with the correct argument
      expect(mockModule.getAlkaneInfo).toHaveBeenCalledWith('alkane-1');
    });
    
    it('should create a predicate', async () => {
      const predicateInfo = {
        name: 'Price Above 20000',
        type: 'equality',
        description: 'Checks if the price is above 20000',
        parameters: {
          variable: 'price',
          condition: 'greater-than',
          value: '20000',
        },
      };
      
      const predicateId = await darkswap.createPredicate(predicateInfo);
      expect(predicateId).toBe('predicate-id');
      
      // Verify that createPredicate was called with the correct argument
      const mockWasmModule = await import('../src/wasm/darkswap_sdk');
      const mockModule = await (mockWasmModule.default as Mock).mock.results[0].value;
      expect(mockModule.createPredicate).toHaveBeenCalledWith(JSON.stringify(predicateInfo));
    });
    
    it('should get predicate info', async () => {
      // Mock getPredicateInfo to return predicate info
      const mockWasmModule = await import('../src/wasm/darkswap_sdk');
      const mockModule = await (mockWasmModule.default as Mock).mock.results[0].value;
      mockModule.getPredicateInfo.mockResolvedValueOnce(JSON.stringify({
        id: 'predicate-1',
        name: 'Price Above 20000',
        type: 'equality',
        description: 'Checks if the price is above 20000',
        parameters: {
          variable: 'price',
          condition: 'greater-than',
          value: '20000',
        },
        createdAt: 1617235200000,
        creatorId: 'peer-1',
      }));
      
      const predicateInfo = await darkswap.getPredicateInfo('predicate-1');
      expect(predicateInfo).not.toBeNull();
      expect(predicateInfo?.id).toBe('predicate-1');
      
      // Verify that getPredicateInfo was called with the correct argument
      expect(mockModule.getPredicateInfo).toHaveBeenCalledWith('predicate-1');
    });
  });
  
  describe('Events', () => {
    beforeEach(async () => {
      await darkswap.initialize();
    });
    
    it('should subscribe to events', () => {
      const handler = vi.fn();
      darkswap.on('network', handler);
      
      // @ts-ignore - Access private property for testing
      expect(darkswap.eventListeners['network']).toContain(handler);
    });
    
    it('should unsubscribe from events', () => {
      const handler = vi.fn();
      darkswap.on('network', handler);
      darkswap.off('network', handler);
      
      // @ts-ignore - Access private property for testing
      expect(darkswap.eventListeners['network']).not.toContain(handler);
    });
    
    it('should emit events', () => {
      const handler = vi.fn();
      darkswap.on('network', handler);
      
      // @ts-ignore - Access private property for testing
      darkswap.emit('network', { type: 'connected' });
      
      expect(handler).toHaveBeenCalledWith({ type: 'connected' });
    });
    
    it('should set up event listeners during initialization', async () => {
      await darkswap.initialize();
      
      // Verify that event callbacks were set up
      const mockWasmModule = await import('../src/wasm/darkswap_sdk');
      const mockModule = await (mockWasmModule.default as Mock).mock.results[0].value;
      expect(mockModule.setNetworkEventCallback).toHaveBeenCalled();
      expect(mockModule.setOrderEventCallback).toHaveBeenCalled();
      expect(mockModule.setTradeEventCallback).toHaveBeenCalled();
      expect(mockModule.setWalletEventCallback).toHaveBeenCalled();
    });
  });
});