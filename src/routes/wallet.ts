import express, { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @route GET /api/wallet/balance
 * @desc Get wallet balance
 * @access Private
 */
router.get('/balance', async (req: Request, res: Response) => {
  try {
    // Get the user ID from the request
    const userId = req.userId;
    
    // Get the wallet
    const wallet = await db.wallets.findOne({ userId });
    
    // If the wallet doesn't exist, return an empty balance
    if (!wallet) {
      return res.status(200).json({});
    }
    
    // Return the wallet balance
    return res.status(200).json(wallet.balance);
  } catch (error: any) {
    logger.error('Error getting wallet balance', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/wallet/transactions
 * @desc Get transaction history
 * @access Private
 */
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    // Get the user ID from the request
    const userId = req.userId;
    
    // Get query parameters
    const asset = req.query.asset as string;
    const type = req.query.type as string;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    
    // Build the query
    const query: any = { userId };
    
    if (asset) {
      query.asset = asset;
    }
    
    if (type) {
      query.type = type;
    }
    
    // Get the transactions
    const transactions = await db.transactions
      .find(query)
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    
    // Return the transactions
    return res.status(200).json(transactions);
  } catch (error: any) {
    logger.error('Error getting transaction history', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route POST /api/wallet/deposit-address
 * @desc Create a deposit address
 * @access Private
 */
router.post('/deposit-address', [
  // Validate input
  body('asset').notEmpty().withMessage('Asset is required'),
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Get the user ID from the request
    const userId = req.userId;
    
    // Extract data from request body
    const { asset } = req.body;
    
    // Get the asset
    const assetData = await db.assets.findOne({ symbol: asset });
    
    // If the asset doesn't exist, return an error
    if (!assetData) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    // Generate a deposit address
    // In a real application, this would involve interacting with a wallet service
    // For this example, we'll just generate a random address
    const address = generateDepositAddress(asset);
    
    // Save the deposit address
    await db.wallets.updateOne(
      { userId },
      {
        $push: {
          depositAddresses: {
            asset,
            address,
            createdAt: new Date(),
          },
        },
      },
      { upsert: true }
    );
    
    // Return the deposit address
    return res.status(200).json({ address });
  } catch (error: any) {
    logger.error('Error creating deposit address', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route POST /api/wallet/withdraw
 * @desc Withdraw funds
 * @access Private
 */
router.post('/withdraw', [
  // Validate input
  body('asset').notEmpty().withMessage('Asset is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('address').notEmpty().withMessage('Address is required'),
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Get the user ID from the request
    const userId = req.userId;
    
    // Extract data from request body
    const { asset, amount, address } = req.body;
    
    // Get the asset
    const assetData = await db.assets.findOne({ symbol: asset });
    
    // If the asset doesn't exist, return an error
    if (!assetData) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    // Get the wallet
    const wallet = await db.wallets.findOne({ userId });
    
    // If the wallet doesn't exist or doesn't have enough balance, return an error
    if (!wallet || !wallet.balance || !wallet.balance[asset] || parseFloat(wallet.balance[asset]) < parseFloat(amount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Generate a transaction ID
    const transactionId = uuidv4();
    
    // Create the transaction
    const transaction = {
      id: transactionId,
      userId,
      asset,
      amount,
      address,
      type: 'withdrawal',
      status: 'pending',
      timestamp: new Date(),
    };
    
    // Insert the transaction into the database
    await db.transactions.insertOne(transaction);
    
    // Update the wallet balance
    await db.wallets.updateOne(
      { userId },
      {
        $set: {
          [`balance.${asset}`]: (parseFloat(wallet.balance[asset]) - parseFloat(amount)).toString(),
        },
      }
    );
    
    // Return the transaction ID
    return res.status(200).json({ transactionId });
  } catch (error: any) {
    logger.error('Error withdrawing funds', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/wallet/deposit-addresses
 * @desc Get deposit addresses
 * @access Private
 */
router.get('/deposit-addresses', async (req: Request, res: Response) => {
  try {
    // Get the user ID from the request
    const userId = req.userId;
    
    // Get the wallet
    const wallet = await db.wallets.findOne({ userId });
    
    // If the wallet doesn't exist, return an empty array
    if (!wallet || !wallet.depositAddresses) {
      return res.status(200).json([]);
    }
    
    // Return the deposit addresses
    return res.status(200).json(wallet.depositAddresses);
  } catch (error: any) {
    logger.error('Error getting deposit addresses', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/wallet/transaction/:id
 * @desc Get a specific transaction
 * @access Private
 */
router.get('/transaction/:id', [
  // Validate parameters
  param('id').notEmpty().withMessage('Transaction ID is required'),
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Get the transaction ID from the request parameters
    const transactionId = req.params.id;
    
    // Get the user ID from the request
    const userId = req.userId;
    
    // Get the transaction
    const transaction = await db.transactions.findOne({ id: transactionId });
    
    // If the transaction doesn't exist, return an error
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // If the transaction doesn't belong to the user, return an error
    if (transaction.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Return the transaction
    return res.status(200).json(transaction);
  } catch (error: any) {
    logger.error('Error getting transaction', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Generates a deposit address for an asset
 * @param asset Asset symbol
 * @returns Deposit address
 */
function generateDepositAddress(asset: string): string {
  // In a real application, this would involve interacting with a wallet service
  // For this example, we'll just generate a random address
  if (asset === 'BTC') {
    return `bc1${uuidv4().replace(/-/g, '').substring(0, 38)}`;
  } else if (asset === 'ETH') {
    return `0x${uuidv4().replace(/-/g, '').substring(0, 40)}`;
  } else {
    return uuidv4();
  }
}

export default router;