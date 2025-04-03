import { test, expect } from '@playwright/test';

/**
 * End-to-end tests for the wallet integration
 */
test.describe('Wallet Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the wallet page
    await page.goto('/wallet');
    
    // Wait for the page to load
    await page.waitForSelector('.wallet-balance', { timeout: 10000 });
  });
  
  test('should display wallet balance', async ({ page }) => {
    // Check that the wallet balance is displayed
    await expect(page.locator('.wallet-balance')).toBeVisible();
    
    // Check that the Bitcoin balance is displayed
    await expect(page.getByText('Bitcoin')).toBeVisible();
    
    // Check that the balance amount is displayed
    const bitcoinBalance = await page.locator('.bitcoin-balance').textContent();
    expect(bitcoinBalance).toMatch(/\d+\.\d{8} BTC/);
    
    // Check that the USD value is displayed
    const usdValue = await page.locator('.usd-value').textContent();
    expect(usdValue).toMatch(/\$\d+\.\d{2}/);
  });
  
  test('should display rune balances', async ({ page }) => {
    // Check that the runes section is displayed
    await expect(page.getByText('Runes')).toBeVisible();
    
    // Check that at least one rune balance is displayed
    await expect(page.locator('.rune-balance')).toBeVisible();
    
    // Check that the rune ID is displayed
    const runeId = await page.locator('.rune-id').first().textContent();
    expect(runeId).toBeTruthy();
    
    // Check that the rune amount is displayed
    const runeAmount = await page.locator('.rune-amount').first().textContent();
    expect(runeAmount).toMatch(/\d+ RUNE/);
  });
  
  test('should display alkane balances', async ({ page }) => {
    // Check that the alkanes section is displayed
    await expect(page.getByText('Alkanes')).toBeVisible();
    
    // Check that at least one alkane balance is displayed
    await expect(page.locator('.alkane-balance')).toBeVisible();
    
    // Check that the alkane ID is displayed
    const alkaneId = await page.locator('.alkane-id').first().textContent();
    expect(alkaneId).toBeTruthy();
    
    // Check that the alkane amount is displayed
    const alkaneAmount = await page.locator('.alkane-amount').first().textContent();
    expect(alkaneAmount).toMatch(/\d+ ALKANE/);
  });
  
  test('should refresh balances', async ({ page }) => {
    // Click the refresh button
    await page.click('button:text("Refresh")');
    
    // Check that the loading indicator is displayed
    await expect(page.locator('.loading-indicator')).toBeVisible();
    
    // Wait for the loading indicator to disappear
    await expect(page.locator('.loading-indicator')).toBeHidden({ timeout: 10000 });
    
    // Check that the balances are displayed
    await expect(page.locator('.wallet-balance')).toBeVisible();
  });
  
  test('should connect to wallet', async ({ page }) => {
    // Click the connect button
    await page.click('button:text("Connect Wallet")');
    
    // Wait for the wallet selection dialog
    await page.waitForSelector('.wallet-selection-dialog', { timeout: 10000 });
    
    // Select a wallet
    await page.click('.wallet-option:first-child');
    
    // Wait for the connection to complete
    await page.waitForSelector('.wallet-connected', { timeout: 10000 });
    
    // Check that the wallet is connected
    await expect(page.locator('.wallet-connected')).toBeVisible();
    
    // Check that the wallet address is displayed
    const walletAddress = await page.locator('.wallet-address').textContent();
    expect(walletAddress).toMatch(/^[a-zA-Z0-9]+$/);
  });
  
  test('should sign a transaction', async ({ page }) => {
    // Ensure wallet is connected
    if (await page.locator('.connect-wallet-button').isVisible()) {
      await page.click('button:text("Connect Wallet")');
      await page.waitForSelector('.wallet-selection-dialog', { timeout: 10000 });
      await page.click('.wallet-option:first-child');
      await page.waitForSelector('.wallet-connected', { timeout: 10000 });
    }
    
    // Navigate to the send page
    await page.click('a:text("Send")');
    
    // Wait for the send form to load
    await page.waitForSelector('.send-form', { timeout: 10000 });
    
    // Fill out the send form
    await page.fill('input[name="recipient"]', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
    await page.fill('input[name="amount"]', '0.0001');
    
    // Submit the form
    await page.click('button:text("Send")');
    
    // Wait for the transaction confirmation dialog
    await page.waitForSelector('.transaction-confirmation', { timeout: 10000 });
    
    // Confirm the transaction
    await page.click('button:text("Confirm")');
    
    // Wait for the transaction to be signed
    await page.waitForSelector('.transaction-signed', { timeout: 10000 });
    
    // Check that the transaction was signed
    await expect(page.locator('.transaction-signed')).toBeVisible();
    
    // Check that the transaction ID is displayed
    const transactionId = await page.locator('.transaction-id').textContent();
    expect(transactionId).toMatch(/^[a-f0-9]+$/);
  });
  
  test('should handle transaction errors', async ({ page }) => {
    // Ensure wallet is connected
    if (await page.locator('.connect-wallet-button').isVisible()) {
      await page.click('button:text("Connect Wallet")');
      await page.waitForSelector('.wallet-selection-dialog', { timeout: 10000 });
      await page.click('.wallet-option:first-child');
      await page.waitForSelector('.wallet-connected', { timeout: 10000 });
    }
    
    // Navigate to the send page
    await page.click('a:text("Send")');
    
    // Wait for the send form to load
    await page.waitForSelector('.send-form', { timeout: 10000 });
    
    // Fill out the send form with an invalid amount
    await page.fill('input[name="recipient"]', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
    await page.fill('input[name="amount"]', '1000'); // Assuming the balance is less than 1000 BTC
    
    // Submit the form
    await page.click('button:text("Send")');
    
    // Check that an error message is displayed
    await expect(page.locator('.error-message')).toBeVisible();
    const errorMessage = await page.locator('.error-message').textContent();
    expect(errorMessage).toContain('Insufficient balance');
  });
});