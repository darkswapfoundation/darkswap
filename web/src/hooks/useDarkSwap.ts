import React, { useContext, createContext, useState, useEffect, ReactNode } from 'react';

// Define the types for the DarkSwap SDK
export interface DarkSwapSDK {
  // Core functionality
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnected: () => boolean;
  getPeerId: () => string;
  getConnectedPeers: () => string[];
  
  // Wallet functionality
  getBalance: (assetType: AssetType) => Promise<number>;
  getAllBalances: () => Promise<{ [key: string]: number }>;
  
  // Trade functionality
  createTradeOffer: (offer: TradeOffer) => Promise<string>;
  acceptTradeOffer: (offerId: string) => Promise<boolean>;
  cancelTradeOffer: (offerId: string) => Promise<boolean>;
  getTradeOffers: () => Promise<TradeOffer[]>;
  getTradeHistory: () => Promise<TradeHistoryItem[]>;
  
  // Event listeners
  on: (event: DarkSwapEvent, callback: (data: any) => void) => void;
  off: (event: DarkSwapEvent, callback: (data: any) => void) => void;
}

// Define the types for the DarkSwap context
export interface DarkSwapContextType {
  sdk: DarkSwapSDK | null;
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
}

// Define the types for the DarkSwap provider props
export interface DarkSwapProviderProps {
  children: ReactNode;
}

// Define the types for asset types
export type AssetType = 
  | { type: 'bitcoin' }
  | { type: 'rune'; id: string }
  | { type: 'alkane'; id: string };

// Define the types for trade offers
export interface TradeOffer {
  id: string;
  maker: string;
  makerAsset: AssetType;
  makerAmount: number;
  takerAsset: AssetType;
  takerAmount: number;
  expiry: number;
  status: 'open' | 'accepted' | 'completed' | 'cancelled' | 'expired';
}

// Define the types for trade history items
export interface TradeHistoryItem {
  id: string;
  timestamp: number;
  type: 'buy' | 'sell';
  assetType: AssetType;
  amount: number;
  price: number;
  status: 'completed' | 'pending' | 'failed';
}

// Define the types for DarkSwap events
export type DarkSwapEvent = 
  | 'connect'
  | 'disconnect'
  | 'peer_connect'
  | 'peer_disconnect'
  | 'trade_offer_received'
  | 'trade_offer_accepted'
  | 'trade_completed'
  | 'trade_cancelled'
  | 'trade_expired'
  | 'balance_changed';

// Create the DarkSwap context
const DarkSwapContext = createContext<DarkSwapContextType>({
  sdk: null,
  isInitialized: false,
  isConnecting: false,
  error: null,
  localPeerId: '',
  connectedPeers: [],
  balances: {},
  tradeOffers: [],
  tradeHistory: [],
  isLoading: {
    balances: false,
    tradeOffers: false,
    tradeHistory: false,
  },
});

