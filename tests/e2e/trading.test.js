/**
 * End-to-End Trading Tests
 * 
 * This file contains end-to-end tests for the trading functionality of DarkSwap.
 * It tests the complete trading flow, including:
 * - Connecting to peers
 * - Creating orders
 * - Matching orders
 * - Executing trades
 * - Verifying transaction results
 */

const { test, expect } = require('@playwright/test');
const { v4: uuidv4 } = require('uuid');

// Test configuration
const config = {
  baseUrl: 'http://localhost:3000',
  timeout: 60000,
  testTimeout: 120000,
};

// Test data
const testData = {
  wallet1: {
    mnemonic: 'test test test test test test test test test test test junk',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  },
  wallet2: {
    mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
  },
  bitcoin: {
    amount: '0.001',
  },
  rune: {
    id: 'rune1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    ticker: 'TEST',
    amount: '100',
  },
  alkane: {
    id: 'alkane1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    ticker: 'METH',
    amount: '50',
  },
};

/**
 * Helper function to connect a wallet
 * @param {Page} page - Playwright page object
 * @param {string} mnemonic - Wallet mnemonic
 */
async function connectWallet(page, mnemonic) {
  // Click the connect wallet button
  await page.click('button:has-text("Connect Wallet")');
  
  // Wait for the wallet modal to appear
  await page.waitForSelector('text=Connect Your Wallet');
  
  // Enter the mnemonic
  await page.fill('textarea[placeholder="Enter your mnemonic phrase"]', mnemonic);
  
  // Click the connect button
  await page.click('button:has-text("Connect")');
  
  // Wait for the wallet to connect
  await page.waitForSelector('text=Wallet Connected');
}

/**
 * Helper function to navigate to the P2P Trade page
 * @param {Page} page - Playwright page object
 */
async function navigateToP2PTrade(page) {
  // Click the P2P Trade link in the navigation
  await page.click('a:has-text("P2P Trade")');
  
  // Wait for the page to load
  await page.waitForSelector('text=P2P Trading');
}

/**
 * Helper function to navigate to the P2P Orderbook page
 * @param {Page} page - Playwright page object
 */
async function navigateToP2POrderbook(page) {
  // Click the P2P Orderbook link in the navigation
  await page.click('a:has-text("P2P Orderbook")');
  
  // Wait for the page to load
  await page.waitForSelector('text=Decentralized Orderbook');
}

/**
 * Helper function to create an order
 * @param {Page} page - Playwright page object
 * @param {Object} orderDetails - Order details
 */
async function createOrder(page, orderDetails) {
  // Click the Create Order button
  await page.click('button:has-text("Create Order")');
  
  // Wait for the order form to appear
  await page.waitForSelector('text=Create Order');
  
  // Select the order side
  if (orderDetails.side === 'buy') {
    await page.click('button:has-text("Buy")');
  } else {
    await page.click('button:has-text("Sell")');
  }
  
  // Select the base asset type
  await page.selectOption('select:near(:text("Base Asset"))', orderDetails.baseAssetType);
  
  // If the base asset is not Bitcoin, enter the asset ID
  if (orderDetails.baseAssetType !== 'bitcoin') {
    await page.fill('input[placeholder="Asset ID"]:near(:text("Base Asset"))', orderDetails.baseAssetId);
  }
  
  // Enter the base asset amount
  await page.fill('input[placeholder="Amount"]:near(:text("Base Asset"))', orderDetails.baseAssetAmount);
  
  // Select the quote asset type
  await page.selectOption('select:near(:text("Quote Asset"))', orderDetails.quoteAssetType);
  
  // If the quote asset is not Bitcoin, enter the asset ID
  if (orderDetails.quoteAssetType !== 'bitcoin') {
    await page.fill('input[placeholder="Asset ID"]:near(:text("Quote Asset"))', orderDetails.quoteAssetId);
  }
  
  // Enter the quote asset amount
  await page.fill('input[placeholder="Amount"]:near(:text("Quote Asset"))', orderDetails.quoteAssetAmount);
  
  // Set the expiry time
  await page.fill('input[type="number"]', orderDetails.expiry.toString());
  
  // Click the Create Order button
  await page.click('button:has-text("Create Order"):not(:has-text("Cancel"))');
  
  // Wait for the order to be created
  await page.waitForSelector('text=Order created successfully');
}

