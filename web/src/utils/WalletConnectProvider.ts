/**
 * WalletConnect provider
 * 
 * This module provides utilities for integrating with WalletConnect.
 * It allows users to connect their wallet to the DarkSwap application
 * using WalletConnect and use it for signing transactions and managing assets.
 */

import { ErrorCode, DarkSwapError, tryAsync } from './ErrorHandling';
import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';

/**
 * WalletConnect provider
 */
export class WalletConnectProvider {
  /**
   * WalletConnect connector
   */
  private connector: WalletConnect | null = null;

  /**
   * Whether the provider is connected
   */
  private connected: boolean = false;

  /**
   * Selected address
   */
  private address: string | null = null;

  /**
   * Chain ID
   */
  private chainId: number | null = null;

  /**
   * Account change listeners
   */
  private accountChangeListeners: ((accounts: string[]) => void)[] = [];

  /**
   * Chain change listeners
   */
  private chainChangeListeners: ((chainId: number) => void)[] = [];

  /**
   * Connect change listeners
   */
  private connectListeners: ((connectInfo: { chainId: number }) => void)[] = [];

  /**
   * Disconnect listeners
   */
  private disconnectListeners: ((error: { code: number; message: string }) => void)[] = [];

  /**
   * Create a new WalletConnect provider
   * @param options WalletConnect options
   */
  constructor(private options: {
    bridge?: string;
    qrcodeModal?: any;
    storageId?: string;
  } = {}) {
    // Set default options
    this.options = {
      bridge: 'https://bridge.walletconnect.org',
      qrcodeModal: QRCodeModal,
      storageId: 'walletconnect',
      ...options,
    };
  }

  /**
   * Check if WalletConnect is supported
   * @returns Whether WalletConnect is supported
   */
  isWalletConnectSupported(): boolean {
    return typeof window !== 'undefined';
  }

  /**
   * Get WalletConnect connector
   * @returns WalletConnect connector
   */
  getConnector(): WalletConnect | null {
    if (!this.isWalletConnectSupported()) {
      return null;
    }
    
    if (!this.connector) {
      this.connector = new WalletConnect({
        bridge: this.options.bridge,
        qrcodeModal: this.options.qrcodeModal,
        storageId: this.options.storageId,
      });
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Check if already connected
      if (this.connector.connected) {
        this.connected = true;
        this.address = this.connector.accounts[0];
        this.chainId = this.connector.chainId;
      }
    }
    
    return this.connector;
  }

  /**
   * Connect to WalletConnect
   * @returns Connected accounts
   */
  async connect(): Promise<string[]> {
    return tryAsync(async () => {
      const connector = this.getConnector();
      
      if (!connector) {
        throw new DarkSwapError(ErrorCode.WALLET_NOT_SUPPORTED, 'WalletConnect is not supported');
      }
      
      try {
        // Create session
        if (!connector.connected) {
          await connector.createSession();
        }
        
        // Wait for connection
        return new Promise<string[]>((resolve, reject) => {
          // Set up event listeners
          const onConnect = (error: Error | null, payload: any) => {
            // Remove event listener
            connector.off('connect', onConnect);
            
            if (error) {
              reject(error);
              return;
            }
            
            // Set connected state
            this.connected = true;
            
            // Set selected address
            this.address = connector.accounts[0];
            
            // Set chain ID
            this.chainId = connector.chainId;
            
            // Resolve with accounts
            resolve(connector.accounts);
          };
          
          // Listen for connection
          connector.on('connect', onConnect);
          
          // If already connected, resolve immediately
          if (connector.connected) {
            connector.off('connect', onConnect);
            this.connected = true;
            this.address = connector.accounts[0];
            this.chainId = connector.chainId;
            resolve(connector.accounts);
          }
        });
      } catch (error: any) {
        if (error.message === 'User rejected') {
          // User rejected the request
          throw new DarkSwapError(ErrorCode.USER_REJECTED, 'User rejected the connection request');
        }
        
        throw new DarkSwapError(ErrorCode.WALLET_CONNECTION_FAILED, `Failed to connect to WalletConnect: ${error.message}`);
      }
    }, ErrorCode.WALLET_CONNECTION_FAILED, 'Failed to connect to WalletConnect');
  }

