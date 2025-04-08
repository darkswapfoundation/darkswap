/**
 * database.ts - Database interface for the DarkSwap server
 * 
 * This file provides a database interface for the DarkSwap server.
 * It uses MongoDB as the database backend.
 */

import { MongoClient, Collection, ObjectId } from 'mongodb';
import { ErrorReport, ErrorReportQuery, ErrorAggregation, ErrorTrend, DatabaseInterface } from './types';

/**
 * Database class
 */
class DatabaseClass implements DatabaseInterface {
  /**
   * MongoDB client
   */
  private client: MongoClient | null = null;
  
  /**
   * Error reports collection
   */
  private errorReportsCollection: Collection<ErrorReport> | null = null;
  
  /**
   * Initialize database
   * @param connectionString - MongoDB connection string
   */
  async initialize(connectionString: string): Promise<void> {
    try {
      // Connect to MongoDB
      this.client = await MongoClient.connect(connectionString);
      
      // Get database
      const db = this.client.db('darkswap');
      
      // Get collections
      this.errorReportsCollection = db.collection<ErrorReport>('errorReports');
      
      // Create indexes
      await this.createIndexes();
      
      console.log('Database initialized');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }
  
  /**
   * Create indexes
   */
  private async createIndexes(): Promise<void> {
    if (!this.errorReportsCollection) {
      throw new Error('Error reports collection not initialized');
    }
    
    // Create indexes
    await this.errorReportsCollection.createIndex({ timestamp: -1 });
    await this.errorReportsCollection.createIndex({ serverTimestamp: -1 });
    await this.errorReportsCollection.createIndex({ name: 1 });
    await this.errorReportsCollection.createIndex({ code: 1 });
    await this.errorReportsCollection.createIndex({ appVersion: 1 });
    await this.errorReportsCollection.createIndex({ userId: 1 });
    await this.errorReportsCollection.createIndex({ sessionId: 1 });
  }
  
  /**
   * Store error report
   * @param errorReport - Error report
   */
  async storeErrorReport(errorReport: ErrorReport): Promise<void> {
    if (!this.errorReportsCollection) {
      throw new Error('Error reports collection not initialized');
    }
    
    // Store error report
    await this.errorReportsCollection.insertOne(errorReport);
  }
  
  /**
   * Get error report
   * @param id - Error report ID
   * @returns Error report
   */
  async getErrorReport(id: string): Promise<ErrorReport | null> {
    if (!this.errorReportsCollection) {
      throw new Error('Error reports collection not initialized');
    }
    
    // Get error report
    const errorReport = await this.errorReportsCollection.findOne({ _id: new ObjectId(id) });
    
    return errorReport;
  }
  
  /**
   * Get error reports
   * @param query - Error report query
   * @returns Error reports
   */
  async getErrorReports(query: ErrorReportQuery): Promise<ErrorReport[]> {
    if (!this.errorReportsCollection) {
      throw new Error('Error reports collection not initialized');
    }
    
    // Create MongoDB query
    const mongoQuery: any = {};
    
    // Add date range
    if (query.startDate || query.endDate) {
      mongoQuery.timestamp = {};
      
      if (query.startDate) {
        mongoQuery.timestamp.$gte = query.startDate.getTime();
      }
      
      if (query.endDate) {
        mongoQuery.timestamp.$lte = query.endDate.getTime();
      }
    }
    
    // Add error type
    if (query.errorType) {
      mongoQuery.name = query.errorType;
    }
    
    // Add error code
    if (query.errorCode !== undefined) {
      mongoQuery.code = query.errorCode;
    }
    
    // Add app version
    if (query.appVersion) {
      mongoQuery.appVersion = query.appVersion;
    }
    
    // Add user ID
    if (query.userId) {
      mongoQuery.userId = query.userId;
    }
    
    // Add session ID
    if (query.sessionId) {
      mongoQuery.sessionId = query.sessionId;
    }
    
    // Create sort
    const sort: any = {};
    sort[query.sortBy || 'timestamp'] = query.sortOrder === 'asc' ? 1 : -1;
    
    // Get error reports
    const errorReports = await this.errorReportsCollection
      .find(mongoQuery)
      .sort(sort)
      .skip(query.offset || 0)
      .limit(query.limit || 100)
      .toArray();
    
    return errorReports;
  }
  
  /**
   * Get error report count
   * @param query - Error report query
   * @returns Error report count
   */
  async getErrorReportCount(query: ErrorReportQuery): Promise<number> {
    if (!this.errorReportsCollection) {
      throw new Error('Error reports collection not initialized');
    }
    
    // Create MongoDB query
    const mongoQuery: any = {};
    
    // Add date range
    if (query.startDate || query.endDate) {
      mongoQuery.timestamp = {};
      
      if (query.startDate) {
        mongoQuery.timestamp.$gte = query.startDate.getTime();
      }
      
      if (query.endDate) {
        mongoQuery.timestamp.$lte = query.endDate.getTime();
      }
    }
    
    // Add error type
    if (query.errorType) {
      mongoQuery.name = query.errorType;
    }
    
    // Add error code
    if (query.errorCode !== undefined) {
      mongoQuery.code = query.errorCode;
    }
    
    // Add app version
    if (query.appVersion) {
      mongoQuery.appVersion = query.appVersion;
    }
    
    // Add user ID
    if (query.userId) {
      mongoQuery.userId = query.userId;
    }
    
    // Add session ID
    if (query.sessionId) {
      mongoQuery.sessionId = query.sessionId;
    }
    
    // Get error report count
    const count = await this.errorReportsCollection.countDocuments(mongoQuery);
    
    return count;
  }
  
  /**
   * Get error aggregation
   * @param query - Error report query
   * @param groupBy - Group by field
   * @returns Error aggregation
   */
  async getErrorAggregation(query: ErrorReportQuery, groupBy: string): Promise<ErrorAggregation[]> {
    if (!this.errorReportsCollection) {
      throw new Error('Error reports collection not initialized');
    }
    
    // Create MongoDB query
    const mongoQuery: any = {};
    
    // Add date range
    if (query.startDate || query.endDate) {
      mongoQuery.timestamp = {};
      
      if (query.startDate) {
        mongoQuery.timestamp.$gte = query.startDate.getTime();
      }
      
      if (query.endDate) {
        mongoQuery.timestamp.$lte = query.endDate.getTime();
      }
    }
    
    // Add error type
    if (query.errorType) {
      mongoQuery.name = query.errorType;
    }
    
    // Add error code
    if (query.errorCode !== undefined) {
      mongoQuery.code = query.errorCode;
    }
    
    // Add app version
    if (query.appVersion) {
      mongoQuery.appVersion = query.appVersion;
    }
    
    // Add user ID
    if (query.userId) {
      mongoQuery.userId = query.userId;
    }
    
    // Add session ID
    if (query.sessionId) {
      mongoQuery.sessionId = query.sessionId;
    }
    
    // Create group
    const group: any = {
      _id: `$${groupBy}`,
      count: { $sum: 1 },
    };
    
    // Get error aggregation
    const aggregation = await this.errorReportsCollection
      .aggregate([
        { $match: mongoQuery },
        { $group: group },
        { $project: { _id: 0, group: '$_id', count: 1 } },
        { $sort: { count: -1 } },
      ])
      .toArray();
    
    return aggregation as ErrorAggregation[];
  }
  
  /**
   * Get error trend
   * @param query - Error report query
   * @param period - Time period
   * @returns Error trend
   */
  async getErrorTrend(query: ErrorReportQuery, period: 'hour' | 'day' | 'week' | 'month'): Promise<ErrorTrend[]> {
    if (!this.errorReportsCollection) {
      throw new Error('Error reports collection not initialized');
    }
    
    // Create MongoDB query
    const mongoQuery: any = {};
    
    // Add date range
    if (query.startDate || query.endDate) {
      mongoQuery.timestamp = {};
      
      if (query.startDate) {
        mongoQuery.timestamp.$gte = query.startDate.getTime();
      }
      
      if (query.endDate) {
        mongoQuery.timestamp.$lte = query.endDate.getTime();
      }
    }
    
    // Add error type
    if (query.errorType) {
      mongoQuery.name = query.errorType;
    }
    
    // Add error code
    if (query.errorCode !== undefined) {
      mongoQuery.code = query.errorCode;
    }
    
    // Add app version
    if (query.appVersion) {
      mongoQuery.appVersion = query.appVersion;
    }
    
    // Add user ID
    if (query.userId) {
      mongoQuery.userId = query.userId;
    }
    
    // Add session ID
    if (query.sessionId) {
      mongoQuery.sessionId = query.sessionId;
    }
    
    // Create date format
    let dateFormat: string;
    
    switch (period) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00';
        break;
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-W%U';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
        break;
    }
    
    // Get error trend
    const trend = await this.errorReportsCollection
      .aggregate([
        { $match: mongoQuery },
        {
          $group: {
            _id: {
              $dateToString: {
                format: dateFormat,
                date: { $toDate: '$timestamp' },
              },
            },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, period: '$_id', count: 1 } },
        { $sort: { period: 1 } },
      ])
      .toArray();
    
    return trend as ErrorTrend[];
  }
}

/**
 * Database instance
 */
export const Database = new DatabaseClass();