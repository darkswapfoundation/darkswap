/**
 * Trade Execution Service
 *
 * This service handles the trade execution flow, including:
 * - Creating PSBTs (Partially Signed Bitcoin Transactions)
 * - Signing PSBTs
 * - Broadcasting transactions
 * - Managing trade state
 *
 * It uses the WasmWalletService for wallet operations.
 */

import ApiClient from '../utils/ApiClient';
import { Order } from '../utils/ApiClient';
import WasmWalletService from './WasmWalletService';

// Trade execution states
export enum TradeExecutionState {
  INITIALIZED = 'initialized',
  CREATING_PSBT = 'creating_psbt',
  PSBT_CREATED = 'psbt_created',
  SIGNING_PSBT = 'signing_psbt',
  PSBT_SIGNED = 'psbt_signed',
  SENDING_TO_COUNTERPARTY = 'sending_to_counterparty',
  WAITING_FOR_COUNTERPARTY = 'waiting_for_counterparty',
  COUNTERPARTY_SIGNED = 'counterparty_signed',
  BROADCASTING = 'broadcasting',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// Trade execution error types
export enum TradeExecutionErrorType {
  NETWORK_ERROR = 'network_error',
  WALLET_ERROR = 'wallet_error',
  TIMEOUT_ERROR = 'timeout_error',
  VALIDATION_ERROR = 'validation_error',
  COUNTERPARTY_ERROR = 'counterparty_error',
  UNKNOWN_ERROR = 'unknown_error',
}

// Trade execution error
export interface TradeExecutionError {
  type: TradeExecutionErrorType;
  message: string;
  details?: any;
}

// PSBT data
export interface PsbtData {
  base64: string;
  hex?: string;
  inputs: PsbtInput[];
  outputs: PsbtOutput[];
  fee?: number;
}

// PSBT input
export interface PsbtInput {
  txid: string;
  vout: number;
  value: number;
  address?: string;
  scriptPubKey?: string;
  sequence?: number;
  witnessUtxo?: {
    script: string;
    value: number;
  };
}

// PSBT output
export interface PsbtOutput {
  address: string;
  value: number;
  script?: string;
}

// Trade execution options
export interface TradeExecutionOptions {
  timeoutMs?: number;
  retryCount?: number;
  retryDelayMs?: number;
  broadcastImmediately?: boolean;
}

// Trade execution result
export interface TradeExecutionResult {
  success: boolean;
  txid?: string;
  error?: TradeExecutionError;
  psbt?: PsbtData;
  state: TradeExecutionState;
}

// Trade execution event types
export enum TradeExecutionEventType {
  STATE_CHANGED = 'state_changed',
  ERROR = 'error',
  PROGRESS = 'progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Trade execution event
export interface TradeExecutionEvent {
  type: TradeExecutionEventType;
  data?: any;
  timestamp: number;
}

// Trade execution event listener
export type TradeExecutionEventListener = (event: TradeExecutionEvent) => void;

/**
 * Trade Execution Service
 */
export class TradeExecutionService {
  private apiClient: ApiClient;
  private walletService: WasmWalletService;
  private eventListeners: Map<TradeExecutionEventType, TradeExecutionEventListener[]> = new Map();
  private currentState: TradeExecutionState = TradeExecutionState.INITIALIZED;
  private currentPsbt?: PsbtData;
  private currentOrder?: Order;
  private currentError?: TradeExecutionError;
  private options: TradeExecutionOptions = {
    timeoutMs: 60000, // 1 minute
    retryCount: 3,
    retryDelayMs: 2000,
    broadcastImmediately: false,
  };

  /**
   * Create a new trade execution service
   * @param apiClient API client
   * @param options Trade execution options
   */
  constructor(apiClient: ApiClient, options?: Partial<TradeExecutionOptions>) {
    this.apiClient = apiClient;
    this.options = { ...this.options, ...options };
    this.walletService = WasmWalletService.getInstance();
    
    // Initialize the wallet service if needed
    this.initializeWalletService();
  }
  
