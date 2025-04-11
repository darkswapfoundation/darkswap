/**
 * Trezor Wallet Provider
 * 
 * This module provides utilities for connecting to a Trezor hardware wallet.
 * It uses the Trezor Connect API to communicate with the Trezor device.
 */

import { ErrorCode, DarkSwapError, tryAsync } from './ErrorHandling';

/**
 * Trezor wallet provider options
 */
export interface TrezorWalletProviderOptions {
  /**
   * App name
   */
  appName?: string;
  
  /**
   * App URL
   */
  appUrl?: string;
  
  /**
   * Email for support
   */
  email?: string;
  
  /**
   * Manifest version
   */
  version?: string;
}

/**
 * Trezor wallet provider
 */
export class TrezorWalletProvider {
  /**
   * App name
   */
  private readonly appName: string;
  
  /**
   * App URL
   */
  private readonly appUrl: string;
  
  /**
   * Email for support
   */
  private readonly email: string;
  
  /**
   * Manifest version
   */
  private readonly version: string;
  
  /**
   * Trezor Connect instance
   */
  private trezorConnect: any = null;
  
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
   * Create a new Trezor wallet provider
   * @param options Provider options
   */
  constructor(options?: TrezorWalletProviderOptions) {
    this.appName = options?.appName || 'DarkSwap';
    this.appUrl = options?.appUrl || 'https://darkswap.io';
    this.email = options?.email || 'support@darkswap.io';
    this.version = options?.version || '1.0.0';
  }
  
  /**
   * Check if Trezor is supported
   * @returns Whether Trezor is supported
   */
  public isTrezorSupported(): boolean {
    return typeof window !== 'undefined';
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
   * Connect to Trezor
   * @returns Accounts
   */
  public async connect(): Promise<string[]> {
    return tryAsync(async () => {
      try {
        // Check if Trezor is supported
        if (!this.isTrezorSupported()) {
          throw new DarkSwapError(ErrorCode.WALLET_NOT_SUPPORTED, 'Trezor is not supported in this browser');
        }
        
        // Import Trezor Connect
        const TrezorConnect = await import('trezor-connect');
        this.trezorConnect = TrezorConnect;
        
        // Initialize Trezor Connect
        await this.trezorConnect.init({
          connectSrc: 'https://connect.trezor.io/8/',
          lazyLoad: true,
          manifest: {
            email: this.email,
            appUrl: this.appUrl,
          },
        });
        
        // Get Ethereum accounts
        const result = await this.trezorConnect.ethereumGetAddress({
          path: "m/44'/60'/0'/0/0",
          showOnTrezor: true,
        });
        
        // Check if successful
        if (!result.success) {
          throw new DarkSwapError(ErrorCode.WALLET_CONNECTION_FAILED, result.payload.error);
        }
        
        // Set accounts
        this.accounts = [`0x${result.payload.address}`];
        
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
        
        throw new DarkSwapError(ErrorCode.WALLET_CONNECTION_FAILED, `Failed to connect to Trezor: ${error.message}`);
      }
    }, ErrorCode.WALLET_CONNECTION_FAILED, 'Failed to connect to Trezor');
  }
  
  /**
   * Disconnect from Trezor
   */
  public async disconnect(): Promise<void> {
    return tryAsync(async () => {
      try {
        // Reset state
        this.accounts = [];
        this.connected = false;
        
        // Notify disconnect listeners
        this.notifyDisconnectListeners({
          code: 1000,
          message: 'User disconnected',
        });
      } catch (error: any) {
        throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, `Failed to disconnect from Trezor: ${error.message}`);
      }
    }, ErrorCode.WALLET_OPERATION_FAILED, 'Failed to disconnect from Trezor');
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
          throw new DarkSwapError(ErrorCode.WALLET_NOT_CONNECTED, 'Trezor is not connected');
        }
        
        // Import required modules
        const ethers = await import('ethers');
        
        // Create provider
        const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/your-infura-project-id');
        
