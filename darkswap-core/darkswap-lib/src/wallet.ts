/**
 * Wallet implementation for the DarkSwap TypeScript Library
 */

import { EventEmitter } from 'eventemitter3';
import { 
  BitcoinBalance, 
  BitcoinNetwork, 
  ConnectionStatus, 
  EventData, 
  EventHandler, 
  EventType, 
  TxInput, 
  TxOutput, 
  WalletBalance, 
  WalletOptions, 
  WalletType 
} from './types';
import { DEFAULT_NETWORK } from './constants';
import { btcToSatoshis, satoshisToBtc } from './utils';

/**
 * Abstract wallet class
 */
export abstract class Wallet extends EventEmitter {
  /** Wallet type */
  protected type: WalletType;
  
  /** Bitcoin network */
  protected network: BitcoinNetwork;
  
  /** Connection status */
  protected status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  
  /** Wallet address */
  protected address: string = '';
  
  /** Wallet balance */
  protected balance: WalletBalance = {
    btc: {
      btc: '0',
      sats: '0',
    },
    runes: [],
    alkanes: [],
  };
  
  /**
   * Create a new wallet
   * @param options Wallet options
   */
  constructor(options: WalletOptions) {
    super();
    
    this.type = options.type;
    this.network = options.network || DEFAULT_NETWORK;
    
    // Auto connect if specified
    if (options.autoConnect) {
      this.connect().catch((error) => {
        this.emit(EventType.WALLET_ERROR, { error });
      });
    }
  }
  
  /**
   * Connect to the wallet
   * @returns Promise that resolves when connected
   */
  public abstract connect(): Promise<boolean>;
  
  /**
   * Disconnect from the wallet
   */
  public abstract disconnect(): void;
  
  /**
   * Check if the wallet is connected
   * @returns True if the wallet is connected
   */
  public isConnected(): boolean {
    return this.status === ConnectionStatus.CONNECTED;
  }
  
  /**
   * Get the wallet address
   * @returns Wallet address
   */
  public getAddress(): string {
    return this.address;
  }
  
  /**
   * Get the wallet balance
   * @returns Wallet balance
   */
  public getBalance(): WalletBalance {
    return this.balance;
  }
  
  /**
   * Get the Bitcoin balance
   * @returns Bitcoin balance
   */
  public getBitcoinBalance(): BitcoinBalance {
    return this.balance.btc;
  }
  
  /**
   * Get the rune balances
   * @returns Rune balances
   */
  public getRuneBalances(): WalletBalance['runes'] {
    return this.balance.runes;
  }
  
  /**
   * Get the alkane balances
   * @returns Alkane balances
   */
  public getAlkaneBalances(): WalletBalance['alkanes'] {
    return this.balance.alkanes;
  }
  
  /**
   * Sign a message
   * @param message Message to sign
   * @returns Promise that resolves with the signature
   */
  public abstract signMessage(message: string): Promise<string>;
  
  /**
   * Sign a transaction
   * @param txHex Transaction hex
   * @returns Promise that resolves with the signed transaction hex
   */
  public abstract signTransaction(txHex: string): Promise<string>;
  
  /**
   * Create a PSBT
   * @param inputs Transaction inputs
   * @param outputs Transaction outputs
   * @returns Promise that resolves with the PSBT base64 string
   */
  public abstract createPsbt(inputs: TxInput[], outputs: TxOutput[]): Promise<string>;
  
  /**
   * Sign a PSBT
   * @param psbtBase64 PSBT base64 string
   * @returns Promise that resolves with the signed PSBT base64 string
   */
  public abstract signPsbt(psbtBase64: string): Promise<string>;
  
  /**
   * Finalize a PSBT
   * @param psbtBase64 PSBT base64 string
   * @returns Promise that resolves with the finalized PSBT base64 string
   */
  public abstract finalizePsbt(psbtBase64: string): Promise<string>;
  
  /**
   * Extract a transaction from a PSBT
   * @param psbtBase64 PSBT base64 string
   * @returns Promise that resolves with the transaction hex
   */
  public abstract extractTx(psbtBase64: string): Promise<string>;
  
  /**
   * Broadcast a transaction
   * @param txHex Transaction hex
   * @returns Promise that resolves with the transaction ID
   */
  public abstract broadcastTx(txHex: string): Promise<string>;
  
  /**
   * Get the wallet type
   * @returns Wallet type
   */
  public getType(): WalletType {
    return this.type;
  }
  
  /**
   * Get the Bitcoin network
   * @returns Bitcoin network
   */
  public getNetwork(): BitcoinNetwork {
    return this.network;
  }
  
  /**
   * Get the connection status
   * @returns Connection status
   */
  public getStatus(): ConnectionStatus {
    return this.status;
  }
  
  /**
   * Set the connection status
   * @param status Connection status
   */
  protected setStatus(status: ConnectionStatus): void {
    this.status = status;
    
    if (status === ConnectionStatus.CONNECTED) {
      this.emit(EventType.WALLET_CONNECTED);
    } else if (status === ConnectionStatus.DISCONNECTED) {
      this.emit(EventType.WALLET_DISCONNECTED);
    }
  }
  
  /**
   * Set the wallet address
   * @param address Wallet address
   */
  protected setAddress(address: string): void {
    this.address = address;
  }
  
  /**
   * Set the wallet balance
   * @param balance Wallet balance
   */
  protected setBalance(balance: WalletBalance): void {
    this.balance = balance;
    this.emit(EventType.WALLET_BALANCE_CHANGED, { balance });
  }
  
