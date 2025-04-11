import { v4 as uuidv4 } from 'uuid';
import { db } from '../../src/db';

/**
 * Order data interface
 */
export interface OrderData {
  userId: string;
  baseAsset: string;
  quoteAsset: string;
  price: string;
  amount: string;
  type: 'buy' | 'sell';
}

/**
 * Creates a test order
 * @param orderData Order data
 * @returns Order ID
 */
export async function createTestOrder(orderData: OrderData): Promise<string> {
  // Generate a unique order ID
  const orderId = uuidv4();
  
  // Insert the order into the database
  await db.orders.insert({
    id: orderId,
    userId: orderData.userId,
    baseAsset: orderData.baseAsset,
    quoteAsset: orderData.quoteAsset,
    price: orderData.price,
    amount: orderData.amount,
    type: orderData.type,
    status: 'open',
    filled: '0',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  return orderId;
}

/**
 * Deletes a test order
 * @param orderId Order ID
 */
export async function deleteTestOrder(orderId: string): Promise<void> {
  // Delete the order from the database
  await db.orders.delete({ id: orderId });
}

/**
 * Gets a test order
 * @param orderId Order ID
 * @returns Order data
 */
export async function getTestOrder(orderId: string): Promise<any> {
  // Get the order from the database
  return await db.orders.findOne({ id: orderId });
}

/**
 * Updates a test order
 * @param orderId Order ID
 * @param orderData Order data
 */
export async function updateTestOrder(orderId: string, orderData: Partial<OrderData>): Promise<void> {
  // Update the order in the database
  await db.orders.update(
    { id: orderId },
    {
      $set: {
        ...orderData,
        updatedAt: new Date(),
      },
    }
  );
}

/**
 * Creates multiple test orders
 * @param orderDataArray Array of order data
 * @returns Array of order IDs
 */
export async function createTestOrders(orderDataArray: OrderData[]): Promise<string[]> {
  // Create multiple orders
  const orderIds = await Promise.all(
    orderDataArray.map(orderData => createTestOrder(orderData))
  );
  
  return orderIds;
}

/**
 * Deletes multiple test orders
 * @param orderIds Array of order IDs
 */
export async function deleteTestOrders(orderIds: string[]): Promise<void> {
  // Delete multiple orders
  await Promise.all(orderIds.map(orderId => deleteTestOrder(orderId)));
}

/**
 * Gets all orders for a user
 * @param userId User ID
 * @returns Array of orders
 */
export async function getTestOrdersByUser(userId: string): Promise<any[]> {
  // Get all orders for a user
  return await db.orders.find({ userId });
}

/**
 * Gets all orders for a trading pair
 * @param baseAsset Base asset
 * @param quoteAsset Quote asset
 * @returns Array of orders
 */
export async function getTestOrdersByPair(baseAsset: string, quoteAsset: string): Promise<any[]> {
  // Get all orders for a trading pair
  return await db.orders.find({ baseAsset, quoteAsset });
}