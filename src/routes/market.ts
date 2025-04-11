import express, { Request, Response } from 'express';
import { param, query, validationResult } from 'express-validator';
import { db } from '../db';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @route GET /api/market/ticker
 * @desc Get ticker data for all trading pairs
 * @access Public
 */
router.get('/ticker', async (req: Request, res: Response) => {
  try {
    // Get the trading pairs
    const pairs = await db.tradingPairs.find().toArray();
    
    // Get the ticker data for each pair
    const ticker = await Promise.all(
      pairs.map(async (pair) => {
        // Get the latest trade
        const latestTrade = await db.trades
          .find({
            baseAsset: pair.baseAsset,
            quoteAsset: pair.quoteAsset,
            status: 'completed',
          })
          .sort({ createdAt: -1 })
          .limit(1)
          .toArray();
        
        // Get the highest bid
        const highestBid = await db.orders
          .find({
            baseAsset: pair.baseAsset,
            quoteAsset: pair.quoteAsset,
            type: 'buy',
            status: 'open',
          })
          .sort({ price: -1 })
          .limit(1)
          .toArray();
        
        // Get the lowest ask
        const lowestAsk = await db.orders
          .find({
            baseAsset: pair.baseAsset,
            quoteAsset: pair.quoteAsset,
            type: 'sell',
            status: 'open',
          })
          .sort({ price: 1 })
          .limit(1)
          .toArray();
        
        // Get the 24-hour volume
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const trades24h = await db.trades
          .find({
            baseAsset: pair.baseAsset,
            quoteAsset: pair.quoteAsset,
            status: 'completed',
            createdAt: { $gte: oneDayAgo },
          })
          .toArray();
        
        // Calculate the 24-hour volume
        const volume24h = trades24h.reduce(
          (total, trade) => total + parseFloat(trade.amount),
          0
        );
        
        // Calculate the 24-hour price change
        const firstTrade24h = trades24h[trades24h.length - 1];
        const lastTrade24h = trades24h[0];
        const priceChange24h = lastTrade24h && firstTrade24h
          ? ((parseFloat(lastTrade24h.price) - parseFloat(firstTrade24h.price)) / parseFloat(firstTrade24h.price)) * 100
          : 0;
        
        // Return the ticker data
        return {
          pair: `${pair.baseAsset}/${pair.quoteAsset}`,
          last: latestTrade[0]?.price || '0',
          bid: highestBid[0]?.price || '0',
          ask: lowestAsk[0]?.price || '0',
          volume: volume24h.toString(),
          change24h: priceChange24h.toString(),
        };
      })
    );
    
    // Return the ticker data
    return res.status(200).json(ticker);
  } catch (error: any) {
    logger.error('Error getting ticker data', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/market/orderbook
 * @desc Get order book data for a trading pair
 * @access Public
 */
router.get('/orderbook', [
  // Validate query parameters
  query('pair').notEmpty().withMessage('Trading pair is required'),
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Get the trading pair from the query parameters
    const pair = req.query.pair as string;
    
    // Split the pair into base and quote assets
    const [baseAsset, quoteAsset] = pair.split('/');
    
    // Get the bids
    const bids = await db.orders
      .find({
        baseAsset,
        quoteAsset,
        type: 'buy',
        status: 'open',
      })
      .sort({ price: -1 })
      .toArray();
    
    // Get the asks
    const asks = await db.orders
      .find({
        baseAsset,
        quoteAsset,
        type: 'sell',
        status: 'open',
      })
      .sort({ price: 1 })
      .toArray();
    
    // Return the order book data
    return res.status(200).json({
      bids,
      asks,
    });
  } catch (error: any) {
    logger.error('Error getting order book data', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/market/trades
 * @desc Get recent trades for a trading pair
 * @access Public
 */
router.get('/trades', [
  // Validate query parameters
  query('pair').notEmpty().withMessage('Trading pair is required'),
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Get the trading pair from the query parameters
    const pair = req.query.pair as string;
    
    // Split the pair into base and quote assets
    const [baseAsset, quoteAsset] = pair.split('/');
    
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
    logger.error('Error getting recent trades', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/market/history
 * @desc Get price history for a trading pair
 * @access Public
 */
router.get('/history', [
  // Validate query parameters
  query('pair').notEmpty().withMessage('Trading pair is required'),
  query('interval').isIn(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w']).withMessage('Invalid interval'),
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Get the trading pair from the query parameters
    const pair = req.query.pair as string;
    
    // Split the pair into base and quote assets
    const [baseAsset, quoteAsset] = pair.split('/');
    
    // Get the interval from the query parameters
    const interval = req.query.interval as string;
    
    // Get the price history
    const priceHistory = await db.priceHistory
      .find({
        baseAsset,
        quoteAsset,
        interval,
      })
      .sort({ timestamp: -1 })
      .limit(1000)
      .toArray();
    
    // Return the price history
    return res.status(200).json(priceHistory);
  } catch (error: any) {
    logger.error('Error getting price history', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/market/depth
 * @desc Get market depth for a trading pair
 * @access Public
 */
router.get('/depth', [
  // Validate query parameters
  query('pair').notEmpty().withMessage('Trading pair is required'),
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Get the trading pair from the query parameters
    const pair = req.query.pair as string;
    
    // Split the pair into base and quote assets
    const [baseAsset, quoteAsset] = pair.split('/');
    
    // Get the bids
    const bids = await db.orders
      .find({
        baseAsset,
        quoteAsset,
        type: 'buy',
        status: 'open',
      })
      .sort({ price: -1 })
      .toArray();
    
    // Get the asks
    const asks = await db.orders
      .find({
        baseAsset,
        quoteAsset,
        type: 'sell',
        status: 'open',
      })
      .sort({ price: 1 })
      .toArray();
    
    // Calculate the market depth
    const bidDepth = calculateMarketDepth(bids);
    const askDepth = calculateMarketDepth(asks);
    
    // Return the market depth
    return res.status(200).json({
      bids: bidDepth,
      asks: askDepth,
    });
  } catch (error: any) {
    logger.error('Error getting market depth', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Calculates the market depth
 * @param orders Orders
 * @returns Market depth
 */
function calculateMarketDepth(orders: any[]): { price: string; amount: string; total: string }[] {
  let total = 0;
  
  return orders.map((order) => {
    total += parseFloat(order.amount);
    
    return {
      price: order.price,
      amount: order.amount,
      total: total.toString(),
    };
  });
}

export default router;