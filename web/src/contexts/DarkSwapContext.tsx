import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import DarkSwapService, { DarkSwapServiceOptions } from '../services/DarkSwapService';
import { useNotifications } from './NotificationContext';
import { AssetType, TradeOffer, TradeHistoryItem } from '../hooks/useDarkSwap';

// Define the DarkSwap context type
interface DarkSwapContextType {
  service: DarkSwapService | null;
  isInitialized: boolean;
  isConnecting: boolean;
  error: Error | null;
  localPeerId: string;
  connectedPeers: string[];
  balances: { [key: string]: number };
  tradeOffers: TradeOffer[];
  tradeHistory: TradeHistoryItem[];
  isLoading: {
    balances: boolean;
    tradeOffers: boolean;
    tradeHistory: boolean;
  };
  createTradeOffer: (offer: Omit<TradeOffer, 'id' | 'maker' | 'expiry' | 'status'>) => Promise<string>;
  acceptTradeOffer: (offerId: string) => Promise<boolean>;
  cancelTradeOffer: (offerId: string) => Promise<boolean>;
  refreshBalances: () => Promise<void>;
  refreshTradeOffers: () => Promise<void>;
  refreshTradeHistory: () => Promise<void>;
}

// Create the DarkSwap context
const DarkSwapContext = createContext<DarkSwapContextType | undefined>(undefined);

// Define the DarkSwap provider props
interface DarkSwapProviderProps {
  children: ReactNode;
  options: DarkSwapServiceOptions;
}

/**
 * DarkSwap provider component
 * @param props Component props
 * @returns DarkSwap provider component
 */
