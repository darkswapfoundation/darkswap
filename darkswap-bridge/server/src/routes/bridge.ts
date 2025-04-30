import express from 'express';
import { BridgeClient } from '../bridge/client';
import { verifyToken } from './auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Get bridge client instance
const bridgeClient = new BridgeClient();

// Use authentication middleware
router.use(verifyToken);

// Wallet routes
router.post('/wallet', async (req, res) => {
  try {
    const { action, payload } = req.body;

    // Validate input
    if (!action) {
      return res.status(400).json({ message: 'Action is required' });
    }

    // Send message to bridge
    const response = await bridgeClient.sendMessage({
      type: 'wallet',
      action,
      payload: payload || {},
    });

    // Return response
    res.json(response);
  } catch (error) {
    logger.error('Wallet error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Network routes
router.post('/network', async (req, res) => {
  try {
    const { action, payload } = req.body;

    // Validate input
    if (!action) {
      return res.status(400).json({ message: 'Action is required' });
    }

    // Send message to bridge
    const response = await bridgeClient.sendMessage({
      type: 'network',
      action,
      payload: payload || {},
    });

    // Return response
    res.json(response);
  } catch (error) {
    logger.error('Network error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// System routes
router.post('/system', async (req, res) => {
  try {
    const { action, payload } = req.body;

    // Validate input
    if (!action) {
      return res.status(400).json({ message: 'Action is required' });
    }

    // Send message to bridge
    const response = await bridgeClient.sendMessage({
      type: 'system',
      action,
      payload: payload || {},
    });

    // Return response
    res.json(response);
  } catch (error) {
    logger.error('System error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get wallet status
router.get('/wallet/status', (req, res) => {
  try {
    const status = bridgeClient.getWalletStatus();
    res.json(status);
  } catch (error) {
    logger.error('Wallet status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get network status
router.get('/network/status', (req, res) => {
  try {
    const status = bridgeClient.getNetworkStatus();
    res.json(status);
  } catch (error) {
    logger.error('Network status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get wallet balance
router.get('/wallet/balance', (req, res) => {
  try {
    const balance = bridgeClient.getWalletBalance();
    res.json(balance);
  } catch (error) {
    logger.error('Wallet balance error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get connected peers
router.get('/network/peers', (req, res) => {
  try {
    const peers = bridgeClient.getConnectedPeers();
    res.json(peers);
  } catch (error) {
    logger.error('Network peers error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get orders
router.get('/orders', (req, res) => {
  try {
    const orders = bridgeClient.getOrders();
    res.json(orders);
  } catch (error) {
    logger.error('Orders error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get trades
router.get('/trades', (req, res) => {
  try {
    const trades = bridgeClient.getTrades();
    res.json(trades);
  } catch (error) {
    logger.error('Trades error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export const bridgeRouter = router;