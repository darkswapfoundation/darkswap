/**
 * WebAssembly Wallet Service
 *
 * This service provides a bridge between the web interface and the WebAssembly bindings
 * for wallet functionality. It handles loading the WebAssembly module, initializing the
 * wallet, and providing methods for interacting with the wallet.
 */

import { loadWasmModule, WasmWallet, WasmBalance, WasmTxInput, WasmTxOutput } from '../wasm';

// Interface for the WebAssembly wallet (for internal use)
interface WasmWalletInterface extends WasmWallet {}

// Event types
export enum WasmWalletEventType {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  BALANCE_CHANGED = 'balance_changed',
  ERROR = 'error',
}

// Event interface
export interface WasmWalletEvent {
  type: WasmWalletEventType;
  data?: any;
  timestamp: number;
}

// Event listener type
export type WasmWalletEventListener = (event: WasmWalletEvent) => void;

/**
 * WebAssembly Wallet Service
 */
export class WasmWalletService {
  private static instance: WasmWalletService;
  private wasmModule: any;
  private wallet: WasmWallet | null = null;
  private isInitialized: boolean = false;
  private isInitializing: boolean = false;
  private eventListeners: Map<WasmWalletEventType, WasmWalletEventListener[]> = new Map();
  private lastBalance: WasmBalance | null = null;
  private balanceCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Get the singleton instance of the service
   * @returns WasmWalletService instance
   */
  public static getInstance(): WasmWalletService {
    if (!WasmWalletService.instance) {
      WasmWalletService.instance = new WasmWalletService();
    }
    return WasmWalletService.instance;
  }

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Initialize the WebAssembly wallet
   * @returns Promise that resolves when the wallet is initialized
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    if (this.isInitializing) {
      // Wait for initialization to complete
      return new Promise<boolean>((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.isInitialized) {
            clearInterval(checkInterval);
            resolve(true);
          }
        }, 100);
      });
    }

    this.isInitializing = true;

    try {
      // Import the WebAssembly module using our loader
      try {
        this.wasmModule = await loadWasmModule();
        
        // Create a new wallet instance
        this.wallet = this.wasmModule.Wallet.new();
      } catch (error) {
        console.error('Failed to load WebAssembly module:', error);
        throw error;
      }
      this.isInitialized = true;
      this.isInitializing = false;

      // Start balance check interval
      this.startBalanceCheck();

      return true;
    } catch (error) {
      console.error('Failed to initialize WebAssembly wallet:', error);
      this.dispatchEvent(WasmWalletEventType.ERROR, {
        message: 'Failed to initialize WebAssembly wallet',
        error,
      });
      this.isInitializing = false;
      return false;
    }
  }

  // The mockWasmModule function has been replaced by the loadWasmModule function from '../wasm'

  /**
   * Start periodic balance check
   */
  private startBalanceCheck(): void {
    if (this.balanceCheckInterval) {
      clearInterval(this.balanceCheckInterval);
    }

    this.balanceCheckInterval = setInterval(async () => {
      if (!this.isInitialized || !this.wallet) return;

      try {
        const balance = await this.wallet.getBalance();
        
        // Check if balance has changed
        if (this.lastBalance) {
          const hasChanged = 
            this.lastBalance.btc !== balance.btc ||
            this.lastBalance.runes.length !== balance.runes.length ||
            this.lastBalance.alkanes.length !== balance.alkanes.length;
          
          if (hasChanged) {
            this.lastBalance = balance;
            this.dispatchEvent(WasmWalletEventType.BALANCE_CHANGED, balance);
          }
        } else {
          this.lastBalance = balance;
          this.dispatchEvent(WasmWalletEventType.BALANCE_CHANGED, balance);
        }
      } catch (error) {
        console.error('Error checking balance:', error);
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Stop periodic balance check
   */
  private stopBalanceCheck(): void {
    if (this.balanceCheckInterval) {
      clearInterval(this.balanceCheckInterval);
      this.balanceCheckInterval = null;
    }
  }

  /**
   * Add event listener
   * @param type Event type
   * @param listener Event listener
   */
  public addEventListener(type: WasmWalletEventType, listener: WasmWalletEventListener): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  /**
   * Remove event listener
   * @param type Event type
   * @param listener Event listener
   */
  public removeEventListener(type: WasmWalletEventType, listener: WasmWalletEventListener): void {
    if (!this.eventListeners.has(type)) {
      return;
    }
    const listeners = this.eventListeners.get(type)!;
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Dispatch event
   * @param type Event type
   * @param data Event data
   */
  private dispatchEvent(type: WasmWalletEventType, data?: any): void {
    if (!this.eventListeners.has(type)) {
      return;
    }
    const event: WasmWalletEvent = {
      type,
      data,
      timestamp: Date.now(),
    };
    this.eventListeners.get(type)!.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  /**
   * Connect to the wallet
   * @returns Promise that resolves when the wallet is connected
   */
  public async connect(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.wallet) {
      return false;
    }

    try {
      const result = await this.wallet.connect();
      if (result) {
        this.dispatchEvent(WasmWalletEventType.CONNECTED);
      }
      return result;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      this.dispatchEvent(WasmWalletEventType.ERROR, {
        message: 'Failed to connect wallet',
        error,
      });
      return false;
    }
  }

  /**
   * Disconnect from the wallet
   */
  public disconnect(): void {
    if (!this.isInitialized || !this.wallet) {
      return;
    }

    try {
      this.wallet.disconnect();
      this.dispatchEvent(WasmWalletEventType.DISCONNECTED);
      this.stopBalanceCheck();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      this.dispatchEvent(WasmWalletEventType.ERROR, {
        message: 'Failed to disconnect wallet',
        error,
      });
    }
  }

  /**
   * Check if the wallet is connected
   * @returns True if the wallet is connected
   */
  public isConnected(): boolean {
    if (!this.isInitialized || !this.wallet) {
      return false;
    }

    return this.wallet.isConnected();
  }

  /**
   * Get the wallet address
   * @returns Wallet address
   */
  public getAddress(): string {
    if (!this.isInitialized || !this.wallet) {
      return '';
    }

    return this.wallet.getAddress();
  }

  /**
   * Get the wallet balance
   * @returns Promise that resolves with the wallet balance
   */
  public async getBalance(): Promise<WasmBalance | null> {
    if (!this.isInitialized || !this.wallet) {
      return null;
    }

    try {
      const balance = await this.wallet.getBalance();
      this.lastBalance = balance;
      return balance;
    } catch (error) {
      console.error('Failed to get wallet balance:', error);
      this.dispatchEvent(WasmWalletEventType.ERROR, {
        message: 'Failed to get wallet balance',
        error,
      });
      return null;
    }
  }

  /**
   * Sign a message
   * @param message Message to sign
   * @returns Promise that resolves with the signature
   */
  public async signMessage(message: string): Promise<string | null> {
    if (!this.isInitialized || !this.wallet) {
      return null;
    }

    try {
      return await this.wallet.signMessage(message);
    } catch (error) {
      console.error('Failed to sign message:', error);
      this.dispatchEvent(WasmWalletEventType.ERROR, {
        message: 'Failed to sign message',
        error,
      });
      return null;
    }
  }

  /**
   * Sign a transaction
   * @param txHex Transaction hex
   * @returns Promise that resolves with the signed transaction
   */
  public async signTransaction(txHex: string): Promise<string | null> {
    if (!this.isInitialized || !this.wallet) {
      return null;
    }

    try {
      return await this.wallet.signTransaction(txHex);
    } catch (error) {
      console.error('Failed to sign transaction:', error);
      this.dispatchEvent(WasmWalletEventType.ERROR, {
        message: 'Failed to sign transaction',
        error,
      });
      return null;
    }
  }

  /**
   * Create a PSBT
   * @param inputs Transaction inputs
   * @param outputs Transaction outputs
   * @returns Promise that resolves with the PSBT base64 string
   */
  public async createPsbt(inputs: WasmTxInput[], outputs: WasmTxOutput[]): Promise<string | null> {
    if (!this.isInitialized || !this.wallet) {
      return null;
    }

    try {
      return await this.wallet.createPsbt(inputs, outputs);
    } catch (error) {
      console.error('Failed to create PSBT:', error);
      this.dispatchEvent(WasmWalletEventType.ERROR, {
        message: 'Failed to create PSBT',
        error,
      });
      return null;
    }
  }

  /**
   * Sign a PSBT
   * @param psbtBase64 PSBT base64 string
   * @returns Promise that resolves with the signed PSBT base64 string
   */
  public async signPsbt(psbtBase64: string): Promise<string | null> {
    if (!this.isInitialized || !this.wallet) {
      return null;
    }

    try {
      return await this.wallet.signPsbt(psbtBase64);
    } catch (error) {
      console.error('Failed to sign PSBT:', error);
      this.dispatchEvent(WasmWalletEventType.ERROR, {
        message: 'Failed to sign PSBT',
        error,
      });
      return null;
    }
  }

  /**
   * Finalize a PSBT
   * @param psbtBase64 PSBT base64 string
   * @returns Promise that resolves with the finalized PSBT base64 string
   */
  public async finalizePsbt(psbtBase64: string): Promise<string | null> {
    if (!this.isInitialized || !this.wallet) {
      return null;
    }

    try {
      return await this.wallet.finalizePsbt(psbtBase64);
    } catch (error) {
      console.error('Failed to finalize PSBT:', error);
      this.dispatchEvent(WasmWalletEventType.ERROR, {
        message: 'Failed to finalize PSBT',
        error,
      });
      return null;
    }
  }

  /**
   * Extract transaction from a PSBT
   * @param psbtBase64 PSBT base64 string
   * @returns Promise that resolves with the transaction hex
   */
  public async extractTx(psbtBase64: string): Promise<string | null> {
    if (!this.isInitialized || !this.wallet) {
      return null;
    }

    try {
      return await this.wallet.extractTx(psbtBase64);
    } catch (error) {
      console.error('Failed to extract transaction:', error);
      this.dispatchEvent(WasmWalletEventType.ERROR, {
        message: 'Failed to extract transaction',
        error,
      });
      return null;
    }
  }

  /**
   * Broadcast a transaction
   * @param txHex Transaction hex
   * @returns Promise that resolves with the transaction ID
   */
  public async broadcastTx(txHex: string): Promise<string | null> {
    if (!this.isInitialized || !this.wallet) {
      return null;
    }

    try {
      return await this.wallet.broadcastTx(txHex);
    } catch (error) {
      console.error('Failed to broadcast transaction:', error);
      this.dispatchEvent(WasmWalletEventType.ERROR, {
        message: 'Failed to broadcast transaction',
        error,
      });
      return null;
    }
  }
}

export default WasmWalletService;