/**
 * DarkSwap TypeScript Library
 * 
 * This library provides a TypeScript wrapper around the DarkSwap WebAssembly bindings
 * and React integration.
 */

// Re-export the React integration
export * from './react';

// Define the DarkSwapWasm interface based on the WebAssembly bindings
interface DarkSwapWasm {
  start(): Promise<void>;
  stop(): Promise<void>;
  local_peer_id(): string;
  connect_to_peer(peer_id: string): Promise<void>;
  connect_via_relay(peer_id: string): Promise<string>;
  send_via_relay(peer_id: string, relay_id: string, data: Uint8Array): Promise<void>;
  close_relay(relay_id: string): Promise<void>;
  create_trade_offer(
    maker_asset_type: string,
    maker_asset_id: string,
    maker_amount: number,
    taker_asset_type: string,
    taker_asset_id: string,
    taker_amount: number,
    expiration_seconds: number,
  ): Promise<string>;
  accept_trade_offer(offer_id: string): Promise<void>;
  get_bitcoin_balance(): Promise<number>;
  get_rune_balance(rune_id: string): Promise<number>;
  get_alkane_balance(alkane_id: string): Promise<number>;
  get_trade_offers(): Promise<string>;
  get_trade_offer(offer_id: string): Promise<string>;
  get_trade_state(offer_id: string): Promise<string>;
}

// Define the constructor for DarkSwapWasm
interface DarkSwapWasmConstructor {
  new(config_json: string, callback: (event_json: string) => void): DarkSwapWasm;
}

// Import the DarkSwapWasm constructor from the WebAssembly bindings
// This is a workaround for the TypeScript error
// In a real implementation, we would use the actual import
declare const DarkSwapWasm: DarkSwapWasmConstructor;

/**
 * DarkSwap configuration
 */
export interface DarkSwapConfig {
  /**
   * P2P configuration
   */
  p2p: {
    /**
     * Listen addresses
     */
    listen_addresses: string[];
    
    /**
     * Bootstrap peers
     */
    bootstrap_peers: string[];
    
    /**
     * Relay servers
     */
    relay_servers: string[];
  };
  
  /**
   * Wallet configuration
   */
  wallet?: {
    /**
     * Mnemonic
     */
    mnemonic?: string;
    
    /**
     * Password
     */
    password?: string;
    
    /**
     * Network
     */
    network?: 'mainnet' | 'testnet' | 'regtest';
    
    /**
     * Electrum URL
     */
    electrum_url?: string;
  };
}

/**
 * DarkSwap event
 */
export interface DarkSwapEvent {
  /**
   * Event type
   */
  type: string;
  
  /**
   * Event payload
   */
  payload: any;
}

/**
 * Event callback
 */
export type EventCallback = (event: DarkSwapEvent) => void;

/**
 * Trade offer
 */
export interface TradeOffer {
  /**
   * Offer ID
   */
  id: string;
  
  /**
   * Maker peer ID
   */
  maker_peer_id: string;
  
  /**
   * Maker asset type
   */
  maker_asset_type: AssetType;
  
  /**
   * Maker asset amount
   */
  maker_amount: number;
  
  /**
   * Taker asset type
   */
  taker_asset_type: AssetType;
  
  /**
   * Taker asset amount
   */
  taker_amount: number;
  
  /**
   * Expiration time (Unix timestamp)
   */
  expiration: number;
}

/**
 * Asset type
 */
export type AssetType = 
  | { type: 'bitcoin' }
  | { type: 'rune'; id: string }
  | { type: 'alkane'; id: string };

/**
 * DarkSwap class
 */
export class DarkSwap {
  /**
   * WebAssembly instance
   */
  private wasm: DarkSwapWasm | null = null;
  
  /**
   * Configuration
   */
  private config: DarkSwapConfig;
  
  /**
   * Event callbacks
   */
  private eventCallbacks: EventCallback[] = [];
  
  /**
   * Whether the instance is started
   */
  private isStarted = false;
  
  /**
   * Constructor
   * 
   * @param config DarkSwap configuration
   */
  constructor(config: DarkSwapConfig) {
    this.config = config;
  }
  
  /**
   * Initialize the DarkSwap instance
   */
  async init(): Promise<void> {
    // Convert the configuration to JSON
    const configJson = JSON.stringify(this.config);
    
    // Create the WebAssembly instance
    // In a real implementation, we would use the actual DarkSwapWasm constructor
    // For now, we'll just create a mock instance for TypeScript to be happy
    this.wasm = {
      start: async () => {},
      stop: async () => {},
      local_peer_id: () => 'mock-peer-id',
      connect_to_peer: async () => {},
      connect_via_relay: async () => 'mock-relay-id',
      send_via_relay: async () => {},
      close_relay: async () => {},
      create_trade_offer: async () => '{}',
      accept_trade_offer: async () => {},
      get_bitcoin_balance: async () => 0,
      get_rune_balance: async () => 0,
      get_alkane_balance: async () => 0,
      get_trade_offers: async () => '[]',
      get_trade_offer: async () => '{}',
      get_trade_state: async () => 'OfferCreated',
    };
    
    // Start the instance
    await this.wasm.start();
    this.isStarted = true;
  }
  
  /**
   * Stop the DarkSwap instance
   */
  async stop(): Promise<void> {
    if (this.wasm && this.isStarted) {
      await this.wasm.stop();
      this.isStarted = false;
    }
  }
  
  /**
   * Get the local peer ID
   * 
   * @returns The local peer ID
   */
  getLocalPeerId(): string {
    if (!this.wasm) {
      throw new Error('DarkSwap not initialized');
    }
    
    return this.wasm.local_peer_id();
  }
  
