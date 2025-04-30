import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { BridgeClient } from './bridge/client';
import { authRouter } from './routes/auth';
import { bridgeRouter } from './routes/bridge';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 3001;

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Create bridge client
const bridgeClient = new BridgeClient();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/bridge', bridgeRouter);

// Socket.IO connection
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Send initial state
  socket.emit('wallet_status', bridgeClient.getWalletStatus());
  socket.emit('network_status', bridgeClient.getNetworkStatus());
  socket.emit('wallet_balance', bridgeClient.getWalletBalance());
  socket.emit('connected_peers', bridgeClient.getConnectedPeers());
  socket.emit('orders', bridgeClient.getOrders());
  socket.emit('trades', bridgeClient.getTrades());

  // Handle disconnect
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Start server
server.listen(port, () => {
  logger.info(`Server listening on port ${port}`);

  // Start bridge client
  bridgeClient.start().catch((error) => {
    logger.error('Failed to start bridge client:', error);
    process.exit(1);
  });
});

// Handle process termination
process.on('SIGINT', () => {
  logger.info('Shutting down server...');
  
  // Stop bridge client
  bridgeClient.stop().catch((error) => {
    logger.error('Failed to stop bridge client:', error);
  });
  
  // Close server
  server.close(() => {
    logger.info('Server shut down');
    process.exit(0);
  });
});