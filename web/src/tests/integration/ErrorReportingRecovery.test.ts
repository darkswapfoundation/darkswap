/**
 * ErrorReportingRecovery.test.ts - Integration tests for error reporting and recovery
 * 
 * This file contains integration tests for the error reporting and recovery systems,
 * testing how they work together in a realistic scenario.
 */

import {
  DarkSwapError,
  ErrorCode,
  WasmError,
  NetworkError,
  OrderError,
  WalletError,
  createError,
} from '../../utils/ErrorHandling';
import {
  configureErrorReporting,
  reportError,
  createErrorReporter,
  ErrorReporter,
} from '../../utils/ErrorReporting';
import {
  retry,
  recover,
  retryStrategy,
  fallbackStrategy,
  throwStrategy,
  customStrategy,
  wasmRecoveryStrategy,
  networkRecoveryStrategy,
  orderRecoveryStrategy,
  walletRecoveryStrategy,
} from '../../utils/ErrorRecovery';

describe('Error Reporting and Recovery Integration', () => {
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
    
    // Use fake timers
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
    jest.useRealTimers();
  });
  
  it('should report errors during retry', async () => {
    // Configure error reporting
    configureErrorReporting({
      enabled: true,
      endpoint: 'https://example.com/errors',
    });
    
    // Create a function that fails
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('Test error 1'))
      .mockRejectedValueOnce(new Error('Test error 2'))
      .mockRejectedValue(new Error('Test error 3'));
    
    // Retry the function
    const resultPromise = retry(fn, {
      maxRetries: 2,
      reportErrors: true,
      reportingContext: 'TestContext',
    });
    
    // Fast-forward timers
    jest.runAllTimers();
    jest.runAllTimers();
    
    // Function should fail after retries
    await expect(resultPromise).rejects.toThrow(DarkSwapError);
    
    // Errors should be reported
    expect(global.fetch).toHaveBeenCalledTimes(1);
    
    // Parse the request body
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    
    expect(body).toEqual(expect.objectContaining({
      name: 'DarkSwapError',
      message: expect.stringContaining('Test error'),
      tags: {
        context: 'TestContext',
      },
    }));
  });
  
  it('should recover from errors using different strategies', async () => {
    // Configure error reporting
    configureErrorReporting({
      enabled: true,
      endpoint: 'https://example.com/errors',
    });
    
    // Create a function that fails with different errors
    const fn1 = jest.fn().mockRejectedValue(new WasmError('Wasm error', ErrorCode.WasmLoadFailed));
    const fn2 = jest.fn().mockRejectedValue(new NetworkError('Network error', ErrorCode.ConnectionFailed));
    const fn3 = jest.fn().mockRejectedValue(new OrderError('Order error', ErrorCode.OrderCreationFailed));
    const fn4 = jest.fn().mockRejectedValue(new WalletError('Wallet error', ErrorCode.WalletConnectionFailed));
    
    // Create recovery functions
    const recover1 = jest.fn().mockResolvedValue('wasm recovery');
    const recover2 = jest.fn().mockResolvedValue('network recovery');
    const recover3 = jest.fn().mockResolvedValue('order recovery');
    const recover4 = jest.fn().mockResolvedValue('wallet recovery');
    
    // Create combined strategy
    const combinedStrategy = async (error: DarkSwapError, context: any) => {
      if (error instanceof WasmError) {
        return await wasmRecoveryStrategy({
          maxRetries: 1,
          retryDelay: 100,
        })(error, {
          ...context,
          originalFn: recover1,
        });
      } else if (error instanceof NetworkError) {
        return await networkRecoveryStrategy({
          maxRetries: 1,
          retryDelay: 100,
        })(error, {
          ...context,
          originalFn: recover2,
        });
      } else if (error instanceof OrderError) {
        return await orderRecoveryStrategy({
          maxRetries: 1,
          retryDelay: 100,
        })(error, {
          ...context,
          originalFn: recover3,
        });
      } else if (error instanceof WalletError) {
        return await walletRecoveryStrategy({
          maxRetries: 1,
          retryDelay: 100,
        })(error, {
          ...context,
          originalFn: recover4,
        });
      } else {
        throw error;
      }
    };
    
    // Recover from errors
    const result1 = await recover(fn1, combinedStrategy);
    const result2 = await recover(fn2, combinedStrategy);
    const result3 = await recover(fn3, combinedStrategy);
    const result4 = await recover(fn4, combinedStrategy);
    
    // Fast-forward timers
    jest.runAllTimers();
    jest.runAllTimers();
    jest.runAllTimers();
    jest.runAllTimers();
    
    // Check results
    expect(result1).toBe('wasm recovery');
    expect(result2).toBe('network recovery');
    expect(result3).toBe('order recovery');
    expect(result4).toBe('wallet recovery');
    
    // Check recovery functions were called
    expect(recover1).toHaveBeenCalled();
    expect(recover2).toHaveBeenCalled();
    expect(recover3).toHaveBeenCalled();
    expect(recover4).toHaveBeenCalled();
    
    // Errors should be reported
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });
  
  it('should use error reporter with recovery', async () => {
    // Configure error reporting
    configureErrorReporting({
      enabled: true,
      endpoint: 'https://example.com/errors',
    });
    
    // Create error reporter
    const reporter = new ErrorReporter('TestContext');
    
    // Create a function that fails
    const fn = jest.fn().mockRejectedValue(new Error('Test error'));
    
    // Create recovery function
    const recoverFn = jest.fn().mockResolvedValue('recovery result');
    
    // Execute function with recovery
    const result = await recover(
      async () => {
        try {
          return await fn();
        } catch (error) {
          // Report error
          await reporter.report(error);
          
          // Rethrow error
          throw error;
        }
      },
      async (error, context) => {
        // Report recovery attempt
        await reporter.report(
          createError(
            error,
            `Recovering from error: ${error.message}`,
            ErrorCode.Unknown
          )
        );
        
        // Recover
        return await recoverFn();
      }
    );
    
    // Check result
    expect(result).toBe('recovery result');
    
    // Check recovery function was called
    expect(recoverFn).toHaveBeenCalled();
    
    // Errors should be reported
    expect(global.fetch).toHaveBeenCalledTimes(2);
    
    // Parse the request bodies
    const body1 = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const body2 = JSON.parse((global.fetch as jest.Mock).mock.calls[1][1].body);
    
    expect(body1).toEqual(expect.objectContaining({
      name: expect.any(String),
      message: expect.stringContaining('Test error'),
      tags: {
        context: 'TestContext',
      },
    }));
    
    expect(body2).toEqual(expect.objectContaining({
      name: expect.any(String),
      message: expect.stringContaining('Recovering from error'),
      tags: {
        context: 'TestContext',
      },
    }));
  });
  
  it('should handle complex error recovery scenarios', async () => {
    // Configure error reporting
    configureErrorReporting({
      enabled: true,
      endpoint: 'https://example.com/errors',
    });
    
    // Create a function that fails with different errors
    const fn = jest.fn()
      .mockRejectedValueOnce(new WasmError('Wasm error', ErrorCode.WasmLoadFailed))
      .mockRejectedValueOnce(new NetworkError('Network error', ErrorCode.ConnectionFailed))
      .mockRejectedValueOnce(new OrderError('Order error', ErrorCode.OrderCreationFailed))
      .mockResolvedValue('success');
    
    // Create error reporter
    const reporter = new ErrorReporter('ComplexScenario');
    
    // Create recovery strategy
    const complexStrategy = async (error: DarkSwapError, context: any) => {
      // Report error
      await reporter.report(error);
      
      // Try different strategies based on error type
      if (error instanceof WasmError) {
        // For WasmError, retry with increased delay
        return await retry(context.originalFn, {
          maxRetries: 3,
          retryDelay: 200,
          useExponentialBackoff: true,
        });
      } else if (error instanceof NetworkError) {
        // For NetworkError, retry with normal delay
        return await retry(context.originalFn, {
          maxRetries: 3,
          retryDelay: 100,
        });
      } else if (error instanceof OrderError) {
        // For OrderError, retry with decreased delay
        return await retry(context.originalFn, {
          maxRetries: 3,
          retryDelay: 50,
        });
      } else {
        // For other errors, use fallback
        return 'fallback';
      }
    };
    
    // Execute function with recovery
    const result = await recover(fn, complexStrategy);
    
    // Fast-forward timers for each retry
    jest.runAllTimers(); // WasmError retry
    jest.runAllTimers(); // NetworkError retry
    jest.runAllTimers(); // OrderError retry
    
    // Check result
    expect(result).toBe('success');
    
    // Check function was called multiple times
    expect(fn).toHaveBeenCalledTimes(4);
    
    // Errors should be reported
    expect(global.fetch).toHaveBeenCalledTimes(3);
    
    // Parse the request bodies
    const body1 = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const body2 = JSON.parse((global.fetch as jest.Mock).mock.calls[1][1].body);
    const body3 = JSON.parse((global.fetch as jest.Mock).mock.calls[2][1].body);
    
    expect(body1).toEqual(expect.objectContaining({
      name: 'WasmError',
      message: 'Wasm error',
      code: ErrorCode.WasmLoadFailed,
      tags: {
        context: 'ComplexScenario',
      },
    }));
    
    expect(body2).toEqual(expect.objectContaining({
      name: 'NetworkError',
      message: 'Network error',
      code: ErrorCode.ConnectionFailed,
      tags: {
        context: 'ComplexScenario',
      },
    }));
    
    expect(body3).toEqual(expect.objectContaining({
      name: 'OrderError',
      message: 'Order error',
      code: ErrorCode.OrderCreationFailed,
      tags: {
        context: 'ComplexScenario',
      },
    }));
  });
});