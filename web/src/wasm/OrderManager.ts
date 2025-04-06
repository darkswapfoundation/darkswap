/**
 * OrderManager - Manages orders using the DarkSwap WebAssembly module
 * 
 * This class provides a higher-level interface for managing orders using the
 * DarkSwap WebAssembly module.
 */

import DarkSwapWasm, { AssetType, OrderSide, Order } from './DarkSwapWasm';
import { 
  DarkSwapError, 
  ErrorCode, 
  OrderError, 
  createError, 
  logError, 
  tryAsync 
} from '../utils/ErrorHandling';

// Order creation parameters
export interface CreateOrderParams {
  side: OrderSide;
  baseAssetType: AssetType;
  baseAssetId: string;
  quoteAssetType: AssetType;
  quoteAssetId: string;
  amount: string;
  price: string;
}

// Order filter parameters
export interface OrderFilterParams {
  side?: OrderSide;
  baseAssetType?: AssetType;
  baseAssetId?: string;
  quoteAssetType?: AssetType;
  quoteAssetId?: string;
}

/**
 * OrderManager class
 */
export class OrderManager {
  private darkswap: DarkSwapWasm;
  
  /**
   * Create a new OrderManager
   * @param darkswap DarkSwap WebAssembly instance
   */
  constructor(darkswap: DarkSwapWasm) {
    this.darkswap = darkswap;
  }
  
  /**
   * Create a new order
   * @param params Order creation parameters
   * @returns Promise that resolves with the order ID
   * @throws OrderError if creating the order fails
   */
  public async createOrder(params: CreateOrderParams): Promise<string> {
    return tryAsync(async () => {
      try {
        // Validate parameters
        this.validateCreateOrderParams(params);
        
        // Create order
        return await this.darkswap.createOrder(
          params.side,
          params.baseAssetType,
          params.baseAssetId,
          params.quoteAssetType,
          params.quoteAssetId,
          params.amount,
          params.price,
        );
      } catch (error) {
        // If the error is already an OrderError, rethrow it
        if (error instanceof OrderError) {
          throw error;
        }
        
        // Otherwise, create a new OrderError
        throw new OrderError(
          `Failed to create order: ${error instanceof Error ? error.message : String(error)}`,
          ErrorCode.OrderCreationFailed,
          {
            params,
            originalError: error,
          }
        );
      }
    }, error => {
      // Log error
      logError(error, 'OrderManager.createOrder');
      
      // Rethrow error
      throw error;
    });
  }
  
  /**
   * Cancel an order
   * @param orderId Order ID
   * @returns Promise that resolves when the order is cancelled
   * @throws OrderError if cancelling the order fails
   */
  public async cancelOrder(orderId: string): Promise<void> {
    return tryAsync(async () => {
      try {
        // Validate order ID
        if (!orderId) {
          throw new OrderError(
            'Order ID is required',
            ErrorCode.InvalidArgument
          );
        }
        
        // Cancel order
        await this.darkswap.cancelOrder(orderId);
      } catch (error) {
        // If the error is already an OrderError, rethrow it
        if (error instanceof OrderError) {
          throw error;
        }
        
        // Otherwise, create a new OrderError
        throw new OrderError(
          `Failed to cancel order: ${error instanceof Error ? error.message : String(error)}`,
          ErrorCode.OrderCancellationFailed,
          {
            orderId,
            originalError: error,
          }
        );
      }
    }, error => {
      // Log error
      logError(error, 'OrderManager.cancelOrder');
      
      // Rethrow error
      throw error;
    });
  }
  
  /**
   * Get an order by ID
   * @param orderId Order ID
   * @returns Promise that resolves with the order
   * @throws OrderError if getting the order fails
   */
  public async getOrder(orderId: string): Promise<Order> {
    return tryAsync(async () => {
      try {
        // Validate order ID
        if (!orderId) {
          throw new OrderError(
            'Order ID is required',
            ErrorCode.InvalidArgument
          );
        }
        
        // Get order
        return await this.darkswap.getOrder(orderId);
      } catch (error) {
        // If the error is already an OrderError, rethrow it
        if (error instanceof OrderError) {
          throw error;
        }
        
        // Otherwise, create a new OrderError
        throw new OrderError(
          `Failed to get order: ${error instanceof Error ? error.message : String(error)}`,
          ErrorCode.OrderNotFound,
          {
            orderId,
            originalError: error,
          }
        );
      }
    }, error => {
      // Log error
      logError(error, 'OrderManager.getOrder');
      
      // Rethrow error
      throw error;
    });
  }
  
