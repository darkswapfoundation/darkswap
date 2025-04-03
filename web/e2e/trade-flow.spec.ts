import { test, expect } from '@playwright/test';

/**
 * End-to-end tests for the trade flow
 */
test.describe('Trade Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the trade page
    await page.goto('/trade');
    
    // Wait for the page to load
    await page.waitForSelector('.trade-form', { timeout: 10000 });
  });
  
  test('should display the trade form', async ({ page }) => {
    // Check that the trade form is displayed
    await expect(page.locator('.trade-form')).toBeVisible();
    
    // Check that the form elements are displayed
    await expect(page.getByText('Create Trade Offer')).toBeVisible();
    await expect(page.getByLabel('You Send:')).toBeVisible();
    await expect(page.getByLabel('You Receive:')).toBeVisible();
    await expect(page.getByLabel('Amount:')).toBeVisible();
    await expect(page.getByText('Create Offer')).toBeVisible();
  });
  
  test('should create a trade offer', async ({ page }) => {
    // Fill out the trade form
    await page.selectOption('select[name="makerAssetType"]', 'bitcoin');
    await page.fill('input[name="makerAmount"]', '0.01');
    await page.selectOption('select[name="takerAssetType"]', 'rune');
    await page.fill('input[name="takerAssetId"]', 'rune-id');
    await page.fill('input[name="takerAmount"]', '1000');
    
    // Submit the form
    await page.click('button:text("Create Offer")');
    
    // Wait for the success notification
    await page.waitForSelector('.notification.success', { timeout: 10000 });
    
    // Check that the notification contains the expected text
    const notification = await page.locator('.notification.success').textContent();
    expect(notification).toContain('Trade offer created');
    
    // Check that the trade offer appears in the trade list
    await page.waitForSelector('.trade-list', { timeout: 10000 });
    const tradeList = await page.locator('.trade-list').textContent();
    expect(tradeList).toContain('1000 RUNE');
    expect(tradeList).toContain('0.01000000 BTC');
  });
  
  test('should accept a trade offer', async ({ page }) => {
    // Wait for the trade list to load
    await page.waitForSelector('.trade-list', { timeout: 10000 });
    
    // Click the accept button for the first offer
    await page.click('.trade-list button:text("Accept")');
    
    // Wait for the success notification
    await page.waitForSelector('.notification.success', { timeout: 10000 });
    
    // Check that the notification contains the expected text
    const notification = await page.locator('.notification.success').textContent();
    expect(notification).toContain('Trade offer accepted');
    
    // Check that the trade offer is marked as accepted
    const tradeList = await page.locator('.trade-list').textContent();
    expect(tradeList).toContain('Accepted');
  });
  
  test('should cancel a trade offer', async ({ page }) => {
    // Create a trade offer first
    await page.selectOption('select[name="makerAssetType"]', 'bitcoin');
    await page.fill('input[name="makerAmount"]', '0.01');
    await page.selectOption('select[name="takerAssetType"]', 'rune');
    await page.fill('input[name="takerAssetId"]', 'rune-id');
    await page.fill('input[name="takerAmount"]', '1000');
    await page.click('button:text("Create Offer")');
    
    // Wait for the success notification
    await page.waitForSelector('.notification.success', { timeout: 10000 });
    
    // Wait for the trade list to load
    await page.waitForSelector('.trade-list', { timeout: 10000 });
    
    // Click the cancel button for the first offer
    await page.click('.trade-list button:text("Cancel")');
    
    // Wait for the success notification
    await page.waitForSelector('.notification.success', { timeout: 10000 });
    
    // Check that the notification contains the expected text
    const notification = await page.locator('.notification.success').textContent();
    expect(notification).toContain('Trade offer cancelled');
    
    // Check that the trade offer is marked as cancelled
    const tradeList = await page.locator('.trade-list').textContent();
    expect(tradeList).toContain('Cancelled');
  });
  
  test('should validate the trade form', async ({ page }) => {
    // Submit the form without filling it out
    await page.click('button:text("Create Offer")');
    
    // Check that validation errors are displayed
    await expect(page.locator('.error-message')).toBeVisible();
    const errorMessage = await page.locator('.error-message').textContent();
    expect(errorMessage).toContain('Please enter an amount');
    
    // Fill out the form with invalid values
    await page.selectOption('select[name="makerAssetType"]', 'bitcoin');
    await page.fill('input[name="makerAmount"]', '-0.01');
    await page.click('button:text("Create Offer")');
    
    // Check that validation errors are displayed
    await expect(page.locator('.error-message')).toBeVisible();
    const negativeAmountError = await page.locator('.error-message').textContent();
    expect(negativeAmountError).toContain('Amount must be positive');
  });
  
  test('should check balance before submitting', async ({ page }) => {
    // Fill out the form with an amount greater than the balance
    await page.selectOption('select[name="makerAssetType"]', 'bitcoin');
    await page.fill('input[name="makerAmount"]', '1000'); // Assuming the balance is less than 1000 BTC
    await page.selectOption('select[name="takerAssetType"]', 'rune');
    await page.fill('input[name="takerAssetId"]', 'rune-id');
    await page.fill('input[name="takerAmount"]', '1000');
    
    // Submit the form
    await page.click('button:text("Create Offer")');
    
    // Check that validation errors are displayed
    await expect(page.locator('.error-message')).toBeVisible();
    const balanceError = await page.locator('.error-message').textContent();
    expect(balanceError).toContain('Insufficient balance');
  });
});