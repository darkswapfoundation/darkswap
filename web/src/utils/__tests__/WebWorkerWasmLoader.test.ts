/**
 * Unit tests for WebWorkerWasmLoader
 */

import {
  loadWasmModuleInWorker,
  preloadWasmModuleInWorker,
  clearWasmModuleCache,
  getWasmModuleCacheSize,
  isWasmModuleCached,
  isWebWorkerSupported,
} from '../WebWorkerWasmLoader';

describe('WebWorkerWasmLoader', () => {
  // Mock Worker
  const mockWorker = {
    postMessage: jest.fn(),
    terminate: jest.fn(),
    onmessage: null as any,
    onerror: null as any,
  };

  // Mock URL
  const mockURL = {
    createObjectURL: jest.fn().mockReturnValue('blob:test'),
    revokeObjectURL: jest.fn(),
  };

  // Mock Blob
  const mockBlob = jest.fn().mockImplementation(() => ({}));

  // Mock Worker constructor
  const mockWorkerConstructor = jest.fn().mockImplementation(() => mockWorker);

  beforeEach(() => {
    // Clear the cache before each test
    clearWasmModuleCache();
    
    // Reset the mocks
    jest.clearAllMocks();
    
    // Mock the performance API
    global.performance = {
      now: jest.fn().mockReturnValueOnce(0).mockReturnValueOnce(100),
    } as any;
    
    // Mock the console
    global.console = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    // Mock the Worker constructor
    global.Worker = mockWorkerConstructor;

    // Mock URL
    global.URL = mockURL as any;

    // Mock Blob
    global.Blob = mockBlob as any;
  });

  describe('loadWasmModuleInWorker', () => {
    it('should load a WebAssembly module in a Web Worker', async () => {
      // Create a promise that will be resolved when the test is done
      const loadPromise = loadWasmModuleInWorker('/test-path');

      // Simulate the worker sending a message
      const mockMessage = {
        data: {
          id: expect.any(String),
          success: true,
          module: {},
          instance: {},
        },
      };

      // Get the onmessage handler that was set
      const onMessageHandler = mockWorker.onmessage;
      
      // Call the onmessage handler
      if (onMessageHandler) {
        onMessageHandler(mockMessage);
      }

      // Wait for the promise to resolve
      const result = await loadPromise;

      // Check that the worker was created
      expect(mockWorkerConstructor).toHaveBeenCalled();

      // Check that the worker was terminated
      expect(mockWorker.terminate).toHaveBeenCalled();

      // Check that the worker posted a message
      expect(mockWorker.postMessage).toHaveBeenCalledWith({
        id: expect.any(String),
        url: '/test-path',
        importObject: undefined,
      });

      // Check that the result is correct
      expect(result).toEqual({
        module: {},
        instance: {},
      });

      // Check that the console.log was called
      expect(console.log).toHaveBeenCalledWith('Loading WebAssembly module in Web Worker: /test-path');
      expect(console.log).toHaveBeenCalledWith('WebAssembly module loaded in Web Worker in 100ms');
    });

    it('should cache the module', async () => {
      // Create a promise that will be resolved when the test is done
      const loadPromise1 = loadWasmModuleInWorker('/test-path');

      // Simulate the worker sending a message
      const mockMessage1 = {
        data: {
          id: expect.any(String),
          success: true,
          module: {},
          instance: {},
        },
      };

      // Get the onmessage handler that was set
      const onMessageHandler = mockWorker.onmessage;
      
      // Call the onmessage handler
      if (onMessageHandler) {
        onMessageHandler(mockMessage1);
      }

      // Wait for the promise to resolve
      const result1 = await loadPromise1;

      // Reset the mocks
      jest.clearAllMocks();

      // Load the same module again
      const result2 = await loadWasmModuleInWorker('/test-path');

      // Check that the worker was not created
      expect(mockWorkerConstructor).not.toHaveBeenCalled();

      // Check that the worker was not terminated
      expect(mockWorker.terminate).not.toHaveBeenCalled();

      // Check that the worker did not post a message
      expect(mockWorker.postMessage).not.toHaveBeenCalled();

      // Check that the results are the same
      expect(result1).toBe(result2);

      // Check that the console.log was not called
      expect(console.log).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      // Create a promise that will be rejected when the test is done
      const loadPromise = loadWasmModuleInWorker('/test-path');

      // Simulate the worker sending an error message
      const mockMessage = {
        data: {
          id: expect.any(String),
          success: false,
          error: 'Test error',
        },
      };

      // Get the onmessage handler that was set
      const onMessageHandler = mockWorker.onmessage;
      
      // Call the onmessage handler
      if (onMessageHandler) {
        onMessageHandler(mockMessage);
      }

      // Wait for the promise to reject
      await expect(loadPromise).rejects.toThrow('Test error');

      // Check that the worker was created
      expect(mockWorkerConstructor).toHaveBeenCalled();

      // Check that the worker was terminated
      expect(mockWorker.terminate).toHaveBeenCalled();

      // Check that the worker posted a message
      expect(mockWorker.postMessage).toHaveBeenCalledWith({
        id: expect.any(String),
        url: '/test-path',
        importObject: undefined,
      });

      // Check that the console.error was called
      expect(console.error).toHaveBeenCalledWith(
        'Failed to load WebAssembly module in Web Worker: /test-path',
        expect.any(Error)
      );
    });

    it('should handle worker errors', async () => {
      // Create a promise that will be rejected when the test is done
      const loadPromise = loadWasmModuleInWorker('/test-path');

      // Simulate the worker sending an error
      const mockError = new Error('Test error');

      // Get the onerror handler that was set
      const onErrorHandler = mockWorker.onerror;
      
      // Call the onerror handler
      if (onErrorHandler) {
        onErrorHandler(mockError);
      }

      // Wait for the promise to reject
      await expect(loadPromise).rejects.toThrow(mockError);

      // Check that the worker was created
      expect(mockWorkerConstructor).toHaveBeenCalled();

      // Check that the worker was terminated
      expect(mockWorker.terminate).toHaveBeenCalled();

      // Check that the worker posted a message
      expect(mockWorker.postMessage).toHaveBeenCalledWith({
        id: expect.any(String),
        url: '/test-path',
        importObject: undefined,
      });
    });
  });

  describe('isWebWorkerSupported', () => {
    it('should return true if Web Workers are supported', () => {
      // Check that Web Workers are supported
      expect(isWebWorkerSupported()).toBe(true);
    });

    it('should return false if Web Workers are not supported', () => {
      // Mock Worker to be undefined
      const originalWorker = global.Worker;
      global.Worker = undefined as any;

      // Check that Web Workers are not supported
      expect(isWebWorkerSupported()).toBe(false);

      // Restore Worker
      global.Worker = originalWorker;
    });
  });
});