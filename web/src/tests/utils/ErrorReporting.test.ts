/**
 * ErrorReporting.test.ts - Tests for the error reporting utilities
 */

import {
  configureErrorReporting,
  reportError,
  createErrorReporter,
  ErrorReporter,
  initializeErrorReporting,
} from '../../utils/ErrorReporting';
import { DarkSwapError, ErrorCode } from '../../utils/ErrorHandling';

describe('ErrorReporting', () => {
  // Mock fetch
  const originalFetch = global.fetch;
  
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
    });
    
    // Reset configuration
    configureErrorReporting({ enabled: false });
    
    // Mock console.error
    console.error = jest.fn();
  });
  
  afterEach(() => {
    global.fetch = originalFetch;
  });
  
  describe('configureErrorReporting', () => {
    it('should configure error reporting', () => {
      configureErrorReporting({
        enabled: true,
        endpoint: 'https://example.com/errors',
        appVersion: '1.0.0',
        userId: 'user-123',
        sessionId: 'session-456',
        tags: {
          environment: 'test',
        },
      });
      
      // Report an error to test configuration
      reportError(new Error('Test error'));
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/errors',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.any(String),
        })
      );
      
      // Parse the request body
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      
      expect(body).toEqual(expect.objectContaining({
        name: 'Error',
        message: 'Test error',
        appVersion: '1.0.0',
        userId: 'user-123',
        sessionId: 'session-456',
        tags: {
          environment: 'test',
        },
      }));
    });
  });
  
  describe('reportError', () => {
    it('should not report an error if disabled', async () => {
      configureErrorReporting({ enabled: false });
      
      await reportError(new Error('Test error'));
      
      expect(global.fetch).not.toHaveBeenCalled();
    });
    
    it('should report an error if enabled', async () => {
      configureErrorReporting({
        enabled: true,
        endpoint: 'https://example.com/errors',
      });
      
      await reportError(new Error('Test error'));
      
      expect(global.fetch).toHaveBeenCalled();
    });
    
    it('should report a DarkSwapError', async () => {
      configureErrorReporting({
        enabled: true,
        endpoint: 'https://example.com/errors',
      });
      
      const error = new DarkSwapError('Test error', ErrorCode.Unknown, { foo: 'bar' });
      
      await reportError(error);
      
      expect(global.fetch).toHaveBeenCalled();
      
      // Parse the request body
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      
      expect(body).toEqual(expect.objectContaining({
        name: 'DarkSwapError',
        message: 'Test error',
        code: ErrorCode.Unknown,
        details: { foo: 'bar' },
      }));
    });
    
    it('should report an error with context', async () => {
      configureErrorReporting({
        enabled: true,
        endpoint: 'https://example.com/errors',
      });
      
      await reportError(new Error('Test error'), 'TestContext');
      
      expect(global.fetch).toHaveBeenCalled();
      
      // Parse the request body
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      
      expect(body).toEqual(expect.objectContaining({
        name: 'Error',
        message: 'Test error',
        tags: {
          context: 'TestContext',
        },
      }));
    });
    
    it('should log an error if fetch fails', async () => {
      configureErrorReporting({
        enabled: true,
        endpoint: 'https://example.com/errors',
      });
      
      // Mock fetch to reject
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Fetch error'));
      
      await reportError(new Error('Test error'));
      
      expect(console.error).toHaveBeenCalledWith('Failed to send error report:', expect.any(Error));
    });
    
    it('should log an error if response is not ok', async () => {
      configureErrorReporting({
        enabled: true,
        endpoint: 'https://example.com/errors',
      });
      
      // Mock fetch to return not ok
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });
      
      await reportError(new Error('Test error'));
      
      expect(console.error).toHaveBeenCalledWith('Failed to send error report:', expect.any(Error));
    });
    
    it('should log the error report if no endpoint is configured', async () => {
      configureErrorReporting({
        enabled: true,
      });
      
      await reportError(new Error('Test error'));
      
      expect(global.fetch).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Error report:', expect.any(Object));
    });
  });
  
  describe('createErrorReporter', () => {
    it('should create an error reporter', async () => {
      configureErrorReporting({
        enabled: true,
        endpoint: 'https://example.com/errors',
      });
      
      const reporter = createErrorReporter('TestContext');
      
      await reporter(new Error('Test error'));
      
      expect(global.fetch).toHaveBeenCalled();
      
      // Parse the request body
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      
      expect(body).toEqual(expect.objectContaining({
        name: 'Error',
        message: 'Test error',
        tags: {
          context: 'TestContext',
        },
      }));
    });
  });
  
  describe('ErrorReporter', () => {
    it('should create an error reporter', async () => {
      configureErrorReporting({
        enabled: true,
        endpoint: 'https://example.com/errors',
      });
      
      const reporter = new ErrorReporter('TestContext');
      
      await reporter.report(new Error('Test error'));
      
      expect(global.fetch).toHaveBeenCalled();
      
      // Parse the request body
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      
      expect(body).toEqual(expect.objectContaining({
        name: 'Error',
        message: 'Test error',
        tags: {
          context: 'TestContext',
        },
      }));
    });
    
    it('should create a child error reporter', async () => {
      configureErrorReporting({
        enabled: true,
        endpoint: 'https://example.com/errors',
      });
      
      const reporter = new ErrorReporter('TestContext');
      const childReporter = reporter.createChild('ChildContext');
      
      await childReporter.report(new Error('Test error'));
      
      expect(global.fetch).toHaveBeenCalled();
      
      // Parse the request body
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      
      expect(body).toEqual(expect.objectContaining({
        name: 'Error',
        message: 'Test error',
        tags: {
          context: 'TestContext.ChildContext',
        },
      }));
    });
  });
  
  describe('initializeErrorReporting', () => {
    it('should initialize error reporting', () => {
      // Mock window event listeners
      const addEventListener = jest.fn();
      const removeEventListener = jest.fn();
      
      Object.defineProperty(global, 'window', {
        value: {
          addEventListener,
          removeEventListener,
        },
        writable: true,
      });
      
      const cleanup = initializeErrorReporting({
        enabled: true,
        endpoint: 'https://example.com/errors',
      });
      
      expect(addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
      expect(addEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
      
      // Clean up
      cleanup();
      
      expect(removeEventListener).toHaveBeenCalledWith('error', expect.any(Function));
      expect(removeEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    });
  });
});