        // Get balance
        const balance = await provider.getBalance(address);
        
        // Convert to hex
        return '0x' + balance.toString(16);
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
          throw new DarkSwapError(ErrorCode.WALLET_NOT_CONNECTED, 'Trezor is not connected');
        }
        
        // Check if Trezor Connect is available
        if (!this.trezorConnect) {
          throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, 'Trezor Connect is not available');
        }
        
        // Get address
        const address = this.getAddress();
        
        // Check if address is available
        if (!address) {
          throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, 'No address available');
        }
        
        // Import required modules
        const ethers = await import('ethers');
        
        // Convert message to hex
        const messageBytes = new TextEncoder().encode(message);
        const messageHex = Array.from(messageBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        // Sign message
        const result = await this.trezorConnect.ethereumSignMessage({
          path: "m/44'/60'/0'/0/0",
          message: messageHex,
          hex: true,
        });
        
        // Check if successful
        if (!result.success) {
          throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, result.payload.error);
        }
        
        // Convert signature to hex
        const signature = '0x' + result.payload.signature;
        
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
          throw new DarkSwapError(ErrorCode.WALLET_NOT_CONNECTED, 'Trezor is not connected');
        }
        
        // Check if Trezor Connect is available
        if (!this.trezorConnect) {
          throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, 'Trezor Connect is not available');
        }
        
        // Get address
        const address = this.getAddress();
        
        // Check if address is available
        if (!address) {
          throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, 'No address available');
        }
        
        // Sign typed data
        const result = await this.trezorConnect.ethereumSignTypedData({
          path: "m/44'/60'/0'/0/0",
          data: typedData,
        });
        
        // Check if successful
        if (!result.success) {
          throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, result.payload.error);
        }
        
        // Convert signature to hex
        const signature = '0x' + result.payload.signature;
        
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
          throw new DarkSwapError(ErrorCode.WALLET_NOT_CONNECTED, 'Trezor is not connected');
        }
        
        // Check if Trezor Connect is available
        if (!this.trezorConnect) {
          throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, 'Trezor Connect is not available');
        }
        
        // Get address
        const address = this.getAddress();
        
        // Check if address is available
        if (!address) {
          throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, 'No address available');
        }
        
        // Import required modules
        const ethers = await import('ethers');
        
        // Create provider
        const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/your-infura-project-id');
        
        // Create transaction
        const tx = {
          to: transaction.to,
          value: transaction.value ? BigInt(transaction.value) : BigInt(0),
          data: transaction.data || '0x',
          gasLimit: transaction.gas ? BigInt(transaction.gas) : undefined,
          gasPrice: transaction.gasPrice ? BigInt(transaction.gasPrice) : undefined,
          nonce: await provider.getTransactionCount(address),
          chainId: this.chainId,
        };
        
        // Sign transaction
        const result = await this.trezorConnect.ethereumSignTransaction({
          path: "m/44'/60'/0'/0/0",
          transaction: {
            to: tx.to,
            value: tx.value.toString(),
            data: tx.data,
            chainId: tx.chainId,
            nonce: tx.nonce.toString(),
            gasLimit: tx.gasLimit ? tx.gasLimit.toString() : undefined,
            gasPrice: tx.gasPrice ? tx.gasPrice.toString() : undefined,
          },
        });
        
        // Check if successful
        if (!result.success) {
          throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, result.payload.error);
        }
        
        // Create signed transaction
        const signedTx = ethers.Transaction.from({
          ...tx,
          signature: {
            r: '0x' + result.payload.r,
            s: '0x' + result.payload.s,
            v: parseInt(result.payload.v, 16),
          },
        });
        
        // Send transaction
        const txResponse = await provider.broadcastTransaction(signedTx.serialized);
        
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
 * Create a Trezor wallet provider
 * @param options Provider options
 * @returns Trezor wallet provider
 */
export function createTrezorWalletProvider(options?: TrezorWalletProviderOptions): TrezorWalletProvider {
  return new TrezorWalletProvider(options);
}