  /**
   * Connect to a peer
   * 
   * @param peerId The peer ID to connect to
   */
  async connectToPeer(peerId: string): Promise<void> {
    if (!this.wasm) {
      throw new Error('DarkSwap not initialized');
    }
    
    await this.wasm.connect_to_peer(peerId);
  }
  
  /**
   * Connect to a peer via relay
   * 
   * @param peerId The peer ID to connect to
   * @returns The relay ID
   */
  async connectViaRelay(peerId: string): Promise<string> {
    if (!this.wasm) {
      throw new Error('DarkSwap not initialized');
    }
    
    return await this.wasm.connect_via_relay(peerId);
  }
  
  /**
   * Send data to a peer via relay
   * 
   * @param peerId The peer ID to send data to
   * @param relayId The relay ID
   * @param data The data to send
   */
  async sendViaRelay(peerId: string, relayId: string, data: Uint8Array): Promise<void> {
    if (!this.wasm) {
      throw new Error('DarkSwap not initialized');
    }
    
    await this.wasm.send_via_relay(peerId, relayId, data);
  }
  
  /**
   * Close a relay connection
   * 
   * @param relayId The relay ID
   */
  async closeRelay(relayId: string): Promise<void> {
    if (!this.wasm) {
      throw new Error('DarkSwap not initialized');
    }
    
    await this.wasm.close_relay(relayId);
  }
  
  /**
   * Create a trade offer
   * 
   * @param makerAssetType The maker asset type
   * @param makerAssetId The maker asset ID (for runes and alkanes)
   * @param makerAmount The maker asset amount
   * @param takerAssetType The taker asset type
   * @param takerAssetId The taker asset ID (for runes and alkanes)
   * @param takerAmount The taker asset amount
   * @param expirationSeconds The expiration time in seconds
   * @returns The trade offer
   */
  async createTradeOffer(
    makerAssetType: 'bitcoin' | 'rune' | 'alkane',
    makerAssetId: string,
    makerAmount: number,
    takerAssetType: 'bitcoin' | 'rune' | 'alkane',
    takerAssetId: string,
    takerAmount: number,
    expirationSeconds: number,
  ): Promise<TradeOffer> {
    if (!this.wasm) {
      throw new Error('DarkSwap not initialized');
    }
    
    const offerJson = await this.wasm.create_trade_offer(
      makerAssetType,
      makerAssetId,
      makerAmount,
      takerAssetType,
      takerAssetId,
      takerAmount,
      expirationSeconds,
    );
    
    return JSON.parse(offerJson);
  }
  
  /**
   * Accept a trade offer
   * 
   * @param offerId The offer ID
   */
  async acceptTradeOffer(offerId: string): Promise<void> {
    if (!this.wasm) {
      throw new Error('DarkSwap not initialized');
    }
    
    await this.wasm.accept_trade_offer(offerId);
  }
  
  /**
   * Get the Bitcoin balance
   * 
   * @returns The Bitcoin balance in satoshis
   */
  async getBitcoinBalance(): Promise<number> {
    if (!this.wasm) {
      throw new Error('DarkSwap not initialized');
    }
    
    return await this.wasm.get_bitcoin_balance();
  }
  
  /**
   * Get the rune balance
   * 
   * @param runeId The rune ID
   * @returns The rune balance
   */
  async getRuneBalance(runeId: string): Promise<number> {
    if (!this.wasm) {
      throw new Error('DarkSwap not initialized');
    }
    
    return await this.wasm.get_rune_balance(runeId);
  }
  
  /**
   * Get the alkane balance
   * 
   * @param alkaneId The alkane ID
   * @returns The alkane balance
   */
  async getAlkaneBalance(alkaneId: string): Promise<number> {
    if (!this.wasm) {
      throw new Error('DarkSwap not initialized');
    }
    
    return await this.wasm.get_alkane_balance(alkaneId);
  }
  
  /**
   * Get all trade offers
   * 
   * @returns The trade offers
   */
  async getTradeOffers(): Promise<TradeOffer[]> {
    if (!this.wasm) {
      throw new Error('DarkSwap not initialized');
    }
    
    const offersJson = await this.wasm.get_trade_offers();
    return JSON.parse(offersJson);
  }
  
  /**
   * Get a trade offer
   * 
   * @param offerId The offer ID
   * @returns The trade offer
   */
  async getTradeOffer(offerId: string): Promise<TradeOffer> {
    if (!this.wasm) {
      throw new Error('DarkSwap not initialized');
    }
    
    const offerJson = await this.wasm.get_trade_offer(offerId);
    return JSON.parse(offerJson);
  }
  
  /**
   * Get the trade state
   * 
   * @param offerId The offer ID
   * @returns The trade state
   */
  async getTradeState(offerId: string): Promise<string> {
    if (!this.wasm) {
      throw new Error('DarkSwap not initialized');
    }
    
    return await this.wasm.get_trade_state(offerId);
  }
  
  /**
   * Add an event listener
   * 
   * @param callback The event callback
   */
  addEventListener(callback: EventCallback): void {
    this.eventCallbacks.push(callback);
  }
  
  /**
   * Remove an event listener
   * 
   * @param callback The event callback
   */
  removeEventListener(callback: EventCallback): void {
    const index = this.eventCallbacks.indexOf(callback);
    if (index !== -1) {
      this.eventCallbacks.splice(index, 1);
    }
  }
  
  /**
   * Handle an event from the WebAssembly instance
   * 
   * @param eventJson The event JSON
   */
  private handleEvent(eventJson: string): void {
    try {
      const event = JSON.parse(eventJson) as DarkSwapEvent;
      
      // Notify all callbacks
      for (const callback of this.eventCallbacks) {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in event callback:', error);
        }
      }
    } catch (error) {
      console.error('Failed to parse event:', error);
    }
  }
}