  /**
   * Initialize the wallet service
   */
  private async initializeWalletService(): Promise<void> {
    try {
      await this.walletService.initialize();
    } catch (error) {
      console.error('Failed to initialize wallet service:', error);
      this.setError(
        TradeExecutionErrorType.WALLET_ERROR,
        `Failed to initialize wallet service: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
    }
  }

  /**
   * Add event listener
   * @param type Event type
   * @param listener Event listener
   */
  public addEventListener(type: TradeExecutionEventType, listener: TradeExecutionEventListener): void {
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
  public removeEventListener(type: TradeExecutionEventType, listener: TradeExecutionEventListener): void {
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
  private dispatchEvent(type: TradeExecutionEventType, data?: any): void {
    if (!this.eventListeners.has(type)) {
      return;
    }
    const event: TradeExecutionEvent = {
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
   * Set state
   * @param state New state
   */
  private setState(state: TradeExecutionState): void {
    if (this.currentState === state) {
      return;
    }
    const previousState = this.currentState;
    this.currentState = state;
    this.dispatchEvent(TradeExecutionEventType.STATE_CHANGED, {
      previousState,
      currentState: state,
    });
  }

  /**
   * Set error
   * @param type Error type
   * @param message Error message
   * @param details Error details
   */
  private setError(type: TradeExecutionErrorType, message: string, details?: any): void {
    this.currentError = {
      type,
      message,
      details,
    };
    this.dispatchEvent(TradeExecutionEventType.ERROR, this.currentError);
  }

  /**
   * Get current state
   * @returns Current state
   */
  public getState(): TradeExecutionState {
    return this.currentState;
  }

  /**
   * Get current error
   * @returns Current error
   */
  public getError(): TradeExecutionError | undefined {
    return this.currentError;
  }

  /**
   * Get current PSBT
   * @returns Current PSBT
   */
  public getPsbt(): PsbtData | undefined {
    return this.currentPsbt;
  }

  /**
   * Get current order
   * @returns Current order
   */
  public getOrder(): Order | undefined {
    return this.currentOrder;
  }

  /**
   * Reset state
   */
  public reset(): void {
    this.currentState = TradeExecutionState.INITIALIZED;
    this.currentPsbt = undefined;
    this.currentOrder = undefined;
    this.currentError = undefined;
  }

  /**
   * Execute trade
   * @param orderId Order ID
   * @param amount Amount to trade
   * @returns Trade execution result
   */
  public async executeTrade(orderId: string, amount: string): Promise<TradeExecutionResult> {
    try {
      this.reset();
      this.setState(TradeExecutionState.INITIALIZED);

      // Get order details
      const orderResponse = await this.apiClient.getOrder(orderId);
      if (orderResponse.error || !orderResponse.data) {
        this.setState(TradeExecutionState.FAILED);
        this.setError(
          TradeExecutionErrorType.NETWORK_ERROR,
          `Failed to get order details: ${orderResponse.error || 'Unknown error'}`
        );
        return {
          success: false,
          error: this.currentError,
          state: this.currentState,
        };
      }

      this.currentOrder = orderResponse.data;

      // Create PSBT
      this.setState(TradeExecutionState.CREATING_PSBT);
      const psbt = await this.createPsbt(orderId, amount);
      if (!psbt) {
        this.setState(TradeExecutionState.FAILED);
        return {
          success: false,
          error: this.currentError,
          state: this.currentState,
        };
      }

      this.currentPsbt = psbt;
      this.setState(TradeExecutionState.PSBT_CREATED);

      // Sign PSBT
      this.setState(TradeExecutionState.SIGNING_PSBT);
      const signedPsbt = await this.signPsbt(psbt);
      if (!signedPsbt) {
        this.setState(TradeExecutionState.FAILED);
        return {
          success: false,
          error: this.currentError,
          state: this.currentState,
        };
      }

      this.currentPsbt = signedPsbt;
      this.setState(TradeExecutionState.PSBT_SIGNED);

      // Send to counterparty
      this.setState(TradeExecutionState.SENDING_TO_COUNTERPARTY);
      const sentResult = await this.sendToCounterparty(orderId, signedPsbt);
      if (!sentResult) {
        this.setState(TradeExecutionState.FAILED);
        return {
          success: false,
          error: this.currentError,
          state: this.currentState,
        };
      }

      // Wait for counterparty
      this.setState(TradeExecutionState.WAITING_FOR_COUNTERPARTY);
      const counterpartySignedPsbt = await this.waitForCounterparty(orderId);
      if (!counterpartySignedPsbt) {
        this.setState(TradeExecutionState.FAILED);
        return {
          success: false,
          error: this.currentError,
          state: this.currentState,
        };
      }

      this.currentPsbt = counterpartySignedPsbt;
      this.setState(TradeExecutionState.COUNTERPARTY_SIGNED);

      // Broadcast transaction
      if (this.options.broadcastImmediately) {
        this.setState(TradeExecutionState.BROADCASTING);
        const txid = await this.broadcastTransaction(counterpartySignedPsbt);
        if (!txid) {
          this.setState(TradeExecutionState.FAILED);
          return {
            success: false,
            error: this.currentError,
            state: this.currentState,
          };
        }

        this.setState(TradeExecutionState.COMPLETED);
        return {
          success: true,
          txid,
          psbt: counterpartySignedPsbt,
          state: this.currentState,
        };
      }

      // Return without broadcasting
      return {
        success: true,
        psbt: counterpartySignedPsbt,
        state: this.currentState,
      };
    } catch (error) {
      this.setState(TradeExecutionState.FAILED);
      this.setError(
        TradeExecutionErrorType.UNKNOWN_ERROR,
        `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
      return {
        success: false,
        error: this.currentError,
        state: this.currentState,
      };
    }
  }

  /**
   * Create PSBT
   * @param orderId Order ID
   * @param amount Amount to trade
   * @returns PSBT data
   */
  private async createPsbt(orderId: string, amount: string): Promise<PsbtData | undefined> {
    try {
      // Check if wallet service is initialized and connected
      if (!this.walletService.isConnected()) {
        this.setError(
          TradeExecutionErrorType.WALLET_ERROR,
          'Wallet not connected. Please connect your wallet first.'
        );
        return undefined;
      }
      
      if (!this.currentOrder) {
        this.setError(
          TradeExecutionErrorType.VALIDATION_ERROR,
          'Order details not available'
        );
        return undefined;
      }
      
      // Determine inputs and outputs based on the order and amount
      // In a real implementation, this would involve more complex logic
      // to select UTXOs and calculate change
      
      // For now, we'll create a simplified version
      
      // Parse the amount
      const tradeAmount = parseFloat(amount);
      if (isNaN(tradeAmount) || tradeAmount <= 0) {
        this.setError(
          TradeExecutionErrorType.VALIDATION_ERROR,
          'Invalid trade amount'
        );
        return undefined;
      }
      
      // Calculate price from the order
      const price = parseFloat(this.currentOrder.price);
      if (isNaN(price) || price <= 0) {
        this.setError(
          TradeExecutionErrorType.VALIDATION_ERROR,
          'Invalid price in order'
        );
        return undefined;
      }
      
      // Calculate total value
      const totalValue = tradeAmount * price;
      
      // Create mock inputs and outputs
      // In a real implementation, these would be determined by the wallet
      const inputs = [
        {
          txid: 'fd0b2ea9615fd7ca8392c1c681ed79e9d9547c0f8961d56a26b5d5c5',
          vout: 0,
          value: Math.round(totalValue * 1.1 * 100000000), // Add some extra for fees
        },
      ];
      
      const outputs = [
        {
          // Counterparty address (in a real implementation, this would come from the order)
          address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
          value: Math.round(totalValue * 100000000), // Convert to satoshis
        },
        {
          // Change address (in a real implementation, this would be from the wallet)
          address: 'bc1qc7slrfxkknqcq2jevvvkdgvrt8080852dfjewde450xdlk4ugp7szw5tk9',
          value: Math.round(totalValue * 0.1 * 100000000), // 10% of the total as change
        },
      ];
      
      // Create the PSBT using the wallet service
      const psbtBase64 = await this.walletService.createPsbt(inputs, outputs);
      
      if (!psbtBase64) {
        this.setError(
          TradeExecutionErrorType.WALLET_ERROR,
          'Failed to create PSBT: No PSBT returned'
        );
        return undefined;
      }
      
      // Return the PSBT data
      return {
        base64: psbtBase64,
        inputs,
        outputs,
        fee: Math.round(totalValue * 0.001 * 100000000), // 0.1% fee
      };
    } catch (error) {
      this.setError(
        TradeExecutionErrorType.WALLET_ERROR,
        `Failed to create PSBT: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
      return undefined;
    }
  }

  /**
   * Sign PSBT
   * @param psbt PSBT data
   * @returns Signed PSBT data
   */
  private async signPsbt(psbt: PsbtData): Promise<PsbtData | undefined> {
    try {
      // Check if wallet service is initialized and connected
      if (!this.walletService.isConnected()) {
        this.setError(
          TradeExecutionErrorType.WALLET_ERROR,
          'Wallet not connected. Please connect your wallet first.'
        );
        return undefined;
      }
      
      // Sign the PSBT using the wallet service
      const signedPsbtBase64 = await this.walletService.signPsbt(psbt.base64);
      
      if (!signedPsbtBase64) {
        this.setError(
          TradeExecutionErrorType.WALLET_ERROR,
          'Failed to sign PSBT: No signature returned'
        );
        return undefined;
      }
      
      // Return the signed PSBT
      return {
        ...psbt,
        base64: signedPsbtBase64,
      };
    } catch (error) {
      this.setError(
        TradeExecutionErrorType.WALLET_ERROR,
        `Failed to sign PSBT: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
      return undefined;
    }
  }

  /**
   * Send PSBT to counterparty
   * @param orderId Order ID
   * @param psbt PSBT data
   * @returns Success status
   */
  private async sendToCounterparty(orderId: string, psbt: PsbtData): Promise<boolean> {
    try {
      // In a real implementation, this would call the API to send the PSBT to the counterparty
      // For now, we'll simulate it with a mock implementation
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      this.setError(
        TradeExecutionErrorType.NETWORK_ERROR,
        `Failed to send PSBT to counterparty: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
      return false;
    }
  }

  /**
   * Wait for counterparty to sign PSBT
   * @param orderId Order ID
   * @returns Counterparty signed PSBT data
   */
  private async waitForCounterparty(orderId: string): Promise<PsbtData | undefined> {
    try {
      // In a real implementation, this would poll the API to check if the counterparty has signed the PSBT
      // For now, we'll simulate it with a mock implementation
      
      // Simulate API call with some delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return the current PSBT (in a real implementation, it would be the counterparty signed PSBT)
      return this.currentPsbt;
    } catch (error) {
      this.setError(
        TradeExecutionErrorType.TIMEOUT_ERROR,
        `Timed out waiting for counterparty: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
      return undefined;
    }
  }

  /**
   * Broadcast transaction
   * @param psbt PSBT data
   * @returns Transaction ID
   */
  private async broadcastTransaction(psbt: PsbtData): Promise<string | undefined> {
    try {
      // Check if wallet service is initialized and connected
      if (!this.walletService.isConnected()) {
        this.setError(
          TradeExecutionErrorType.WALLET_ERROR,
          'Wallet not connected. Please connect your wallet first.'
        );
        return undefined;
      }
      
      // First, we need to extract the transaction from the PSBT
      const extractedTx = await this.walletService.extractTx(psbt.base64);
      
      if (!extractedTx) {
        this.setError(
          TradeExecutionErrorType.WALLET_ERROR,
          'Failed to extract transaction from PSBT'
        );
        return undefined;
      }
      
      // Broadcast the transaction using the wallet service
      const txid = await this.walletService.broadcastTx(extractedTx);
      
      if (!txid) {
        this.setError(
          TradeExecutionErrorType.NETWORK_ERROR,
          'Failed to broadcast transaction: No transaction ID returned'
        );
        return undefined;
      }
      
      return txid;
    } catch (error) {
      this.setError(
        TradeExecutionErrorType.NETWORK_ERROR,
        `Failed to broadcast transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
      return undefined;
    }
  }

  /**
   * Cancel trade
   * @returns Success status
   */
  public async cancelTrade(): Promise<boolean> {
    try {
      // Only allow cancellation in certain states
      if (
        this.currentState === TradeExecutionState.COMPLETED ||
        this.currentState === TradeExecutionState.FAILED ||
        this.currentState === TradeExecutionState.CANCELLED
      ) {
        return false;
      }
      
      this.setState(TradeExecutionState.CANCELLED);
      this.dispatchEvent(TradeExecutionEventType.CANCELLED);
      
      return true;
    } catch (error) {
      this.setError(
        TradeExecutionErrorType.UNKNOWN_ERROR,
        `Failed to cancel trade: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      );
      return false;
    }
  }
}

export default TradeExecutionService;