/**
 * Mock SDK Service
 * 
 * This is a temporary mock implementation of the DarkSwap SDK service.
 * It simulates the behavior of the actual SDK for development purposes.
 * This will be replaced with the actual SDK integration in the future.
 */

// Types
export interface PeerInfo {
  id: string;
  address: string;
  connected: boolean;
  lastSeen: number;
}

export interface OrderInfo {
  id: string;
  pair: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market';
  price: number;
  amount: number;
  filled: number;
  total: number;
  status: 'open' | 'filled' | 'canceled' | 'expired';
  timestamp: number;
  maker: string;
}

export interface TradeInfo {
  id: string;
  orderId: string;
  pair: string;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  total: number;
  status: 'completed' | 'failed' | 'pending';
  counterparty: string;
  timestamp: number;
  txid?: string;
}

export interface AssetInfo {
  id: string;
  name: string;
  symbol: string;
  type: 'bitcoin' | 'rune' | 'alkane';
  balance: number;
  value: number;
  change24h: number;
}

export interface NetworkStats {
  peerCount: number;
  orderCount: number;
  connectionQuality: 'poor' | 'fair' | 'good' | 'excellent';
}

// Mock data generators
const generateMockPeers = (count: number): PeerInfo[] => {
  const peers: PeerInfo[] = [];
  
  for (let i = 0; i < count; i++) {
    peers.push({
      id: `peer-${i}`,
      address: `${Math.random().toString(16).substring(2, 10)}@darkswap.io`,
      connected: Math.random() > 0.2,
      lastSeen: Date.now() - Math.floor(Math.random() * 1000000),
    });
  }
  
  return peers;
};

