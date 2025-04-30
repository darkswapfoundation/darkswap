/**
 * ErrorRecovery.test.ts - Tests for the error recovery utilities
 */

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
import {
  DarkSwapError,
  ErrorCode,
  WasmError,
  NetworkError,
  OrderError,
  WalletError,
} from '../../utils/ErrorHandling';
import { reportError } from '../../utils/ErrorReporting';

// Mock reportError
jest.mock('../../utils/ErrorReporting', () => ({
  reportError: jest.fn().mockResolvedValue(undefined),
}));

describe('ErrorRecovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  describe('retry', () => {
    it('should return the result of the function', async () => {
      const fn = jest.fn().mockResolvedValue('result');
      
      const result = await retry(fn);
      
      expect(fn).toHaveBeenCalledTimes(1);
      expect(result).toBe('result');
    });
    
    it('should retry the function if it fails', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Test error'))
        .mockResolvedValueOnce('result');
      
      const resultPromise = retry(fn);
      
      // Fast-forward timers
      jest.runAllTimers();
      
      const result = await resultPromise;
      
      expect(fn).toHaveBeenCalledTimes(2);
      expect(result).toBe('result');
    });
    
    it('should retry the function up to maxRetries times', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Test error 1'))
        .mockRejectedValueOnce(new Error('Test error 2'))
        .mockRejectedValueOnce(new Error('Test error 3'))
        .mockResolvedValueOnce('result');
      
      const resultPromise = retry(fn, { maxRetries: 3 });
      
      // Fast-forward timers
      jest.runAllTimers();
      jest.runAllTimers();
      jest.runAllTimers();
      
      const result = await resultPromise;
      
      expect(fn).toHaveBeenCalledTimes(4);
      expect(result).toBe('result');
    });
    
    it('should throw an error if the function fails after maxRetries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Test error'));
      
      const resultPromise = retry(fn, { maxRetries: 3 });
      
      // Fast-forward timers
      jest.runAllTimers();
      jest.runAllTimers();
      jest.runAllTimers();
      
      await expect(resultPromise).rejects.toThrow(DarkSwapError);
      
      expect(fn).toHaveBeenCalledTimes(4);
    });
    
    it('should use exponential backoff if enabled', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Test error 1'))
        .mockRejectedValueOnce(new Error('Test error 2'))
        .mockResolvedValueOnce('result');
      
      const resultPromise = retry(fn, {
        maxRetries: 3,
        retryDelay: 1000,
        useExponentialBackoff: true,
      });
      
      // First retry should be after 1000ms
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000);
      jest.runAllTimers();
      
      // Second retry should be after 2000ms
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 2000);
      jest.runAllTimers();
      
      const result = await resultPromise;
      
      expect(fn).toHaveBeenCalledTimes(3);
      expect(result).toBe('result');
    });
    
    it('should report errors if enabled', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Test error'));
      
      const resultPromise = retry(fn, {
        maxRetries: 1,
        reportErrors: true,
        reportingContext: 'TestContext',
      });
      
      // Fast-forward timers
      jest.runAllTimers();
      
      await expect(resultPromise).rejects.toThrow(DarkSwapError);
      
      expect(reportError).toHaveBeenCalledWith(
        expect.any(DarkSwapError),
        'TestContext'
      );
    });
  });
  
  describe('recover', () => {
    it('should return the result of the function', async () => {
      const fn = jest.fn().mockResolvedValue('result');
      const strategy = jest.fn();
      
      const result = await recover(fn, strategy);
      
      expect(fn).toHaveBeenCalledTimes(1);
      expect(strategy).not.toHaveBeenCalled();
      expect(result).toBe('result');
    });
    
    it('should call the strategy if the function fails', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Test error'));
      const strategy = jest.fn().mockResolvedValue('fallback');
      
      const result = await recover(fn, strategy);
      
      expect(fn).toHaveBeenCalledTimes(1);
      expect(strategy).toHaveBeenCalledTimes(1);
      expect(result).toBe('fallback');
    });
    
    it('should report errors if enabled', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Test error'));
      const strategy = jest.fn().mockResolvedValue('fallback');
      
      await recover(fn, strategy, {
        reportErrors: true,
        reportingContext: 'TestContext',
      });
      
      expect(reportError).toHaveBeenCalledWith(
        expect.any(DarkSwapError),
        'TestContext'
      );
    });
  });
  
  describe('retryStrategy', () => {
    it('should retry the function', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Test error'))
        .mockResolvedValueOnce('result');
      
      const strategy = retryStrategy();
      
      const result = await strategy(
        new DarkSwapError('Test error'),
        {
          retryCount: 0,
          originalFn: fn,
          options: { maxRetries: 3 },
        }
      );
      
      // Fast-forward timers
      jest.runAllTimers();
      
      expect(fn).toHaveBeenCalledTimes(2);
      expect(result).toBe('result');
    });
  });
  
  describe('fallbackStrategy', () => {
    it('should return the fallback value', async () => {
      const strategy = fallbackStrategy('fallback');
      
      const result = await strategy(
        new DarkSwapError('Test error'),
        {
          retryCount: 0,
          originalFn: jest.fn(),
          options: {},
        }
      );
      
      expect(result).toBe('fallback');
    });
  });
  
  describe('throwStrategy', () => {
    it('should throw a custom error', async () => {
      const strategy = throwStrategy('Custom error', ErrorCode.NotInitialized);
      
      await expect(strategy(
        new DarkSwapError('Test error'),
        {
          retryCount: 0,
          originalFn: jest.fn(),
          options: {},
        }
      )).rejects.toThrow('Custom error');
    });
  });
  
  describe('customStrategy', () => {
    it('should execute a custom function', async () => {
      const customFn = jest.fn().mockResolvedValue('custom');
      const strategy = customStrategy(customFn);
      
      const error = new DarkSwapError('Test error');
      const context = {
        retryCount: 0,
        originalFn: jest.fn(),
        options: {},
      };
      
      const result = await strategy(error, context);
      
      expect(customFn).toHaveBeenCalledWith(error, context);
      expect(result).toBe('custom');
    });
  });
  
  describe('wasmRecoveryStrategy', () => {
    it('should retry for WasmLoadFailed', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Test error'))
        .mockResolvedValueOnce('result');
      
      const strategy = wasmRecoveryStrategy();
      
      const result = await strategy(
        new WasmError('Test error', ErrorCode.WasmLoadFailed),
        {
          retryCount: 0,
          originalFn: fn,
          options: { maxRetries: 3, retryDelay: 1000 },
        }
      );
      
      // Fast-forward timers
      jest.runAllTimers();
      
      expect(fn).toHaveBeenCalledTimes(2);
      expect(result).toBe('result');
    });
    
    it('should retry for WasmInitFailed', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Test error'))
        .mockResolvedValueOnce('result');
      
      const strategy = wasmRecoveryStrategy();
      
      const result = await strategy(
        new WasmError('Test error', ErrorCode.WasmInitFailed),
        {
          retryCount: 0,
          originalFn: fn,
          options: { maxRetries: 3, retryDelay: 1000 },
        }
      );
      
      // Fast-forward timers
      jest.runAllTimers();
      
      expect(fn).toHaveBeenCalledTimes(2);
      expect(result).toBe('result');
    });
    
    it('should retry for WasmExecutionFailed', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Test error'))
        .mockResolvedValueOnce('result');
      
      const strategy = wasmRecoveryStrategy();
      
      const result = await strategy(
        new WasmError('Test error', ErrorCode.WasmExecutionFailed),
        {
          retryCount: 0,
          originalFn: fn,
          options: { maxRetries: 3, retryDelay: 1000 },
        }
      );
      
      // Fast-forward timers
      jest.runAllTimers();
      
      expect(fn).toHaveBeenCalledTimes(2);
      expect(result).toBe('result');
    });
    
    it('should rethrow for other errors', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Test error'));
      
      const strategy = wasmRecoveryStrategy();
      
      await expect(strategy(
        new DarkSwapError('Test error'),
        {
          retryCount: 0,
          originalFn: fn,
          options: {},
        }
      )).rejects.toThrow(DarkSwapError);
    });
  });
  
  describe('networkRecoveryStrategy', () => {
    it('should retry for ConnectionFailed', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Test error'))
        .mockResolvedValueOnce('result');
      
      const strategy = networkRecoveryStrategy();
      
      const result = await strategy(
        new NetworkError('Test error', ErrorCode.ConnectionFailed),
        {
          retryCount: 0,
          originalFn: fn,
          options: { maxRetries: 3, retryDelay: 1000 },
        }
      );
      
      // Fast-forward timers
      jest.runAllTimers();
      
      expect(fn).toHaveBeenCalledTimes(2);
      expect(result).toBe('result');
    });
  });
  
  describe('orderRecoveryStrategy', () => {
    it('should retry for OrderCreationFailed', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Test error'))
        .mockResolvedValueOnce('result');
      
      const strategy = orderRecoveryStrategy();
      
      const result = await strategy(
        new OrderError('Test error', ErrorCode.OrderCreationFailed),
        {
          retryCount: 0,
          originalFn: fn,
          options: { maxRetries: 3, retryDelay: 1000 },
        }
      );
      
      // Fast-forward timers
      jest.runAllTimers();
      
      expect(fn).toHaveBeenCalledTimes(2);
      expect(result).toBe('result');
    });
  });
  
  describe('walletRecoveryStrategy', () => {
    it('should retry for WalletConnectionFailed', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Test error'))
        .mockResolvedValueOnce('result');
      
      const strategy = walletRecoveryStrategy();
      
      const result = await strategy(
        new WalletError('Test error', ErrorCode.WalletConnectionFailed),
        {
          retryCount: 0,
          originalFn: fn,
          options: { maxRetries: 3, retryDelay: 1000 },
        }
      );
      
      // Fast-forward timers
      jest.runAllTimers();
      
      expect(fn).toHaveBeenCalledTimes(2);
      expect(result).toBe('result');
    });
  });
});