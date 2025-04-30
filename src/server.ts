import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { logger, stream } from './utils/logger';
import dbConnection from './db';
import { verifyAuthToken } from './utils/auth';
import { createWebSocketServer } from './websocket';
import { createWebSocketHandlers } from './websocket/handlers';

// Import routes
import authRoutes from './routes/auth';
import orderRoutes from './routes/orders';
import tradeRoutes from './routes/trades';
import assetRoutes from './routes/assets';
import walletRoutes from './routes/wallet';
import marketRoutes from './routes/market';
import p2pRoutes from './routes/p2p';

/**
 * Error handler middleware
 */
function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  logger.error('Error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
}

/**
 * Authentication middleware
 */
function authenticate(req: Request, res: Response, next: NextFunction): void {
  // Get the authorization header
  const authHeader = req.headers.authorization;
  
  // If there is no authorization header, return an error
  if (!authHeader) {
    res.status(401).json({ error: 'No authorization header' });
    return;
  }
  
  // Get the token from the authorization header
  const token = authHeader.split(' ')[1];
  
  // If there is no token, return an error
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  
  // Verify the token
  const userId = verifyAuthToken(token);
  
  // If the token is invalid, return an error
  if (!userId) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
  
  // Add the user ID to the request
  req.userId = userId;
  
  // Continue to the next middleware
  next();
}

/**
 * Starts the server
 * @param port Port to listen on
 * @returns HTTP server
 */
export async function startServer(port: number = 3000): Promise<any> {
  try {
    // Connect to the database
    await dbConnection.connect();
    
    // Create the Express app
    const app = express();
    
    // Set up middleware
    app.use(cors());
    app.use(helmet());
    app.use(morgan('combined', { stream }));
    app.use(compression());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Set up routes
    app.use('/api/auth', authRoutes);
    app.use('/api/orders', authenticate, orderRoutes);
    app.use('/api/trades', authenticate, tradeRoutes);
    app.use('/api/assets', assetRoutes);
    app.use('/api/wallet', authenticate, walletRoutes);
    app.use('/api/market', marketRoutes);
    app.use('/api/p2p', p2pRoutes);
    
    // Set up error handler
    app.use(errorHandler);
    
    // Create the HTTP server
    const server = createServer(app);
    
    // Create the WebSocket server
    const webSocketServer = createWebSocketServer(server);
    
    // Create the WebSocket handlers
    const webSocketHandlers = createWebSocketHandlers(webSocketServer);
    
    // Start periodic WebSocket updates
    webSocketHandlers.startPeriodicUpdates();
    
    // Start the server
    server.listen(port, () => {
      logger.info(`Server listening on port ${port}`);
    });
    
    return server;
  } catch (error) {
    logger.error('Failed to start server', error);
    throw error;
  }
}

/**
 * Stops the server
 * @param server HTTP server
 */
export async function stopServer(server: any): Promise<void> {
  try {
    // Close the server
    await new Promise<void>((resolve, reject) => {
      server.close((err: Error) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    
    // Disconnect from the database
    await dbConnection.disconnect();
    
    logger.info('Server stopped');
  } catch (error) {
    logger.error('Failed to stop server', error);
    throw error;
  }
}

// If this file is run directly, start the server
if (require.main === module) {
  startServer().catch((error) => {
    logger.error('Failed to start server', error);
    process.exit(1);
  });
}

// Add userId to Request interface
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}