const generateMockOrders = (count: number): OrderInfo[] => {
  const orders: OrderInfo[] = [];
  const pairs = ['BTC/RUNE:0x123', 'BTC/ALKANE:0x456', 'RUNE:0x123/ALKANE:0x456'];
  const sides: ('buy' | 'sell')[] = ['buy', 'sell'];
  const types: ('limit' | 'market')[] = ['limit', 'market'];
  const statuses: ('open' | 'filled' | 'canceled' | 'expired')[] = ['open', 'filled', 'canceled', 'expired'];
  
  for (let i = 0; i < count; i++) {
    const pair = pairs[Math.floor(Math.random() * pairs.length)];
    const side = sides[Math.floor(Math.random() * sides.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const status = i < count * 0.3 ? 'open' : statuses[Math.floor(Math.random() * statuses.length)];
    const price = Math.random() * (pair.includes('BTC') ? 20000 : 100) + (pair.includes('BTC') ? 10000 : 50);
    const amount = Math.random() * 5 + 0.1;
    const filled = status === 'filled' ? amount : status === 'open' ? Math.random() * amount : 0;
    
    orders.push({
      id: `order-${i}`,
      pair,
      side,
      type,
      price,
      amount,
      filled,
      total: price * amount,
      status,
      timestamp: Date.now() - Math.floor(Math.random() * 1000000000),
      maker: `0x${Math.random().toString(16).substring(2, 10)}`,
    });
  }
  
  return orders;
};

const generateMockTrades = (count: number, orders: OrderInfo[]): TradeInfo[] => {
  const trades: TradeInfo[] = [];
  const statuses: ('completed' | 'failed' | 'pending')[] = ['completed', 'failed', 'pending'];
  
  for (let i = 0; i < count; i++) {
    const order = orders[Math.floor(Math.random() * orders.length)];
    const status = i < count * 0.1 ? 'pending' : statuses[Math.floor(Math.random() * (statuses.length - 1))];
    
    trades.push({
      id: `trade-${i}`,
      orderId: order.id,
      pair: order.pair,
      side: order.side,
      price: order.price,
      amount: Math.min(order.amount, Math.random() * order.amount + 0.1),
      total: order.price * Math.min(order.amount, Math.random() * order.amount + 0.1),
      status,
      counterparty: `0x${Math.random().toString(16).substring(2, 10)}`,
      timestamp: Date.now() - Math.floor(Math.random() * 1000000000),
      txid: status === 'completed' ? `0x${Math.random().toString(16).substring(2, 66)}` : undefined,
    });
  }
  
  // Sort by timestamp (newest first)
  trades.sort((a, b) => b.timestamp - a.timestamp);
  
  return trades;
};

const generateMockAssets = (): AssetInfo[] => {
  return [
    {
      id: 'btc',
      name: 'Bitcoin',
      symbol: 'BTC',
      type: 'bitcoin',
      balance: 0.45,
      value: 18450,
      change24h: 2.4,
    },
    {
      id: 'rune:0x123',
      name: 'RUNE:0x123',
      symbol: 'RUNE',
      type: 'rune',
      balance: 1000,
      value: 5230.56,
      change24h: 5.7,
    },
    {
      id: 'alkane:0x456',
      name: 'ALKANE:0x456',
      symbol: 'ALKANE',
      type: 'alkane',
      balance: 500,
      value: 1750,
      change24h: -1.2,
    },
    {
      id: 'rune:0x789',
      name: 'RUNE:0x789',
      symbol: 'RUNE',
      type: 'rune',
      balance: 750,
      value: 3250,
      change24h: 3.1,
    },
  ];
};

// Mock SDK class
export class MockSdkService {
  private initialized: boolean = false;
  private peers: PeerInfo[] = [];
  private orders: OrderInfo[] = [];
  private trades: TradeInfo[] = [];
  private assets: AssetInfo[] = [];
  private networkStats: NetworkStats = {
    peerCount: 0,
    orderCount: 0,
    connectionQuality: 'poor',
  };
  private updateInterval: NodeJS.Timeout | null = null;

  // Initialize the SDK
  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }
    
    // Simulate initialization delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Generate mock data
    this.peers = generateMockPeers(30);
    this.orders = generateMockOrders(50);
    this.trades = generateMockTrades(20, this.orders);
    this.assets = generateMockAssets();
    
    // Update network stats
    this.updateNetworkStats();
    
    // Start periodic updates
    this.startPeriodicUpdates();
    
    this.initialized = true;
    return true;
  }

  // Shutdown the SDK
  async shutdown(): Promise<boolean> {
    if (!this.initialized) {
      return true;
    }
    
    // Stop periodic updates
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    // Simulate shutdown delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    this.initialized = false;
    return true;
  }

  // Get network stats
  getNetworkStats(): NetworkStats {
    return this.networkStats;
  }

  // Get all peers
  getPeers(): PeerInfo[] {
    return this.peers;
  }

  // Get all orders
  getOrders(): OrderInfo[] {
    return this.orders;
  }

  // Get open orders
  getOpenOrders(): OrderInfo[] {
    return this.orders.filter((order) => order.status === 'open');
  }

  // Get order history
  getOrderHistory(): OrderInfo[] {
    return this.orders.filter((order) => order.status !== 'open');
  }

  // Get all trades
  getTrades(): TradeInfo[] {
    return this.trades;
  }

  // Get all assets
  getAssets(): AssetInfo[] {
    return this.assets;
  }

  // Create a new order
  async createOrder(
    pair: string,
    side: 'buy' | 'sell',
    type: 'limit' | 'market',
    price: number,
    amount: number
  ): Promise<OrderInfo> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const order: OrderInfo = {
      id: `order-${this.orders.length + 1}`,
      pair,
      side,
      type,
      price,
      amount,
      filled: 0,
      total: price * amount,
      status: 'open',
      timestamp: Date.now(),
      maker: `0x${Math.random().toString(16).substring(2, 10)}`,
    };
    
    this.orders.push(order);
    this.updateNetworkStats();
    
    return order;
  }

  // Cancel an order
  async cancelOrder(orderId: string): Promise<boolean> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const orderIndex = this.orders.findIndex((order) => order.id === orderId);
    
    if (orderIndex === -1) {
      return false;
    }
    
    this.orders[orderIndex].status = 'canceled';
    this.updateNetworkStats();
    
    return true;
  }

  // Private methods
  private updateNetworkStats() {
    const connectedPeers = this.peers.filter((peer) => peer.connected);
    const openOrders = this.orders.filter((order) => order.status === 'open');
    
    let connectionQuality: 'poor' | 'fair' | 'good' | 'excellent' = 'poor';
    
    if (connectedPeers.length >= 30) {
      connectionQuality = 'excellent';
    } else if (connectedPeers.length >= 20) {
      connectionQuality = 'good';
    } else if (connectedPeers.length >= 10) {
      connectionQuality = 'fair';
    }
    
    this.networkStats = {
      peerCount: connectedPeers.length,
      orderCount: openOrders.length,
      connectionQuality,
    };
  }

  private startPeriodicUpdates() {
    this.updateInterval = setInterval(() => {
      // Randomly update peer connections
      this.peers.forEach((peer) => {
        if (Math.random() < 0.1) {
          peer.connected = !peer.connected;
          peer.lastSeen = Date.now();
        }
      });
      
      // Randomly update order status
      this.orders.forEach((order) => {
        if (order.status === 'open' && Math.random() < 0.05) {
          const action = Math.random();
          
          if (action < 0.7) {
            // Partially fill
            const fillAmount = Math.random() * (order.amount - order.filled);
            order.filled += fillAmount;
            
            // Create a trade
            this.trades.unshift({
              id: `trade-${this.trades.length + 1}`,
              orderId: order.id,
              pair: order.pair,
              side: order.side,
              price: order.price,
              amount: fillAmount,
              total: order.price * fillAmount,
              status: 'completed',
              counterparty: `0x${Math.random().toString(16).substring(2, 10)}`,
              timestamp: Date.now(),
              txid: `0x${Math.random().toString(16).substring(2, 66)}`,
            });
            
            // Check if fully filled
            if (Math.abs(order.filled - order.amount) < 0.000001) {
              order.status = 'filled';
            }
          } else if (action < 0.9) {
            // Expire
            order.status = 'expired';
          }
        }
      });
      
      // Update network stats
      this.updateNetworkStats();
    }, 5000);
  }
}

// Create and export a singleton instance
export const mockSdkService = new MockSdkService();