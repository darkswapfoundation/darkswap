import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { DarkSwapProvider, useDarkSwapService } from '../contexts/DarkSwapContext';
import DarkSwapService from '../services/DarkSwapService';
import { NotificationProvider } from '../contexts/NotificationContext';

// Mock DarkSwapService
jest.mock('../services/DarkSwapService');
const MockDarkSwapService = DarkSwapService as jest.MockedClass<typeof DarkSwapService>;

// Mock NotificationContext
jest.mock('../contexts/NotificationContext', () => {
  const originalModule = jest.requireActual('../contexts/NotificationContext');
  
  return {
    ...originalModule,
    useNotifications: jest.fn().mockReturnValue({
      addNotification: jest.fn(),
      removeNotification: jest.fn(),
      clearNotifications: jest.fn(),
      notifications: [],
    }),
  };
});

// Test component that uses the DarkSwap context
const TestComponent: React.FC = () => {
  const { 
    service, 
    isInitialized, 
    isConnecting, 
    error, 
    localPeerId, 
    connectedPeers, 
    balances, 
    tradeOffers, 
    tradeHistory, 
    isLoading,
    createTradeOffer,
    acceptTradeOffer,
    cancelTradeOffer,
    refreshBalances,
    refreshTradeOffers,
    refreshTradeHistory,
  } = useDarkSwapService();
  
  return (
    <div>
      <div data-testid="initialized">{isInitialized ? 'true' : 'false'}</div>
      <div data-testid="connecting">{isConnecting ? 'true' : 'false'}</div>
      <div data-testid="error">{error ? error.message : 'no error'}</div>
      <div data-testid="service-exists">{service ? 'true' : 'false'}</div>
      <div data-testid="peer-id">{localPeerId}</div>
      <div data-testid="peer-count">{connectedPeers.length}</div>
      <div data-testid="balances">{JSON.stringify(balances)}</div>
      <div data-testid="trade-offers">{JSON.stringify(tradeOffers)}</div>
      <div data-testid="trade-history">{JSON.stringify(tradeHistory)}</div>
      <div data-testid="loading-balances">{isLoading.balances ? 'true' : 'false'}</div>
      <div data-testid="loading-offers">{isLoading.tradeOffers ? 'true' : 'false'}</div>
      <div data-testid="loading-history">{isLoading.tradeHistory ? 'true' : 'false'}</div>
      <button data-testid="create-offer" onClick={() => createTradeOffer({
        makerAsset: { type: 'bitcoin' },
        makerAmount: 100000000,
        takerAsset: { type: 'rune', id: 'rune-id' },
        takerAmount: 1000,
      })}>Create Offer</button>
      <button data-testid="accept-offer" onClick={() => acceptTradeOffer('offer-id')}>Accept Offer</button>
      <button data-testid="cancel-offer" onClick={() => cancelTradeOffer('offer-id')}>Cancel Offer</button>
      <button data-testid="refresh-balances" onClick={() => refreshBalances()}>Refresh Balances</button>
      <button data-testid="refresh-offers" onClick={() => refreshTradeOffers()}>Refresh Offers</button>
      <button data-testid="refresh-history" onClick={() => refreshTradeHistory()}>Refresh History</button>
    </div>
  );
};

// Wrapper component with provider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <NotificationProvider>
      <DarkSwapProvider options={{ apiUrl: 'http://localhost:8000/api', wsUrl: 'ws://localhost:8000/ws' }}>
        {children}
      </DarkSwapProvider>
    </NotificationProvider>
  );
};

