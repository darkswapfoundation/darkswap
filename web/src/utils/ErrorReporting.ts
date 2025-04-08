/**
 * ErrorReporting.ts - Error reporting utilities
 * 
 * This file provides error reporting utilities for the DarkSwap application.
 */

import { DarkSwapError, createError } from './ErrorHandling';

/**
 * Error reporting configuration
 */
interface ErrorReportingConfig {
  /**
   * Whether error reporting is enabled
   */
  enabled: boolean;
  
  /**
   * Error reporting endpoint
   */
  endpoint?: string;
  
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
   * Tags
   */
  tags?: Record<string, string>;
}

/**
 * Error reporting configuration
 */
let config: ErrorReportingConfig = {
  enabled: false,
};

/**
 * Configure error reporting
 * @param newConfig - New configuration
 */
export function configureErrorReporting(newConfig: Partial<ErrorReportingConfig>): void {
  config = {
    ...config,
    ...newConfig,
  };
}

/**
 * Report an error
 * @param error - Error to report
 * @param context - Error context
 * @returns Promise that resolves when the error is reported
 */
export async function reportError(error: unknown, context?: string): Promise<void> {
  // Check if error reporting is enabled
  if (!config.enabled) {
    return;
  }
  
  try {
    // Convert error to DarkSwapError
    const darkswapError = createError(error);
    
    // Create error report
    const report = {
      name: darkswapError.name,
      message: darkswapError.message,
      code: darkswapError.code,
      details: darkswapError.details,
      stack: darkswapError.stack,
      timestamp: Date.now(),
      appVersion: config.appVersion,
      userId: config.userId,
      sessionId: config.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      tags: {
        ...config.tags,
        ...(context ? { context } : {}),
      },
    };
    
    // Send error report
    if (config.endpoint) {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });
      
      // Check response
      if (!response.ok) {
        throw new Error(`Failed to send error report: ${response.status} ${response.statusText}`);
      }
    } else {
      // Log error report
      console.error('Error report:', report);
    }
  } catch (err) {
    // Log error
    console.error('Failed to report error:', err);
  }
}

/**
 * Create an error reporter
 * @param context - Error context
 * @returns Error reporter function
 */
export function createErrorReporter(context: string): (error: unknown) => Promise<void> {
  return (error: unknown) => reportError(error, context);
}

/**
 * Error reporter class
 */
export class ErrorReporter {
  /**
   * Error context
   */
  private context: string;
  
  /**
   * Create a new error reporter
   * @param context - Error context
   */
  constructor(context: string) {
    this.context = context;
  }
  
  /**
   * Report an error
   * @param error - Error to report
   * @returns Promise that resolves when the error is reported
   */
  async report(error: unknown): Promise<void> {
    return reportError(error, this.context);
  }
  
  /**
   * Create a child error reporter
   * @param childContext - Child context
   * @returns Child error reporter
   */
  createChild(childContext: string): ErrorReporter {
    return new ErrorReporter(`${this.context}.${childContext}`);
  }
}

/**
 * Initialize error reporting
 * @param config - Error reporting configuration
 * @returns Function to clean up error reporting
 */
export function initializeErrorReporting(config: Partial<ErrorReportingConfig>): () => void {
  // Configure error reporting
  configureErrorReporting(config);
  
  // Create error reporter
  const reporter = new ErrorReporter('global');
  
  // Handle unhandled errors
  const handleError = (event: ErrorEvent) => {
    reporter.report(event.error || new Error(event.message));
  };
  
  // Handle unhandled promise rejections
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    reporter.report(event.reason);
  };
  
  // Add event listeners
  if (typeof window !== 'undefined') {
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
  }
  
  // Return cleanup function
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    }
  };
}

/**
 * Default export
 */
export default {
  configureErrorReporting,
  reportError,
  createErrorReporter,
  ErrorReporter,
  initializeErrorReporting,
};