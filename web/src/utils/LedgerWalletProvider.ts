/**
 * Ledger Wallet Provider
 * 
 * This module provides utilities for connecting to a Ledger hardware wallet.
 * It uses the Ledger Live API to communicate with the Ledger device.
 */

import { ErrorCode, DarkSwapError, tryAsync } from './ErrorHandling';

/**
 * Ledger wallet provider options
 */
export interface LedgerWalletProviderOptions {
  /**
   * App name
   */
  appName?: string;
  
  /**
   * App description
   */
  appDescription?: string;
  
  /**
   * App icon URL
   */
  appIconUrl?: string;
  
  /**
   * App URL
   */
  appUrl?: string;
}

/**
 * Ledger wallet provider
 */
export class LedgerWalletProvider {
  /**
   * App name
   */
  private readonly appName: string;
  
  /**
   * App description
   */
  private readonly appDescription: string;
  
  /**
   * App icon URL
   */
  private readonly appIconUrl: string;
  
  /**
   * App URL
   */
  private readonly appUrl: string;
  
  /**
   * Ethereum app instance
   */
  private ethereumApp: any = null;
  
  /**
   * Transport instance
   */
  private transport: any = null;
  
  /**
   * Connected state
   */
  private connected: boolean = false;
  
  /**
   * Account change listeners
   */
  private accountChangeListeners: ((accounts: string[]) => void)[] = [];
  
  /**
   * Chain change listeners
   */
  private chainChangeListeners: ((chainId: number) => void)[] = [];
  
  /**
   * Connect listeners
   */
  private connectListeners: ((connectInfo: { chainId: number }) => void)[] = [];
  
  /**
   * Disconnect listeners
   */
  private disconnectListeners: ((error: { code: number; message: string }) => void)[] = [];
  
  /**
   * Current accounts
   */
  private accounts: string[] = [];
  
  /**
   * Current chain ID
   */
  private chainId: number = 1;
  
  /**
   * Create a new Ledger wallet provider
   * @param options Provider options
   */
  constructor(options?: LedgerWalletProviderOptions) {
    this.appName = options?.appName || 'DarkSwap';
    this.appDescription = options?.appDescription || 'DarkSwap - Decentralized Exchange for Bitcoin, Runes, and Alkanes';
    this.appIconUrl = options?.appIconUrl || 'https://darkswap.io/logo.png';
    this.appUrl = options?.appUrl || 'https://darkswap.io';
  }
  
  /**
   * Check if Ledger is supported
   * @returns Whether Ledger is supported
   */
  public isLedgerSupported(): boolean {
    return typeof window !== 'undefined' && 
           typeof navigator !== 'undefined' && 
           navigator.usb !== undefined;
  }
  
  /**
   * Check if connected
   * @returns Whether connected
   */
  public isConnected(): boolean {
    return this.connected;
  }
  
  /**
   * Get accounts
   * @returns Accounts
   */
  public getAccounts(): string[] {
    return this.accounts;
  }
  
  /**
   * Get address
   * @returns Address
   */
  public getAddress(): string | null {
    return this.accounts.length > 0 ? this.accounts[0] : null;
  }
  
  /**
   * Get chain ID
   * @returns Chain ID
   */
  public getChainId(): number {
    return this.chainId;
  }
  
  /**
   * Get network name
   * @returns Network name
   */
  public getNetworkName(): string {
    switch (this.chainId) {
      case 1:
        return 'Ethereum Mainnet';
      case 3:
        return 'Ropsten Testnet';
      case 4:
        return 'Rinkeby Testnet';
      case 5:
        return 'Goerli Testnet';
      case 42:
        return 'Kovan Testnet';
      case 56:
        return 'Binance Smart Chain';
      case 97:
        return 'Binance Smart Chain Testnet';
      case 137:
        return 'Polygon Mainnet';
      case 80001:
        return 'Polygon Mumbai Testnet';
      default:
        return 'Unknown';
    }
  }
  
