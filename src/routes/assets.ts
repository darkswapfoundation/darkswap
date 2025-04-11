import express, { Request, Response } from 'express';
import { param, validationResult } from 'express-validator';
import { db } from '../db';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @route GET /api/assets
 * @desc Get all assets
 * @access Public
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Get the assets
    const assets = await db.assets.find().toArray();
    
    // Return the assets
    return res.status(200).json(assets);
  } catch (error: any) {
    logger.error('Error getting assets', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/assets/:symbol
 * @desc Get a specific asset
 * @access Public
 */
router.get('/:symbol', [
  // Validate parameters
  param('symbol').notEmpty().withMessage('Asset symbol is required'),
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Get the asset symbol from the request parameters
    const symbol = req.params.symbol;
    
    // Get the asset
    const asset = await db.assets.findOne({ symbol });
    
    // If the asset doesn't exist, return an error
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    // Return the asset
    return res.status(200).json(asset);
  } catch (error: any) {
    logger.error('Error getting asset', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/assets/:symbol/price
 * @desc Get the price of a specific asset
 * @access Public
 */
router.get('/:symbol/price', [
  // Validate parameters
  param('symbol').notEmpty().withMessage('Asset symbol is required'),
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Get the asset symbol from the request parameters
    const symbol = req.params.symbol;
    
    // Get the asset
    const asset = await db.assets.findOne({ symbol });
    
    // If the asset doesn't exist, return an error
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    // Return the asset price
    return res.status(200).json({ price: asset.price });
  } catch (error: any) {
    logger.error('Error getting asset price', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/assets/:symbol/history
 * @desc Get the price history of a specific asset
 * @access Public
 */
router.get('/:symbol/history', [
  // Validate parameters
  param('symbol').notEmpty().withMessage('Asset symbol is required'),
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Get the asset symbol from the request parameters
    const symbol = req.params.symbol;
    
    // Get the asset
    const asset = await db.assets.findOne({ symbol });
    
    // If the asset doesn't exist, return an error
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    // Get the price history
    const priceHistory = await db.priceHistory
      .find({ symbol })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();
    
    // Return the price history
    return res.status(200).json(priceHistory);
  } catch (error: any) {
    logger.error('Error getting asset price history', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/assets/runes
 * @desc Get all runes
 * @access Public
 */
router.get('/runes', async (req: Request, res: Response) => {
  try {
    // Get the runes
    const runes = await db.assets.find({ type: 'rune' }).toArray();
    
    // Return the runes
    return res.status(200).json(runes);
  } catch (error: any) {
    logger.error('Error getting runes', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/assets/alkanes
 * @desc Get all alkanes
 * @access Public
 */
router.get('/alkanes', async (req: Request, res: Response) => {
  try {
    // Get the alkanes
    const alkanes = await db.assets.find({ type: 'alkane' }).toArray();
    
    // Return the alkanes
    return res.status(200).json(alkanes);
  } catch (error: any) {
    logger.error('Error getting alkanes', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/assets/pairs
 * @desc Get all trading pairs
 * @access Public
 */
router.get('/pairs', async (req: Request, res: Response) => {
  try {
    // Get the trading pairs
    const pairs = await db.tradingPairs.find().toArray();
    
    // Return the trading pairs
    return res.status(200).json(pairs);
  } catch (error: any) {
    logger.error('Error getting trading pairs', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/assets/pairs/:baseAsset/:quoteAsset
 * @desc Get a specific trading pair
 * @access Public
 */
router.get('/pairs/:baseAsset/:quoteAsset', [
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
    
    // Get the trading pair
    const pair = await db.tradingPairs.findOne({ baseAsset, quoteAsset });
    
    // If the trading pair doesn't exist, return an error
    if (!pair) {
      return res.status(404).json({ error: 'Trading pair not found' });
    }
    
    // Return the trading pair
    return res.status(200).json(pair);
  } catch (error: any) {
    logger.error('Error getting trading pair', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;