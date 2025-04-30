import { Page, expect } from '@playwright/test';

/**
 * Helper functions for end-to-end tests
 */

/**
 * Wait for a notification of a specific type to appear
 * @param page Playwright page
 * @param type Notification type ('success', 'error', 'warning', 'info')
 * @param timeout Timeout in milliseconds
 * @returns The notification element
 */
export async function waitForNotification(page: Page, type: 'success' | 'error' | 'warning' | 'info', timeout = 10000) {
  const selector = `.notification.${type}`;
  await page.waitForSelector(selector, { timeout });
  return page.locator(selector);
}

/**
 * Fill out the trade form with the specified values
 * @param page Playwright page
 * @param makerAssetType Maker asset type ('bitcoin', 'rune', 'alkane')
 * @param makerAmount Maker amount
 * @param takerAssetType Taker asset type ('bitcoin', 'rune', 'alkane')
 * @param takerAmount Taker amount
 * @param makerAssetId Maker asset ID (required for rune and alkane)
 * @param takerAssetId Taker asset ID (required for rune and alkane)
 */
export async function fillTradeForm(
  page: Page,
  makerAssetType: 'bitcoin' | 'rune' | 'alkane',
  makerAmount: string,
  takerAssetType: 'bitcoin' | 'rune' | 'alkane',
  takerAmount: string,
  makerAssetId?: string,
  takerAssetId?: string
) {
  // Select maker asset type
  await page.selectOption('select[name="makerAssetType"]', makerAssetType);
  
  // Fill maker asset ID if needed
  if (makerAssetType !== 'bitcoin' && makerAssetId) {
    await page.fill('input[name="makerAssetId"]', makerAssetId);
  }
  
  // Fill maker amount
  await page.fill('input[name="makerAmount"]', makerAmount);
  
  // Select taker asset type
  await page.selectOption('select[name="takerAssetType"]', takerAssetType);
  
  // Fill taker asset ID if needed
  if (takerAssetType !== 'bitcoin' && takerAssetId) {
    await page.fill('input[name="takerAssetId"]', takerAssetId);
  }
  
  // Fill taker amount
  await page.fill('input[name="takerAmount"]', takerAmount);
}

/**
 * Connect to a wallet
 * @param page Playwright page
 * @param walletIndex Index of the wallet to connect to (0-based)
 */
export async function connectWallet(page: Page, walletIndex = 0) {
  // Check if wallet is already connected
  const isConnected = await page.locator('.wallet-connected').isVisible();
  if (isConnected) {
    return;
  }
  
  // Click the connect button
  await page.click('button:text("Connect Wallet")');
  
  // Wait for the wallet selection dialog
  await page.waitForSelector('.wallet-selection-dialog', { timeout: 10000 });
  
  // Select the specified wallet
  const walletOptions = page.locator('.wallet-option');
  const count = await walletOptions.count();
  
  if (walletIndex >= count) {
    throw new Error(`Wallet index ${walletIndex} is out of range (0-${count - 1})`);
  }
  
  await walletOptions.nth(walletIndex).click();
  
  // Wait for the connection to complete
  await page.waitForSelector('.wallet-connected', { timeout: 10000 });
}

/**
 * Ensure WebSocket is connected
 * @param page Playwright page
 */
export async function ensureWebSocketConnected(page: Page) {
  // Check if WebSocket is already connected
  const isConnected = await page.locator('.websocket-status.connected').isVisible();
  if (isConnected) {
    return;
  }
  
  // Check if there's a reconnect button
  const hasReconnectButton = await page.locator('button:text("Reconnect")').isVisible();
  if (hasReconnectButton) {
    await page.click('button:text("Reconnect")');
  } else {
    // Check if there's a connect button
    const hasConnectButton = await page.locator('button:text("Connect")').isVisible();
    if (hasConnectButton) {
      await page.click('button:text("Connect")');
    }
  }
  
  // Wait for the connection to establish
  await page.waitForSelector('.websocket-status.connected', { timeout: 10000 });
}

/**
 * Mock API response
 * @param page Playwright page
 * @param url URL pattern to mock
 * @param response Response to return
 * @param status HTTP status code
 */
export async function mockApiResponse(
  page: Page,
  url: string | RegExp,
  response: any,
  status = 200
) {
  await page.route(url, route => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Mock API error
 * @param page Playwright page
 * @param url URL pattern to mock
 * @param error Error message
 * @param status HTTP status code
 */
export async function mockApiError(
  page: Page,
  url: string | RegExp,
  error: string,
  status = 400
) {
  await page.route(url, route => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        error,
      }),
    });
  });
}

/**
 * Mock API network failure
 * @param page Playwright page
 * @param url URL pattern to mock
 */
export async function mockApiNetworkFailure(
  page: Page,
  url: string | RegExp
) {
  await page.route(url, route => {
    route.abort('failed');
  });
}

/**
 * Mock API timeout
 * @param page Playwright page
 * @param url URL pattern to mock
 */
export async function mockApiTimeout(
  page: Page,
  url: string | RegExp
) {
  await page.route(url, route => {
    // Never resolve the request to simulate a timeout
    // The request will be automatically timed out by the API client
  });
}

/**
 * Get formatted balance text
 * @param amount Amount
 * @param assetType Asset type ('bitcoin', 'rune', 'alkane')
 * @returns Formatted balance text
 */
export function getFormattedBalance(amount: number, assetType: 'bitcoin' | 'rune' | 'alkane') {
  if (assetType === 'bitcoin') {
    return `${amount.toFixed(8)} BTC`;
  } else if (assetType === 'rune') {
    return `${amount} RUNE`;
  } else {
    return `${amount} ALKANE`;
  }
}

/**
 * Get formatted USD value text
 * @param amount Amount in USD
 * @returns Formatted USD value text
 */
export function getFormattedUsdValue(amount: number) {
  return `$${amount.toFixed(2)}`;
}