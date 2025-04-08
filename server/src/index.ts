/**
 * index.ts - Entry point for the DarkSwap server
 * 
 * This file is the entry point for the DarkSwap server.
 * It sets up the Express application and connects to the database.
 */

import * as express from 'express';
import * as cors from 'cors';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import * as dotenv from 'dotenv';
import { Database } from './database';
import errorMonitoring from './errorMonitoring';
import { configureNotifications } from './notifications';

// Load environment variables
dotenv.config();

// Create Express application
const app = express.default();

// Configure middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// Configure notifications
configureNotifications({
  enabled: process.env.NOTIFICATIONS_ENABLED === 'true',
  email: {
    enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true',
    host: process.env.EMAIL_HOST || '',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    username: process.env.EMAIL_USERNAME || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || '',
    to: (process.env.EMAIL_TO || '').split(','),
  },
  slack: {
    enabled: process.env.SLACK_NOTIFICATIONS_ENABLED === 'true',
    token: process.env.SLACK_TOKEN || '',
    channel: process.env.SLACK_CHANNEL || '',
  },
  discord: {
    enabled: process.env.DISCORD_NOTIFICATIONS_ENABLED === 'true',
    webhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
  },
});

// Configure routes
app.use(errorMonitoring);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await Database.initialize(process.env.MONGODB_URI || 'mongodb://localhost:27017/darkswap');
    
    // Start server
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server
startServer();