// Create a mock SDK for development
const createMockSDK = (): DarkSwapSDK => {
  let connected = false;
  let peerId = `peer-${Math.random().toString(36).substring(2, 10)}`;
  let connectedPeers: string[] = [];
  let balances: { [key: string]: number } = {
    'bitcoin': 0.1,
    'rune:rune1': 100,
    'rune:rune2': 200,
    'alkane:alkane1': 50,
    'alkane:alkane2': 75,
  };
  let tradeOffers: TradeOffer[] = [];
  let tradeHistory: TradeHistoryItem[] = [];
  let eventListeners: { [key: string]: ((data: any) => void)[] } = {};
  
  // Generate some mock trade offers
  for (let i = 0; i < 5; i++) {
    tradeOffers.push({
      id: `offer-${i}`,
      maker: `peer-${Math.random().toString(36).substring(2, 10)}`,
      makerAsset: i % 2 === 0 ? { type: 'bitcoin' } : { type: 'rune', id: `rune${i % 2 + 1}` },
      makerAmount: i % 2 === 0 ? 0.01 : 50,
      takerAsset: i % 2 === 0 ? { type: 'rune', id: `rune${i % 2 + 1}` } : { type: 'bitcoin' },
      takerAmount: i % 2 === 0 ? 100 : 0.005,
      expiry: Date.now() + 3600000, // 1 hour from now
      status: 'open',
    });
  }
  
  // Generate some mock trade history
  for (let i = 0; i < 5; i++) {
    tradeHistory.push({
      id: `trade-${i}`,
      timestamp: Date.now() - i * 3600000, // i hours ago
      type: i % 2 === 0 ? 'buy' : 'sell',
      assetType: i % 3 === 0 
        ? { type: 'bitcoin' } 
        : i % 3 === 1 
          ? { type: 'rune', id: `rune${i % 2 + 1}` } 
          : { type: 'alkane', id: `alkane${i % 2 + 1}` },
      amount: i % 3 === 0 ? 0.01 : 50,
      price: i % 3 === 0 ? 65000 : 0.0001,
      status: 'completed',
    });
  }
  
  return {
    connect: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      connected = true;
      
      // Generate some mock connected peers
      const peerCount = Math.floor(Math.random() * 5) + 1;
      connectedPeers = [];
      for (let i = 0; i < peerCount; i++) {
        connectedPeers.push(`peer-${Math.random().toString(36).substring(2, 10)}`);
      }
      
      // Trigger connect event
      if (eventListeners['connect']) {
        eventListeners['connect'].forEach(callback => callback(null));
      }
    },
    
    disconnect: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      connected = false;
      connectedPeers = [];
      
      // Trigger disconnect event
      if (eventListeners['disconnect']) {
        eventListeners['disconnect'].forEach(callback => callback(null));
      }
    },
    
    isConnected: () => connected,
    
    getPeerId: () => peerId,
    
    getConnectedPeers: () => connectedPeers,
    
    getBalance: async (assetType: AssetType) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const key = assetType.type === 'bitcoin' 
        ? 'bitcoin' 
        : `${assetType.type}:${assetType.id}`;
      
      return balances[key] || 0;
    },
    
    getAllBalances: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return balances;
    },
    
    createTradeOffer: async (offer: TradeOffer) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const offerId = `offer-${Math.random().toString(36).substring(2, 10)}`;
      const newOffer: TradeOffer = {
        ...offer,
        id: offerId,
        maker: peerId,
        expiry: Date.now() + 3600000, // 1 hour from now
        status: 'open',
      };
      
      tradeOffers.push(newOffer);
      
      // Trigger trade_offer_received event for other peers
      if (eventListeners['trade_offer_received']) {
        eventListeners['trade_offer_received'].forEach(callback => callback(newOffer));
      }
      
      return offerId;
    },
    
    acceptTradeOffer: async (offerId: string) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const offerIndex = tradeOffers.findIndex(offer => offer.id === offerId);
      if (offerIndex === -1) {
        return false;
      }
      
      const offer = tradeOffers[offerIndex];
      offer.status = 'accepted';
      
      // Trigger trade_offer_accepted event
      if (eventListeners['trade_offer_accepted']) {
        eventListeners['trade_offer_accepted'].forEach(callback => callback(offer));
      }
      
      // Simulate trade completion after a delay
      setTimeout(() => {
        offer.status = 'completed';
        
        // Update balances
        if (offer.makerAsset.type === 'bitcoin') {
          balances['bitcoin'] -= offer.makerAmount;
        } else {
          const makerKey = `${offer.makerAsset.type}:${offer.makerAsset.id}`;
          balances[makerKey] = (balances[makerKey] || 0) - offer.makerAmount;
        }
        
        if (offer.takerAsset.type === 'bitcoin') {
          balances['bitcoin'] += offer.takerAmount;
        } else {
          const takerKey = `${offer.takerAsset.type}:${offer.takerAsset.id}`;
          balances[takerKey] = (balances[takerKey] || 0) + offer.takerAmount;
        }
        
        // Add to trade history
        const historyItem: TradeHistoryItem = {
          id: `trade-${Math.random().toString(36).substring(2, 10)}`,
          timestamp: Date.now(),
          type: offer.takerAsset.type === 'bitcoin' ? 'sell' : 'buy',
          assetType: offer.takerAsset.type === 'bitcoin' ? offer.makerAsset : offer.takerAsset,
          amount: offer.takerAsset.type === 'bitcoin' ? offer.makerAmount : offer.takerAmount,
          price: offer.takerAsset.type === 'bitcoin' 
            ? offer.takerAmount / offer.makerAmount 
            : offer.makerAmount / offer.takerAmount,
          status: 'completed',
        };
        
        tradeHistory.unshift(historyItem);
        
        // Trigger trade_completed event
        if (eventListeners['trade_completed']) {
          eventListeners['trade_completed'].forEach(callback => callback({
            offer,
            history: historyItem,
          }));
        }
        
        // Trigger balance_changed event
        if (eventListeners['balance_changed']) {
          eventListeners['balance_changed'].forEach(callback => callback(balances));
        }
      }, 3000);
      
      return true;
    },
    
    cancelTradeOffer: async (offerId: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const offerIndex = tradeOffers.findIndex(offer => offer.id === offerId);
      if (offerIndex === -1) {
        return false;
      }
      
      const offer = tradeOffers[offerIndex];
      offer.status = 'cancelled';
      
      // Trigger trade_cancelled event
      if (eventListeners['trade_cancelled']) {
        eventListeners['trade_cancelled'].forEach(callback => callback(offer));
      }
      
      return true;
    },
    
    getTradeOffers: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return tradeOffers.filter(offer => offer.status === 'open');
    },
    
    getTradeHistory: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return tradeHistory;
    },
    
    on: (event: DarkSwapEvent, callback: (data: any) => void) => {
      if (!eventListeners[event]) {
        eventListeners[event] = [];
      }
      eventListeners[event].push(callback);
    },
    
    off: (event: DarkSwapEvent, callback: (data: any) => void) => {
      if (!eventListeners[event]) {
        return;
      }
      eventListeners[event] = eventListeners[event].filter(cb => cb !== callback);
    },
  };
};

