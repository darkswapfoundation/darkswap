/**
 * MetaMask wallet provider
 * 
 * This module provides utilities for integrating with the MetaMask wallet.
 * It allows users to connect their MetaMask wallet to the DarkSwap application
 * and use it for signing transactions and managing assets.
 */

import { ErrorCode, DarkSwapError, tryAsync } from './ErrorHandling';

/**
 * MetaMask provider interface
 */
interface MetaMaskProvider {
  isMetaMask: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (eventName: string, callback: (params: any) => void) => void;
  removeListener: (eventName: string, callback: (params: any) => void) => void;
  selectedAddress: string | null;
  chainId: string | null;
  isConnected: () => boolean;
}

/**
 * MetaMask wallet provider
 */
export class MetaMaskWalletProvider {
  /**
   * MetaMask provider
   */
  private provider: MetaMaskProvider | null = null;

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
  private chainId: string | null = null;

  /**
   * Account change listeners
   */
  private accountChangeListeners: ((accounts: string[]) => void)[] = [];

  /**
   * Chain change listeners
   */
  private chainChangeListeners: ((chainId: string) => void)[] = [];

  /**
   * Connect change listeners
   */
  private connectListeners: ((connectInfo: { chainId: string }) => void)[] = [];

  /**
   * Disconnect listeners
   */
  private disconnectListeners: ((error: { code: number; message: string }) => void)[] = [];

  /**
   * Check if MetaMask is installed
   * @returns Whether MetaMask is installed
   */
  isMetaMaskInstalled(): boolean {
    return typeof window !== 'undefined' && 
           typeof (window as any).ethereum !== 'undefined' && 
           (window as any).ethereum.isMetaMask;
  }

  /**
   * Get MetaMask provider
   * @returns MetaMask provider
   */
  getProvider(): MetaMaskProvider | null {
    if (!this.isMetaMaskInstalled()) {
      return null;
    }
    
    if (!this.provider) {
      this.provider = (window as any).ethereum as MetaMaskProvider;
    }
    
    return this.provider;
  }

  /**
   * Connect to MetaMask
   * @returns Connected accounts
   */
  async connect(): Promise<string[]> {
    return tryAsync(async () => {
      const provider = this.getProvider();
      
      if (!provider) {
        throw new DarkSwapError(ErrorCode.WALLET_NOT_INSTALLED, 'MetaMask is not installed');
      }
      
      try {
        // Request accounts
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        
        // Set connected state
        this.connected = true;
        
        // Set selected address
        this.address = accounts[0];
        
        // Set chain ID
        this.chainId = provider.chainId;
        
        // Set up event listeners
        this.setupEventListeners();
        
        return accounts;
      } catch (error: any) {
        if (error.code === 4001) {
          // User rejected the request
          throw new DarkSwapError(ErrorCode.USER_REJECTED, 'User rejected the connection request');
        }
        
        throw new DarkSwapError(ErrorCode.WALLET_CONNECTION_FAILED, `Failed to connect to MetaMask: ${error.message}`);
      }
    }, ErrorCode.WALLET_CONNECTION_FAILED, 'Failed to connect to MetaMask');
  }

  /**
   * Disconnect from MetaMask
   */
  disconnect(): void {
    // Remove event listeners
    this.removeEventListeners();
    
    // Reset state
    this.connected = false;
    this.address = null;
    this.chainId = null;
  }

  /**
   * Check if connected to MetaMask
   * @returns Whether connected to MetaMask
   */
  isConnected(): boolean {
    return this.connected && !!this.address;
  }

  /**
   * Get connected address
   * @returns Connected address
   */
  getAddress(): string | null {
    return this.address;
  }

  /**
   * Get chain ID
   * @returns Chain ID
   */
  getChainId(): string | null {
    return this.chainId;
  }

  /**
   * Get network name
   * @returns Network name
   */
  getNetworkName(): string {
    if (!this.chainId) {
      return 'Unknown';
    }
    
    const chainId = parseInt(this.chainId, 16);
    
    switch (chainId) {
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
        return `Chain ID ${chainId}`;
    }
  }

