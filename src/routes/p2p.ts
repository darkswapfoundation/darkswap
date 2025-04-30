import express, { Request, Response } from 'express';
import { param, validationResult } from 'express-validator';
import { db } from '../db';
import { logger } from '../utils/logger';

const router = express.Router();

// In-memory store for P2P network status
const p2pNetwork = {
  peers: new Map<string, {
    id: string;
    ip: string;
    port: number;
    lastSeen: Date;
    connected: boolean;
    version: string;
    userAgent: string;
  }>(),
  messages: {
    sent: 0,
    received: 0,
  },
  startTime: new Date(),
};

/**
 * @route GET /api/p2p/peers
 * @desc Get the number of connected peers
 * @access Public
 */
router.get('/peers', (req: Request, res: Response) => {
  try {
    // Count the number of connected peers
    const connectedPeers = Array.from(p2pNetwork.peers.values()).filter(
      (peer) => peer.connected
    );
    
    // Return the peer count
    return res.status(200).json({
      count: connectedPeers.length,
    });
  } catch (error: any) {
    logger.error('Error getting peer count', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/p2p/peers/list
 * @desc Get a list of connected peers
 * @access Public
 */
router.get('/peers/list', (req: Request, res: Response) => {
  try {
    // Get the connected peers
    const connectedPeers = Array.from(p2pNetwork.peers.values()).filter(
      (peer) => peer.connected
    );
    
    // Return the peer list
    return res.status(200).json(connectedPeers);
  } catch (error: any) {
    logger.error('Error getting peer list', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/p2p/status
 * @desc Get the P2P network status
 * @access Public
 */
router.get('/status', (req: Request, res: Response) => {
  try {
    // Calculate the uptime
    const uptime = Date.now() - p2pNetwork.startTime.getTime();
    
    // Return the network status
    return res.status(200).json({
      connected: p2pNetwork.peers.size > 0,
      uptime,
      messages: p2pNetwork.messages,
    });
  } catch (error: any) {
    logger.error('Error getting network status', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route POST /api/p2p/peers
 * @desc Add a new peer
 * @access Private
 */
router.post('/peers', async (req: Request, res: Response) => {
  try {
    // Get the user ID from the request
    const userId = req.userId;
    
    // Extract peer data from request body
    const { id, ip, port, version, userAgent } = req.body;
    
    // Add the peer to the network
    p2pNetwork.peers.set(id, {
      id,
      ip,
      port,
      lastSeen: new Date(),
      connected: true,
      version,
      userAgent,
    });
    
    // Return success
    return res.status(201).json({ message: 'Peer added' });
  } catch (error: any) {
    logger.error('Error adding peer', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route DELETE /api/p2p/peers/:id
 * @desc Remove a peer
 * @access Private
 */
router.delete('/peers/:id', [
  // Validate parameters
  param('id').notEmpty().withMessage('Peer ID is required'),
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Get the user ID from the request
    const userId = req.userId;
    
    // Get the peer ID from the request parameters
    const peerId = req.params.id;
    
    // Remove the peer from the network
    p2pNetwork.peers.delete(peerId);
    
    // Return success
    return res.status(200).json({ message: 'Peer removed' });
  } catch (error: any) {
    logger.error('Error removing peer', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route POST /api/p2p/broadcast
 * @desc Broadcast a message to all peers
 * @access Private
 */
router.post('/broadcast', async (req: Request, res: Response) => {
  try {
    // Get the user ID from the request
    const userId = req.userId;
    
    // Extract message data from request body
    const { type, data } = req.body;
    
    // Increment the sent messages counter
    p2pNetwork.messages.sent += p2pNetwork.peers.size;
    
    // In a real application, this would broadcast the message to all peers
    // For this example, we'll just log the message
    logger.info('Broadcasting message', { type, data });
    
    // Return success
    return res.status(200).json({ message: 'Message broadcast' });
  } catch (error: any) {
    logger.error('Error broadcasting message', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route POST /api/p2p/message
 * @desc Send a message to a specific peer
 * @access Private
 */
router.post('/message', async (req: Request, res: Response) => {
  try {
    // Get the user ID from the request
    const userId = req.userId;
    
    // Extract message data from request body
    const { peerId, type, data } = req.body;
    
    // Check if the peer exists
    if (!p2pNetwork.peers.has(peerId)) {
      return res.status(404).json({ error: 'Peer not found' });
    }
    
    // Increment the sent messages counter
    p2pNetwork.messages.sent++;
    
    // In a real application, this would send the message to the peer
    // For this example, we'll just log the message
    logger.info('Sending message to peer', { peerId, type, data });
    
    // Return success
    return res.status(200).json({ message: 'Message sent' });
  } catch (error: any) {
    logger.error('Error sending message', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route POST /api/p2p/receive
 * @desc Receive a message from a peer
 * @access Private
 */
router.post('/receive', async (req: Request, res: Response) => {
  try {
    // Get the user ID from the request
    const userId = req.userId;
    
    // Extract message data from request body
    const { peerId, type, data } = req.body;
    
    // Check if the peer exists
    if (!p2pNetwork.peers.has(peerId)) {
      return res.status(404).json({ error: 'Peer not found' });
    }
    
    // Update the peer's last seen timestamp
    const peer = p2pNetwork.peers.get(peerId);
    if (peer) {
      peer.lastSeen = new Date();
    }
    
    // Increment the received messages counter
    p2pNetwork.messages.received++;
    
    // In a real application, this would process the message
    // For this example, we'll just log the message
    logger.info('Received message from peer', { peerId, type, data });
    
    // Return success
    return res.status(200).json({ message: 'Message received' });
  } catch (error: any) {
    logger.error('Error receiving message', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route GET /api/p2p/discover
 * @desc Discover new peers
 * @access Public
 */
router.get('/discover', (req: Request, res: Response) => {
  try {
    // In a real application, this would discover new peers
    // For this example, we'll just return some mock peers
    const mockPeers = [
      {
        id: 'peer1',
        ip: '192.168.1.1',
        port: 8333,
        version: '1.0.0',
        userAgent: 'DarkSwap/1.0.0',
      },
      {
        id: 'peer2',
        ip: '192.168.1.2',
        port: 8333,
        version: '1.0.0',
        userAgent: 'DarkSwap/1.0.0',
      },
      {
        id: 'peer3',
        ip: '192.168.1.3',
        port: 8333,
        version: '1.0.0',
        userAgent: 'DarkSwap/1.0.0',
      },
    ];
    
    // Return the discovered peers
    return res.status(200).json(mockPeers);
  } catch (error: any) {
    logger.error('Error discovering peers', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;