export const DarkSwapProvider: React.FC<DarkSwapProviderProps> = ({ children, options }) => {
  const { addNotification } = useNotifications();
  const [service, setService] = useState<DarkSwapService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [localPeerId, setLocalPeerId] = useState('');
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [balances, setBalances] = useState<{ [key: string]: number }>({});
  const [tradeOffers, setTradeOffers] = useState<TradeOffer[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState({
    balances: false,
    tradeOffers: false,
    tradeHistory: false,
  });

  // Initialize the DarkSwap service
  useEffect(() => {
    const initService = async () => {
      try {
        const darkswapService = new DarkSwapService(options);
        setService(darkswapService);
        setIsInitialized(true);

        // Set up event handlers
        darkswapService.on('connected', () => {
          addNotification('success', 'Connected to DarkSwap daemon');
          fetchInitialData(darkswapService);
        });

        darkswapService.on('disconnected', () => {
          addNotification('warning', 'Disconnected from DarkSwap daemon');
        });

        darkswapService.on('reconnecting', (data) => {
          addNotification('info', `Reconnecting to DarkSwap daemon (attempt ${data.attempt})`);
        });

        darkswapService.on('reconnect_failed', () => {
          addNotification('error', 'Failed to reconnect to DarkSwap daemon');
        });

        darkswapService.on('error', () => {
          addNotification('error', 'Error connecting to DarkSwap daemon');
        });

        darkswapService.on('trade_offer_received', (offer: TradeOffer) => {
          addNotification('info', `New trade offer received: ${offer.id}`);
          setTradeOffers(prev => [...prev, offer]);
        });

        darkswapService.on('trade_offer_accepted', (offer: TradeOffer) => {
          addNotification('success', `Trade offer accepted: ${offer.id}`);
          setTradeOffers(prev => prev.map(o => o.id === offer.id ? offer : o));
        });

        darkswapService.on('trade_completed', (data: { offer: TradeOffer, history: TradeHistoryItem }) => {
          addNotification('success', `Trade completed: ${data.offer.id}`);
          setTradeOffers(prev => prev.map(o => o.id === data.offer.id ? data.offer : o));
          setTradeHistory(prev => [data.history, ...prev]);
          refreshBalances();
        });

        darkswapService.on('trade_cancelled', (offer: TradeOffer) => {
          addNotification('warning', `Trade offer cancelled: ${offer.id}`);
          setTradeOffers(prev => prev.map(o => o.id === offer.id ? offer : o));
        });

        darkswapService.on('trade_expired', (offer: TradeOffer) => {
          addNotification('warning', `Trade offer expired: ${offer.id}`);
          setTradeOffers(prev => prev.map(o => o.id === offer.id ? offer : o));
        });

        darkswapService.on('balance_changed', (newBalances: { [key: string]: number }) => {
          setBalances(newBalances);
        });

        // Connect to the DarkSwap daemon
        setIsConnecting(true);
        await darkswapService.connect();
      } catch (err) {
        console.error('Failed to initialize DarkSwap service:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize DarkSwap service'));
        addNotification('error', 'Failed to initialize DarkSwap service');
      }
    };

    initService();

    // Clean up
    return () => {
      if (service) {
        service.disconnect();
      }
    };
  }, [options, addNotification]);

  // Fetch initial data
  const fetchInitialData = async (darkswapService: DarkSwapService) => {
    try {
      // Get local peer ID
      const peerId = await darkswapService.getPeerId();
      setLocalPeerId(peerId);

      // Get connected peers
      const peers = await darkswapService.getConnectedPeers();
      setConnectedPeers(peers);

      // Get balances, trade offers, and trade history
      await Promise.all([
        refreshBalances(),
        refreshTradeOffers(),
        refreshTradeHistory(),
      ]);

      setIsConnecting(false);
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch initial data'));
      addNotification('error', 'Failed to fetch initial data');
      setIsConnecting(false);
    }
  };

  // Refresh balances
  const refreshBalances = async (): Promise<void> => {
    if (!service) {
      return;
    }

    setIsLoading(prev => ({ ...prev, balances: true }));

    try {
      const newBalances = await service.getAllBalances();
      setBalances(newBalances);
    } catch (err) {
      console.error('Failed to refresh balances:', err);
      addNotification('error', 'Failed to refresh balances');
    } finally {
      setIsLoading(prev => ({ ...prev, balances: false }));
    }
  };

  // Refresh trade offers
  const refreshTradeOffers = async (): Promise<void> => {
    if (!service) {
      return;
    }

    setIsLoading(prev => ({ ...prev, tradeOffers: true }));

    try {
      const offers = await service.getTradeOffers();
      setTradeOffers(offers);
    } catch (err) {
      console.error('Failed to refresh trade offers:', err);
      addNotification('error', 'Failed to refresh trade offers');
    } finally {
      setIsLoading(prev => ({ ...prev, tradeOffers: false }));
    }
  };

  // Refresh trade history
  const refreshTradeHistory = async (): Promise<void> => {
    if (!service) {
      return;
    }

    setIsLoading(prev => ({ ...prev, tradeHistory: true }));

    try {
      const history = await service.getTradeHistory();
      setTradeHistory(history);
    } catch (err) {
      console.error('Failed to refresh trade history:', err);
      addNotification('error', 'Failed to refresh trade history');
    } finally {
      setIsLoading(prev => ({ ...prev, tradeHistory: false }));
    }
  };

  // Create a trade offer
  const createTradeOffer = async (
    offer: Omit<TradeOffer, 'id' | 'maker' | 'expiry' | 'status'>
  ): Promise<string> => {
    if (!service) {
      throw new Error('DarkSwap service not initialized');
    }

    try {
      const offerId = await service.createTradeOffer(offer);
      addNotification('success', `Trade offer created: ${offerId}`);
      await refreshTradeOffers();
      return offerId;
    } catch (err) {
      console.error('Failed to create trade offer:', err);
      addNotification('error', 'Failed to create trade offer');
      throw err;
    }
  };

  // Accept a trade offer
  const acceptTradeOffer = async (offerId: string): Promise<boolean> => {
    if (!service) {
      throw new Error('DarkSwap service not initialized');
    }

    try {
      const result = await service.acceptTradeOffer(offerId);
      if (result) {
        addNotification('success', `Trade offer accepted: ${offerId}`);
      } else {
        addNotification('error', `Failed to accept trade offer: ${offerId}`);
      }
      return result;
    } catch (err) {
      console.error('Failed to accept trade offer:', err);
      addNotification('error', 'Failed to accept trade offer');
      throw err;
    }
  };

  // Cancel a trade offer
  const cancelTradeOffer = async (offerId: string): Promise<boolean> => {
    if (!service) {
      throw new Error('DarkSwap service not initialized');
    }

    try {
      const result = await service.cancelTradeOffer(offerId);
      if (result) {
        addNotification('success', `Trade offer cancelled: ${offerId}`);
      } else {
        addNotification('error', `Failed to cancel trade offer: ${offerId}`);
      }
      return result;
    } catch (err) {
      console.error('Failed to cancel trade offer:', err);
      addNotification('error', 'Failed to cancel trade offer');
      throw err;
    }
  };

  // Create the context value
  const contextValue: DarkSwapContextType = {
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
  };

  // Return the DarkSwap provider
  return React.createElement(
    DarkSwapContext.Provider,
    { value: contextValue },
    children
  );
};

/**
 * Hook to use the DarkSwap service
 * @returns DarkSwap context
 */
export const useDarkSwapService = (): DarkSwapContextType => {
  const context = useContext(DarkSwapContext);

  if (context === undefined) {
    throw new Error('useDarkSwapService must be used within a DarkSwapProvider');
  }

  return context;
};

export default DarkSwapContext;