  /**
   * Update the Bitcoin balance
   * @param btc Bitcoin balance in BTC
   */
  protected updateBitcoinBalance(btc: string): void {
    const sats = btcToSatoshis(btc);
    this.balance.btc = { btc, sats };
    this.emit(EventType.WALLET_BALANCE_CHANGED, { balance: this.balance });
  }
  
  /**
   * Update the rune balances
   * @param runes Rune balances
   */
  protected updateRuneBalances(runes: WalletBalance['runes']): void {
    this.balance.runes = runes;
    this.emit(EventType.WALLET_BALANCE_CHANGED, { balance: this.balance });
  }
  
  /**
   * Update the alkane balances
   * @param alkanes Alkane balances
   */
  protected updateAlkaneBalances(alkanes: WalletBalance['alkanes']): void {
    this.balance.alkanes = alkanes;
    this.emit(EventType.WALLET_BALANCE_CHANGED, { balance: this.balance });
  }
}

/**
 * WASM wallet implementation
 */
export class WasmWallet extends Wallet {
  /** WASM wallet instance */
  private wasmWallet: any;
  
  /**
   * Create a new WASM wallet
   * @param options Wallet options
   */
  constructor(options: WalletOptions) {
    super({ ...options, type: WalletType.WASM });
  }
  
  /**
   * Connect to the wallet
   * @returns Promise that resolves when connected
   */
  public async connect(): Promise<boolean> {
    try {
      this.setStatus(ConnectionStatus.CONNECTING);
      
      // Import the WebAssembly module
      const wasmModule = await import('@darkswap/web-sys');
      
      // Initialize the WebAssembly module
      await wasmModule.initialize();
      
      // Create a wallet instance
      this.wasmWallet = new wasmModule.Wallet();
      
      // Connect to the wallet
      const connected = await this.wasmWallet.connect();
      
      if (connected) {
        // Get the wallet address
        const address = this.wasmWallet.getAddress();
        this.setAddress(address);
        
        // Get the wallet balance
        const balance = await this.wasmWallet.getBalance();
        this.setBalance(balance);
        
        // Set the status to connected
        this.setStatus(ConnectionStatus.CONNECTED);
        
        return true;
      } else {
        this.setStatus(ConnectionStatus.DISCONNECTED);
        return false;
      }
    } catch (error) {
      this.setStatus(ConnectionStatus.ERROR);
      this.emit(EventType.WALLET_ERROR, { error });
      throw error;
    }
  }
  
  /**
   * Disconnect from the wallet
   */
  public disconnect(): void {
    if (this.wasmWallet) {
      this.wasmWallet.disconnect();
      this.wasmWallet = null;
    }
    
    this.setStatus(ConnectionStatus.DISCONNECTED);
  }
  
  /**
   * Sign a message
   * @param message Message to sign
   * @returns Promise that resolves with the signature
   */
  public async signMessage(message: string): Promise<string> {
    if (!this.wasmWallet) {
      throw new Error('Wallet not connected');
    }
    
    return this.wasmWallet.signMessage(message);
  }
  
  /**
   * Sign a transaction
   * @param txHex Transaction hex
   * @returns Promise that resolves with the signed transaction hex
   */
  public async signTransaction(txHex: string): Promise<string> {
    if (!this.wasmWallet) {
      throw new Error('Wallet not connected');
    }
    
    return this.wasmWallet.signTransaction(txHex);
  }
  
  /**
   * Create a PSBT
   * @param inputs Transaction inputs
   * @param outputs Transaction outputs
   * @returns Promise that resolves with the PSBT base64 string
   */
  public async createPsbt(inputs: TxInput[], outputs: TxOutput[]): Promise<string> {
    if (!this.wasmWallet) {
      throw new Error('Wallet not connected');
    }
    
    return this.wasmWallet.createPsbt(inputs, outputs);
  }
  
  /**
   * Sign a PSBT
   * @param psbtBase64 PSBT base64 string
   * @returns Promise that resolves with the signed PSBT base64 string
   */
  public async signPsbt(psbtBase64: string): Promise<string> {
    if (!this.wasmWallet) {
      throw new Error('Wallet not connected');
    }
    
    return this.wasmWallet.signPsbt(psbtBase64);
  }
  
  /**
   * Finalize a PSBT
   * @param psbtBase64 PSBT base64 string
   * @returns Promise that resolves with the finalized PSBT base64 string
   */
  public async finalizePsbt(psbtBase64: string): Promise<string> {
    if (!this.wasmWallet) {
      throw new Error('Wallet not connected');
    }
    
    return this.wasmWallet.finalizePsbt(psbtBase64);
  }
  
  /**
   * Extract a transaction from a PSBT
   * @param psbtBase64 PSBT base64 string
   * @returns Promise that resolves with the transaction hex
   */
  public async extractTx(psbtBase64: string): Promise<string> {
    if (!this.wasmWallet) {
      throw new Error('Wallet not connected');
    }
    
    return this.wasmWallet.extractTx(psbtBase64);
  }
  
  /**
   * Broadcast a transaction
   * @param txHex Transaction hex
   * @returns Promise that resolves with the transaction ID
   */
  public async broadcastTx(txHex: string): Promise<string> {
    if (!this.wasmWallet) {
      throw new Error('Wallet not connected');
    }
    
    return this.wasmWallet.broadcastTx(txHex);
  }
}

/**
 * Create a new wallet
 * @param options Wallet options
 * @returns Wallet instance
 */
export function createWallet(options: WalletOptions): Wallet {
  switch (options.type) {
    case WalletType.WASM:
      return new WasmWallet(options);
    case WalletType.EXTERNAL:
      throw new Error('External wallet not implemented');
    default:
      throw new Error(`Unknown wallet type: ${options.type}`);
  }
}