/**
 * Helper function to execute a trade
 * @param {Page} page - Playwright page object
 * @param {string} orderId - Order ID
 */
async function executeTrade(page, orderId) {
  // Find the order in the table
  const orderRow = page.locator(`tr:has-text("${orderId}")`);
  
  // Click the Trade button
  await orderRow.locator('button:has-text("Trade")').click();
  
  // Wait for the trade confirmation dialog
  await page.waitForSelector('text=Confirm Trade');
  
  // Click the Confirm button
  await page.click('button:has-text("Confirm")');
  
  // Wait for the trade to be executed
  await page.waitForSelector('text=Trade executed successfully');
}

/**
 * Test: Complete P2P Trading Flow with Bitcoin
 */
test('Complete P2P Trading Flow with Bitcoin', async ({ browser }) => {
  // Create two browser contexts for the two users
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  
  // Create pages for each user
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  
  // Navigate to the app
  await page1.goto(config.baseUrl);
  await page2.goto(config.baseUrl);
  
  // Connect wallets
  await connectWallet(page1, testData.wallet1.mnemonic);
  await connectWallet(page2, testData.wallet2.mnemonic);
  
  // Navigate to the P2P Orderbook page
  await navigateToP2POrderbook(page1);
  await navigateToP2POrderbook(page2);
  
  // User 1 creates a sell order for Bitcoin
  const orderId = uuidv4();
  await createOrder(page1, {
    side: 'sell',
    baseAssetType: 'bitcoin',
    baseAssetAmount: testData.bitcoin.amount,
    quoteAssetType: 'bitcoin',
    quoteAssetAmount: (parseFloat(testData.bitcoin.amount) * 1.05).toString(), // 5% markup
    expiry: 24, // 24 hours
    orderId,
  });
  
  // Wait for the order to be synchronized to User 2
  await page2.waitForSelector(`text=${orderId}`);
  
  // User 2 executes the trade
  await executeTrade(page2, orderId);
  
  // Verify the trade was executed successfully
  await page1.waitForSelector('text=Trade executed successfully');
  await page2.waitForSelector('text=Trade executed successfully');
  
  // Close the browser contexts
  await context1.close();
  await context2.close();
});

/**
 * Test: Complete P2P Trading Flow with Runes
 */
test('Complete P2P Trading Flow with Runes', async ({ browser }) => {
  // Create two browser contexts for the two users
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  
  // Create pages for each user
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  
  // Navigate to the app
  await page1.goto(config.baseUrl);
  await page2.goto(config.baseUrl);
  
  // Connect wallets
  await connectWallet(page1, testData.wallet1.mnemonic);
  await connectWallet(page2, testData.wallet2.mnemonic);
  
  // Navigate to the P2P Orderbook page
  await navigateToP2POrderbook(page1);
  await navigateToP2POrderbook(page2);
  
  // User 1 creates a sell order for Runes
  const orderId = uuidv4();
  await createOrder(page1, {
    side: 'sell',
    baseAssetType: 'rune',
    baseAssetId: testData.rune.id,
    baseAssetAmount: testData.rune.amount,
    quoteAssetType: 'bitcoin',
    quoteAssetAmount: testData.bitcoin.amount,
    expiry: 24, // 24 hours
    orderId,
  });
  
  // Wait for the order to be synchronized to User 2
  await page2.waitForSelector(`text=${orderId}`);
  
  // User 2 executes the trade
  await executeTrade(page2, orderId);
  
  // Verify the trade was executed successfully
  await page1.waitForSelector('text=Trade executed successfully');
  await page2.waitForSelector('text=Trade executed successfully');
  
  // Close the browser contexts
  await context1.close();
  await context2.close();
});

/**
 * Test: Complete P2P Trading Flow with Alkanes
 */