// Create the DarkSwap provider
export const DarkSwapProvider: React.FC<DarkSwapProviderProps> = ({ children }) => {
  const [sdk, setSdk] = useState<DarkSwapSDK | null>(null);
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
  
  // Initialize the SDK
  useEffect(() => {
    const initSDK = async () => {
      try {
        // In a real implementation, we would import the actual SDK
        // For now, we'll use a mock SDK
        const darkswapSDK = createMockSDK();
        setSdk(darkswapSDK);
        setIsInitialized(true);
        
        // Set the local peer ID
        setLocalPeerId(darkswapSDK.getPeerId());
        
        // Connect to the network
        setIsConnecting(true);
        await darkswapSDK.connect();
        setIsConnecting(false);
        
        // Set connected peers
        setConnectedPeers(darkswapSDK.getConnectedPeers());
        
        // Set up event listeners
        darkswapSDK.on('peer_connect', (peer: string) => {
          setConnectedPeers(prev => [...prev, peer]);
        });
        
        darkswapSDK.on('peer_disconnect', (peer: string) => {
          setConnectedPeers(prev => prev.filter(p => p !== peer));
        });
        
        darkswapSDK.on('trade_offer_received', (offer: TradeOffer) => {
          setTradeOffers(prev => [...prev, offer]);
        });
        
        darkswapSDK.on('trade_offer_accepted', (offer: TradeOffer) => {
          setTradeOffers(prev => prev.map(o => o.id === offer.id ? offer : o));
        });
        
        darkswapSDK.on('trade_completed', ({ offer, history }: { offer: TradeOffer, history: TradeHistoryItem }) => {
          setTradeOffers(prev => prev.map(o => o.id === offer.id ? offer : o));
          setTradeHistory(prev => [history, ...prev]);
        });
        
        darkswapSDK.on('trade_cancelled', (offer: TradeOffer) => {
          setTradeOffers(prev => prev.map(o => o.id === offer.id ? offer : o));
        });
        
        darkswapSDK.on('balance_changed', (newBalances: { [key: string]: number }) => {
          setBalances(newBalances);
        });
        
        // Fetch initial data
        fetchBalances(darkswapSDK);
        fetchTradeOffers(darkswapSDK);
        fetchTradeHistory(darkswapSDK);
      } catch (err) {
        console.error('Failed to initialize DarkSwap SDK:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize DarkSwap SDK'));
      }
    };
    
    initSDK();
    
    // Clean up
    return () => {
      if (sdk) {
        sdk.disconnect();
      }
    };
  }, []);
  
  // Fetch balances
  const fetchBalances = async (darkswapSDK: DarkSwapSDK) => {
    try {
      setIsLoading(prev => ({ ...prev, balances: true }));
      const newBalances = await darkswapSDK.getAllBalances();
      setBalances(newBalances);
    } catch (err) {
      console.error('Failed to fetch balances:', err);
    } finally {
      setIsLoading(prev => ({ ...prev, balances: false }));
    }
  };
  
  // Fetch trade offers
  const fetchTradeOffers = async (darkswapSDK: DarkSwapSDK) => {
    try {
      setIsLoading(prev => ({ ...prev, tradeOffers: true }));
      const offers = await darkswapSDK.getTradeOffers();
      setTradeOffers(offers);
    } catch (err) {
      console.error('Failed to fetch trade offers:', err);
    } finally {
      setIsLoading(prev => ({ ...prev, tradeOffers: false }));
    }
  };
  
  // Fetch trade history
  const fetchTradeHistory = async (darkswapSDK: DarkSwapSDK) => {
    try {
      setIsLoading(prev => ({ ...prev, tradeHistory: true }));
      const history = await darkswapSDK.getTradeHistory();
      setTradeHistory(history);
    } catch (err) {
      console.error('Failed to fetch trade history:', err);
    } finally {
      setIsLoading(prev => ({ ...prev, tradeHistory: false }));
    }
  };
  
  const contextValue: DarkSwapContextType = {
    sdk,
    isInitialized,
    isConnecting,
    error,
    localPeerId,
    connectedPeers,
    balances,
    tradeOffers,
    tradeHistory,
    isLoading,
  };

  return React.createElement(
    DarkSwapContext.Provider,
    { value: contextValue },
    children
  );
};

