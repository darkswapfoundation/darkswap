/**
 * errorMonitoring.ts - Backend error monitoring service
 * 
 * This file provides a backend service for collecting and analyzing error reports
 * from the DarkSwap application.
 */

import * as express from 'express';
import { Database } from './database';
import { sendNotification } from './notifications';
import { ErrorReport, ErrorReportQuery } from './types';

const router = express.Router();

/**
 * Error report endpoint
 * 
 * This endpoint receives error reports from the DarkSwap application and stores them
 * in the database. It also sends notifications for critical errors.
 */
router.post('/api/errors', async (req, res) => {
  try {
    const errorReport: ErrorReport = req.body;
    
    // Validate error report
    if (!errorReport.name || !errorReport.message) {
      return res.status(400).json({ error: 'Invalid error report' });
    }
    
    // Add server timestamp
    errorReport.serverTimestamp = Date.now();
    
    // Store error report in database
    await Database.storeErrorReport(errorReport);
    
    // Send notification for critical errors
    if (isCriticalError(errorReport)) {
      await sendCriticalErrorNotification(errorReport);
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Failed to process error report:', error);
    return res.status(500).json({ error: 'Failed to process error report' });
  }
});

/**
 * Error dashboard endpoint
 * 
 * This endpoint provides access to error reports stored in the database.
 * It supports filtering by date range, error type, and pagination.
 */
router.get('/api/errors', async (req, res) => {
  try {
    const query: ErrorReportQuery = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      errorType: req.query.errorType as string,
      errorCode: req.query.errorCode ? parseInt(req.query.errorCode as string) : undefined,
      appVersion: req.query.appVersion as string,
      userId: req.query.userId as string,
      sessionId: req.query.sessionId as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      sortBy: req.query.sortBy as string || 'timestamp',
      sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'desc',
    };
    
    // Get error reports from database
    const errorReports = await Database.getErrorReports(query);
    
    // Get error report count
    const count = await Database.getErrorReportCount(query);
    
    return res.status(200).json({
      errorReports,
      count,
      limit: query.limit,
      offset: query.offset,
    });
  } catch (error) {
    console.error('Failed to get error reports:', error);
    return res.status(500).json({ error: 'Failed to get error reports' });
  }
});

/**
 * Error aggregation endpoint
 * 
 * This endpoint provides aggregated error data for the error dashboard.
 * It supports grouping by error type, error code, app version, etc.
 */
router.get('/api/errors/aggregation', async (req, res) => {
  try {
    const query: ErrorReportQuery = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      errorType: req.query.errorType as string,
      errorCode: req.query.errorCode ? parseInt(req.query.errorCode as string) : undefined,
      appVersion: req.query.appVersion as string,
      userId: req.query.userId as string,
      sessionId: req.query.sessionId as string,
    };
    
    const groupBy = req.query.groupBy as string || 'errorType';
    
    // Get error aggregation from database
    const aggregation = await Database.getErrorAggregation(query, groupBy);
    
    return res.status(200).json(aggregation);
  } catch (error) {
    console.error('Failed to get error aggregation:', error);
    return res.status(500).json({ error: 'Failed to get error aggregation' });
  }
});

/**
 * Error trend endpoint
 * 
 * This endpoint provides error trend data for the error dashboard.
 * It supports grouping by time period (hour, day, week, month).
 */
router.get('/api/errors/trend', async (req, res) => {
  try {
    const query: ErrorReportQuery = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      errorType: req.query.errorType as string,
      errorCode: req.query.errorCode ? parseInt(req.query.errorCode as string) : undefined,
      appVersion: req.query.appVersion as string,
      userId: req.query.userId as string,
      sessionId: req.query.sessionId as string,
    };
    
    const period = req.query.period as 'hour' | 'day' | 'week' | 'month' || 'day';
    
    // Get error trend from database
    const trend = await Database.getErrorTrend(query, period);
    
    return res.status(200).json(trend);
  } catch (error) {
    console.error('Failed to get error trend:', error);
    return res.status(500).json({ error: 'Failed to get error trend' });
  }
});

/**
 * Error details endpoint
 * 
 * This endpoint provides detailed information about a specific error report.
 */
router.get('/api/errors/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // Get error report from database
    const errorReport = await Database.getErrorReport(id);
    
    if (!errorReport) {
      return res.status(404).json({ error: 'Error report not found' });
    }
    
    return res.status(200).json(errorReport);
  } catch (error) {
    console.error('Failed to get error report:', error);
    return res.status(500).json({ error: 'Failed to get error report' });
  }
});

/**
 * Check if an error is critical
 * @param errorReport - Error report
 * @returns Whether the error is critical
 */
function isCriticalError(errorReport: ErrorReport): boolean {
  // Check error code
  if (errorReport.code !== undefined) {
    // WebAssembly errors are critical
    if (errorReport.code >= 100 && errorReport.code < 200) {
      return true;
    }
    
    // Network errors are critical
    if (errorReport.code >= 200 && errorReport.code < 300) {
      return true;
    }
    
    // Wallet errors are critical
    if (errorReport.code >= 300 && errorReport.code < 400) {
      return true;
    }
  }
  
  // Check error name
  if (errorReport.name) {
    // WebAssembly errors are critical
    if (errorReport.name === 'WasmError') {
      return true;
    }
    
    // Network errors are critical
    if (errorReport.name === 'NetworkError') {
      return true;
    }
    
    // Wallet errors are critical
    if (errorReport.name === 'WalletError') {
      return true;
    }
  }
  
  return false;
}

/**
 * Send notification for critical error
 * @param errorReport - Error report
 */
async function sendCriticalErrorNotification(errorReport: ErrorReport): Promise<void> {
  // Create notification message
  const message = `Critical error: ${errorReport.name} - ${errorReport.message}`;
  
  // Create notification details
  const details = {
    errorReport,
    timestamp: Date.now(),
  };
  
  // Send notification
  await sendNotification('critical-error', message, details);
}

export default router;