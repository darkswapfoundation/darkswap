/**
 * Logger utility for DarkSwap
 * 
 * This utility provides a centralized way to log messages in the DarkSwap application.
 * It supports different log levels and can be configured to log to different destinations.
 */

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Log entry
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteUrl?: string;
  batchSize?: number;
  flushInterval?: number;
}

/**
 * Default logger configuration
 */
const defaultConfig: LoggerConfig = {
  level: LogLevel.INFO,
  enableConsole: true,
  enableRemote: false,
  batchSize: 10,
  flushInterval: 5000, // 5 seconds
};

/**
 * Logger class
 */
export class Logger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  
  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    
    if (this.config.enableRemote) {
      this.startFlushTimer();
    }
  }
  
  /**
   * Set the logger configuration
   * 
   * @param config The logger configuration
   */
  public setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.enableRemote) {
      this.startFlushTimer();
    } else {
      this.stopFlushTimer();
    }
  }
  
  /**
   * Get the logger configuration
   * 
   * @returns The logger configuration
   */
  public getConfig(): LoggerConfig {
    return { ...this.config };
  }
  
  /**
   * Log a debug message
   * 
   * @param message The message to log
   * @param context Additional context for the log entry
   */
  public debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }
  
  /**
   * Log an info message
   * 
   * @param message The message to log
   * @param context Additional context for the log entry
   */
  public info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }
  
  /**
   * Log a warning message
   * 
   * @param message The message to log
   * @param context Additional context for the log entry
   */
  public warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }
  
  /**
   * Log an error message
   * 
   * @param message The message to log
   * @param context Additional context for the log entry
   */
  public error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }
  
  /**
   * Log a message
   * 
   * @param level The log level
   * @param message The message to log
   * @param context Additional context for the log entry
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    // Check if the log level is enabled
    if (!this.isLevelEnabled(level)) {
      return;
    }
    
    // Create the log entry
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };
    
    // Log to console if enabled
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }
    
    // Add to buffer if remote logging is enabled
    if (this.config.enableRemote) {
      this.logBuffer.push(entry);
      
      // Flush the buffer if it's full
      if (this.logBuffer.length >= (this.config.batchSize || 10)) {
        this.flushBuffer();
      }
    }
  }
  
  /**
   * Check if a log level is enabled
   * 
   * @param level The log level to check
   * @returns Whether the log level is enabled
   */
  private isLevelEnabled(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const configLevelIndex = levels.indexOf(this.config.level);
    const levelIndex = levels.indexOf(level);
    
    return levelIndex >= configLevelIndex;
  }
  
  /**
   * Log an entry to the console
   * 
   * @param entry The log entry to log
   */
  private logToConsole(entry: LogEntry): void {
    const { timestamp, level, message, context } = entry;
    
    // Format the log message
    let formattedMessage = `${timestamp} [${level.toUpperCase()}] ${message}`;
    
    // Add context if provided
    if (context) {
      formattedMessage += `\n${JSON.stringify(context, null, 2)}`;
    }
    
    // Log to the appropriate console method
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
    }
  }
  
  /**
   * Start the flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      this.stopFlushTimer();
    }
    
    this.flushTimer = setInterval(() => {
      this.flushBuffer();
    }, this.config.flushInterval || 5000);
  }
  
  /**
   * Stop the flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
  
  /**
   * Flush the log buffer to the remote server
   */
  private flushBuffer(): void {
    if (this.logBuffer.length === 0) {
      return;
    }
    
    // Clone the buffer and clear it
    const buffer = [...this.logBuffer];
    this.logBuffer = [];
    
    // Send the logs to the remote server
    this.sendLogsToRemote(buffer).catch((error) => {
      console.error('Failed to send logs to remote server:', error);
      
      // Add the logs back to the buffer
      this.logBuffer = [...buffer, ...this.logBuffer];
    });
  }
  
  /**
   * Send logs to the remote server
   * 
   * @param logs The logs to send
   */
  private async sendLogsToRemote(logs: LogEntry[]): Promise<void> {
    if (!this.config.remoteUrl) {
      return;
    }
    
    try {
      const response = await fetch(this.config.remoteUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logs),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send logs to remote server: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Failed to send logs to remote server: ${error.message}`);
    }
  }
}

/**
 * Create a logger instance
 */
export const logger = new Logger({
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableRemote: process.env.NODE_ENV === 'production',
  remoteUrl: process.env.LOG_SERVER_URL,
});

export default logger;