  /**
   * Connect to Ledger
   * @returns Accounts
   */
  public async connect(): Promise<string[]> {
    return tryAsync(async () => {
      try {
        // Check if Ledger is supported
        if (!this.isLedgerSupported()) {
          throw new DarkSwapError(ErrorCode.WALLET_NOT_SUPPORTED, 'Ledger is not supported in this browser');
        }
        
        // Import required modules
        const { default: TransportWebUSB } = await import('@ledgerhq/hw-transport-webusb');
        const { default: Eth } = await import('@ledgerhq/hw-app-eth');
        
        // Create transport
        this.transport = await TransportWebUSB.create();
        
        // Create Ethereum app
        this.ethereumApp = new Eth(this.transport);
        
        // Get accounts
        const result = await this.ethereumApp.getAddress("44'/60'/0'/0/0", false);
        
        // Set accounts
        this.accounts = [result.address];
        
        // Set connected state
        this.connected = true;
        
        // Notify connect listeners
        this.notifyConnectListeners();
        
        return this.accounts;
      } catch (error: any) {
        // Check if user rejected the request
        if (error.message && error.message.includes('user')) {
          throw new DarkSwapError(ErrorCode.USER_REJECTED, 'User rejected the request');
        }
        
        throw new DarkSwapError(ErrorCode.WALLET_CONNECTION_FAILED, `Failed to connect to Ledger: ${error.message}`);
      }
    }, ErrorCode.WALLET_CONNECTION_FAILED, 'Failed to connect to Ledger');
  }
  
