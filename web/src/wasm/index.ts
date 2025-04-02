/**
 * WebAssembly Module Loader
 * 
 * This module is responsible for loading the WebAssembly bindings for the DarkSwap SDK.
 * It provides a singleton instance of the WebAssembly module and handles initialization.
 */

// Import the WebAssembly bindings
import * as wasm from '../wasm-bindings';

// Define the interface for the WebAssembly module
export interface DarkSwapWasm {
  Wallet: {
    new: () => WasmWallet;
  };
  OrderBook: {
    new: () => WasmOrderBook;
  };
  Trade: {
    new: () => WasmTrade;
  };
  initialize(): Promise<void>;
  isInitialized(): boolean;
}

// Define the interface for the WebAssembly wallet
export interface WasmWallet {
  connect(): Promise<boolean>;
  disconnect(): void;
  isConnected(): boolean;
  getAddress(): string;
  getBalance(): Promise<WasmBalance>;
  signMessage(message: string): Promise<string>;
  signTransaction(txHex: string): Promise<string>;
  createPsbt(inputs: WasmTxInput[], outputs: WasmTxOutput[]): Promise<string>;
  signPsbt(psbtBase64: string): Promise<string>;
  finalizePsbt(psbtBase64: string): Promise<string>;
  extractTx(psbtBase64: string): Promise<string>;
  broadcastTx(txHex: string): Promise<string>;
}

// Define the interface for the WebAssembly orderbook
export interface WasmOrderBook {
  addOrder(order: WasmOrder): Promise<string>;
  removeOrder(orderId: string): Promise<boolean>;
  getOrders(): Promise<WasmOrder[]>;
  getOrderById(orderId: string): Promise<WasmOrder | null>;
  getOrdersByPair(baseAsset: string, quoteAsset: string): Promise<WasmOrder[]>;
  matchOrders(order: WasmOrder): Promise<WasmOrder[]>;
}

// Define the interface for the WebAssembly trade execution
export interface WasmTradeExecution {
  id: string;
  makerOrder: WasmOrder;
  takerOrder: WasmOrder;
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
  completedAt?: number;
}

// Define the interface for the WebAssembly trade
export interface WasmTrade {
  createTrade(makerOrder: WasmOrder, takerOrder: WasmOrder): Promise<WasmTradeExecution>;
  executeTrade(tradeId: string): Promise<boolean>;
  getTrades(): Promise<WasmTradeExecution[]>;
  getTradeById(tradeId: string): Promise<WasmTradeExecution | null>;
}

// Define the interface for the WebAssembly balance
export interface WasmBalance {
  btc: string;
  runes: WasmRuneBalance[];
  alkanes: WasmAlkaneBalance[];
}

// Define the interface for the WebAssembly rune balance
export interface WasmRuneBalance {
  id: string;
  ticker: string;
  amount: string;
}

// Define the interface for the WebAssembly alkane balance
export interface WasmAlkaneBalance {
  id: string;
  ticker: string;
  amount: string;
}

// Define the interface for the WebAssembly transaction input
export interface WasmTxInput {
  txid: string;
  vout: number;
  value: number;
  address?: string;
  scriptPubKey?: string;
}

// Define the interface for the WebAssembly transaction output
export interface WasmTxOutput {
  address: string;
  value: number;
  script?: string;
}

// Define the interface for the WebAssembly order
export interface WasmOrder {
  id: string;
  baseAsset: string;
  quoteAsset: string;
  side: 'buy' | 'sell';
  amount: string;
  price: string;
  timestamp: number;
  expiry: number;
  status: 'open' | 'filled' | 'cancelled' | 'expired';
  maker: string;
}

// Singleton instance of the WebAssembly module
let wasmInstance: DarkSwapWasm | null = null;
let isLoading = false;
let loadPromise: Promise<DarkSwapWasm> | null = null;

/**
 * Load the WebAssembly module
 * @returns Promise that resolves with the WebAssembly module
 */
export async function loadWasmModule(): Promise<DarkSwapWasm> {
  if (wasmInstance) {
    return wasmInstance;
  }

  if (loadPromise) {
    return loadPromise;
  }

  isLoading = true;
  loadPromise = new Promise<DarkSwapWasm>(async (resolve, reject) => {
    try {
      // Initialize the WebAssembly module
      await wasm.initialize();
      wasmInstance = wasm as unknown as DarkSwapWasm;

      isLoading = false;
      resolve(wasmInstance);
    } catch (error) {
      isLoading = false;
      loadPromise = null;
      console.error('Failed to load WebAssembly module:', error);
      reject(error);
    }
  });

  return loadPromise;
}

/**
 * Check if the WebAssembly module is initialized
 * @returns True if the WebAssembly module is initialized
 */
export function isWasmInitialized(): boolean {
  return wasmInstance !== null && !isLoading;
}

/**
 * Get the WebAssembly module
 * @returns WebAssembly module or null if not initialized
 */
export function getWasmModule(): DarkSwapWasm | null {
  return wasmInstance;
}