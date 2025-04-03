/**
 * Service for interacting with the DarkSwap daemon
 */

import ApiClient from '../utils/ApiClient';
import WebSocketClient from '../utils/WebSocketClient';
import { AssetType, TradeOffer, TradeHistoryItem } from '../hooks/useDarkSwap';

export interface DarkSwapServiceOptions {
  apiUrl: string;
  wsUrl: string;
  apiTimeout?: number;
  wsReconnectInterval?: number;
  wsMaxReconnectAttempts?: number;
}

export class DarkSwapService {
  private apiClient: ApiClient;
  private wsClient: WebSocketClient;
  private eventHandlers: Map<string, Set<(data: any) => void>> = new Map();

  /**
   * Create a new DarkSwap service
   * @param options Service options
   */
  constructor(options: DarkSwapServiceOptions) {
    this.apiClient = new ApiClient({
      baseUrl: options.apiUrl,
      timeout: options.apiTimeout || 30000,
    });

    this.wsClient = new WebSocketClient(
      options.wsUrl,
      options.wsReconnectInterval || 5000,
      options.wsMaxReconnectAttempts || 10
    );

    // Set up WebSocket event handlers
    this.wsClient.on('connected', () => {
      this.emit('connected', null);
    });

    this.wsClient.on('disconnected', (event) => {
      this.emit('disconnected', event);
    });

    this.wsClient.on('reconnecting', (data) => {
      this.emit('reconnecting', data);
    });

    this.wsClient.on('reconnect_failed', () => {
      this.emit('reconnect_failed', null);
    });

    this.wsClient.on('error', (event) => {
      this.emit('error', event);
    });

    this.wsClient.on('message', (message) => {
      this.emit(message.type, message.payload);
    });
  }

  /**
   * Connect to the DarkSwap daemon
   */
  public async connect(): Promise<void> {
    this.wsClient.connect();
  }

  /**
   * Disconnect from the DarkSwap daemon
   */
  public async disconnect(): Promise<void> {
    this.wsClient.disconnect();
  }

  /**
   * Check if connected to the DarkSwap daemon
   * @returns True if connected, false otherwise
   */
  public isConnected(): boolean {
    return this.wsClient.isWebSocketConnected();
  }

  /**
   * Get the local peer ID
   * @returns Local peer ID
   */
  public async getPeerId(): Promise<string> {
    const response = await this.apiClient.get<{ peerId: string }>('/peer/id');

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get peer ID');
    }

    return response.data.peerId;
  }

  /**
   * Get connected peers
   * @returns Connected peers
   */
  public async getConnectedPeers(): Promise<string[]> {
    const response = await this.apiClient.get<{ peers: string[] }>('/peer/connected');

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get connected peers');
    }

    return response.data.peers;
  }

  /**
   * Get balance for an asset
   * @param assetType Asset type
   * @returns Asset balance
   */
  public async getBalance(assetType: AssetType): Promise<number> {
    let endpoint = '/wallet/balance';

    if (assetType.type === 'bitcoin') {
      endpoint += '/bitcoin';
    } else if (assetType.type === 'rune') {
      endpoint += `/rune/${assetType.id}`;
    } else if (assetType.type === 'alkane') {
      endpoint += `/alkane/${assetType.id}`;
    }

    const response = await this.apiClient.get<{ balance: number }>(endpoint);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get balance');
    }

    return response.data.balance;
  }

  /**
   * Get all balances
   * @returns All balances
   */
  public async getAllBalances(): Promise<{ [key: string]: number }> {
    const response = await this.apiClient.get<{ balances: { [key: string]: number } }>('/wallet/balances');

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get balances');
    }

    return response.data.balances;
  }

  /**
   * Create a trade offer
   * @param offer Trade offer
   * @returns Trade offer ID
   */
  public async createTradeOffer(offer: Omit<TradeOffer, 'id' | 'maker' | 'expiry' | 'status'>): Promise<string> {
    const response = await this.apiClient.post<{ offerId: string }>('/trade/offer', offer);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create trade offer');
    }

    return response.data.offerId;
  }

  /**
   * Accept a trade offer
   * @param offerId Trade offer ID
   * @returns True if accepted, false otherwise
   */
  public async acceptTradeOffer(offerId: string): Promise<boolean> {
    const response = await this.apiClient.post<{ success: boolean }>(`/trade/offer/${offerId}/accept`);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to accept trade offer');
    }

    return response.data.success;
  }

  /**
   * Cancel a trade offer
   * @param offerId Trade offer ID
   * @returns True if cancelled, false otherwise
   */
  public async cancelTradeOffer(offerId: string): Promise<boolean> {
    const response = await this.apiClient.post<{ success: boolean }>(`/trade/offer/${offerId}/cancel`);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to cancel trade offer');
    }

    return response.data.success;
  }

  /**
   * Get trade offers
   * @returns Trade offers
   */
  public async getTradeOffers(): Promise<TradeOffer[]> {
    const response = await this.apiClient.get<{ offers: TradeOffer[] }>('/trade/offers');

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get trade offers');
    }

    return response.data.offers;
  }

  /**
   * Get trade history
   * @returns Trade history
   */
  public async getTradeHistory(): Promise<TradeHistoryItem[]> {
    const response = await this.apiClient.get<{ history: TradeHistoryItem[] }>('/trade/history');

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get trade history');
    }

    return response.data.history;
  }

  /**
   * Add an event handler
   * @param event Event name
   * @param handler Event handler
   */
  public on(event: string, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }

    this.eventHandlers.get(event)?.add(handler);
  }

  /**
   * Remove an event handler
   * @param event Event name
   * @param handler Event handler
   */
  public off(event: string, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      return;
    }

    this.eventHandlers.get(event)?.delete(handler);
  }

  /**
   * Emit an event
   * @param event Event name
   * @param data Event data
   */
  private emit(event: string, data: any): void {
    if (!this.eventHandlers.has(event)) {
      return;
    }

    this.eventHandlers.get(event)?.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }
}

export default DarkSwapService;