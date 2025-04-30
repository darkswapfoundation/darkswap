import { test, expect } from '@playwright/test';

test.describe('WebAssembly Integration', () => {
  test('should display WebAssembly demo page', async ({ page }) => {
    await page.goto('/wasm-demo');
    
    // Check if the title is displayed
    const title = await page.locator('h1:has-text("WebAssembly Demo")');
    await expect(title).toBeVisible();
  });
  
  test('should load WebAssembly module', async ({ page }) => {
    await page.goto('/wasm-demo');
    
    // Wait for the WebAssembly module to load
    await page.waitForSelector('.wasm-status:has-text("Loaded")');
    
    // Check if the WebAssembly module is loaded
    const wasmStatus = await page.locator('.wasm-status');
    await expect(wasmStatus).toContainText('Loaded');
  });
  
  test('should display WebAssembly module information', async ({ page }) => {
    await page.goto('/wasm-demo');
    
    // Wait for the WebAssembly module to load
    await page.waitForSelector('.wasm-status:has-text("Loaded")');
    
    // Check if the WebAssembly module information is displayed
    const wasmInfo = await page.locator('.wasm-info');
    await expect(wasmInfo).toBeVisible();
    
    // Check if the WebAssembly module information contains the expected fields
    const wasmVersion = await page.locator('.wasm-version');
    const wasmMemory = await page.locator('.wasm-memory');
    const wasmExports = await page.locator('.wasm-exports');
    
    await expect(wasmVersion).toBeVisible();
    await expect(wasmMemory).toBeVisible();
    await expect(wasmExports).toBeVisible();
  });
  
  test('should create an order using WebAssembly', async ({ page }) => {
    await page.goto('/wasm-demo');
    
    // Wait for the WebAssembly module to load
    await page.waitForSelector('.wasm-status:has-text("Loaded")');
    
    // Fill in the order form
    await page.fill('.order-form-base-asset', 'BTC');
    await page.fill('.order-form-quote-asset', 'ETH');
    await page.fill('.order-form-price', '10');
    await page.fill('.order-form-amount', '1');
    
    // Select the order type
    await page.selectOption('.order-form-type', 'buy');
    
    // Click the create order button
    await page.click('.order-form-submit');
    
    // Wait for the order to be created
    await page.waitForSelector('.order-created-message');
    
    // Check if the order created message is displayed
    const orderCreatedMessage = await page.locator('.order-created-message');
    await expect(orderCreatedMessage).toBeVisible();
    await expect(orderCreatedMessage).toContainText('Order created');
    
    // Check if the order is displayed in the orders list
    const ordersList = await page.locator('.orders-list');
    await expect(ordersList).toBeVisible();
    
    const orderItem = await page.locator('.order-item');
    await expect(orderItem).toBeVisible();
    await expect(orderItem).toContainText('BTC/ETH');
    await expect(orderItem).toContainText('10');
    await expect(orderItem).toContainText('1');
    await expect(orderItem).toContainText('Buy');
  });
  
  test('should match orders using WebAssembly', async ({ page }) => {
    await page.goto('/wasm-demo');
    
    // Wait for the WebAssembly module to load
    await page.waitForSelector('.wasm-status:has-text("Loaded")');
    
    // Create a buy order
    await page.fill('.order-form-base-asset', 'BTC');
    await page.fill('.order-form-quote-asset', 'ETH');
    await page.fill('.order-form-price', '10');
    await page.fill('.order-form-amount', '1');
    await page.selectOption('.order-form-type', 'buy');
    await page.click('.order-form-submit');
    
    // Wait for the order to be created
    await page.waitForSelector('.order-created-message');
    
    // Create a matching sell order
    await page.fill('.order-form-base-asset', 'BTC');
    await page.fill('.order-form-quote-asset', 'ETH');
    await page.fill('.order-form-price', '10');
    await page.fill('.order-form-amount', '1');
    await page.selectOption('.order-form-type', 'sell');
    await page.click('.order-form-submit');
    
    // Wait for the order to be created
    await page.waitForSelector('.order-created-message');
    
    // Wait for the orders to be matched
    await page.waitForSelector('.order-matched-message');
    
    // Check if the order matched message is displayed
    const orderMatchedMessage = await page.locator('.order-matched-message');
    await expect(orderMatchedMessage).toBeVisible();
    await expect(orderMatchedMessage).toContainText('Orders matched');
    
    // Check if the matched orders are displayed in the trades list
    const tradesList = await page.locator('.trades-list');
    await expect(tradesList).toBeVisible();
    
    const tradeItem = await page.locator('.trade-item');
    await expect(tradeItem).toBeVisible();
    await expect(tradeItem).toContainText('BTC/ETH');
    await expect(tradeItem).toContainText('10');
    await expect(tradeItem).toContainText('1');
  });
  
  test('should handle WebAssembly errors', async ({ page }) => {
    await page.goto('/wasm-demo');
    
    // Wait for the WebAssembly module to load
    await page.waitForSelector('.wasm-status:has-text("Loaded")');
    
    // Create an invalid order (missing required fields)
    await page.fill('.order-form-base-asset', 'BTC');
    await page.fill('.order-form-quote-asset', ''); // Missing quote asset
    await page.fill('.order-form-price', '10');
    await page.fill('.order-form-amount', '1');
    await page.selectOption('.order-form-type', 'buy');
    await page.click('.order-form-submit');
    
    // Wait for the error message to be displayed
    await page.waitForSelector('.wasm-error-message');
    
    // Check if the error message is displayed
    const errorMessage = await page.locator('.wasm-error-message');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Error');
  });
  
  test('should support WebAssembly memory operations', async ({ page }) => {
    await page.goto('/wasm-demo');
    
    // Wait for the WebAssembly module to load
    await page.waitForSelector('.wasm-status:has-text("Loaded")');
    
    // Click on the memory test button
    await page.click('.wasm-memory-test-button');
    
    // Wait for the memory test to complete
    await page.waitForSelector('.wasm-memory-test-result');
    
    // Check if the memory test result is displayed
    const memoryTestResult = await page.locator('.wasm-memory-test-result');
    await expect(memoryTestResult).toBeVisible();
    await expect(memoryTestResult).toContainText('Memory test passed');
  });
  
  test('should support WebAssembly performance benchmarks', async ({ page }) => {
    await page.goto('/wasm-demo');
    
    // Wait for the WebAssembly module to load
    await page.waitForSelector('.wasm-status:has-text("Loaded")');
    
    // Click on the benchmark button
    await page.click('.wasm-benchmark-button');
    
    // Wait for the benchmark to complete
    await page.waitForSelector('.wasm-benchmark-result');
    
    // Check if the benchmark result is displayed
    const benchmarkResult = await page.locator('.wasm-benchmark-result');
    await expect(benchmarkResult).toBeVisible();
    
    // Check if the benchmark result contains the expected fields
    const benchmarkTime = await page.locator('.wasm-benchmark-time');
    const benchmarkOps = await page.locator('.wasm-benchmark-ops');
    
    await expect(benchmarkTime).toBeVisible();
    await expect(benchmarkOps).toBeVisible();
  });
  
  test('should support WebAssembly streaming compilation', async ({ page }) => {
    await page.goto('/streaming-demo');
    
    // Wait for the WebAssembly module to load
    await page.waitForSelector('.wasm-status:has-text("Loaded")');
    
    // Check if the streaming compilation status is displayed
    const streamingStatus = await page.locator('.streaming-status');
    await expect(streamingStatus).toBeVisible();
    
    // The streaming status should indicate whether streaming compilation was used
    const streamingSupported = await page.evaluate(() => {
      return typeof WebAssembly.compileStreaming === 'function';
    });
    
    if (streamingSupported) {
      await expect(streamingStatus).toContainText('Streaming compilation used');
    } else {
      await expect(streamingStatus).toContainText('Streaming compilation not supported');
    }
  });
  
  test('should support WebAssembly SIMD instructions', async ({ page }) => {
    await page.goto('/simd-demo');
    
    // Wait for the WebAssembly module to load
    await page.waitForSelector('.wasm-status:has-text("Loaded")');
    
    // Check if the SIMD status is displayed
    const simdStatus = await page.locator('.simd-status');
    await expect(simdStatus).toBeVisible();
    
    // The SIMD status should indicate whether SIMD instructions are supported
    const simdSupported = await page.evaluate(() => {
      try {
        // Try to compile a WebAssembly module with SIMD instructions
        const bytes = new Uint8Array([
          0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x04, 0x01, 0x60, 0x00, 0x00,
          0x03, 0x02, 0x01, 0x00, 0x0a, 0x09, 0x01, 0x07, 0x00, 0xfd, 0x0f, 0x00, 0x00, 0x0b
        ]);
        const module = new WebAssembly.Module(bytes);
        return WebAssembly.validate ? WebAssembly.validate(bytes) : false;
      } catch (error) {
        return false;
      }
    });
    
    if (simdSupported) {
      await expect(simdStatus).toContainText('SIMD instructions supported');
    } else {
      await expect(simdStatus).toContainText('SIMD instructions not supported');
    }
  });
  
  test('should support WebAssembly shared memory', async ({ page }) => {
    await page.goto('/shared-memory-demo');
    
    // Wait for the WebAssembly module to load
    await page.waitForSelector('.wasm-status:has-text("Loaded")');
    
    // Check if the shared memory status is displayed
    const sharedMemoryStatus = await page.locator('.shared-memory-status');
    await expect(sharedMemoryStatus).toBeVisible();
    
    // The shared memory status should indicate whether shared memory is supported
    const sharedMemorySupported = await page.evaluate(() => {
      return typeof SharedArrayBuffer !== 'undefined' && typeof Atomics !== 'undefined';
    });
    
    if (sharedMemorySupported) {
      await expect(sharedMemoryStatus).toContainText('Shared memory supported');
    } else {
      await expect(sharedMemoryStatus).toContainText('Shared memory not supported');
    }
  });
  
  test('should support WebAssembly dynamic linking', async ({ page }) => {
    await page.goto('/dynamic-linking-demo');
    
    // Wait for the WebAssembly modules to load
    await page.waitForSelector('.wasm-status:has-text("Loaded")');
    
    // Check if the dynamic linking status is displayed
    const dynamicLinkingStatus = await page.locator('.dynamic-linking-status');
    await expect(dynamicLinkingStatus).toBeVisible();
    
    // Check if the modules are linked
    await expect(dynamicLinkingStatus).toContainText('Modules linked');
    
    // Click on the test dynamic linking button
    await page.click('.test-dynamic-linking-button');
    
    // Wait for the test to complete
    await page.waitForSelector('.dynamic-linking-test-result');
    
    // Check if the test result is displayed
    const testResult = await page.locator('.dynamic-linking-test-result');
    await expect(testResult).toBeVisible();
    await expect(testResult).toContainText('Dynamic linking test passed');
  });
});