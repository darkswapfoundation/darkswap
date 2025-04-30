import express, { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @route GET /api/orders
 * @desc Get all orders for a user
 * @access Private
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Get the user ID from the request
    const userId = req.userId;
    
    // Get query parameters
    const status = req.query.status as string;
    const baseAsset = req.query.baseAsset as string;
    const quoteAsset = req.query.quoteAsset as string;
    const type = req.query.type as string;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    
    // Build the query
    const query: any = { userId };
    
    if (status) {
      query.status = status;
    }
    
    if (baseAsset) {
      query.baseAsset = baseAsset;
    }
    
    if (quoteAsset) {
      query.quoteAsset = quoteAsset;
    }
    
    if (type) {
      query.type = type;
    }
    
    // Get the orders
    const orders = await db.orders
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    
    // Return the orders
    return res.status(200).json(orders);
  } catch (error: any) {
    logger.error('Error getting orders', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/orders/:id
 * @desc Get a specific order
 * @access Private
 */
router.get('/:id', [
  // Validate parameters
  param('id').notEmpty().withMessage('Order ID is required'),
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Get the order ID from the request parameters
    const orderId = req.params.id;
    
    // Get the user ID from the request
    const userId = req.userId;
    
    // Get the order
    const order = await db.orders.findOne({ id: orderId });
    
    // If the order doesn't exist, return an error
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // If the order doesn't belong to the user, return an error
    if (order.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Return the order
    return res.status(200).json(order);
  } catch (error: any) {
    logger.error('Error getting order', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route POST /api/orders
 * @desc Create a new order
 * @access Private
 */
router.post('/', [
  // Validate input
  body('baseAsset').notEmpty().withMessage('Base asset is required'),
  body('quoteAsset').notEmpty().withMessage('Quote asset is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('type').isIn(['buy', 'sell']).withMessage('Type must be buy or sell'),
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Get the user ID from the request
    const userId = req.userId;
    
    // Extract order data from request body
    const { baseAsset, quoteAsset, price, amount, type } = req.body;
    
    // Generate a unique order ID
    const orderId = uuidv4();
    
    // Create the order
    const order = {
      id: orderId,
      userId,
      baseAsset,
      quoteAsset,
      price,
      amount,
      type,
      status: 'open',
      filled: '0',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Insert the order into the database
    await db.orders.insertOne(order);
    
    // Return the order ID
    return res.status(201).json({ orderId });
  } catch (error: any) {
    logger.error('Error creating order', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route PUT /api/orders/:id
 * @desc Update an order
 * @access Private
 */
router.put('/:id', [
  // Validate parameters
  param('id').notEmpty().withMessage('Order ID is required'),
  
  // Validate input
  body('price').optional().isNumeric().withMessage('Price must be a number'),
  body('amount').optional().isNumeric().withMessage('Amount must be a number'),
  body('status').optional().isIn(['open', 'cancelled']).withMessage('Status must be open or cancelled'),
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Get the order ID from the request parameters
    const orderId = req.params.id;
    
    // Get the user ID from the request
    const userId = req.userId;
    
    // Get the order
    const order = await db.orders.findOne({ id: orderId });
    
    // If the order doesn't exist, return an error
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // If the order doesn't belong to the user, return an error
    if (order.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Extract order data from request body
    const { price, amount, status } = req.body;
    
    // Build the update
    const update: any = { updatedAt: new Date() };
    
    if (price !== undefined) {
      update.price = price;
    }
    
    if (amount !== undefined) {
      update.amount = amount;
    }
    
    if (status !== undefined) {
      update.status = status;
    }
    
    // Update the order
    await db.orders.updateOne(
      { id: orderId },
      { $set: update }
    );
    
    // Get the updated order
    const updatedOrder = await db.orders.findOne({ id: orderId });
    
    // Return the updated order
    return res.status(200).json(updatedOrder);
  } catch (error: any) {
    logger.error('Error updating order', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route DELETE /api/orders/:id
 * @desc Cancel an order
 * @access Private
 */
router.delete('/:id', [
  // Validate parameters
  param('id').notEmpty().withMessage('Order ID is required'),
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Get the order ID from the request parameters
    const orderId = req.params.id;
    
    // Get the user ID from the request
    const userId = req.userId;
    
    // Get the order
    const order = await db.orders.findOne({ id: orderId });
    
    // If the order doesn't exist, return an error
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // If the order doesn't belong to the user, return an error
    if (order.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Update the order status to cancelled
    await db.orders.updateOne(
      { id: orderId },
      { $set: { status: 'cancelled', updatedAt: new Date() } }
    );
    
    // Get the updated order
    const updatedOrder = await db.orders.findOne({ id: orderId });
    
    // Return the updated order
    return res.status(200).json(updatedOrder);
  } catch (error: any) {
    logger.error('Error cancelling order', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/orders/market/:baseAsset/:quoteAsset
 * @desc Get all open orders for a trading pair
 * @access Public
 */
router.get('/market/:baseAsset/:quoteAsset', [
  // Validate parameters
  param('baseAsset').notEmpty().withMessage('Base asset is required'),
  param('quoteAsset').notEmpty().withMessage('Quote asset is required'),
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Get the base and quote assets from the request parameters
    const baseAsset = req.params.baseAsset;
    const quoteAsset = req.params.quoteAsset;
    
    // Get query parameters
    const type = req.query.type as string;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    
    // Build the query
    const query: any = {
      baseAsset,
      quoteAsset,
      status: 'open',
    };
    
    if (type) {
      query.type = type;
    }
    
    // Get the orders
    const orders = await db.orders
      .find(query)
      .sort({ price: type === 'sell' ? 1 : -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    
    // Return the orders
    return res.status(200).json(orders);
  } catch (error: any) {
    logger.error('Error getting market orders', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;