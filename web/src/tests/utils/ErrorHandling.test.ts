/**
 * ErrorHandling.test.ts - Tests for the error handling utilities
 */

import {
  DarkSwapError,
  ErrorCode,
  WasmError,
  OrderError,
  NetworkError,
  WalletError,
  TradeError,
  createError,
  logError,
  tryAsync,
  trySync,
} from '../../utils/ErrorHandling';

describe('ErrorHandling', () => {
  // Mock console.error
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    console.error = jest.fn();
  });
  
  afterEach(() => {
    console.error = originalConsoleError;
  });
  
  describe('DarkSwapError', () => {
    it('should create a DarkSwapError with default code', () => {
      const error = new DarkSwapError('Test error');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DarkSwapError);
      expect(error.name).toBe('DarkSwapError');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCode.Unknown);
      expect(error.details).toBeUndefined();
    });
    
    it('should create a DarkSwapError with custom code', () => {
      const error = new DarkSwapError('Test error', ErrorCode.NotInitialized);
      
      expect(error.code).toBe(ErrorCode.NotInitialized);
    });
    
    it('should create a DarkSwapError with details', () => {
      const details = { foo: 'bar' };
      const error = new DarkSwapError('Test error', ErrorCode.Unknown, details);
      
      expect(error.details).toBe(details);
    });
    
    it('should get details string', () => {
      const details = { foo: 'bar' };
      const error = new DarkSwapError('Test error', ErrorCode.Unknown, details);
      
      expect(error.getDetailsString()).toBe(JSON.stringify(details, null, 2));
    });
    
    it('should get empty details string when no details', () => {
      const error = new DarkSwapError('Test error');
      
      expect(error.getDetailsString()).toBe('');
    });
    
    it('should get full message', () => {
      const details = { foo: 'bar' };
      const error = new DarkSwapError('Test error', ErrorCode.Unknown, details);
      
      expect(error.getFullMessage()).toBe(`Test error\nDetails: ${JSON.stringify(details, null, 2)}`);
    });
    
    it('should get message when no details', () => {
      const error = new DarkSwapError('Test error');
      
      expect(error.getFullMessage()).toBe('Test error');
    });
  });
  
  describe('WasmError', () => {
    it('should create a WasmError with default code', () => {
      const error = new WasmError('Test error');
      
      expect(error).toBeInstanceOf(DarkSwapError);
      expect(error).toBeInstanceOf(WasmError);
      expect(error.name).toBe('WasmError');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCode.WasmExecutionFailed);
    });
    
    it('should create a WasmError with custom code', () => {
      const error = new WasmError('Test error', ErrorCode.WasmLoadFailed);
      
      expect(error.code).toBe(ErrorCode.WasmLoadFailed);
    });
  });
  
  describe('NetworkError', () => {
    it('should create a NetworkError with default code', () => {
      const error = new NetworkError('Test error');
      
      expect(error).toBeInstanceOf(DarkSwapError);
      expect(error).toBeInstanceOf(NetworkError);
      expect(error.name).toBe('NetworkError');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCode.NetworkError);
    });
    
    it('should create a NetworkError with custom code', () => {
      const error = new NetworkError('Test error', ErrorCode.ConnectionFailed);
      
      expect(error.code).toBe(ErrorCode.ConnectionFailed);
    });
  });
  
  describe('OrderError', () => {
    it('should create an OrderError with default code', () => {
      const error = new OrderError('Test error');
      
      expect(error).toBeInstanceOf(DarkSwapError);
      expect(error).toBeInstanceOf(OrderError);
      expect(error.name).toBe('OrderError');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCode.OrderNotFound);
    });
    
    it('should create an OrderError with custom code', () => {
      const error = new OrderError('Test error', ErrorCode.OrderCreationFailed);
      
      expect(error.code).toBe(ErrorCode.OrderCreationFailed);
    });
  });
  
  describe('WalletError', () => {
    it('should create a WalletError with default code', () => {
      const error = new WalletError('Test error');
      
      expect(error).toBeInstanceOf(DarkSwapError);
      expect(error).toBeInstanceOf(WalletError);
      expect(error.name).toBe('WalletError');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCode.WalletNotConnected);
    });
    
    it('should create a WalletError with custom code', () => {
      const error = new WalletError('Test error', ErrorCode.WalletConnectionFailed);
      
      expect(error.code).toBe(ErrorCode.WalletConnectionFailed);
    });
  });
  
  describe('TradeError', () => {
    it('should create a TradeError with default code', () => {
      const error = new TradeError('Test error');
      
      expect(error).toBeInstanceOf(DarkSwapError);
      expect(error).toBeInstanceOf(TradeError);
      expect(error.name).toBe('TradeError');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCode.TradeNotFound);
    });
    
    it('should create a TradeError with custom code', () => {
      const error = new TradeError('Test error', ErrorCode.TradeExecutionFailed);
      
      expect(error.code).toBe(ErrorCode.TradeExecutionFailed);
    });
  });
  
  describe('createError', () => {
    it('should return the error if it is already a DarkSwapError', () => {
      const originalError = new DarkSwapError('Test error');
      const error = createError(originalError);
      
      expect(error).toBe(originalError);
    });
    
    it('should create a DarkSwapError from an Error', () => {
      const originalError = new Error('Test error');
      const error = createError(originalError);
      
      expect(error).toBeInstanceOf(DarkSwapError);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCode.Unknown);
      expect(error.details).toEqual({
        originalError: {
          name: 'Error',
          stack: originalError.stack,
        },
      });
    });
    
    it('should create a DarkSwapError from a string', () => {
      const error = createError('Test error');
      
      expect(error).toBeInstanceOf(DarkSwapError);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCode.Unknown);
      expect(error.details).toBeUndefined();
    });
    
    it('should create a DarkSwapError from an object', () => {
      const originalError = { foo: 'bar' };
      const error = createError(originalError);
      
      expect(error).toBeInstanceOf(DarkSwapError);
      expect(error.message).toBe('An unknown error occurred');
      expect(error.code).toBe(ErrorCode.Unknown);
      expect(error.details).toEqual({ originalError });
    });
    
    it('should create a DarkSwapError with default message', () => {
      const error = createError(null, 'Default message');
      
      expect(error.message).toBe('Default message');
    });
    
    it('should create a DarkSwapError with default code', () => {
      const error = createError(null, 'Default message', ErrorCode.NotInitialized);
      
      expect(error.code).toBe(ErrorCode.NotInitialized);
    });
  });
  
  describe('logError', () => {
    it('should log an error without context', () => {
      const error = new DarkSwapError('Test error');
      
      logError(error);
      
      expect(console.error).toHaveBeenCalledWith('DarkSwapError: Test error');
    });
    
    it('should log an error with context', () => {
      const error = new DarkSwapError('Test error');
      
      logError(error, 'TestContext');
      
      expect(console.error).toHaveBeenCalledWith('[TestContext] DarkSwapError: Test error');
    });
    
    it('should log error details', () => {
      const details = { foo: 'bar' };
      const error = new DarkSwapError('Test error', ErrorCode.Unknown, details);
      
      logError(error);
      
      expect(console.error).toHaveBeenCalledWith('DarkSwapError: Test error');
      expect(console.error).toHaveBeenCalledWith('Error details:', details);
    });
    
    it('should log error stack', () => {
      const error = new DarkSwapError('Test error');
      
      logError(error);
      
      expect(console.error).toHaveBeenCalledWith('DarkSwapError: Test error');
      expect(console.error).toHaveBeenCalledWith('Stack trace:', error.stack);
    });
  });
  
  describe('tryAsync', () => {
    it('should return the result of the function', async () => {
      const result = await tryAsync(() => Promise.resolve('result'));
      
      expect(result).toBe('result');
    });
    
    it('should throw a DarkSwapError if the function throws', async () => {
      await expect(tryAsync(() => Promise.reject(new Error('Test error')))).rejects.toThrow(DarkSwapError);
    });
    
    it('should call the error handler if provided', async () => {
      const errorHandler = jest.fn().mockReturnValue('fallback');
      
      const result = await tryAsync(
        () => Promise.reject(new Error('Test error')),
        errorHandler
      );
      
      expect(errorHandler).toHaveBeenCalled();
      expect(result).toBe('fallback');
    });
  });
  
  describe('trySync', () => {
    it('should return the result of the function', () => {
      const result = trySync(() => 'result');
      
      expect(result).toBe('result');
    });
    
    it('should throw a DarkSwapError if the function throws', () => {
      expect(() => trySync(() => { throw new Error('Test error'); })).toThrow(DarkSwapError);
    });
    
    it('should call the error handler if provided', () => {
      const errorHandler = jest.fn().mockReturnValue('fallback');
      
      const result = trySync(
        () => { throw new Error('Test error'); },
        errorHandler
      );
      
      expect(errorHandler).toHaveBeenCalled();
      expect(result).toBe('fallback');
    });
  });
});