describe('DarkSwapContext', () => {
  let mockDarkSwapService: jest.Mocked<DarkSwapService>;
  let mockEventHandlers: { [key: string]: Function } = {};
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    mockEventHandlers = {};
    
    // Set up mock DarkSwapService
    mockDarkSwapService = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      isConnected: jest.fn().mockReturnValue(false),
      getPeerId: jest.fn().mockResolvedValue('test-peer-id'),
      getConnectedPeers: jest.fn().mockResolvedValue(['peer-1', 'peer-2']),
      getBalance: jest.fn(),
      getAllBalances: jest.fn().mockResolvedValue({
        'bitcoin': 100000000,
        'rune:rune-id': 1000,
        'alkane:alkane-id': 500,
      }),
      createTradeOffer: jest.fn().mockResolvedValue('offer-id'),
      acceptTradeOffer: jest.fn().mockResolvedValue(true),
      cancelTradeOffer: jest.fn().mockResolvedValue(true),
      getTradeOffers: jest.fn().mockResolvedValue([
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
      ]),
      getTradeHistory: jest.fn().mockResolvedValue([
        {
          id: 'trade-1',
          timestamp: 1617235200,
          type: 'buy',
          assetType: { type: 'rune', id: 'rune-id' },
          amount: 1000,
          price: 0.0001,
          status: 'completed',
        },
      ]),
      on: jest.fn().mockImplementation((event, callback) => {
        mockEventHandlers[event] = callback;
      }),
      off: jest.fn(),
    } as unknown as jest.Mocked<DarkSwapService>;
    
    MockDarkSwapService.mockImplementation(() => mockDarkSwapService);
  });
  
  describe('DarkSwapProvider', () => {
    it('should initialize DarkSwapService with correct options', () => {
      render(
        <NotificationProvider>
          <DarkSwapProvider options={{ 
            apiUrl: 'http://localhost:8000/api', 
            wsUrl: 'ws://localhost:8000/ws',
            apiTimeout: 5000,
            wsReconnectInterval: 2000,
            wsMaxReconnectAttempts: 5,
          }}>
            <div />
          </DarkSwapProvider>
        </NotificationProvider>
      );
      
      expect(MockDarkSwapService).toHaveBeenCalledWith({
        apiUrl: 'http://localhost:8000/api',
        wsUrl: 'ws://localhost:8000/ws',
        apiTimeout: 5000,
        wsReconnectInterval: 2000,
        wsMaxReconnectAttempts: 5,
      });
    });
    
    it('should provide DarkSwapService to children', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      expect(screen.getByTestId('service-exists').textContent).toBe('true');
    });
    
    it('should connect to DarkSwap daemon', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      expect(mockDarkSwapService.connect).toHaveBeenCalled();
      expect(screen.getByTestId('connecting').textContent).toBe('true');
    });
    
    it('should set up event handlers', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      expect(mockDarkSwapService.on).toHaveBeenCalledWith('connected', expect.any(Function));
      expect(mockDarkSwapService.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
      expect(mockDarkSwapService.on).toHaveBeenCalledWith('reconnecting', expect.any(Function));
      expect(mockDarkSwapService.on).toHaveBeenCalledWith('reconnect_failed', expect.any(Function));
      expect(mockDarkSwapService.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockDarkSwapService.on).toHaveBeenCalledWith('trade_offer_received', expect.any(Function));
      expect(mockDarkSwapService.on).toHaveBeenCalledWith('trade_offer_accepted', expect.any(Function));
      expect(mockDarkSwapService.on).toHaveBeenCalledWith('trade_completed', expect.any(Function));
      expect(mockDarkSwapService.on).toHaveBeenCalledWith('trade_cancelled', expect.any(Function));
      expect(mockDarkSwapService.on).toHaveBeenCalledWith('trade_expired', expect.any(Function));
      expect(mockDarkSwapService.on).toHaveBeenCalledWith('balance_changed', expect.any(Function));
    });
    
    it('should disconnect on unmount', () => {
      const { unmount } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      unmount();
      
      expect(mockDarkSwapService.disconnect).toHaveBeenCalled();
    });
    
    it('should handle initialization errors', async () => {
      // Mock DarkSwapService constructor to throw an error
      const error = new Error('Initialization error');
      MockDarkSwapService.mockImplementation(() => {
        throw error;
      });
      
      // Suppress console.error for this test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      expect(screen.getByTestId('initialized').textContent).toBe('false');
      expect(screen.getByTestId('error').textContent).toBe('Initialization error');
      
      consoleErrorSpy.mockRestore();
    });
  });
  
  describe('useDarkSwapService', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useDarkSwapService must be used within a DarkSwapProvider');
      
      consoleErrorSpy.mockRestore();
    });
    
    it('should fetch initial data when connected', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      // Simulate connected event
      await act(async () => {
        if (mockEventHandlers['connected']) {
          mockEventHandlers['connected']();
        }
      });
      
      expect(mockDarkSwapService.getPeerId).toHaveBeenCalled();
      expect(mockDarkSwapService.getConnectedPeers).toHaveBeenCalled();
      expect(mockDarkSwapService.getAllBalances).toHaveBeenCalled();
      expect(mockDarkSwapService.getTradeOffers).toHaveBeenCalled();
      expect(mockDarkSwapService.getTradeHistory).toHaveBeenCalled();
      
      expect(screen.getByTestId('peer-id').textContent).toBe('test-peer-id');
      expect(screen.getByTestId('peer-count').textContent).toBe('2');
      expect(JSON.parse(screen.getByTestId('balances').textContent || '{}')).toEqual({
        'bitcoin': 100000000,
        'rune:rune-id': 1000,
        'alkane:alkane-id': 500,
      });
      expect(JSON.parse(screen.getByTestId('trade-offers').textContent || '[]')).toHaveLength(1);
      expect(JSON.parse(screen.getByTestId('trade-history').textContent || '[]')).toHaveLength(1);
    });
    
    it('should create trade offer', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      await act(async () => {
        screen.getByTestId('create-offer').click();
      });
      
      expect(mockDarkSwapService.createTradeOffer).toHaveBeenCalledWith({
        makerAsset: { type: 'bitcoin' },
        makerAmount: 100000000,
        takerAsset: { type: 'rune', id: 'rune-id' },
        takerAmount: 1000,
      });
    });
    
    it('should accept trade offer', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      await act(async () => {
        screen.getByTestId('accept-offer').click();
      });
      
      expect(mockDarkSwapService.acceptTradeOffer).toHaveBeenCalledWith('offer-id');
    });
    
    it('should cancel trade offer', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      await act(async () => {
        screen.getByTestId('cancel-offer').click();
      });
      
      expect(mockDarkSwapService.cancelTradeOffer).toHaveBeenCalledWith('offer-id');
    });
    
    it('should refresh balances', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      await act(async () => {
        screen.getByTestId('refresh-balances').click();
      });
      
      expect(mockDarkSwapService.getAllBalances).toHaveBeenCalled();
      expect(screen.getByTestId('loading-balances').textContent).toBe('false');
    });
    
    it('should refresh trade offers', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      await act(async () => {
        screen.getByTestId('refresh-offers').click();
      });
      
      expect(mockDarkSwapService.getTradeOffers).toHaveBeenCalled();
      expect(screen.getByTestId('loading-offers').textContent).toBe('false');
    });
    
    it('should refresh trade history', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      await act(async () => {
        screen.getByTestId('refresh-history').click();
      });
      
      expect(mockDarkSwapService.getTradeHistory).toHaveBeenCalled();
      expect(screen.getByTestId('loading-history').textContent).toBe('false');
    });
    
    it('should handle trade offer received event', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      const newOffer = {
        id: 'offer-2',
        maker: 'peer-2',
        makerAsset: { type: 'rune', id: 'rune-id' },
        makerAmount: 1000,
        takerAsset: { type: 'bitcoin' },
        takerAmount: 100000000,
        expiry: 1617235200,
        status: 'open',
      };
      
      await act(async () => {
        if (mockEventHandlers['trade_offer_received']) {
          mockEventHandlers['trade_offer_received'](newOffer);
        }
      });
      
      const tradeOffers = JSON.parse(screen.getByTestId('trade-offers').textContent || '[]');
      expect(tradeOffers).toHaveLength(1);
      expect(tradeOffers[0].id).toBe('offer-2');
    });
    
    it('should handle trade offer accepted event', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      // First, simulate connected event to load initial data
      await act(async () => {
        if (mockEventHandlers['connected']) {
          mockEventHandlers['connected']();
        }
      });
      
      const updatedOffer = {
        id: 'offer-1',
        maker: 'peer-1',
        makerAsset: { type: 'bitcoin' },
        makerAmount: 100000000,
        takerAsset: { type: 'rune', id: 'rune-id' },
        takerAmount: 1000,
        expiry: 1617235200,
        status: 'accepted',
      };
      
      await act(async () => {
        if (mockEventHandlers['trade_offer_accepted']) {
          mockEventHandlers['trade_offer_accepted'](updatedOffer);
        }
      });
      
      const tradeOffers = JSON.parse(screen.getByTestId('trade-offers').textContent || '[]');
      expect(tradeOffers).toHaveLength(1);
      expect(tradeOffers[0].status).toBe('accepted');
    });
    
    it('should handle trade completed event', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      // First, simulate connected event to load initial data
      await act(async () => {
        if (mockEventHandlers['connected']) {
          mockEventHandlers['connected']();
        }
      });
      
      const completedOffer = {
        id: 'offer-1',
        maker: 'peer-1',
        makerAsset: { type: 'bitcoin' },
        makerAmount: 100000000,
        takerAsset: { type: 'rune', id: 'rune-id' },
        takerAmount: 1000,
        expiry: 1617235200,
        status: 'completed',
      };
      
      const historyItem = {
        id: 'trade-2',
        timestamp: 1617235300,
        type: 'buy',
        assetType: { type: 'rune', id: 'rune-id' },
        amount: 1000,
        price: 0.0001,
        status: 'completed',
      };
      
      await act(async () => {
        if (mockEventHandlers['trade_completed']) {
          mockEventHandlers['trade_completed']({ offer: completedOffer, history: historyItem });
        }
      });
      
      const tradeOffers = JSON.parse(screen.getByTestId('trade-offers').textContent || '[]');
      expect(tradeOffers).toHaveLength(1);
      expect(tradeOffers[0].status).toBe('completed');
      
      const tradeHistory = JSON.parse(screen.getByTestId('trade-history').textContent || '[]');
      expect(tradeHistory).toHaveLength(2);
      expect(tradeHistory[0].id).toBe('trade-2');
      
      expect(mockDarkSwapService.getAllBalances).toHaveBeenCalled();
    });
  });
});