  /**
   * Disconnect from Ledger
   */
  public async disconnect(): Promise<void> {
    return tryAsync(async () => {
      try {
        // Close transport
        if (this.transport) {
          await this.transport.close();
          this.transport = null;
        }
        
        // Reset state
        this.ethereumApp = null;
        this.accounts = [];
        this.connected = false;
        
        // Notify disconnect listeners
        this.notifyDisconnectListeners({
          code: 1000,
          message: 'User disconnected',
        });
      } catch (error: any) {
        throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, `Failed to disconnect from Ledger: ${error.message}`);
      }
    }, ErrorCode.WALLET_OPERATION_FAILED, 'Failed to disconnect from Ledger');
  }
  
  /**
   * Get balance
   * @param address Address to get balance for
   * @returns Balance in wei as a hex string
   */
  public async getBalance(address: string): Promise<string> {
    return tryAsync(async () => {
      try {
        // Check if connected
        if (!this.isConnected()) {
          throw new DarkSwapError(ErrorCode.WALLET_NOT_CONNECTED, 'Ledger is not connected');
        }
        
        // Import required modules
        const { ethers } = await import('ethers');
        
        // Create provider
        const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/your-infura-project-id');
        
        // Get balance
        const balance = await provider.getBalance(address);
        
        // Convert to hex
        return '0x' + balance.toHexString().substring(2);
      } catch (error: any) {
        throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, `Failed to get balance: ${error.message}`);
      }
    }, ErrorCode.WALLET_OPERATION_FAILED, 'Failed to get balance');
  }
  
  /**
   * Sign message
   * @param message Message to sign
   * @returns Signature
   */
  public async signMessage(message: string): Promise<string> {
    return tryAsync(async () => {
      try {
        // Check if connected
        if (!this.isConnected()) {
          throw new DarkSwapError(ErrorCode.WALLET_NOT_CONNECTED, 'Ledger is not connected');
        }
        
        // Check if Ethereum app is available
        if (!this.ethereumApp) {
          throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, 'Ethereum app is not available');
        }
        
        // Get address
        const address = this.getAddress();
        
        // Check if address is available
        if (!address) {
          throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, 'No address available');
        }
        
        // Import required modules
        const { ethers } = await import('ethers');
        
        // Convert message to hex
        const messageHex = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message));
        
        // Sign message
        const result = await this.ethereumApp.signPersonalMessage("44'/60'/0'/0/0", messageHex.substring(2));
        
        // Convert signature to hex
        const signature = '0x' + result.r + result.s + (result.v - 27).toString(16).padStart(2, '0');
        
        return signature;
      } catch (error: any) {
        // Check if user rejected the request
        if (error.message && error.message.includes('user')) {
          throw new DarkSwapError(ErrorCode.USER_REJECTED, 'User rejected the request');
        }
        
        throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, `Failed to sign message: ${error.message}`);
      }
    }, ErrorCode.WALLET_OPERATION_FAILED, 'Failed to sign message');
  }
  
  /**
   * Sign typed data
   * @param typedData Typed data to sign
   * @returns Signature
   */
  public async signTypedData(typedData: any): Promise<string> {
    return tryAsync(async () => {
      try {
        // Check if connected
        if (!this.isConnected()) {
          throw new DarkSwapError(ErrorCode.WALLET_NOT_CONNECTED, 'Ledger is not connected');
        }
        
        // Check if Ethereum app is available
        if (!this.ethereumApp) {
          throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, 'Ethereum app is not available');
        }
        
        // Get address
        const address = this.getAddress();
        
        // Check if address is available
        if (!address) {
          throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, 'No address available');
        }
        
        // Import required modules
        const { ethers } = await import('ethers');
        
        // Convert typed data to string
        const typedDataString = JSON.stringify(typedData);
        
        // Sign typed data
        const result = await this.ethereumApp.signEIP712HashedMessage(
          "44'/60'/0'/0/0",
          ethers.utils._TypedDataEncoder.hash(typedData.domain, typedData.types, typedData.message)
        );
        
        // Convert signature to hex
        const signature = '0x' + result.r + result.s + (result.v - 27).toString(16).padStart(2, '0');
        
        return signature;
      } catch (error: any) {
        // Check if user rejected the request
        if (error.message && error.message.includes('user')) {
          throw new DarkSwapError(ErrorCode.USER_REJECTED, 'User rejected the request');
        }
        
        throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, `Failed to sign typed data: ${error.message}`);
      }
    }, ErrorCode.WALLET_OPERATION_FAILED, 'Failed to sign typed data');
  }
  
  /**
   * Send transaction
   * @param transaction Transaction to send
   * @returns Transaction hash
   */
  public async sendTransaction(transaction: {
    from: string;
    to: string;
    value?: string;
    data?: string;
    gas?: string;
    gasPrice?: string;
  }): Promise<string> {
    return tryAsync(async () => {
      try {
        // Check if connected
        if (!this.isConnected()) {
          throw new DarkSwapError(ErrorCode.WALLET_NOT_CONNECTED, 'Ledger is not connected');
        }
        
        // Check if Ethereum app is available
        if (!this.ethereumApp) {
          throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, 'Ethereum app is not available');
        }
        
        // Get address
        const address = this.getAddress();
        
        // Check if address is available
        if (!address) {
          throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, 'No address available');
        }
        
        // Import required modules
        const { ethers } = await import('ethers');
        
        // Create provider
        const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/your-infura-project-id');
        
        // Create transaction
        const tx = {
          to: transaction.to,
          value: transaction.value ? ethers.BigNumber.from(transaction.value) : ethers.BigNumber.from(0),
          data: transaction.data || '0x',
          gasLimit: transaction.gas ? ethers.BigNumber.from(transaction.gas) : undefined,
          gasPrice: transaction.gasPrice ? ethers.BigNumber.from(transaction.gasPrice) : undefined,
          nonce: await provider.getTransactionCount(address),
          chainId: this.chainId,
        };
        
        // Get transaction hash
        const unsignedTx = ethers.utils.serializeTransaction(tx).substring(2);
        
        // Sign transaction
        const result = await this.ethereumApp.signTransaction("44'/60'/0'/0/0", unsignedTx);
        
        // Convert signature to hex
        const signature = {
          r: '0x' + result.r,
          s: '0x' + result.s,
          v: parseInt(result.v, 16),
        };
        
        // Create signed transaction
        const signedTx = ethers.utils.serializeTransaction(tx, signature);
        
        // Send transaction
        const txResponse = await provider.sendTransaction(signedTx);
        
        return txResponse.hash;
      } catch (error: any) {
        // Check if user rejected the request
        if (error.message && error.message.includes('user')) {
          throw new DarkSwapError(ErrorCode.USER_REJECTED, 'User rejected the request');
        }
        
        throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, `Failed to send transaction: ${error.message}`);
      }
    }, ErrorCode.WALLET_OPERATION_FAILED, 'Failed to send transaction');
  }
  
  /**
   * Add account change listener
   * @param listener Listener function
   */
  public addAccountChangeListener(listener: (accounts: string[]) => void): void {
    this.accountChangeListeners.push(listener);
  }
  
  /**
   * Remove account change listener
   * @param listener Listener function
   */
  public removeAccountChangeListener(listener: (accounts: string[]) => void): void {
    this.accountChangeListeners = this.accountChangeListeners.filter(l => l !== listener);
  }
  
  /**
   * Add chain change listener
   * @param listener Listener function
   */
  public addChainChangeListener(listener: (chainId: number) => void): void {
    this.chainChangeListeners.push(listener);
  }
  
  /**
   * Remove chain change listener
   * @param listener Listener function
   */
  public removeChainChangeListener(listener: (chainId: number) => void): void {
    this.chainChangeListeners = this.chainChangeListeners.filter(l => l !== listener);
  }
  
  /**
   * Add connect listener
   * @param listener Listener function
   */
  public addConnectListener(listener: (connectInfo: { chainId: number }) => void): void {
    this.connectListeners.push(listener);
  }
  
  /**
   * Remove connect listener
   * @param listener Listener function
   */
  public removeConnectListener(listener: (connectInfo: { chainId: number }) => void): void {
    this.connectListeners = this.connectListeners.filter(l => l !== listener);
  }
  
  /**
   * Add disconnect listener
   * @param listener Listener function
   */
  public addDisconnectListener(listener: (error: { code: number; message: string }) => void): void {
    this.disconnectListeners.push(listener);
  }
  
  /**
   * Remove disconnect listener
   * @param listener Listener function
   */
  public removeDisconnectListener(listener: (error: { code: number; message: string }) => void): void {
    this.disconnectListeners = this.disconnectListeners.filter(l => l !== listener);
  }
  
  /**
   * Notify account change listeners
   */
  private notifyAccountChangeListeners(): void {
    for (const listener of this.accountChangeListeners) {
      try {
        listener(this.accounts);
      } catch (error) {
        console.error('Error in account change listener:', error);
      }
    }
  }
  
  /**
   * Notify chain change listeners
   */
  private notifyChainChangeListeners(): void {
    for (const listener of this.chainChangeListeners) {
      try {
        listener(this.chainId);
      } catch (error) {
        console.error('Error in chain change listener:', error);
      }
    }
  }
  
  /**
   * Notify connect listeners
   */
  private notifyConnectListeners(): void {
    for (const listener of this.connectListeners) {
      try {
        listener({ chainId: this.chainId });
      } catch (error) {
        console.error('Error in connect listener:', error);
      }
    }
  }
  
  /**
   * Notify disconnect listeners
   * @param error Error
   */
  private notifyDisconnectListeners(error: { code: number; message: string }): void {
    for (const listener of this.disconnectListeners) {
      try {
        listener(error);
      } catch (error) {
        console.error('Error in disconnect listener:', error);
      }
    }
  }
}

/**
 * Create a Ledger wallet provider
 * @param options Provider options
 * @returns Ledger wallet provider
 */
export function createLedgerWalletProvider(options?: LedgerWalletProviderOptions): LedgerWalletProvider {
  return new LedgerWalletProvider(options);
}