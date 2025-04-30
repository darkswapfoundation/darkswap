import DarkSwapService from '../services/DarkSwapService';
import ApiClient from '../utils/ApiClient';
import WebSocketClient from '../utils/WebSocketClient';
import { AssetType } from '../hooks/useDarkSwap';

// Mock ApiClient
jest.mock('../utils/ApiClient');
const MockApiClient = ApiClient as jest.MockedClass<typeof ApiClient>;

// Mock WebSocketClient
jest.mock('../utils/WebSocketClient');
const MockWebSocketClient = WebSocketClient as jest.MockedClass<typeof WebSocketClient>;

describe('DarkSwapService', () => {
  let darkswapService: DarkSwapService;
  let mockApiClient: jest.Mocked<ApiClient>;
  let mockWebSocketClient: jest.Mocked<WebSocketClient>;
  
  const options = {
    apiUrl: 'http://localhost:8000/api',
    wsUrl: 'ws://localhost:8000/ws',
    apiTimeout: 5000,
    wsReconnectInterval: 2000,
    wsMaxReconnectAttempts: 5,
  };
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Set up mock ApiClient
    mockApiClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      setAuthToken: jest.fn(),
      clearAuthToken: jest.fn(),
    } as unknown as jest.Mocked<ApiClient>;
    
    MockApiClient.mockImplementation(() => mockApiClient);
    
    // Set up mock WebSocketClient
    mockWebSocketClient = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
      isWebSocketConnected: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    } as unknown as jest.Mocked<WebSocketClient>;
    
    MockWebSocketClient.mockImplementation(() => mockWebSocketClient);
    
    // Create DarkSwapService instance
    darkswapService = new DarkSwapService(options);
  });
  
  describe('constructor', () => {
    it('should create ApiClient with correct options', () => {
      expect(MockApiClient).toHaveBeenCalledWith({
        baseUrl: options.apiUrl,
        timeout: options.apiTimeout,
      });
    });
    
    it('should create WebSocketClient with correct options', () => {
      expect(MockWebSocketClient).toHaveBeenCalledWith(
        options.wsUrl,
        options.wsReconnectInterval,
        options.wsMaxReconnectAttempts
      );
    });
    
    it('should set up WebSocket event handlers', () => {
      expect(mockWebSocketClient.on).toHaveBeenCalledWith('connected', expect.any(Function));
      expect(mockWebSocketClient.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
      expect(mockWebSocketClient.on).toHaveBeenCalledWith('reconnecting', expect.any(Function));
      expect(mockWebSocketClient.on).toHaveBeenCalledWith('reconnect_failed', expect.any(Function));
      expect(mockWebSocketClient.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockWebSocketClient.on).toHaveBeenCalledWith('message', expect.any(Function));
    });
  });
  
  describe('connect', () => {
    it('should call WebSocketClient.connect', async () => {
      await darkswapService.connect();
      expect(mockWebSocketClient.connect).toHaveBeenCalled();
    });
  });
  
  describe('disconnect', () => {
    it('should call WebSocketClient.disconnect', async () => {
      await darkswapService.disconnect();
      expect(mockWebSocketClient.disconnect).toHaveBeenCalled();
    });
  });
  
  describe('isConnected', () => {
    it('should call WebSocketClient.isWebSocketConnected', () => {
      mockWebSocketClient.isWebSocketConnected.mockReturnValue(true);
      const result = darkswapService.isConnected();
      expect(mockWebSocketClient.isWebSocketConnected).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });
  
  describe('getPeerId', () => {
    it('should call ApiClient.get with correct endpoint', async () => {
      const mockResponse = {
        success: true,
        data: { peerId: 'test-peer-id' },
      };
      
      mockApiClient.get.mockResolvedValue(mockResponse);
      
      const result = await darkswapService.getPeerId();
      
      expect(mockApiClient.get).toHaveBeenCalledWith('/peer/id');
      expect(result).toBe('test-peer-id');
    });
    
    it('should throw error on API failure', async () => {
      const mockResponse = {
        success: false,
        error: 'API error',
      };
      
      mockApiClient.get.mockResolvedValue(mockResponse);
      
      await expect(darkswapService.getPeerId()).rejects.toThrow('API error');
    });
    
    it('should throw error on missing data', async () => {
      const mockResponse = {
        success: true,
        data: null,
      };
      
      mockApiClient.get.mockResolvedValue(mockResponse);
      
      await expect(darkswapService.getPeerId()).rejects.toThrow('Failed to get peer ID');
    });
  });
  
  describe('getConnectedPeers', () => {
    it('should call ApiClient.get with correct endpoint', async () => {
      const mockResponse = {
        success: true,
        data: { peers: ['peer-1', 'peer-2'] },
      };
      
      mockApiClient.get.mockResolvedValue(mockResponse);
      
      const result = await darkswapService.getConnectedPeers();
      
      expect(mockApiClient.get).toHaveBeenCalledWith('/peer/connected');
      expect(result).toEqual(['peer-1', 'peer-2']);
    });
  });
  
  describe('getBalance', () => {
    it('should call ApiClient.get with correct endpoint for bitcoin', async () => {
      const mockResponse = {
        success: true,
        data: { balance: 100000000 },
      };
      
      mockApiClient.get.mockResolvedValue(mockResponse);
      
      const assetType: AssetType = { type: 'bitcoin' };
      const result = await darkswapService.getBalance(assetType);
      
      expect(mockApiClient.get).toHaveBeenCalledWith('/wallet/balance/bitcoin');
      expect(result).toBe(100000000);
    });
    
    it('should call ApiClient.get with correct endpoint for rune', async () => {
      const mockResponse = {
        success: true,
        data: { balance: 1000 },
      };
      
      mockApiClient.get.mockResolvedValue(mockResponse);
      
      const assetType: AssetType = { type: 'rune', id: 'rune-id' };
      const result = await darkswapService.getBalance(assetType);
      
      expect(mockApiClient.get).toHaveBeenCalledWith('/wallet/balance/rune/rune-id');
      expect(result).toBe(1000);
    });
    
    it('should call ApiClient.get with correct endpoint for alkane', async () => {
      const mockResponse = {
        success: true,
        data: { balance: 500 },
      };
      
      mockApiClient.get.mockResolvedValue(mockResponse);
      
      const assetType: AssetType = { type: 'alkane', id: 'alkane-id' };
      const result = await darkswapService.getBalance(assetType);
      
      expect(mockApiClient.get).toHaveBeenCalledWith('/wallet/balance/alkane/alkane-id');
      expect(result).toBe(500);
    });
  });
  
  describe('getAllBalances', () => {
    it('should call ApiClient.get with correct endpoint', async () => {
      const mockResponse = {
        success: true,
        data: {
          balances: {
            'bitcoin': 100000000,
            'rune:rune-id': 1000,
            'alkane:alkane-id': 500,
          },
        },
      };
      
      mockApiClient.get.mockResolvedValue(mockResponse);
      
      const result = await darkswapService.getAllBalances();
      
      expect(mockApiClient.get).toHaveBeenCalledWith('/wallet/balances');
      expect(result).toEqual({
        'bitcoin': 100000000,
        'rune:rune-id': 1000,
        'alkane:alkane-id': 500,
      });
    });
  });
  
  describe('createTradeOffer', () => {
    it('should call ApiClient.post with correct endpoint and data', async () => {
      const mockResponse = {
        success: true,
        data: { offerId: 'offer-id' },
      };
      
      mockApiClient.post.mockResolvedValue(mockResponse);
      
      const offer = {
        makerAsset: { type: 'bitcoin' } as AssetType,
        makerAmount: 100000000,
        takerAsset: { type: 'rune', id: 'rune-id' } as AssetType,
        takerAmount: 1000,
      };
      
      const result = await darkswapService.createTradeOffer(offer);
      
      expect(mockApiClient.post).toHaveBeenCalledWith('/trade/offer', offer);
      expect(result).toBe('offer-id');
    });
  });
  
  describe('acceptTradeOffer', () => {
    it('should call ApiClient.post with correct endpoint', async () => {
      const mockResponse = {
        success: true,
        data: { success: true },
      };
      
      mockApiClient.post.mockResolvedValue(mockResponse);
      
      const offerId = 'offer-id';
      const result = await darkswapService.acceptTradeOffer(offerId);
      
      expect(mockApiClient.post).toHaveBeenCalledWith(`/trade/offer/${offerId}/accept`);
      expect(result).toBe(true);
    });
  });
  
  describe('cancelTradeOffer', () => {
    it('should call ApiClient.post with correct endpoint', async () => {
      const mockResponse = {
        success: true,
        data: { success: true },
      };
      
      mockApiClient.post.mockResolvedValue(mockResponse);
      
      const offerId = 'offer-id';
      const result = await darkswapService.cancelTradeOffer(offerId);
      
      expect(mockApiClient.post).toHaveBeenCalledWith(`/trade/offer/${offerId}/cancel`);
      expect(result).toBe(true);
    });
  });
  
  describe('getTradeOffers', () => {
    it('should call ApiClient.get with correct endpoint', async () => {
      const mockOffers = [
        {
          id: 'offer-1',
          maker: 'peer-1',
          makerAsset: { type: 'bitcoin' },
          makerAmount: 100000000,
          takerAsset: { type: 'rune', id: 'rune-id' },
          takerAmount: 1000,
          expiry: 1617235200,
          status: 'open',
        },
      ];
      
      const mockResponse = {
        success: true,
        data: { offers: mockOffers },
      };
      
      mockApiClient.get.mockResolvedValue(mockResponse);
      
      const result = await darkswapService.getTradeOffers();
      
      expect(mockApiClient.get).toHaveBeenCalledWith('/trade/offers');
      expect(result).toEqual(mockOffers);
    });
  });
  
  describe('getTradeHistory', () => {
    it('should call ApiClient.get with correct endpoint', async () => {
      const mockHistory = [
        {
          id: 'trade-1',
          timestamp: 1617235200,
          type: 'buy',
          assetType: { type: 'rune', id: 'rune-id' },
          amount: 1000,
          price: 0.0001,
          status: 'completed',
        },
      ];
      
      const mockResponse = {
        success: true,
        data: { history: mockHistory },
      };
      
      mockApiClient.get.mockResolvedValue(mockResponse);
      
      const result = await darkswapService.getTradeHistory();
      
      expect(mockApiClient.get).toHaveBeenCalledWith('/trade/history');
      expect(result).toEqual(mockHistory);
    });
  });
  
  describe('event handling', () => {
    it('should register and unregister event handlers', () => {
      const handler = jest.fn();
      
      // Register handler
      darkswapService.on('test-event', handler);
      
      // @ts-ignore - accessing private property for testing
      const eventHandlers = darkswapService.eventHandlers;
      expect(eventHandlers.get('test-event')?.has(handler)).toBe(true);
      
      // Unregister handler
      darkswapService.off('test-event', handler);
      expect(eventHandlers.get('test-event')?.has(handler)).toBe(false);
    });
    
    it('should emit events to registered handlers', () => {
      const handler = jest.fn();
      const data = { test: 'data' };
      
      // Register handler
      darkswapService.on('test-event', handler);
      
      // Emit event
      // @ts-ignore - calling private method for testing
      darkswapService.emit('test-event', data);
      
      expect(handler).toHaveBeenCalledWith(data);
    });
    
    it('should handle errors in event handlers', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const handler = jest.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });
      
      // Register handler
      darkswapService.on('test-event', handler);
      
      // Emit event
      // @ts-ignore - calling private method for testing
      darkswapService.emit('test-event', {});
      
      expect(handler).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in event handler for test-event:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
});