import { test, expect } from '@playwright/test';

/**
 * End-to-end tests for error handling scenarios
 */
test.describe('Error Handling', () => {
  test('should handle network failures when creating trade offers', async ({ page }) => {
    // Navigate to the trade page
    await page.goto('/trade');
    
    // Wait for the page to load
    await page.waitForSelector('.trade-form', { timeout: 10000 });
    
    // Intercept API calls to simulate network failure
    await page.route('**/api/trade/offer', route => {
      route.abort('failed');
    });
    
    // Fill out the trade form
    await page.selectOption('select[name="makerAssetType"]', 'bitcoin');
    await page.fill('input[name="makerAmount"]', '0.01');
    await page.selectOption('select[name="takerAssetType"]', 'rune');
    await page.fill('input[name="takerAssetId"]', 'rune-id');
    await page.fill('input[name="takerAmount"]', '1000');
    
    // Submit the form
    await page.click('button:text("Create Offer")');
    
    // Check that an error notification is displayed
    await page.waitForSelector('.notification.error', { timeout: 10000 });
    const notification = await page.locator('.notification.error').textContent();
    expect(notification).toContain('Failed to create trade offer');
    
    // Check that the form is still displayed and can be resubmitted
    await expect(page.locator('.trade-form')).toBeVisible();
    await expect(page.locator('button:text("Create Offer")')).toBeEnabled();
  });
  
  test('should handle API errors when accepting trade offers', async ({ page }) => {
    // Navigate to the trade page
    await page.goto('/trade');
    
    // Wait for the page to load
    await page.waitForSelector('.trade-list', { timeout: 10000 });
    
    // Intercept API calls to simulate API error
    await page.route('**/api/trade/offer/*/accept', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Invalid trade offer',
        }),
      });
    });
    
    // Click the accept button for the first offer
    await page.click('.trade-list button:text("Accept")');
    
    // Check that an error notification is displayed
    await page.waitForSelector('.notification.error', { timeout: 10000 });
    const notification = await page.locator('.notification.error').textContent();
    expect(notification).toContain('Failed to accept trade offer');
    
    // Check that the trade list is still displayed
    await expect(page.locator('.trade-list')).toBeVisible();
  });
  
  test('should handle WebSocket disconnection', async ({ page }) => {
    // Navigate to the trade page
    await page.goto('/trade');
    
    // Wait for the page to load
    await page.waitForSelector('.websocket-status', { timeout: 10000 });
    
    // Simulate WebSocket disconnection
    await page.evaluate(() => {
      // This will trigger the WebSocket's onclose event
      // @ts-ignore - Accessing window object
      window.dispatchEvent(new CustomEvent('websocket-disconnected'));
    });
    
    // Check that the WebSocket status shows disconnected
    await page.waitForSelector('.websocket-status.disconnected', { timeout: 10000 });
    
    // Check that a warning notification is displayed
    await page.waitForSelector('.notification.warning', { timeout: 10000 });
    const notification = await page.locator('.notification.warning').textContent();
    expect(notification).toContain('Disconnected from server');
    
    // Check that the reconnect button is displayed
    await expect(page.locator('button:text("Reconnect")')).toBeVisible();
    
    // Click the reconnect button
    await page.click('button:text("Reconnect")');
    
    // Check that the WebSocket status shows connecting
    await page.waitForSelector('.websocket-status.connecting', { timeout: 10000 });
  });
  
  test('should handle validation errors in forms', async ({ page }) => {
    // Navigate to the trade page
    await page.goto('/trade');
    
    // Wait for the page to load
    await page.waitForSelector('.trade-form', { timeout: 10000 });
    
    // Submit the form without filling it out
    await page.click('button:text("Create Offer")');
    
    // Check that validation errors are displayed
    await expect(page.locator('.error-message')).toBeVisible();
    
    // Fill out the form with invalid values
    await page.selectOption('select[name="makerAssetType"]', 'bitcoin');
    await page.fill('input[name="makerAmount"]', 'not-a-number');
    
    // Submit the form
    await page.click('button:text("Create Offer")');
    
    // Check that validation errors are displayed
    await expect(page.locator('.error-message')).toBeVisible();
    const errorMessage = await page.locator('.error-message').textContent();
    expect(errorMessage).toContain('Please enter a valid number');
  });
  
  test('should handle transaction failures', async ({ page }) => {
    // Navigate to the wallet page
    await page.goto('/wallet');
    
    // Wait for the page to load
    await page.waitForSelector('.wallet-balance', { timeout: 10000 });
    
    // Navigate to the send page
    await page.click('a:text("Send")');
    
    // Wait for the send form to load
    await page.waitForSelector('.send-form', { timeout: 10000 });
    
    // Intercept API calls to simulate transaction failure
    await page.route('**/api/wallet/send', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Transaction failed: insufficient funds',
        }),
      });
    });
    
    // Fill out the send form
    await page.fill('input[name="recipient"]', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
    await page.fill('input[name="amount"]', '0.0001');
    
    // Submit the form
    await page.click('button:text("Send")');
    
    // Check that an error notification is displayed
    await page.waitForSelector('.notification.error', { timeout: 10000 });
    const notification = await page.locator('.notification.error').textContent();
    expect(notification).toContain('Transaction failed');
    
    // Check that the error details are displayed
    const errorDetails = await page.locator('.error-details').textContent();
    expect(errorDetails).toContain('insufficient funds');
  });
  
  test('should handle timeout errors', async ({ page }) => {
    // Navigate to the trade page
    await page.goto('/trade');
    
    // Wait for the page to load
    await page.waitForSelector('.trade-form', { timeout: 10000 });
    
    // Intercept API calls to simulate timeout
    await page.route('**/api/trade/offers', route => {
      // Never resolve the request to simulate a timeout
      // The request will be automatically timed out by the API client
    });
    
    // Try to refresh the trade offers
    await page.click('button:text("Refresh")');
    
    // Check that a loading indicator is displayed
    await expect(page.locator('.loading-indicator')).toBeVisible();
    
    // Wait for the timeout to occur (this might take some time depending on the API client timeout)
    await page.waitForSelector('.notification.error', { timeout: 30000 });
    
    // Check that an error notification is displayed
    const notification = await page.locator('.notification.error').textContent();
    expect(notification).toContain('Request timed out');
  });
  
  test('should handle server errors', async ({ page }) => {
    // Navigate to the trade page
    await page.goto('/trade');
    
    // Wait for the page to load
    await page.waitForSelector('.trade-list', { timeout: 10000 });
    
    // Intercept API calls to simulate server error
    await page.route('**/api/trade/offers', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error',
        }),
      });
    });
    
    // Try to refresh the trade offers
    await page.click('button:text("Refresh")');
    
    // Check that an error notification is displayed
    await page.waitForSelector('.notification.error', { timeout: 10000 });
    const notification = await page.locator('.notification.error').textContent();
    expect(notification).toContain('Failed to fetch trade offers');
    
    // Check that the error details are displayed
    const errorDetails = await page.locator('.error-details').textContent();
    expect(errorDetails).toContain('Internal server error');
  });
});