  /**
   * Disconnect from WalletConnect
   */
  async disconnect(): Promise<void> {
    return tryAsync(async () => {
      const connector = this.getConnector();
      
      if (!connector) {
        return;
      }
      
      try {
        // Kill session
        await connector.killSession();
        
        // Reset state
        this.connected = false;
        this.address = null;
        this.chainId = null;
      } catch (error: any) {
        throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, `Failed to disconnect from WalletConnect: ${error.message}`);
      }
    }, ErrorCode.WALLET_OPERATION_FAILED, 'Failed to disconnect from WalletConnect');
  }

  /**
   * Check if connected to WalletConnect
   * @returns Whether connected to WalletConnect
   */
  isConnected(): boolean {
    const connector = this.getConnector();
    return !!connector && connector.connected;
  }

  /**
   * Get connected address
   * @returns Connected address
   */
  getAddress(): string | null {
    const connector = this.getConnector();
    return connector && connector.connected ? connector.accounts[0] : null;
  }

  /**
   * Get chain ID
   * @returns Chain ID
   */
  getChainId(): number | null {
    const connector = this.getConnector();
    return connector && connector.connected ? connector.chainId : null;
  }

  /**
   * Get network name
   * @returns Network name
   */
  getNetworkName(): string {
    if (!this.chainId) {
      return 'Unknown';
    }
    
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
        return `Chain ID ${this.chainId}`;
    }
  }

  /**
   * Get balance
   * @param address Address to get balance for (defaults to connected address)
   * @returns Balance in wei
   */
  async getBalance(address?: string): Promise<string> {
    return tryAsync(async () => {
      const connector = this.getConnector();
      
      if (!connector) {
        throw new DarkSwapError(ErrorCode.WALLET_NOT_SUPPORTED, 'WalletConnect is not supported');
      }
      
      if (!connector.connected) {
        throw new DarkSwapError(ErrorCode.WALLET_NOT_CONNECTED, 'WalletConnect is not connected');
      }
      
      const targetAddress = address || this.address;
      
      if (!targetAddress) {
        throw new DarkSwapError(ErrorCode.INVALID_ADDRESS, 'No address provided');
      }
      
      try {
        // Get balance
        const result = await connector.sendCustomRequest({
          method: 'eth_getBalance',
          params: [targetAddress, 'latest'],
        });
        
        return result;
      } catch (error: any) {
        throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, `Failed to get balance: ${error.message}`);
      }
    }, ErrorCode.WALLET_OPERATION_FAILED, 'Failed to get balance');
  }

  /**
   * Send transaction
   * @param transaction Transaction to send
   * @returns Transaction hash
   */
  async sendTransaction(transaction: {
    from: string;
    to: string;
    value?: string;
    data?: string;
    gas?: string;
    gasPrice?: string;
  }): Promise<string> {
    return tryAsync(async () => {
      const connector = this.getConnector();
      
      if (!connector) {
        throw new DarkSwapError(ErrorCode.WALLET_NOT_SUPPORTED, 'WalletConnect is not supported');
      }
      
      if (!connector.connected) {
        throw new DarkSwapError(ErrorCode.WALLET_NOT_CONNECTED, 'WalletConnect is not connected');
      }
      
      try {
        // Send transaction
        const result = await connector.sendTransaction(transaction);
        
        return result;
      } catch (error: any) {
        if (error.message === 'User rejected') {
          // User rejected the request
          throw new DarkSwapError(ErrorCode.USER_REJECTED, 'User rejected the transaction');
        }
        
        throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, `Failed to send transaction: ${error.message}`);
      }
    }, ErrorCode.WALLET_OPERATION_FAILED, 'Failed to send transaction');
  }

  /**
   * Sign message
   * @param message Message to sign
   * @returns Signature
   */
  async signMessage(message: string): Promise<string> {
    return tryAsync(async () => {
      const connector = this.getConnector();
      
      if (!connector) {
        throw new DarkSwapError(ErrorCode.WALLET_NOT_SUPPORTED, 'WalletConnect is not supported');
      }
      
      if (!connector.connected) {
        throw new DarkSwapError(ErrorCode.WALLET_NOT_CONNECTED, 'WalletConnect is not connected');
      }
      
      if (!this.address) {
        throw new DarkSwapError(ErrorCode.INVALID_ADDRESS, 'No address provided');
      }
      
      try {
        // Convert message to hex
        const hexMessage = '0x' + Buffer.from(message).toString('hex');
        
        // Sign message
        const result = await connector.signPersonalMessage([hexMessage, this.address]);
        
        return result;
      } catch (error: any) {
        if (error.message === 'User rejected') {
          // User rejected the request
          throw new DarkSwapError(ErrorCode.USER_REJECTED, 'User rejected the signing request');
        }
        
        throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, `Failed to sign message: ${error.message}`);
      }
    }, ErrorCode.WALLET_OPERATION_FAILED, 'Failed to sign message');
  }

  /**
   * Sign typed data (EIP-712)
   * @param typedData Typed data to sign
   * @returns Signature
   */
  async signTypedData(typedData: any): Promise<string> {
    return tryAsync(async () => {
      const connector = this.getConnector();
      
      if (!connector) {
        throw new DarkSwapError(ErrorCode.WALLET_NOT_SUPPORTED, 'WalletConnect is not supported');
      }
      
      if (!connector.connected) {
        throw new DarkSwapError(ErrorCode.WALLET_NOT_CONNECTED, 'WalletConnect is not connected');
      }
      
      if (!this.address) {
        throw new DarkSwapError(ErrorCode.INVALID_ADDRESS, 'No address provided');
      }
      
      try {
        // Sign typed data
        const result = await connector.signTypedData([this.address, JSON.stringify(typedData)]);
        
        return result;
      } catch (error: any) {
        if (error.message === 'User rejected') {
          // User rejected the request
          throw new DarkSwapError(ErrorCode.USER_REJECTED, 'User rejected the signing request');
        }
        
        throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, `Failed to sign typed data: ${error.message}`);
      }
    }, ErrorCode.WALLET_OPERATION_FAILED, 'Failed to sign typed data');
  }

  /**
   * Add account change listener
   * @param listener Listener function
   */
  addAccountChangeListener(listener: (accounts: string[]) => void): void {
    this.accountChangeListeners.push(listener);
  }

  /**
   * Remove account change listener
   * @param listener Listener function
   */
  removeAccountChangeListener(listener: (accounts: string[]) => void): void {
    this.accountChangeListeners = this.accountChangeListeners.filter(l => l !== listener);
  }

  /**
   * Add chain change listener
   * @param listener Listener function
   */
  addChainChangeListener(listener: (chainId: number) => void): void {
    this.chainChangeListeners.push(listener);
  }

  /**
   * Remove chain change listener
   * @param listener Listener function
   */
  removeChainChangeListener(listener: (chainId: number) => void): void {
    this.chainChangeListeners = this.chainChangeListeners.filter(l => l !== listener);
  }

  /**
   * Add connect listener
   * @param listener Listener function
   */
  addConnectListener(listener: (connectInfo: { chainId: number }) => void): void {
    this.connectListeners.push(listener);
  }

  /**
   * Remove connect listener
   * @param listener Listener function
   */
  removeConnectListener(listener: (connectInfo: { chainId: number }) => void): void {
    this.connectListeners = this.connectListeners.filter(l => l !== listener);
  }

  /**
   * Add disconnect listener
   * @param listener Listener function
   */
  addDisconnectListener(listener: (error: { code: number; message: string }) => void): void {
    this.disconnectListeners.push(listener);
  }

  /**
   * Remove disconnect listener
   * @param listener Listener function
   */
  removeDisconnectListener(listener: (error: { code: number; message: string }) => void): void {
    this.disconnectListeners = this.disconnectListeners.filter(l => l !== listener);
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    const connector = this.getConnector();
    
    if (!connector) {
      return;
    }
    
    // Account change
    connector.on('session_update', (error, payload) => {
      if (error) {
        console.error('WalletConnect session update error:', error);
        return;
      }
      
      const { accounts, chainId } = payload.params[0];
      
      // Update address
      this.address = accounts[0];
      
      // Update chain ID
      this.chainId = chainId;
      
      // Notify account change listeners
      this.accountChangeListeners.forEach(listener => {
        try {
          listener(accounts);
        } catch (error) {
          console.error('Error in account change listener:', error);
        }
      });
      
      // Notify chain change listeners
      this.chainChangeListeners.forEach(listener => {
        try {
          listener(chainId);
        } catch (error) {
          console.error('Error in chain change listener:', error);
        }
      });
    });
    
    // Connect
    connector.on('connect', (error, payload) => {
      if (error) {
        console.error('WalletConnect connect error:', error);
        return;
      }
      
      const { accounts, chainId } = payload.params[0];
      
      // Update connected state
      this.connected = true;
      
      // Update address
      this.address = accounts[0];
      
      // Update chain ID
      this.chainId = chainId;
      
      // Notify connect listeners
      this.connectListeners.forEach(listener => {
        try {
          listener({ chainId });
        } catch (error) {
          console.error('Error in connect listener:', error);
        }
      });
    });
    
    // Disconnect
    connector.on('disconnect', (error, payload) => {
      if (error) {
        console.error('WalletConnect disconnect error:', error);
        return;
      }
      
      // Update connected state
      this.connected = false;
      
      // Update address
      this.address = null;
      
      // Update chain ID
      this.chainId = null;
      
      // Notify disconnect listeners
      this.disconnectListeners.forEach(listener => {
        try {
          listener({ code: 1000, message: 'Disconnected' });
        } catch (error) {
          console.error('Error in disconnect listener:', error);
        }
      });
    });
  }
}

/**
 * Create a new WalletConnect provider
 * @param options WalletConnect options
 * @returns WalletConnect provider
 */
export function createWalletConnectProvider(options?: {
  bridge?: string;
  qrcodeModal?: any;
  storageId?: string;
}): WalletConnectProvider {
  return new WalletConnectProvider(options);
}