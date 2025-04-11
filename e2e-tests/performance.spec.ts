import { test, expect } from '@playwright/test';

test.describe('Performance Benchmarks', () => {
  test('should display performance benchmark page', async ({ page }) => {
    await page.goto('/performance-demo');
    
    // Check if the title is displayed
    const title = await page.locator('h1:has-text("Performance Benchmarks")');
    await expect(title).toBeVisible();
  });
  
  test('should measure order creation performance', async ({ page }) => {
    await page.goto('/performance-demo');
    
    // Wait for the demo to load
    await page.waitForSelector('.performance-demo-loaded');
    
    // Click on the order creation benchmark button
    await page.click('.order-creation-benchmark-button');
    
    // Wait for the benchmark to complete
    await page.waitForSelector('.order-creation-benchmark-result');
    
    // Check if the benchmark result is displayed
    const benchmarkResult = await page.locator('.order-creation-benchmark-result');
    await expect(benchmarkResult).toBeVisible();
    
    // Check if the benchmark result contains the expected fields
    const benchmarkTime = await page.locator('.order-creation-benchmark-time');
    const benchmarkOps = await page.locator('.order-creation-benchmark-ops');
    
    await expect(benchmarkTime).toBeVisible();
    await expect(benchmarkOps).toBeVisible();
    
    // Check if the benchmark time is a number
    const benchmarkTimeText = await benchmarkTime.textContent();
    expect(parseFloat(benchmarkTimeText || '0')).toBeGreaterThan(0);
    
    // Check if the benchmark ops is a number
    const benchmarkOpsText = await benchmarkOps.textContent();
    expect(parseFloat(benchmarkOpsText || '0')).toBeGreaterThan(0);
  });
  
  test('should measure order matching performance', async ({ page }) => {
    await page.goto('/performance-demo');
    
    // Wait for the demo to load
    await page.waitForSelector('.performance-demo-loaded');
    
    // Click on the order matching benchmark button
    await page.click('.order-matching-benchmark-button');
    
    // Wait for the benchmark to complete
    await page.waitForSelector('.order-matching-benchmark-result');
    
    // Check if the benchmark result is displayed
    const benchmarkResult = await page.locator('.order-matching-benchmark-result');
    await expect(benchmarkResult).toBeVisible();
    
    // Check if the benchmark result contains the expected fields
    const benchmarkTime = await page.locator('.order-matching-benchmark-time');
    const benchmarkOps = await page.locator('.order-matching-benchmark-ops');
    
    await expect(benchmarkTime).toBeVisible();
    await expect(benchmarkOps).toBeVisible();
    
    // Check if the benchmark time is a number
    const benchmarkTimeText = await benchmarkTime.textContent();
    expect(parseFloat(benchmarkTimeText || '0')).toBeGreaterThan(0);
    
    // Check if the benchmark ops is a number
    const benchmarkOpsText = await benchmarkOps.textContent();
    expect(parseFloat(benchmarkOpsText || '0')).toBeGreaterThan(0);
  });
  
  test('should measure WebAssembly load time', async ({ page }) => {
    await page.goto('/performance-demo');
    
    // Wait for the demo to load
    await page.waitForSelector('.performance-demo-loaded');
    
    // Click on the WebAssembly load time benchmark button
    await page.click('.wasm-load-benchmark-button');
    
    // Wait for the benchmark to complete
    await page.waitForSelector('.wasm-load-benchmark-result');
    
    // Check if the benchmark result is displayed
    const benchmarkResult = await page.locator('.wasm-load-benchmark-result');
    await expect(benchmarkResult).toBeVisible();
    
    // Check if the benchmark result contains the expected fields
    const benchmarkTime = await page.locator('.wasm-load-benchmark-time');
    
    await expect(benchmarkTime).toBeVisible();
    
    // Check if the benchmark time is a number
    const benchmarkTimeText = await benchmarkTime.textContent();
    expect(parseFloat(benchmarkTimeText || '0')).toBeGreaterThan(0);
  });
  
  test('should measure WebRTC connection establishment time', async ({ page, context }) => {
    // Create two pages for WebRTC connection establishment
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    // Navigate to the performance demo page on both pages
    await page1.goto('/performance-demo');
    await page2.goto('/performance-demo');
    
    // Wait for the demo to load on both pages
    await page1.waitForSelector('.performance-demo-loaded');
    await page2.waitForSelector('.performance-demo-loaded');
    
    // Get the peer IDs
    const peerId1 = await page1.locator('.webrtc-peer-id').textContent();
    
    // Enter the peer ID from page1 into page2
    await page2.fill('.webrtc-peer-id-input', peerId1 || '');
    
    // Click on the WebRTC connection establishment benchmark button on page2
    await page2.click('.webrtc-connection-benchmark-button');
    
    // Wait for the benchmark to complete
    await page2.waitForSelector('.webrtc-connection-benchmark-result');
    
    // Check if the benchmark result is displayed
    const benchmarkResult = await page2.locator('.webrtc-connection-benchmark-result');
    await expect(benchmarkResult).toBeVisible();
    
    // Check if the benchmark result contains the expected fields
    const benchmarkTime = await page2.locator('.webrtc-connection-benchmark-time');
    
    await expect(benchmarkTime).toBeVisible();
    
    // Check if the benchmark time is a number
    const benchmarkTimeText = await benchmarkTime.textContent();
    expect(parseFloat(benchmarkTimeText || '0')).toBeGreaterThan(0);
    
    // Close the pages
    await page1.close();
    await page2.close();
  });
  
  test('should measure P2P message propagation time', async ({ page, context }) => {
    // Create three pages for P2P message propagation
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    const page3 = await context.newPage();
    
    // Navigate to the performance demo page on all pages
    await page1.goto('/performance-demo');
    await page2.goto('/performance-demo');
    await page3.goto('/performance-demo');
    
    // Wait for the demo to load on all pages
    await page1.waitForSelector('.performance-demo-loaded');
    await page2.waitForSelector('.performance-demo-loaded');
    await page3.waitForSelector('.performance-demo-loaded');
    
    // Click the discover peers button on all pages
    await page1.click('.p2p-discover-button');
    await page2.click('.p2p-discover-button');
    await page3.click('.p2p-discover-button');
    
    // Wait for all peers to discover each other
    await page1.waitForSelector('.p2p-discovered-peers-count:has-text("2")');
    await page2.waitForSelector('.p2p-discovered-peers-count:has-text("2")');
    await page3.waitForSelector('.p2p-discovered-peers-count:has-text("2")');
    
    // Connect all peers to each other
    await page1.click('.p2p-connect-all-button');
    await page2.click('.p2p-connect-all-button');
    await page3.click('.p2p-connect-all-button');
    
    // Wait for all connections to be established
    await page1.waitForSelector('.p2p-connected-peers-count:has-text("2")');
    await page2.waitForSelector('.p2p-connected-peers-count:has-text("2")');
    await page3.waitForSelector('.p2p-connected-peers-count:has-text("2")');
    
    // Click on the P2P message propagation benchmark button on page1
    await page1.click('.p2p-message-propagation-benchmark-button');
    
    // Wait for the benchmark to complete on all pages
    await page1.waitForSelector('.p2p-message-propagation-benchmark-result');
    await page2.waitForSelector('.p2p-message-propagation-benchmark-result');
    await page3.waitForSelector('.p2p-message-propagation-benchmark-result');
    
    // Check if the benchmark result is displayed on all pages
    const benchmarkResult1 = await page1.locator('.p2p-message-propagation-benchmark-result');
    const benchmarkResult2 = await page2.locator('.p2p-message-propagation-benchmark-result');
    const benchmarkResult3 = await page3.locator('.p2p-message-propagation-benchmark-result');
    
    await expect(benchmarkResult1).toBeVisible();
    await expect(benchmarkResult2).toBeVisible();
    await expect(benchmarkResult3).toBeVisible();
    
    // Check if the benchmark result contains the expected fields
    const benchmarkTime1 = await page1.locator('.p2p-message-propagation-benchmark-time');
    const benchmarkTime2 = await page2.locator('.p2p-message-propagation-benchmark-time');
    const benchmarkTime3 = await page3.locator('.p2p-message-propagation-benchmark-time');
    
    await expect(benchmarkTime1).toBeVisible();
    await expect(benchmarkTime2).toBeVisible();
    await expect(benchmarkTime3).toBeVisible();
    
    // Check if the benchmark time is a number
    const benchmarkTimeText1 = await benchmarkTime1.textContent();
    const benchmarkTimeText2 = await benchmarkTime2.textContent();
    const benchmarkTimeText3 = await benchmarkTime3.textContent();
    
    expect(parseFloat(benchmarkTimeText1 || '0')).toBeGreaterThan(0);
    expect(parseFloat(benchmarkTimeText2 || '0')).toBeGreaterThan(0);
    expect(parseFloat(benchmarkTimeText3 || '0')).toBeGreaterThan(0);
    
    // Close the pages
    await page1.close();
    await page2.close();
    await page3.close();
  });
  
  test('should compare optimization strategies', async ({ page }) => {
    await page.goto('/performance-demo');
    
    // Wait for the demo to load
    await page.waitForSelector('.performance-demo-loaded');
    
    // Click on the optimization comparison button
    await page.click('.optimization-comparison-button');
    
    // Wait for the comparison to complete
    await page.waitForSelector('.optimization-comparison-result');
    
    // Check if the comparison result is displayed
    const comparisonResult = await page.locator('.optimization-comparison-result');
    await expect(comparisonResult).toBeVisible();
    
    // Check if the comparison result contains the expected optimization types
    const noOptimization = await page.locator('.optimization-none');
    const lazyLoading = await page.locator('.optimization-lazy-loading');
    const streamingCompilation = await page.locator('.optimization-streaming-compilation');
    const webWorkerLoading = await page.locator('.optimization-web-worker-loading');
    const codeSplitting = await page.locator('.optimization-code-splitting');
    const simdInstructions = await page.locator('.optimization-simd-instructions');
    const sharedMemory = await page.locator('.optimization-shared-memory');
    const combinedOptimizations = await page.locator('.optimization-combined');
    
    await expect(noOptimization).toBeVisible();
    await expect(lazyLoading).toBeVisible();
    await expect(streamingCompilation).toBeVisible();
    await expect(webWorkerLoading).toBeVisible();
    await expect(codeSplitting).toBeVisible();
    await expect(simdInstructions).toBeVisible();
    await expect(sharedMemory).toBeVisible();
    await expect(combinedOptimizations).toBeVisible();
    
    // Check if the combined optimizations are faster than no optimizations
    const noOptimizationTime = await page.locator('.optimization-none-time').textContent();
    const combinedOptimizationsTime = await page.locator('.optimization-combined-time').textContent();
    
    expect(parseFloat(combinedOptimizationsTime || '0')).toBeLessThan(parseFloat(noOptimizationTime || '0'));
  });
  
  test('should measure memory usage', async ({ page }) => {
    await page.goto('/performance-demo');
    
    // Wait for the demo to load
    await page.waitForSelector('.performance-demo-loaded');
    
    // Click on the memory usage benchmark button
    await page.click('.memory-usage-benchmark-button');
    
    // Wait for the benchmark to complete
    await page.waitForSelector('.memory-usage-benchmark-result');
    
    // Check if the benchmark result is displayed
    const benchmarkResult = await page.locator('.memory-usage-benchmark-result');
    await expect(benchmarkResult).toBeVisible();
    
    // Check if the benchmark result contains the expected fields
    const initialMemory = await page.locator('.initial-memory-usage');
    const peakMemory = await page.locator('.peak-memory-usage');
    const finalMemory = await page.locator('.final-memory-usage');
    
    await expect(initialMemory).toBeVisible();
    await expect(peakMemory).toBeVisible();
    await expect(finalMemory).toBeVisible();
    
    // Check if the memory usage values are numbers
    const initialMemoryText = await initialMemory.textContent();
    const peakMemoryText = await peakMemory.textContent();
    const finalMemoryText = await finalMemory.textContent();
    
    expect(parseFloat(initialMemoryText || '0')).toBeGreaterThan(0);
    expect(parseFloat(peakMemoryText || '0')).toBeGreaterThan(0);
    expect(parseFloat(finalMemoryText || '0')).toBeGreaterThan(0);
    
    // Check if the peak memory is greater than or equal to the initial memory
    expect(parseFloat(peakMemoryText || '0')).toBeGreaterThanOrEqual(parseFloat(initialMemoryText || '0'));
  });
  
  test('should measure rendering performance', async ({ page }) => {
    await page.goto('/performance-demo');
    
    // Wait for the demo to load
    await page.waitForSelector('.performance-demo-loaded');
    
    // Click on the rendering performance benchmark button
    await page.click('.rendering-performance-benchmark-button');
    
    // Wait for the benchmark to complete
    await page.waitForSelector('.rendering-performance-benchmark-result');
    
    // Check if the benchmark result is displayed
    const benchmarkResult = await page.locator('.rendering-performance-benchmark-result');
    await expect(benchmarkResult).toBeVisible();
    
    // Check if the benchmark result contains the expected fields
    const fps = await page.locator('.rendering-fps');
    const frameTime = await page.locator('.rendering-frame-time');
    
    await expect(fps).toBeVisible();
    await expect(frameTime).toBeVisible();
    
    // Check if the FPS is a number
    const fpsText = await fps.textContent();
    expect(parseFloat(fpsText || '0')).toBeGreaterThan(0);
    
    // Check if the frame time is a number
    const frameTimeText = await frameTime.textContent();
    expect(parseFloat(frameTimeText || '0')).toBeGreaterThan(0);
  });
  
  test('should measure network performance', async ({ page }) => {
    await page.goto('/performance-demo');
    
    // Wait for the demo to load
    await page.waitForSelector('.performance-demo-loaded');
    
    // Click on the network performance benchmark button
    await page.click('.network-performance-benchmark-button');
    
    // Wait for the benchmark to complete
    await page.waitForSelector('.network-performance-benchmark-result');
    
    // Check if the benchmark result is displayed
    const benchmarkResult = await page.locator('.network-performance-benchmark-result');
    await expect(benchmarkResult).toBeVisible();
    
    // Check if the benchmark result contains the expected fields
    const downloadSpeed = await page.locator('.download-speed');
    const uploadSpeed = await page.locator('.upload-speed');
    const latency = await page.locator('.network-latency');
    
    await expect(downloadSpeed).toBeVisible();
    await expect(uploadSpeed).toBeVisible();
    await expect(latency).toBeVisible();
    
    // Check if the download speed is a number
    const downloadSpeedText = await downloadSpeed.textContent();
    expect(parseFloat(downloadSpeedText || '0')).toBeGreaterThan(0);
    
    // Check if the upload speed is a number
    const uploadSpeedText = await uploadSpeed.textContent();
    expect(parseFloat(uploadSpeedText || '0')).toBeGreaterThan(0);
    
    // Check if the latency is a number
    const latencyText = await latency.textContent();
    expect(parseFloat(latencyText || '0')).toBeGreaterThan(0);
  });
});