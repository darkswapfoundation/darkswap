/**
 * TypeScript declarations for the DarkSwap WebAssembly module
 */

declare module 'darkswap-wasm' {
  /**
   * Asset type for JavaScript
   */
  export enum JsAssetType {
    Bitcoin = 0,
    Rune = 1,
    Alkane = 2,
  }

  /**
   * Order side for JavaScript
   */
  export enum JsOrderSide {
    Buy = 0,
    Sell = 1,
  }

  /**
   * Order status for JavaScript
   */
  export enum JsOrderStatus {
    Open = 0,
    Filled = 1,
    Canceled = 2,
    Expired = 3,
  }

  /**
   * Bitcoin network for JavaScript
   */
  export enum JsBitcoinNetwork {
    Mainnet = 0,
    Testnet = 1,
    Regtest = 2,
    Signet = 3,
  }

  /**
   * DarkSwap configuration for JavaScript
   */
  export class JsConfig {
    /**
     * Bitcoin network
     */
    network: JsBitcoinNetwork;
    /**
     * Wallet type
     */
    wallet_type: string;
    /**
     * Private key
     */
    private_key?: string;
    /**
     * Mnemonic
     */
    mnemonic?: string;
    /**
     * Derivation path
     */
    derivation_path?: string;
    /**
     * Enable WebRTC
     */
    enable_webrtc: boolean;
    /**
     * WebRTC ICE servers
     */
    ice_servers: string[];
    /**
     * Signaling server URL
     */
    signaling_server_url?: string;
  }

  /**
   * DarkSwap SDK for JavaScript
   */
  export class JsDarkSwap {
    /**
     * Create a new DarkSwap instance
     * @param config DarkSwap configuration
     */
    constructor(config: JsConfig);

    /**
     * Start DarkSwap
     */
    start(): Promise<boolean>;

    /**
     * Stop DarkSwap
     */
    stop(): Promise<boolean>;

    /**
     * Set event callback
     * @param callback Event callback
     */
    set_event_callback(callback: (event: any) => void): Promise<boolean>;

    /**
     * Get wallet address
     */
    get_address(): Promise<string>;

    /**
     * Get wallet balance
     */
    get_balance(): Promise<number>;

    /**
     * Get asset balance
     * @param assetType Asset type
     * @param id Asset ID
     */
    get_asset_balance(assetType: JsAssetType, id: string): Promise<number>;

    /**
     * Create an order
     * @param baseAssetType Base asset type
     * @param baseAssetId Base asset ID
     * @param quoteAssetType Quote asset type
     * @param quoteAssetId Quote asset ID
     * @param side Order side
     * @param amount Order amount
     * @param price Order price
     * @param makerAddress Maker address
     * @param expirySeconds Order expiry in seconds
     */
    create_order(
      baseAssetType: JsAssetType,
      baseAssetId: string,
      quoteAssetType: JsAssetType,
      quoteAssetId: string,
      side: JsOrderSide,
      amount: string,
      price: string,
      makerAddress: string,
      expirySeconds: number
    ): Promise<any>;

    /**
     * Cancel an order
     * @param orderId Order ID
     */
    cancel_order(orderId: string): Promise<boolean>;

    /**
     * Get an order by ID
     * @param orderId Order ID
     */
    get_order(orderId: string): Promise<any>;

    /**
     * Get orders for a pair
     * @param baseAssetType Base asset type
     * @param baseAssetId Base asset ID
     * @param quoteAssetType Quote asset type
     * @param quoteAssetId Quote asset ID
     */
    get_orders(
      baseAssetType: JsAssetType,
      baseAssetId: string,
      quoteAssetType: JsAssetType,
      quoteAssetId: string
    ): Promise<any[]>;

    /**
     * Take an order
     * @param orderId Order ID
     * @param amount Order amount
     */
    take_order(orderId: string, amount: string): Promise<any>;

    /**
     * Get best bid and ask prices for a pair
     * @param baseAssetType Base asset type
     * @param baseAssetId Base asset ID
     * @param quoteAssetType Quote asset type
     * @param quoteAssetId Quote asset ID
     */
    get_best_bid_ask(
      baseAssetType: JsAssetType,
      baseAssetId: string,
      quoteAssetType: JsAssetType,
      quoteAssetId: string
    ): Promise<any>;
  }

  /**
   * Initialize the WebAssembly module
   * @param path Path to the WebAssembly module
   */
  export default function init(path?: string): Promise<any>;
}