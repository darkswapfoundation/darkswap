/**
 * ErrorReporting - Error reporting utilities
 * 
 * This file provides error reporting utilities for the DarkSwap application.
 * It allows tracking and analyzing errors in production.
 */

import { DarkSwapError, ErrorCode } from './ErrorHandling';

// Error reporting configuration
interface ErrorReportingConfig {
  /** Whether to enable error reporting */
  enabled: boolean;
  
  /** API endpoint for error reporting */
  endpoint?: string;
  
  /** Application version */
  appVersion?: string;
  
  /** User ID */
  userId?: string;
  
  /** Session ID */
  sessionId?: string;
  
  /** Additional tags */
  tags?: Record<string, string>;
}

// Error report interface
interface ErrorReport {
  /** Error name */
  name: string;
  
  /** Error message */
  message: string;
  
  /** Error code */
  code?: number;
  
  /** Error details */
  details?: Record<string, any>;
  
  /** Error stack trace */
  stack?: string;
  
  /** Timestamp */
  timestamp: number;
  
  /** Application version */
  appVersion?: string;
  
  /** User ID */
  userId?: string;
  
  /** Session ID */
  sessionId?: string;
  
  /** URL */
  url?: string;
  
  /** User agent */
  userAgent?: string;
  
  /** Tags */
  tags?: Record<string, string>;
}

// Default configuration
const defaultConfig: ErrorReportingConfig = {
  enabled: false,
};

// Current configuration
let config: ErrorReportingConfig = { ...defaultConfig };

/**
 * Configure error reporting
 * @param newConfig New configuration
 */
export function configureErrorReporting(newConfig: Partial<ErrorReportingConfig>): void {
  config = {
    ...config,
    ...newConfig,
  };
}

/**
 * Report an error
 * @param error Error to report
 * @param context Context information
 * @returns Promise that resolves when the error is reported
 */
export async function reportError(error: unknown, context?: string): Promise<void> {
  // Check if error reporting is enabled
  if (!config.enabled) {
    return;
  }
  
  try {
    // Create error report
    const report = createErrorReport(error, context);
    
    // Send error report
    await sendErrorReport(report);
  } catch (err) {
    // Log error
    console.error('Failed to report error:', err);
  }
}

/**
 * Create an error report
 * @param error Error to report
 * @param context Context information
 * @returns Error report
 */
function createErrorReport(error: unknown, context?: string): ErrorReport {
  // Create report
  const report: ErrorReport = {
    name: 'Unknown Error',
    message: 'An unknown error occurred',
    timestamp: Date.now(),
    appVersion: config.appVersion,
    userId: config.userId,
    sessionId: config.sessionId,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    tags: config.tags,
  };
  
  // Add context as tag
  if (context) {
    report.tags = {
      ...report.tags,
      context,
    };
  }
  
  // Add error information
  if (error instanceof DarkSwapError) {
    report.name = error.name;
    report.message = error.message;
    report.code = error.code;
    report.details = error.details;
    report.stack = error.stack;
  } else if (error instanceof Error) {
    report.name = error.name;
    report.message = error.message;
    report.stack = error.stack;
  } else if (typeof error === 'string') {
    report.message = error;
  } else if (typeof error === 'object' && error !== null) {
    report.details = { originalError: error };
  }
  
  return report;
}

/**
 * Send an error report
 * @param report Error report
 * @returns Promise that resolves when the error report is sent
 */
async function sendErrorReport(report: ErrorReport): Promise<void> {
  // Check if endpoint is configured
  if (!config.endpoint) {
    // Log error report
    console.error('Error report:', report);
    return;
  }
  
  try {
    // Send error report
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
  } catch (err) {
    // Log error
    console.error('Failed to send error report:', err);
  }
}

/**
 * Create an error reporter function
 * @param context Context information
 * @returns Error reporter function
 */
export function createErrorReporter(context: string): (error: unknown) => Promise<void> {
  return (error: unknown) => reportError(error, context);
}

/**
 * Error reporter class
 */
export class ErrorReporter {
  private context: string;
  
  /**
   * Create a new error reporter
   * @param context Context information
   */
  constructor(context: string) {
    this.context = context;
  }
  
  /**
   * Report an error
   * @param error Error to report
   * @returns Promise that resolves when the error is reported
   */
  public async report(error: unknown): Promise<void> {
    return reportError(error, this.context);
  }
  
  /**
   * Create a child error reporter
   * @param childContext Child context information
   * @returns Child error reporter
   */
  public createChild(childContext: string): ErrorReporter {
    return new ErrorReporter(`${this.context}.${childContext}`);
  }
}

/**
 * Create a global error handler
 * @param context Context information
 * @returns Cleanup function
 */
export function createGlobalErrorHandler(context: string): () => void {
  // Create error reporter
  const reporter = createErrorReporter(context);
  
  // Handle unhandled errors
  const handleError = (event: ErrorEvent) => {
    reporter(event.error || new Error(event.message));
    
    // Prevent default error handling
    event.preventDefault();
  };
  
  // Handle unhandled promise rejections
  const handleRejection = (event: PromiseRejectionEvent) => {
    reporter(event.reason || new Error('Unhandled promise rejection'));
    
    // Prevent default error handling
    event.preventDefault();
  };
  
  // Register event listeners
  if (typeof window !== 'undefined') {
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
  }
  
  // Return cleanup function
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    }
  };
}

/**
 * Initialize error reporting
 * @param config Error reporting configuration
 * @returns Cleanup function
 */
export function initializeErrorReporting(config: Partial<ErrorReportingConfig> = {}): () => void {
  // Configure error reporting
  configureErrorReporting(config);
  
  // Create global error handler
  return createGlobalErrorHandler('global');
}