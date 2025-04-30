import { MongoClient, Db, Collection } from 'mongodb';
import { logger } from './utils/logger';

/**
 * Database interface
 */
interface Database {
  users: Collection;
  orders: Collection;
  trades: Collection;
  assets: Collection;
  wallets: Collection;
  transactions: Collection;
  sessions: Collection;
  apiKeys: Collection;
  twoFactorSecrets: Collection;
  priceHistory: Collection;
  tradingPairs: Collection;
}

/**
 * Database connection
 */
class DatabaseConnection {
  private client: MongoClient | null = null;
  private dbInstance: Db | null = null;
  public db: Database | null = null;

  /**
   * Connects to the database
   */
  public async connect(): Promise<void> {
    try {
      // Get the MongoDB URI from environment variables
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/darkswap';
      
      // Connect to MongoDB
      this.client = await MongoClient.connect(uri);
      
      // Get the database instance
      this.dbInstance = this.client.db();
      
      // Initialize collections
      this.db = {
        users: this.dbInstance.collection('users'),
        orders: this.dbInstance.collection('orders'),
        trades: this.dbInstance.collection('trades'),
        assets: this.dbInstance.collection('assets'),
        wallets: this.dbInstance.collection('wallets'),
        transactions: this.dbInstance.collection('transactions'),
        sessions: this.dbInstance.collection('sessions'),
        apiKeys: this.dbInstance.collection('apiKeys'),
        twoFactorSecrets: this.dbInstance.collection('twoFactorSecrets'),
        priceHistory: this.dbInstance.collection('priceHistory'),
        tradingPairs: this.dbInstance.collection('tradingPairs'),
      };
      
      logger.info('Connected to database');
    } catch (error) {
      logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  /**
   * Disconnects from the database
   */
  public async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.dbInstance = null;
        this.db = null;
        logger.info('Disconnected from database');
      }
    } catch (error) {
      logger.error('Failed to disconnect from database', error);
      throw error;
    }
  }

  /**
   * Gets the database instance
   * @returns Database instance
   */
  public getDb(): Database {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db;
  }
}

// Create a database connection
const dbConnection = new DatabaseConnection();

// Export the database
export const db = dbConnection.getDb();

// Export the database connection
export default dbConnection;