/**
 * WebRTC Storage utility
 * 
 * This utility provides persistent storage for WebRTC data,
 * allowing users to store and retrieve data when offline.
 */

// Storage keys
const STORAGE_KEYS = {
  PEERS: 'darkswap_webrtc_peers',
  ORDERS: 'darkswap_webrtc_orders',
  TRADES: 'darkswap_webrtc_trades',
  MESSAGES: 'darkswap_webrtc_messages',
  SETTINGS: 'darkswap_webrtc_settings',
};

// Storage types
export interface StoredPeer {
  id: string;
  name: string;
  lastSeen: string; // ISO date string
  metadata: {
    version: string;
    features: string[];
    [key: string]: any;
  };
}

export interface StoredOrder {
  id: string;
  peerId: string;
  assetId: string;
  amount: string;
  price: string;
  type: 'buy' | 'sell';
  timestamp: string; // ISO date string
}

export interface StoredTrade {
  id: string;
  peerId: string;
  assetId: string;
  amount: string;
  price: string;
  status: string;
  direction: 'incoming' | 'outgoing';
  timestamp: string; // ISO date string
  txid?: string;
}

export interface StoredMessage {
  id: string;
  peerId: string;
  content: string;
  timestamp: string; // ISO date string
  direction: 'incoming' | 'outgoing';
  read: boolean;
}

export interface StoredSettings {
  peerName: string;
  discoveryEnabled: boolean;
  autoConnect: boolean;
  theme: 'light' | 'dark';
  notifications: boolean;
  [key: string]: any;
}

/**
 * WebRTC Storage class
 */
export class WebRtcStorage {
  /**
   * Store peers
   * @param peers Peers to store
   */
  static storePeers(peers: StoredPeer[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PEERS, JSON.stringify(peers));
    } catch (error) {
      console.error('Failed to store peers:', error);
    }
  }

  /**
   * Load peers
   * @returns Stored peers
   */
  static loadPeers(): StoredPeer[] {
    try {
      const peersJson = localStorage.getItem(STORAGE_KEYS.PEERS);
      if (!peersJson) return [];
      
      return JSON.parse(peersJson);
    } catch (error) {
      console.error('Failed to load peers:', error);
      return [];
    }
  }

  /**
   * Store orders
   * @param orders Orders to store
   */
  static storeOrders(orders: StoredOrder[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (error) {
      console.error('Failed to store orders:', error);
    }
  }

  /**
   * Load orders
   * @returns Stored orders
   */
  static loadOrders(): StoredOrder[] {
    try {
      const ordersJson = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (!ordersJson) return [];
      
      return JSON.parse(ordersJson);
    } catch (error) {
      console.error('Failed to load orders:', error);
      return [];
    }
  }

  /**
   * Store trades
   * @param trades Trades to store
   */
  static storeTrades(trades: StoredTrade[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades));
    } catch (error) {
      console.error('Failed to store trades:', error);
    }
  }

  /**
   * Load trades
   * @returns Stored trades
   */
  static loadTrades(): StoredTrade[] {
    try {
      const tradesJson = localStorage.getItem(STORAGE_KEYS.TRADES);
      if (!tradesJson) return [];
      
      return JSON.parse(tradesJson);
    } catch (error) {
      console.error('Failed to load trades:', error);
      return [];
    }
  }

  /**
   * Store messages
   * @param messages Messages to store
   */
  static storeMessages(messages: StoredMessage[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to store messages:', error);
    }
  }

  /**
   * Load messages
   * @returns Stored messages
   */
  static loadMessages(): StoredMessage[] {
    try {
      const messagesJson = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (!messagesJson) return [];
      
      return JSON.parse(messagesJson);
    } catch (error) {
      console.error('Failed to load messages:', error);
      return [];
    }
  }

  /**
   * Store settings
   * @param settings Settings to store
   */
  static storeSettings(settings: StoredSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to store settings:', error);
    }
  }

  /**
   * Load settings
   * @returns Stored settings
   */
  static loadSettings(): StoredSettings {
    try {
      const settingsJson = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!settingsJson) {
        return {
          peerName: `User-${Math.floor(Math.random() * 10000)}`,
          discoveryEnabled: false,
          autoConnect: false,
          theme: 'dark',
          notifications: true,
        };
      }
      
      return JSON.parse(settingsJson);
    } catch (error) {
      console.error('Failed to load settings:', error);
      return {
        peerName: `User-${Math.floor(Math.random() * 10000)}`,
        discoveryEnabled: false,
        autoConnect: false,
        theme: 'dark',
        notifications: true,
      };
    }
  }

  /**
   * Clear all stored data
   */
  static clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.PEERS);
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
      localStorage.removeItem(STORAGE_KEYS.TRADES);
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  /**
   * Get storage usage statistics
   * @returns Storage usage statistics
   */
  static getStorageStats(): { key: string; size: number; items: number }[] {
    const stats: { key: string; size: number; items: number }[] = [];
    
    try {
      // Check peers
      const peersJson = localStorage.getItem(STORAGE_KEYS.PEERS);
      if (peersJson) {
        const peers = JSON.parse(peersJson);
        stats.push({
          key: STORAGE_KEYS.PEERS,
          size: peersJson.length,
          items: peers.length,
        });
      }
      
      // Check orders
      const ordersJson = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (ordersJson) {
        const orders = JSON.parse(ordersJson);
        stats.push({
          key: STORAGE_KEYS.ORDERS,
          size: ordersJson.length,
          items: orders.length,
        });
      }
      
      // Check trades
      const tradesJson = localStorage.getItem(STORAGE_KEYS.TRADES);
      if (tradesJson) {
        const trades = JSON.parse(tradesJson);
        stats.push({
          key: STORAGE_KEYS.TRADES,
          size: tradesJson.length,
          items: trades.length,
        });
      }
      
      // Check messages
      const messagesJson = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (messagesJson) {
        const messages = JSON.parse(messagesJson);
        stats.push({
          key: STORAGE_KEYS.MESSAGES,
          size: messagesJson.length,
          items: messages.length,
        });
      }
      
      // Check settings
      const settingsJson = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settingsJson) {
        stats.push({
          key: STORAGE_KEYS.SETTINGS,
          size: settingsJson.length,
          items: 1,
        });
      }
    } catch (error) {
      console.error('Failed to get storage stats:', error);
    }
    
    return stats;
  }

  /**
   * Export all stored data
   * @returns All stored data as a JSON string
   */
  static exportData(): string {
    try {
      const data = {
        peers: this.loadPeers(),
        orders: this.loadOrders(),
        trades: this.loadTrades(),
        messages: this.loadMessages(),
        settings: this.loadSettings(),
      };
      
      return JSON.stringify(data);
    } catch (error) {
      console.error('Failed to export data:', error);
      return '';
    }
  }

  /**
   * Import data
   * @param jsonData JSON data to import
   * @returns Whether the import was successful
   */
  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.peers) this.storePeers(data.peers);
      if (data.orders) this.storeOrders(data.orders);
      if (data.trades) this.storeTrades(data.trades);
      if (data.messages) this.storeMessages(data.messages);
      if (data.settings) this.storeSettings(data.settings);
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
}