// Create a hook for using the DarkSwap context
export const useDarkSwap = () => {
  const context = useContext(DarkSwapContext);
  if (context === undefined) {
    throw new Error('useDarkSwap must be used within a DarkSwapProvider');
  }
  return context;
};

// Create a hook for using the local peer ID
export const useLocalPeerId = () => {
  const { localPeerId } = useDarkSwap();
  return localPeerId;
};

// Create a hook for using connected peers
export const useConnectedPeers = () => {
  const { connectedPeers } = useDarkSwap();
  return connectedPeers;
};

// Create a hook for using balances
export const useBalances = () => {
  const { balances, isLoading } = useDarkSwap();
  return { balances, isLoading: isLoading.balances };
};

// Create a hook for using trade offers
export const useTradeOffers = () => {
  const { sdk, tradeOffers, isLoading } = useDarkSwap();
  
  const createTradeOffer = async (offer: Omit<TradeOffer, 'id' | 'maker' | 'expiry' | 'status'>) => {
    if (!sdk) {
      throw new Error('DarkSwap SDK not initialized');
    }
    
    return await sdk.createTradeOffer({
      ...offer,
      id: '',
      maker: '',
      expiry: 0,
      status: 'open',
    });
  };
  
  const acceptTradeOffer = async (offerId: string) => {
    if (!sdk) {
      throw new Error('DarkSwap SDK not initialized');
    }
    
    return await sdk.acceptTradeOffer(offerId);
  };
  
  const cancelTradeOffer = async (offerId: string) => {
    if (!sdk) {
      throw new Error('DarkSwap SDK not initialized');
    }
    
    return await sdk.cancelTradeOffer(offerId);
  };
  
  return {
    tradeOffers,
    isLoading: isLoading.tradeOffers,
    createTradeOffer,
    acceptTradeOffer,
    cancelTradeOffer,
  };
};

// Create a hook for using trade history
export const useTradeHistory = () => {
  const { tradeHistory, isLoading } = useDarkSwap();
  return { tradeHistory, isLoading: isLoading.tradeHistory };
};