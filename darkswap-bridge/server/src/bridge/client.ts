import { spawn, ChildProcess } from 'child_process';
import { logger } from '../utils/logger';
import path from 'path';

// Define types for bridge messages
interface WalletMessage {
  type: 'wallet';
  action: string;
  payload: any;
}

interface NetworkMessage {
  type: 'network';
  action: string;
  payload: any;
}

interface SystemMessage {
  type: 'system';
  action: string;
  payload: any;
}

type BridgeMessage = WalletMessage | NetworkMessage | SystemMessage;

// Define types for bridge responses
interface WalletResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface NetworkResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface SystemResponse {
  success: boolean;
  data?: any;
  error?: string;
}

type BridgeResponse = WalletResponse | NetworkResponse | SystemResponse;

// Define types for bridge status
interface WalletStatus {
  status: 'connected' | 'disconnected';
  name?: string;
}

interface NetworkStatus {
  status: 'connected' | 'disconnected';
  peers: number;
}

interface WalletBalance {
  confirmed: number;
  unconfirmed: number;
}

interface Order {
  id: string;
  order_type: 'buy' | 'sell';
  sell_asset: string;
  sell_amount: number;
  buy_asset: string;
  buy_amount: number;
  peer_id: string;
  timestamp: number;
  status: 'open' | 'filled' | 'cancelled';
}

interface Trade {
  id: string;
  order_id: string;
  amount: number;
  initiator: string;
  counterparty: string;
  timestamp: number;
  status: 'proposed' | 'accepted' | 'rejected' | 'executing' | 'confirmed' | 'cancelled';
  transaction_id?: string;
}

export class BridgeClient {
  private bridgeProcess: ChildProcess | null = null;
  private walletStatus: WalletStatus = { status: 'disconnected' };
  private networkStatus: NetworkStatus = { status: 'disconnected', peers: 0 };
  private walletBalance: WalletBalance = { confirmed: 0, unconfirmed: 0 };
  private connectedPeers: string[] = [];
  private orders: Order[] = [];
  private trades: Trade[] = [];

  constructor() {}

  /**
   * Start the bridge client
   */
  public async start(): Promise<void> {
    try {
      // Start the bridge process
      const bridgePath = path.resolve(__dirname, '../../../target/release/darkswap-bridge');
      this.bridgeProcess = spawn(bridgePath, ['--server']);

      // Handle stdout
      this.bridgeProcess.stdout?.on('data', (data: Buffer) => {
        const message = data.toString().trim();
        logger.info(`Bridge: ${message}`);
        this.handleBridgeMessage(message);
      });

      // Handle stderr
      this.bridgeProcess.stderr?.on('data', (data: Buffer) => {
        const message = data.toString().trim();
        logger.error(`Bridge error: ${message}`);
      });

      // Handle process exit
      this.bridgeProcess.on('exit', (code: number | null, signal: string | null) => {
        if (code !== 0) {
          logger.error(`Bridge process exited with code ${code} and signal ${signal}`);
        } else {
          logger.info('Bridge process exited');
        }
        this.bridgeProcess = null;
      });

      logger.info('Bridge client started');
    } catch (error) {
      logger.error('Failed to start bridge client:', error);
      throw error;
    }
  }

  /**
   * Stop the bridge client
   */
  public async stop(): Promise<void> {
    if (this.bridgeProcess) {
      // Send shutdown message to bridge
      this.sendMessage({
        type: 'system',
        action: 'shutdown',
        payload: {},
      });

      // Wait for bridge process to exit
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          logger.warn('Bridge process did not exit gracefully, killing it');
          this.bridgeProcess?.kill();
          resolve();
        }, 5000);

        this.bridgeProcess?.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      this.bridgeProcess = null;
      logger.info('Bridge client stopped');
    }
  }

  /**
   * Send a message to the bridge
   */
  public sendMessage(message: BridgeMessage): Promise<BridgeResponse> {
    return new Promise((resolve, reject) => {
      if (!this.bridgeProcess) {
        reject(new Error('Bridge process not running'));
        return;
      }

      // Send message to bridge
      this.bridgeProcess.stdin?.write(JSON.stringify(message) + '\n');

      // TODO: Implement response handling
      // For now, just resolve with a dummy response
      resolve({
        success: true,
        data: {},
      });
    });
  }

  /**
   * Handle a message from the bridge
   */
  private handleBridgeMessage(message: string): void {
    try {
      const data = JSON.parse(message);

      if (data.type === 'wallet') {
        this.handleWalletMessage(data);
      } else if (data.type === 'network') {
        this.handleNetworkMessage(data);
      } else if (data.type === 'system') {
        this.handleSystemMessage(data);
      }
    } catch (error) {
      logger.error('Failed to parse bridge message:', error);
    }
  }

  /**
   * Handle a wallet message from the bridge
   */
  private handleWalletMessage(message: WalletMessage): void {
    if (message.action === 'status') {
      this.walletStatus = message.payload;
    } else if (message.action === 'balance') {
      this.walletBalance = message.payload;
    }
  }

  /**
   * Handle a network message from the bridge
   */
  private handleNetworkMessage(message: NetworkMessage): void {
    if (message.action === 'status') {
      this.networkStatus = message.payload;
    } else if (message.action === 'peers') {
      this.connectedPeers = message.payload;
    } else if (message.action === 'orders') {
      this.orders = message.payload;
    } else if (message.action === 'trades') {
      this.trades = message.payload;
    }
  }

  /**
   * Handle a system message from the bridge
   */
  private handleSystemMessage(message: SystemMessage): void {
    // TODO: Implement system message handling
  }

  /**
   * Get the wallet status
   */
  public getWalletStatus(): WalletStatus {
    return this.walletStatus;
  }

  /**
   * Get the network status
   */
  public getNetworkStatus(): NetworkStatus {
    return this.networkStatus;
  }

  /**
   * Get the wallet balance
   */
  public getWalletBalance(): WalletBalance {
    return this.walletBalance;
  }

  /**
   * Get the connected peers
   */
  public getConnectedPeers(): string[] {
    return this.connectedPeers;
  }

  /**
   * Get the orders
   */
  public getOrders(): Order[] {
    return this.orders;
  }

  /**
   * Get the trades
   */
  public getTrades(): Trade[] {
    return this.trades;
  }
}