  /**
   * Get orders
   * @param filter Order filter parameters
   * @returns Promise that resolves with the orders
   * @throws OrderError if getting the orders fails
   */
  public async getOrders(filter?: OrderFilterParams): Promise<Order[]> {
    return tryAsync(async () => {
      try {
        // Get orders
        return await this.darkswap.getOrders(
          filter?.side,
          filter?.baseAssetType,
          filter?.baseAssetId,
          filter?.quoteAssetType,
          filter?.quoteAssetId,
        );
      } catch (error) {
        // If the error is already an OrderError, rethrow it
        if (error instanceof OrderError) {
          throw error;
        }
        
        // Otherwise, create a new OrderError
        throw new OrderError(
          `Failed to get orders: ${error instanceof Error ? error.message : String(error)}`,
          ErrorCode.Unknown,
          {
            filter,
            originalError: error,
          }
        );
      }
    }, error => {
      // Log error
      logError(error, 'OrderManager.getOrders');
      
      // Rethrow error
      throw error;
    });
  }
  
  /**
   * Take an order
   * @param orderId Order ID
   * @param amount Amount to take
   * @returns Promise that resolves with the trade ID
   * @throws OrderError if taking the order fails
   */
  public async takeOrder(orderId: string, amount: string): Promise<string> {
    return tryAsync(async () => {
      try {
        // Validate parameters
        if (!orderId) {
          throw new OrderError(
            'Order ID is required',
            ErrorCode.InvalidArgument
          );
        }
        
        if (!amount || parseFloat(amount) <= 0) {
          throw new OrderError(
            'Amount must be greater than 0',
            ErrorCode.InvalidArgument,
            { amount }
          );
        }
        
        // Take order
        return await this.darkswap.takeOrder(orderId, amount);
      } catch (error) {
        // If the error is already an OrderError, rethrow it
        if (error instanceof OrderError) {
          throw error;
        }
        
        // Otherwise, create a new OrderError
        throw new OrderError(
          `Failed to take order: ${error instanceof Error ? error.message : String(error)}`,
          ErrorCode.OrderExecutionFailed,
          {
            orderId,
            amount,
            originalError: error,
          }
        );
      }
    }, error => {
      // Log error
      logError(error, 'OrderManager.takeOrder');
      
      // Rethrow error
      throw error;
    });
  }
  
  /**
   * Validate order creation parameters
   * @param params Order creation parameters
   * @throws OrderError if parameters are invalid
   */
  private validateCreateOrderParams(params: CreateOrderParams): void {
    if (!params) {
      throw new OrderError(
        'Order parameters are required',
        ErrorCode.InvalidOrderParameters
      );
    }
    
    if (params.side === undefined) {
      throw new OrderError(
        'Order side is required',
        ErrorCode.InvalidOrderParameters,
        { params }
      );
    }
    
    if (params.baseAssetType === undefined) {
      throw new OrderError(
        'Base asset type is required',
        ErrorCode.InvalidOrderParameters,
        { params }
      );
    }
    
    if (!params.baseAssetId) {
      throw new OrderError(
        'Base asset ID is required',
        ErrorCode.InvalidOrderParameters,
        { params }
      );
    }
    
    if (params.quoteAssetType === undefined) {
      throw new OrderError(
        'Quote asset type is required',
        ErrorCode.InvalidOrderParameters,
        { params }
      );
    }
    
    if (!params.quoteAssetId) {
      throw new OrderError(
        'Quote asset ID is required',
        ErrorCode.InvalidOrderParameters,
        { params }
      );
    }
    
    if (!params.amount) {
      throw new OrderError(
        'Amount is required',
        ErrorCode.InvalidOrderParameters,
        { params }
      );
    }
    
    const amountValue = parseFloat(params.amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      throw new OrderError(
        'Amount must be a positive number',
        ErrorCode.InvalidOrderParameters,
        { params }
      );
    }
    
    if (!params.price) {
      throw new OrderError(
        'Price is required',
        ErrorCode.InvalidOrderParameters,
        { params }
      );
    }
    
    const priceValue = parseFloat(params.price);
    if (isNaN(priceValue) || priceValue <= 0) {
      throw new OrderError(
        'Price must be a positive number',
        ErrorCode.InvalidOrderParameters,
        { params }
      );
    }
  }
}

export default OrderManager;