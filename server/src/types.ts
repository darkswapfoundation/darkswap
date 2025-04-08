/**
 * types.ts - Type definitions for the DarkSwap server
 * 
 * This file contains type definitions for the DarkSwap server.
 */

/**
 * Error report
 */
export interface ErrorReport {
  /**
   * Error name
   */
  name: string;
  
  /**
   * Error message
   */
  message: string;
  
  /**
   * Error code
   */
  code?: number;
  
  /**
   * Error details
   */
  details?: Record<string, any>;
  
  /**
   * Error stack trace
   */
  stack?: string;
  
  /**
   * Timestamp when the error occurred
   */
  timestamp: number;
  
  /**
   * Timestamp when the error was received by the server
   */
  serverTimestamp?: number;
  
  /**
   * Application version
   */
  appVersion?: string;
  
  /**
   * User ID
   */
  userId?: string;
  
  /**
   * Session ID
   */
  sessionId?: string;
  
  /**
   * URL where the error occurred
   */
  url?: string;
  
  /**
   * User agent
   */
  userAgent?: string;
  
  /**
   * Tags
   */
  tags?: Record<string, string>;
}

/**
 * Error report query
 */
export interface ErrorReportQuery {
  /**
   * Start date
   */
  startDate?: Date;
  
  /**
   * End date
   */
  endDate?: Date;
  
  /**
   * Error type
   */
  errorType?: string;
  
  /**
   * Error code
   */
  errorCode?: number;
  
  /**
   * Application version
   */
  appVersion?: string;
  
  /**
   * User ID
   */
  userId?: string;
  
  /**
   * Session ID
   */
  sessionId?: string;
  
  /**
   * Limit
   */
  limit?: number;
  
  /**
   * Offset
   */
  offset?: number;
  
  /**
   * Sort by
   */
  sortBy?: string;
  
  /**
   * Sort order
   */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Error aggregation
 */
export interface ErrorAggregation {
  /**
   * Group
   */
  group: string;
  
  /**
   * Count
   */
  count: number;
}

/**
 * Error trend
 */
export interface ErrorTrend {
  /**
   * Time period
   */
  period: string;
  
  /**
   * Count
   */
  count: number;
}

/**
 * Notification type
 */
export type NotificationType = 'critical-error' | 'warning' | 'info';

/**
 * Notification
 */
export interface Notification {
  /**
   * Notification type
   */
  type: NotificationType;
  
  /**
   * Notification message
   */
  message: string;
  
  /**
   * Notification details
   */
  details?: any;
  
  /**
   * Timestamp
   */
  timestamp: number;
}

/**
 * Database interface
 */
export interface DatabaseInterface {
  /**
   * Store error report
   * @param errorReport - Error report
   */
  storeErrorReport(errorReport: ErrorReport): Promise<void>;
  
  /**
   * Get error report
   * @param id - Error report ID
   * @returns Error report
   */
  getErrorReport(id: string): Promise<ErrorReport | null>;
  
  /**
   * Get error reports
   * @param query - Error report query
   * @returns Error reports
   */
  getErrorReports(query: ErrorReportQuery): Promise<ErrorReport[]>;
  
  /**
   * Get error report count
   * @param query - Error report query
   * @returns Error report count
   */
  getErrorReportCount(query: ErrorReportQuery): Promise<number>;
  
  /**
   * Get error aggregation
   * @param query - Error report query
   * @param groupBy - Group by field
   * @returns Error aggregation
   */
  getErrorAggregation(query: ErrorReportQuery, groupBy: string): Promise<ErrorAggregation[]>;
  
  /**
   * Get error trend
   * @param query - Error report query
   * @param period - Time period
   * @returns Error trend
   */
  getErrorTrend(query: ErrorReportQuery, period: 'hour' | 'day' | 'week' | 'month'): Promise<ErrorTrend[]>;
}

/**
 * Notification interface
 */
export interface NotificationInterface {
  /**
   * Send notification
   * @param type - Notification type
   * @param message - Notification message
   * @param details - Notification details
   */
  sendNotification(type: NotificationType, message: string, details?: any): Promise<void>;
}