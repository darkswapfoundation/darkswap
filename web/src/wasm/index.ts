/**
 * WebAssembly Module for DarkSwap
 * 
 * This file provides a wrapper around the WebAssembly bindings for DarkSwap.
 * It handles initialization, error handling, and provides a type-safe interface.
 */

// Import the WebAssembly bindings
import wasmBindings from '../wasm-bindings';

// Define the interface for the WebAssembly module
export interface DarkSwapWasm {
  // Core functionality
  isInitialized: () => boolean;
  
  // Wallet functionality
  createWallet: (seed?: string) => string;
  getWalletAddress: (walletId: string) => string;
  getWalletBalance: (walletId: string) => number;
  
  // Transaction functionality
  createTransaction: (walletId: string, recipient: string, amount: number, fee: number) => string;
  signTransaction: (walletId: string, txHex: string) => string;
  broadcastTransaction: (txHex: string) => string;
  
  // Order book functionality
  createOrder: (walletId: string, side: 'buy' | 'sell', amount: number, price: number) => string;
  cancelOrder: (walletId: string, orderId: string) => boolean;
  getOrders: () => string;
  
  // P2P functionality
  connectToPeer: (peerId: string) => boolean;
  disconnectFromPeer: (peerId: string) => boolean;
  getPeers: () => string[];
  
  // Rune functionality
  getRunes: (walletId: string) => string;
  transferRune: (walletId: string, recipient: string, runeId: string, amount: number) => string;
  
  // Alkane functionality
  getAlkanes: (walletId: string) => string;
  transferAlkane: (walletId: string, recipient: string, alkaneId: string, amount: number) => string;
}

// Module state
let wasmInstance: DarkSwapWasm | null = null;
let isLoading = false;
let loadError: Error | null = null;

/**
 * Initialize the WebAssembly module
 * @returns Promise that resolves when the module is initialized
 */
export const initWasm = async (): Promise<void> => {
  // If already initialized, return
  if (wasmInstance) {
    return;
  }
  
  // If already loading, wait for it to complete
  if (isLoading) {
    return new Promise<void>((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (wasmInstance) {
          clearInterval(checkInterval);
          resolve();
        } else if (loadError) {
          clearInterval(checkInterval);
          reject(loadError);
        }
      }, 100);
    });
  }
  
  // Start loading
  isLoading = true;
  loadError = null;
  
  try {
    // Initialize the WebAssembly module
    wasmInstance = wasmBindings as unknown as DarkSwapWasm;
    isLoading = false;
  } catch (error) {
    isLoading = false;
    loadError = error instanceof Error ? error : new Error(String(error));
    throw loadError;
  }
};

/**
 * Get the WebAssembly module instance
 * @returns WebAssembly module instance
 * @throws Error if the module is not initialized
 */
export const getWasm = (): DarkSwapWasm => {
  if (!wasmInstance) {
    throw new Error('WebAssembly module not initialized. Call initWasm() first.');
  }
  
  return wasmInstance;
};

/**
 * Check if the WebAssembly module is initialized
 * @returns Whether the module is initialized
 */
export const isWasmInitialized = (): boolean => {
  return !!wasmInstance;
};

/**
 * Check if the WebAssembly module is loading
 * @returns Whether the module is loading
 */
export const isWasmLoading = (): boolean => {
  return isLoading;
};

/**
 * Get the WebAssembly module load error
 * @returns Load error or null if no error
 */
export const getWasmError = (): Error | null => {
  return loadError;
};

export default {
  initWasm,
  getWasm,
  isWasmInitialized,
  isWasmLoading,
  getWasmError,
};