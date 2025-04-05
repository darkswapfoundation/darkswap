/**
 * End-to-end tests for the trades functionality
 */

const { chromium } = require('playwright');
const assert = require('assert');

describe('Trades Page', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await chromium.launch({
      headless: process.env.CI === 'true',
    });
    const context = await browser.newContext();
    page = await context.newPage();

    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[placeholder="Enter username"]', 'admin');
    await page.fill('input[placeholder="Enter password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for navigation to complete
    await page.waitForURL('http://localhost:3000/');
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should navigate to trades page', async () => {
    await page.click('a[href="/trades"]');
    await page.waitForURL('http://localhost:3000/trades');
    
    const title = await page.textContent('h1');
    expect(title).toBe('Trades');
  });

  test('should display trades', async () => {
    // Create a trade first by taking an order
    await page.click('a[href="/orderbook"]');
    await page.waitForURL('http://localhost:3000/orderbook');
    
    // Create an order
    await page.selectOption('select#orderType', 'sell');
    await page.fill('input[placeholder="Enter asset to sell"]', 'RUNE');
    await page.fill('input[placeholder="Enter amount to sell"]', '1000');
    await page.fill('input[placeholder="Enter asset to buy"]', 'BTC');
    await page.fill('input[placeholder="Enter amount to buy"]', '0.01');
    await page.click('button:has-text("Create Order")');
    
    // Wait for order to be created
    await page.waitForSelector('.alert-success');
    
    // Take the order
    await page.click('table tbody tr:first-child button:has-text("Take")');
    
    // Wait for trade to be proposed
    await page.waitForSelector('.alert-success');
    
    // Navigate back to trades page
    await page.click('a[href="/trades"]');
    await page.waitForURL('http://localhost:3000/trades');
    
    // Wait for trades to load
    await page.waitForSelector('table tbody tr');
    
    // Check if there are any trades in the list
    const tradeCount = await page.$$eval('table tbody tr', rows => rows.length);
    expect(tradeCount).toBeGreaterThan(0);
  });

  test('should filter trades by status', async () => {
    // Get the total number of trades
    const totalTrades = await page.$$eval('table tbody tr', rows => rows.length);
    
    // Filter by proposed trades
    await page.click('button:has-text("Proposed")');
    
    // Wait for the filtered list to update
    await page.waitForTimeout(500);
    
    // Get the number of proposed trades
    const proposedTrades = await page.$$eval('table tbody tr', rows => rows.length);
    
    // Filter by all trades
    await page.click('button:has-text("All")');
    
    // Wait for the filtered list to update
    await page.waitForTimeout(500);
    
    // Check that the number of proposed trades is less than or equal to the total
    expect(proposedTrades).toBeLessThanOrEqual(totalTrades);
  });

  test('should accept a trade', async () => {
    // Filter by proposed trades
    await page.click('button:has-text("Proposed")');
    
    // Wait for the filtered list to update
    await page.waitForTimeout(500);
    
    // Check if there are any proposed trades
    const proposedTradeCount = await page.$$eval('table tbody tr', rows => rows.length);
    
    if (proposedTradeCount > 0) {
      // Click accept button on the first trade
      await page.click('table tbody tr:first-child button:has-text("Accept")');
      
      // Wait for success message
      await page.waitForSelector('.alert-success');
      
      const successMessage = await page.textContent('.alert-success');
      expect(successMessage).toContain('Trade accepted successfully');
      
      // Filter by accepted trades
      await page.click('button:has-text("Accepted")');
      
      // Wait for the filtered list to update
      await page.waitForTimeout(500);
      
      // Check if there are any accepted trades
      const acceptedTradeCount = await page.$$eval('table tbody tr', rows => rows.length);
      expect(acceptedTradeCount).toBeGreaterThan(0);
    } else {
      console.log('No proposed trades to accept');
    }
  });

  test('should execute a trade', async () => {
    // Filter by accepted trades
    await page.click('button:has-text("Accepted")');
    
    // Wait for the filtered list to update
    await page.waitForTimeout(500);
    
    // Check if there are any accepted trades
    const acceptedTradeCount = await page.$$eval('table tbody tr', rows => rows.length);
    
    if (acceptedTradeCount > 0) {
      // Click execute button on the first trade
      await page.click('table tbody tr:first-child button:has-text("Execute")');
      
      // Wait for success message
      await page.waitForSelector('.alert-success');
      
      const successMessage = await page.textContent('.alert-success');
      expect(successMessage).toContain('Trade executed successfully');
      
      // Filter by executing trades
      await page.click('button:has-text("Executing")');
      
      // Wait for the filtered list to update
      await page.waitForTimeout(500);
      
      // Check if there are any executing trades
      const executingTradeCount = await page.$$eval('table tbody tr', rows => rows.length);
      expect(executingTradeCount).toBeGreaterThan(0);
    } else {
      console.log('No accepted trades to execute');
    }
  });

  test('should confirm a trade', async () => {
    // Filter by executing trades
    await page.click('button:has-text("Executing")');
    
    // Wait for the filtered list to update
    await page.waitForTimeout(500);
    
    // Check if there are any executing trades
    const executingTradeCount = await page.$$eval('table tbody tr', rows => rows.length);
    
    if (executingTradeCount > 0) {
      // Click confirm button on the first trade
      await page.click('table tbody tr:first-child button:has-text("Confirm")');
      
      // Wait for success message
      await page.waitForSelector('.alert-success');
      
      const successMessage = await page.textContent('.alert-success');
      expect(successMessage).toContain('Trade confirmed successfully');
      
      // Filter by confirmed trades
      await page.click('button:has-text("Confirmed")');
      
      // Wait for the filtered list to update
      await page.waitForTimeout(500);
      
      // Check if there are any confirmed trades
      const confirmedTradeCount = await page.$$eval('table tbody tr', rows => rows.length);
      expect(confirmedTradeCount).toBeGreaterThan(0);
    } else {
      console.log('No executing trades to confirm');
    }
  });

  test('should view trade details', async () => {
    // Filter by all trades
    await page.click('button:has-text("All")');
    
    // Wait for the filtered list to update
    await page.waitForTimeout(500);
    
    // Click details button on the first trade
    await page.click('table tbody tr:first-child button:has-text("Details")');
    
    // Wait for details card to appear
    await page.waitForSelector('.card:nth-of-type(2)');
    
    // Check if details are displayed
    const detailsTitle = await page.textContent('.card:nth-of-type(2) .card-title');
    expect(detailsTitle).toBe('Trade Details');
    
    // Check if trade ID is displayed
    const tradeIdLabel = await page.textContent('.card:nth-of-type(2) p:first-child strong');
    expect(tradeIdLabel).toBe('ID:');
    
    // Close details
    await page.click('.card:nth-of-type(2) button:has-text("Close")');
    
    // Wait for details card to disappear
    await page.waitForTimeout(500);
    const detailsCardVisible = await page.isVisible('.card:nth-of-type(2)');
    expect(detailsCardVisible).toBe(false);
  });
});