  /**
   * Get balance
   * @param address Address to get balance for (defaults to connected address)
   * @returns Balance in wei
   */
  async getBalance(address?: string): Promise<string> {
    return tryAsync(async () => {
      const provider = this.getProvider();
      
      if (!provider) {
        throw new DarkSwapError(ErrorCode.WALLET_NOT_INSTALLED, 'MetaMask is not installed');
      }
      
      if (!this.isConnected()) {
        throw new DarkSwapError(ErrorCode.WALLET_NOT_CONNECTED, 'MetaMask is not connected');
      }
      
      const targetAddress = address || this.address;
      
      if (!targetAddress) {
        throw new DarkSwapError(ErrorCode.INVALID_ADDRESS, 'No address provided');
      }
      
      try {
        // Get balance
        const balance = await provider.request({
          method: 'eth_getBalance',
          params: [targetAddress, 'latest'],
        });
        
        return balance;
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
    to: string;
    value?: string;
    data?: string;
    gas?: string;
    gasPrice?: string;
  }): Promise<string> {
    return tryAsync(async () => {
      const provider = this.getProvider();
      
      if (!provider) {
        throw new DarkSwapError(ErrorCode.WALLET_NOT_INSTALLED, 'MetaMask is not installed');
      }
      
      if (!this.isConnected()) {
        throw new DarkSwapError(ErrorCode.WALLET_NOT_CONNECTED, 'MetaMask is not connected');
      }
      
      if (!this.address) {
        throw new DarkSwapError(ErrorCode.INVALID_ADDRESS, 'No address provided');
      }
      
      try {
        // Send transaction
        const txHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [{
            from: this.address,
            to: transaction.to,
            value: transaction.value,
            data: transaction.data,
            gas: transaction.gas,
            gasPrice: transaction.gasPrice,
          }],
        });
        
        return txHash;
      } catch (error: any) {
        if (error.code === 4001) {
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
      const provider = this.getProvider();
      
      if (!provider) {
        throw new DarkSwapError(ErrorCode.WALLET_NOT_INSTALLED, 'MetaMask is not installed');
      }
      
      if (!this.isConnected()) {
        throw new DarkSwapError(ErrorCode.WALLET_NOT_CONNECTED, 'MetaMask is not connected');
      }
      
      if (!this.address) {
        throw new DarkSwapError(ErrorCode.INVALID_ADDRESS, 'No address provided');
      }
      
      try {
        // Convert message to hex
        const hexMessage = '0x' + Buffer.from(message).toString('hex');
        
        // Sign message
        const signature = await provider.request({
          method: 'personal_sign',
          params: [hexMessage, this.address],
        });
        
        return signature;
      } catch (error: any) {
        if (error.code === 4001) {
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
      const provider = this.getProvider();
      
      if (!provider) {
        throw new DarkSwapError(ErrorCode.WALLET_NOT_INSTALLED, 'MetaMask is not installed');
      }
      
      if (!this.isConnected()) {
        throw new DarkSwapError(ErrorCode.WALLET_NOT_CONNECTED, 'MetaMask is not connected');
      }
      
      if (!this.address) {
        throw new DarkSwapError(ErrorCode.INVALID_ADDRESS, 'No address provided');
      }
      
      try {
        // Sign typed data
        const signature = await provider.request({
          method: 'eth_signTypedData_v4',
          params: [this.address, JSON.stringify(typedData)],
        });
        
        return signature;
      } catch (error: any) {
        if (error.code === 4001) {
          // User rejected the request
          throw new DarkSwapError(ErrorCode.USER_REJECTED, 'User rejected the signing request');
        }
        
        throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, `Failed to sign typed data: ${error.message}`);
      }
    }, ErrorCode.WALLET_OPERATION_FAILED, 'Failed to sign typed data');
  }

  /**
   * Add token to MetaMask
   * @param token Token to add
   * @returns Whether the token was added
   */
  async addToken(token: {
    address: string;
    symbol: string;
    decimals: number;
    image?: string;
  }): Promise<boolean> {
    return tryAsync(async () => {
      const provider = this.getProvider();
      
      if (!provider) {
        throw new DarkSwapError(ErrorCode.WALLET_NOT_INSTALLED, 'MetaMask is not installed');
      }
      
      if (!this.isConnected()) {
        throw new DarkSwapError(ErrorCode.WALLET_NOT_CONNECTED, 'MetaMask is not connected');
      }
      
      try {
        // Add token
        const wasAdded = await provider.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: token.address,
              symbol: token.symbol,
              decimals: token.decimals,
              image: token.image,
            },
          },
        });
        
        return wasAdded;
      } catch (error: any) {
        if (error.code === 4001) {
          // User rejected the request
          throw new DarkSwapError(ErrorCode.USER_REJECTED, 'User rejected the request to add the token');
        }
        
        throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, `Failed to add token: ${error.message}`);
      }
    }, ErrorCode.WALLET_OPERATION_FAILED, 'Failed to add token');
  }

  /**
   * Switch to chain
   * @param chainId Chain ID
   * @returns Whether the chain was switched
   */
  async switchChain(chainId: string): Promise<boolean> {
    return tryAsync(async () => {
      const provider = this.getProvider();
      
      if (!provider) {
        throw new DarkSwapError(ErrorCode.WALLET_NOT_INSTALLED, 'MetaMask is not installed');
      }
      
      if (!this.isConnected()) {
        throw new DarkSwapError(ErrorCode.WALLET_NOT_CONNECTED, 'MetaMask is not connected');
      }
      
      try {
        // Switch chain
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId }],
        });
        
        return true;
      } catch (error: any) {
        if (error.code === 4001) {
          // User rejected the request
          throw new DarkSwapError(ErrorCode.USER_REJECTED, 'User rejected the request to switch chains');
        }
        
        if (error.code === 4902) {
          // Chain not added
          throw new DarkSwapError(ErrorCode.CHAIN_NOT_ADDED, 'Chain not added to MetaMask');
        }
        
        throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, `Failed to switch chain: ${error.message}`);
      }
    }, ErrorCode.WALLET_OPERATION_FAILED, 'Failed to switch chain');
  }

  /**
   * Add chain
   * @param chain Chain to add
   * @returns Whether the chain was added
   */
  async addChain(chain: {
    chainId: string;
    chainName: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    rpcUrls: string[];
    blockExplorerUrls?: string[];
    iconUrls?: string[];
  }): Promise<boolean> {
    return tryAsync(async () => {
      const provider = this.getProvider();
      
      if (!provider) {
        throw new DarkSwapError(ErrorCode.WALLET_NOT_INSTALLED, 'MetaMask is not installed');
      }
      
      if (!this.isConnected()) {
        throw new DarkSwapError(ErrorCode.WALLET_NOT_CONNECTED, 'MetaMask is not connected');
      }
      
      try {
        // Add chain
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [chain],
        });
        
        return true;
      } catch (error: any) {
        if (error.code === 4001) {
          // User rejected the request
          throw new DarkSwapError(ErrorCode.USER_REJECTED, 'User rejected the request to add the chain');
        }
        
        throw new DarkSwapError(ErrorCode.WALLET_OPERATION_FAILED, `Failed to add chain: ${error.message}`);
      }
    }, ErrorCode.WALLET_OPERATION_FAILED, 'Failed to add chain');
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
  addChainChangeListener(listener: (chainId: string) => void): void {
    this.chainChangeListeners.push(listener);
  }

  /**
   * Remove chain change listener
   * @param listener Listener function
   */
  removeChainChangeListener(listener: (chainId: string) => void): void {
    this.chainChangeListeners = this.chainChangeListeners.filter(l => l !== listener);
  }

  /**
   * Add connect listener
   * @param listener Listener function
   */
  addConnectListener(listener: (connectInfo: { chainId: string }) => void): void {
    this.connectListeners.push(listener);
  }

  /**
   * Remove connect listener
   * @param listener Listener function
   */
  removeConnectListener(listener: (connectInfo: { chainId: string }) => void): void {
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
    const provider = this.getProvider();
    
    if (!provider) {
      return;
    }
    
    // Account change
    provider.on('accountsChanged', this.handleAccountsChanged);
    
    // Chain change
    provider.on('chainChanged', this.handleChainChanged);
    
    // Connect
    provider.on('connect', this.handleConnect);
    
    // Disconnect
    provider.on('disconnect', this.handleDisconnect);
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    const provider = this.getProvider();
    
    if (!provider) {
      return;
    }
    
    // Account change
    provider.removeListener('accountsChanged', this.handleAccountsChanged);
    
    // Chain change
    provider.removeListener('chainChanged', this.handleChainChanged);
    
    // Connect
    provider.removeListener('connect', this.handleConnect);
    
    // Disconnect
    provider.removeListener('disconnect', this.handleDisconnect);
  }

  /**
   * Handle accounts changed event
   * @param accounts Changed accounts
   */
  private handleAccountsChanged = (accounts: string[]): void => {
    if (accounts.length === 0) {
      // Disconnected
      this.connected = false;
      this.address = null;
    } else {
      // Connected
      this.connected = true;
      this.address = accounts[0];
    }
    
    // Notify listeners
    this.accountChangeListeners.forEach(listener => {
      try {
        listener(accounts);
      } catch (error) {
        console.error('Error in account change listener:', error);
      }
    });
  };

  /**
   * Handle chain changed event
   * @param chainId Changed chain ID
   */
  private handleChainChanged = (chainId: string): void => {
    // Update chain ID
    this.chainId = chainId;
    
    // Notify listeners
    this.chainChangeListeners.forEach(listener => {
      try {
        listener(chainId);
      } catch (error) {
        console.error('Error in chain change listener:', error);
      }
    });
  };

  /**
   * Handle connect event
   * @param connectInfo Connect info
   */
  private handleConnect = (connectInfo: { chainId: string }): void => {
    // Update connected state
    this.connected = true;
    
    // Update chain ID
    this.chainId = connectInfo.chainId;
    
    // Notify listeners
    this.connectListeners.forEach(listener => {
      try {
        listener(connectInfo);
      } catch (error) {
        console.error('Error in connect listener:', error);
      }
    });
  };

  /**
   * Handle disconnect event
   * @param error Disconnect error
   */
  private handleDisconnect = (error: { code: number; message: string }): void => {
    // Update connected state
    this.connected = false;
    
    // Update address
    this.address = null;
    
    // Update chain ID
    this.chainId = null;
    
    // Notify listeners
    this.disconnectListeners.forEach(listener => {
      try {
        listener(error);
      } catch (error) {
        console.error('Error in disconnect listener:', error);
      }
    });
  };
}

/**
 * Create a new MetaMask wallet provider
 * @returns MetaMask wallet provider
 */
export function createMetaMaskWalletProvider(): MetaMaskWalletProvider {
  return new MetaMaskWalletProvider();
}