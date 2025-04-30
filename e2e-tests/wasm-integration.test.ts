import { test, expect } from '@playwright/test';
import { loadWasm, wasmFeatures } from '../web/src/utils/WasmLoader';

test.describe('WebAssembly Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the test page
    await page.goto('/test-wasm.html');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });
  
  test('should detect WebAssembly features', async ({ page }) => {
    const features = await page.evaluate(() => {
      return window.wasmFeatures;
    });
    
    expect(features).toBeDefined();
    expect(features.supported).toBe(true);
    expect(typeof features.streaming).toBe('boolean');
    expect(typeof features.sharedMemory).toBe('boolean');
    expect(typeof features.threads).toBe('boolean');
    expect(typeof features.simd).toBe('boolean');
    expect(typeof features.bulkMemory).toBe('boolean');
    expect(typeof features.referenceTypes).toBe('boolean');
  });
  
  test('should load WebAssembly module', async ({ page }) => {
    const result = await page.evaluate(async () => {
      try {
        const { exports } = await window.loadWasm('/wasm/simple.wasm');
        return {
          success: true,
          hasAdd: typeof exports.add === 'function',
          addResult: exports.add(40, 2),
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    });
    
    expect(result.success).toBe(true);
    expect(result.hasAdd).toBe(true);
    expect(result.addResult).toBe(42);
  });
  
  test('should cache WebAssembly module', async ({ page }) => {
    const result = await page.evaluate(async () => {
      try {
        // Load the module twice
        const start = performance.now();
        await window.loadWasm('/wasm/simple.wasm');
        const firstLoadTime = performance.now() - start;
        
        const start2 = performance.now();
        await window.loadWasm('/wasm/simple.wasm');
        const secondLoadTime = performance.now() - start2;
        
        return {
          success: true,
          firstLoadTime,
          secondLoadTime,
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    });
    
    expect(result.success).toBe(true);
    expect(result.secondLoadTime).toBeLessThan(result.firstLoadTime);
  });
  
  test('should handle WebAssembly errors gracefully', async ({ page }) => {
    const result = await page.evaluate(async () => {
      try {
        await window.loadWasm('/wasm/non-existent.wasm');
        return {
          success: true,
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
  
  test('should work with memory operations', async ({ page }) => {
    const result = await page.evaluate(async () => {
      try {
        const { exports } = await window.loadWasm('/wasm/memory.wasm');
        
        // Write to memory
        const ptr = exports.allocate(10);
        const memory = new Uint8Array(exports.memory.buffer);
        
        for (let i = 0; i < 10; i++) {
          memory[ptr + i] = i;
        }
        
        // Read from memory
        const sum = exports.sumArray(ptr, 10);
        
        return {
          success: true,
          sum,
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    });
    
    expect(result.success).toBe(true);
    expect(result.sum).toBe(45); // 0 + 1 + 2 + ... + 9 = 45
  });
  
  test('should handle large WebAssembly modules', async ({ page }) => {
    const result = await page.evaluate(async () => {
      try {
        const start = performance.now();
        const { exports } = await window.loadWasm('/wasm/large.wasm');
        const loadTime = performance.now() - start;
        
        return {
          success: true,
          loadTime,
          hasFibonacci: typeof exports.fibonacci === 'function',
          fibonacci40: exports.fibonacci(40),
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    });
    
    expect(result.success).toBe(true);
    expect(result.hasFibonacci).toBe(true);
    expect(result.fibonacci40).toBe(102334155);
  });
  
  test('should work with streaming compilation if supported', async ({ page }) => {
    const result = await page.evaluate(async () => {
      try {
        const features = window.wasmFeatures;
        
        if (!features.streaming) {
          return {
            success: true,
            streaming: false,
            message: 'Streaming compilation not supported',
          };
        }
        
        const start = performance.now();
        await window.compileWasm('/wasm/simple.wasm');
        const compileTime = performance.now() - start;
        
        return {
          success: true,
          streaming: true,
          compileTime,
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    });
    
    expect(result.success).toBe(true);
    if (result.streaming) {
      expect(result.compileTime).toBeGreaterThan(0);
    }
  });
  
  test('should handle concurrent WebAssembly loads', async ({ page }) => {
    const result = await page.evaluate(async () => {
      try {
        const start = performance.now();
        
        // Load multiple modules concurrently
        const [module1, module2, module3] = await Promise.all([
          window.loadWasm('/wasm/simple.wasm'),
          window.loadWasm('/wasm/memory.wasm'),
          window.loadWasm('/wasm/large.wasm'),
        ]);
        
        const loadTime = performance.now() - start;
        
        return {
          success: true,
          loadTime,
          module1Loaded: typeof module1.exports.add === 'function',
          module2Loaded: typeof module2.exports.allocate === 'function',
          module3Loaded: typeof module3.exports.fibonacci === 'function',
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    });
    
    expect(result.success).toBe(true);
    expect(result.module1Loaded).toBe(true);
    expect(result.module2Loaded).toBe(true);
    expect(result.module3Loaded).toBe(true);
  });
  
  test('should work with shared memory if supported', async ({ page }) => {
    const result = await page.evaluate(async () => {
      try {
        const features = window.wasmFeatures;
        
        if (!features.sharedMemory) {
          return {
            success: true,
            sharedMemory: false,
            message: 'Shared memory not supported',
          };
        }
        
        // Create shared memory
        const memory = window.createWasmMemory(1, 10, true);
        
        return {
          success: true,
          sharedMemory: true,
          isSharedArrayBuffer: memory.buffer instanceof SharedArrayBuffer,
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    });
    
    expect(result.success).toBe(true);
    if (result.sharedMemory) {
      expect(result.isSharedArrayBuffer).toBe(true);
    }
  });
});