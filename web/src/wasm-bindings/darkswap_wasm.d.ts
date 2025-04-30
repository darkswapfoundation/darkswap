/* tslint:disable */
/* eslint-disable */
/**
 * Initialize the DarkSwap WebAssembly module
 */
export function start(): void;
/**
 * Asset type for JavaScript
 */
export enum JsAssetType {
  Bitcoin = 0,
  Rune = 1,
  Alkane = 2,
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
  Cancelled = 2,
  Expired = 3,
}
/**
 * Configuration for DarkSwap
 */
export class JsConfig {
  free(): void;
  constructor();
  bitcoin_network: JsBitcoinNetwork;
  relay_url: string;
  listen_addresses: Array<any>;
  bootstrap_peers: Array<any>;
  get wallet_path(): string | undefined;
  set wallet_path(value: string | null | undefined);
  get wallet_password(): string | undefined;
  set wallet_password(value: string | null | undefined);
  debug: boolean;
}
/**
 * DarkSwap WebAssembly class
 */
export class JsDarkSwap {
  free(): void;
  /**
   * Create a new DarkSwap instance
   */
  constructor(js_config: JsConfig);
  /**
   * Start DarkSwap
   */
  start(): Promise<any>;
  /**
   * Stop DarkSwap
   */
  stop(): Promise<any>;
  /**
   * Set event callback
   */
  set_event_callback(callback: Function): Promise<any>;
  /**
   * Create an order
   */
  create_order(side: JsOrderSide, base_asset_type: JsAssetType, base_asset_id: string, quote_asset_type: JsAssetType, quote_asset_id: string, amount: string, price: string): Promise<any>;
  /**
   * Cancel an order
   */
  cancel_order(order_id: string): Promise<any>;
  /**
   * Get an order by ID
   */
  get_order(order_id: string): Promise<any>;
  /**
   * Get orders
   */
  get_orders(side?: JsOrderSide | null, base_asset_type?: JsAssetType | null, base_asset_id?: string | null, quote_asset_type?: JsAssetType | null, quote_asset_id?: string | null): Promise<any>;
  /**
   * Take an order
   */
  take_order(order_id: string, amount: string): Promise<any>;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_jsconfig_free: (a: number, b: number) => void;
  readonly jsconfig_new: () => number;
  readonly jsconfig_bitcoin_network: (a: number) => number;
  readonly jsconfig_set_bitcoin_network: (a: number, b: number) => void;
  readonly jsconfig_relay_url: (a: number) => [number, number];
  readonly jsconfig_set_relay_url: (a: number, b: number, c: number) => void;
  readonly jsconfig_listen_addresses: (a: number) => any;
  readonly jsconfig_set_listen_addresses: (a: number, b: any) => void;
  readonly jsconfig_bootstrap_peers: (a: number) => any;
  readonly jsconfig_set_bootstrap_peers: (a: number, b: any) => void;
  readonly jsconfig_wallet_path: (a: number) => [number, number];
  readonly jsconfig_set_wallet_path: (a: number, b: number, c: number) => void;
  readonly jsconfig_wallet_password: (a: number) => [number, number];
  readonly jsconfig_set_wallet_password: (a: number, b: number, c: number) => void;
  readonly jsconfig_debug: (a: number) => number;
  readonly jsconfig_set_debug: (a: number, b: number) => void;
  readonly __wbg_jsdarkswap_free: (a: number, b: number) => void;
  readonly jsdarkswap_new: (a: number) => [number, number, number];
  readonly jsdarkswap_start: (a: number) => any;
  readonly jsdarkswap_stop: (a: number) => any;
  readonly jsdarkswap_set_event_callback: (a: number, b: any) => any;
  readonly jsdarkswap_create_order: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number) => any;
  readonly jsdarkswap_cancel_order: (a: number, b: number, c: number) => any;
  readonly jsdarkswap_get_order: (a: number, b: number, c: number) => any;
  readonly jsdarkswap_get_orders: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => any;
  readonly jsdarkswap_take_order: (a: number, b: number, c: number, d: number, e: number) => any;
  readonly start: () => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_6: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly closure44_externref_shim: (a: number, b: number, c: any) => void;
  readonly closure61_externref_shim: (a: number, b: number, c: any, d: any) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