test('Complete P2P Trading Flow with Alkanes', async ({ browser }) => {
  // Create two browser contexts for the two users
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  
  // Create pages for each user
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  
  // Navigate to the app
  await page1.goto(config.baseUrl);
  await page2.goto(config.baseUrl);
  
  // Connect wallets
  await connectWallet(page1, testData.wallet1.mnemonic);
  await connectWallet(page2, testData.wallet2.mnemonic);
  
  // Navigate to the P2P Orderbook page
  await navigateToP2POrderbook(page1);
  await navigateToP2POrderbook(page2);
  
  // User 1 creates a sell order for Alkanes
  const orderId = uuidv4();
  await createOrder(page1, {
    side: 'sell',
    baseAssetType: 'alkane',
    baseAssetId: testData.alkane.id,
    baseAssetAmount: testData.alkane.amount,
    quoteAssetType: 'bitcoin',
    quoteAssetAmount: testData.bitcoin.amount,
    expiry: 24, // 24 hours
    orderId,
  });
  
  // Wait for the order to be synchronized to User 2
  await page2.waitForSelector(`text=${orderId}`);
  
  // User 2 executes the trade
  await executeTrade(page2, orderId);
  
  // Verify the trade was executed successfully
  await page1.waitForSelector('text=Trade executed successfully');
  await page2.waitForSelector('text=Trade executed successfully');
  
  // Close the browser contexts
  await context1.close();
  await context2.close();
});

/**
 * Test: Cross-Asset Trading (Runes for Alkanes)
 */
test('Cross-Asset Trading (Runes for Alkanes)', async ({ browser }) => {
  // Create two browser contexts for the two users
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  
  // Create pages for each user
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  
  // Navigate to the app
  await page1.goto(config.baseUrl);
  await page2.goto(config.baseUrl);
  
  // Connect wallets
  await connectWallet(page1, testData.wallet1.mnemonic);
  await connectWallet(page2, testData.wallet2.mnemonic);
  
  // Navigate to the P2P Orderbook page
  await navigateToP2POrderbook(page1);
  await navigateToP2POrderbook(page2);
  
  // User 1 creates a sell order for Runes, asking for Alkanes
  const orderId = uuidv4();
  await createOrder(page1, {
    side: 'sell',
    baseAssetType: 'rune',
    baseAssetId: testData.rune.id,
    baseAssetAmount: testData.rune.amount,
    quoteAssetType: 'alkane',
    quoteAssetId: testData.alkane.id,
    quoteAssetAmount: testData.alkane.amount,
    expiry: 24, // 24 hours
    orderId,
  });
  
  // Wait for the order to be synchronized to User 2
  await page2.waitForSelector(`text=${orderId}`);
  
  // User 2 executes the trade
  await executeTrade(page2, orderId);
  
  // Verify the trade was executed successfully
  await page1.waitForSelector('text=Trade executed successfully');
  await page2.waitForSelector('text=Trade executed successfully');
  
  // Close the browser contexts
  await context1.close();
  await context2.close();
});

/**
 * Test: Order Expiry and Cancellation
 */
test('Order Expiry and Cancellation', async ({ browser }) => {
  // Create a browser context
  const context = await browser.newContext();
  
  // Create a page
  const page = await context.newPage();
  
  // Navigate to the app
  await page.goto(config.baseUrl);
  
  // Connect wallet
  await connectWallet(page, testData.wallet1.mnemonic);
  
  // Navigate to the P2P Orderbook page
  await navigateToP2POrderbook(page);
  
  // Create an order with a short expiry
  const orderId = uuidv4();
  await createOrder(page, {
    side: 'sell',
    baseAssetType: 'bitcoin',
    baseAssetAmount: testData.bitcoin.amount,
    quoteAssetType: 'bitcoin',
    quoteAssetAmount: (parseFloat(testData.bitcoin.amount) * 1.05).toString(), // 5% markup
    expiry: 0.01, // 36 seconds
    orderId,
  });
  
  // Wait for the order to appear in the My Orders tab
  await page.click('button:has-text("My Orders")');
  await page.waitForSelector(`text=${orderId}`);
  
  // Wait for the order to expire
  await page.waitForSelector('text=Expired', { timeout: 60000 });
  
  // Create another order to cancel
  const orderId2 = uuidv4();
  await createOrder(page, {
    side: 'sell',
    baseAssetType: 'bitcoin',
    baseAssetAmount: testData.bitcoin.amount,
    quoteAssetType: 'bitcoin',
    quoteAssetAmount: (parseFloat(testData.bitcoin.amount) * 1.05).toString(), // 5% markup
    expiry: 24, // 24 hours
    orderId: orderId2,
  });
  
  // Wait for the order to appear in the My Orders tab
  await page.waitForSelector(`text=${orderId2}`);
  
  // Cancel the order
  const orderRow = page.locator(`tr:has-text("${orderId2}")`);
  await orderRow.locator('button:has-text("Cancel")').click();
  
  // Wait for the order to be cancelled
  await page.waitForSelector('text=Cancelled');
  
  // Close the browser context
  await context.close();
});