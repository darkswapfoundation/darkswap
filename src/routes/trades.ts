import express, { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @route GET /api/trades
 * @desc Get all trades for a user
 * @access Private
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Get the user ID from the request
    const userId = req.userId;
    
    // Get query parameters
    const baseAsset = req.query.baseAsset as string;
    const quoteAsset = req.query.quoteAsset as string;
    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    
    // Build the query
    const query: any = {
      $or: [
        { buyUserId: userId },
        { sellUserId: userId },
      ],
    };
    
    if (baseAsset) {
      query.baseAsset = baseAsset;
    }
    
    if (quoteAsset) {
      query.quoteAsset = quoteAsset;
    }
    
    if (status) {
      query.status = status;
    }
    
    // Get the trades
    const trades = await db.trades
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    
    // Return the trades
    return res.status(200).json(trades);
  } catch (error: any) {
    logger.error('Error getting trades', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/trades/:id
 * @desc Get a specific trade
 * @access Private
 */
router.get('/:id', [
  // Validate parameters
  param('id').notEmpty().withMessage('Trade ID is required'),
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Get the trade ID from the request parameters
    const tradeId = req.params.id;
    
    // Get the user ID from the request
    const userId = req.userId;
    
    // Get the trade
    const trade = await db.trades.findOne({ id: tradeId });
    
    // If the trade doesn't exist, return an error
    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    
    // If the trade doesn't involve the user, return an error
    if (trade.buyUserId !== userId && trade.sellUserId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Return the trade
    return res.status(200).json(trade);
  } catch (error: any) {
    logger.error('Error getting trade', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route POST /api/trades
 * @desc Create a new trade
 * @access Private
 */
router.post('/', [
  // Validate input
  body('baseAsset').notEmpty().withMessage('Base asset is required'),
  body('quoteAsset').notEmpty().withMessage('Quote asset is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('buyOrderId').notEmpty().withMessage('Buy order ID is required'),
  body('sellOrderId').notEmpty().withMessage('Sell order ID is required'),
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Get the user ID from the request
    const userId = req.userId;
    
    // Extract trade data from request body
    const { baseAsset, quoteAsset, price, amount, buyOrderId, sellOrderId } = req.body;
    
    // Get the buy order
    const buyOrder = await db.orders.findOne({ id: buyOrderId });
    
    // If the buy order doesn't exist, return an error
    if (!buyOrder) {
      return res.status(404).json({ error: 'Buy order not found' });
    }
    
    // Get the sell order
    const sellOrder = await db.orders.findOne({ id: sellOrderId });
    
    // If the sell order doesn't exist, return an error
    if (!sellOrder) {
      return res.status(404).json({ error: 'Sell order not found' });
    }
    
    // Check if the user is involved in the trade
    if (buyOrder.userId !== userId && sellOrder.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Generate a unique trade ID
    const tradeId = uuidv4();
    
    // Create the trade
    const trade = {
      id: tradeId,
      baseAsset,
      quoteAsset,
      price,
      amount,
      buyOrderId,
      sellOrderId,
      buyUserId: buyOrder.userId,
      sellUserId: sellOrder.userId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Insert the trade into the database
    await db.trades.insertOne(trade);
    
    // Update the buy order
    await db.orders.updateOne(
      { id: buyOrderId },
      {
        $set: {
          filled: (parseFloat(buyOrder.filled) + parseFloat(amount)).toString(),
          updatedAt: new Date(),
        },
      }
    );
    
    // Update the sell order
    await db.orders.updateOne(
      { id: sellOrderId },
      {
        $set: {
          filled: (parseFloat(sellOrder.filled) + parseFloat(amount)).toString(),
          updatedAt: new Date(),
        },
      }
    );
    
    // Return the trade ID
    return res.status(201).json({ tradeId });
  } catch (error: any) {
    logger.error('Error creating trade', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route PUT /api/trades/:id
 * @desc Update a trade
 * @access Private
 */
router.put('/:id', [
  // Validate parameters
  param('id').notEmpty().withMessage('Trade ID is required'),
  
  // Validate input
  body('status').isIn(['pending', 'completed', 'cancelled']).withMessage('Status must be pending, completed, or cancelled'),
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Get the trade ID from the request parameters
    const tradeId = req.params.id;
    
    // Get the user ID from the request
    const userId = req.userId;
    
    // Get the trade
    const trade = await db.trades.findOne({ id: tradeId });
    
    // If the trade doesn't exist, return an error
    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    
    // If the trade doesn't involve the user, return an error
    if (trade.buyUserId !== userId && trade.sellUserId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Extract trade data from request body
    const { status } = req.body;
    
    // Update the trade
    await db.trades.updateOne(
      { id: tradeId },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      }
    );
    
    // Get the updated trade
    const updatedTrade = await db.trades.findOne({ id: tradeId });
    
    // Return the updated trade
    return res.status(200).json(updatedTrade);
  } catch (error: any) {
    logger.error('Error updating trade', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route DELETE /api/trades/:id
 * @desc Cancel a trade
 * @access Private
 */
router.delete('/:id', [
  // Validate parameters
  param('id').notEmpty().withMessage('Trade ID is required'),
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Get the trade ID from the request parameters
    const tradeId = req.params.id;
    
    // Get the user ID from the request
    const userId = req.userId;
    
    // Get the trade
    const trade = await db.trades.findOne({ id: tradeId });
    
    // If the trade doesn't exist, return an error
    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    
    // If the trade doesn't involve the user, return an error
    if (trade.buyUserId !== userId && trade.sellUserId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // If the trade is already completed, return an error
    if (trade.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel a completed trade' });
    }
    
    // Update the trade status to cancelled
    await db.trades.updateOne(
      { id: tradeId },
      {
        $set: {
          status: 'cancelled',
          updatedAt: new Date(),
        },
      }
    );
    
    // Get the buy order
    const buyOrder = await db.orders.findOne({ id: trade.buyOrderId });
    
    // If the buy order exists, update it
    if (buyOrder) {
      await db.orders.updateOne(
        { id: trade.buyOrderId },
        {
          $set: {
            filled: (parseFloat(buyOrder.filled) - parseFloat(trade.amount)).toString(),
            updatedAt: new Date(),
          },
        }
      );
    }
    
    // Get the sell order
    const sellOrder = await db.orders.findOne({ id: trade.sellOrderId });
    
    // If the sell order exists, update it
    if (sellOrder) {
      await db.orders.updateOne(
        { id: trade.sellOrderId },
        {
          $set: {
            filled: (parseFloat(sellOrder.filled) - parseFloat(trade.amount)).toString(),
            updatedAt: new Date(),
          },
        }
      );
    }
    
    // Get the updated trade
    const updatedTrade = await db.trades.findOne({ id: tradeId });
    
    // Return the updated trade
    return res.status(200).json(updatedTrade);
  } catch (error: any) {
    logger.error('Error cancelling trade', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/trades/market/:baseAsset/:quoteAsset
 * @desc Get recent trades for a trading pair
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
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    
    // Get the trades
    const trades = await db.trades
      .find({
        baseAsset,
        quoteAsset,
        status: 'completed',
      })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    
    // Return the trades
    return res.status(200).json(trades);
  } catch (error: any) {
    logger.error('Error getting market trades', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;