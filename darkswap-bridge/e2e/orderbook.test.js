/**
 * End-to-end tests for the order book functionality
 */

const { chromium } = require('playwright');
const assert = require('assert');

describe('OrderBook Page', () => {
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

  test('should navigate to order book page', async () => {
    await page.click('a[href="/orderbook"]');
    await page.waitForURL('http://localhost:3000/orderbook');
    
    const title = await page.textContent('h1');
    expect(title).toBe('Order Book');
  });

  test('should create a buy order', async () => {
    // Select buy order type
    await page.selectOption('select#orderType', 'buy');
    
    // Fill in order details
    await page.fill('input[placeholder="Enter asset to sell"]', 'BTC');
    await page.fill('input[placeholder="Enter amount to sell"]', '0.01');
    await page.fill('input[placeholder="Enter asset to buy"]', 'RUNE');
    await page.fill('input[placeholder="Enter amount to buy"]', '1000');
    
    // Click create order button
    await page.click('button:has-text("Create Order")');
    
    // Wait for success message
    await page.waitForSelector('.alert-success');
    
    const successMessage = await page.textContent('.alert-success');
    expect(successMessage).toContain('Order created successfully');
  });

  test('should create a sell order', async () => {
    // Select sell order type
    await page.selectOption('select#orderType', 'sell');
    
    // Fill in order details
    await page.fill('input[placeholder="Enter asset to sell"]', 'RUNE');
    await page.fill('input[placeholder="Enter amount to sell"]', '1000');
    await page.fill('input[placeholder="Enter asset to buy"]', 'BTC');
    await page.fill('input[placeholder="Enter amount to buy"]', '0.01');
    
    // Click create order button
    await page.click('button:has-text("Create Order")');
    
    // Wait for success message
    await page.waitForSelector('.alert-success');
    
    const successMessage = await page.textContent('.alert-success');
    expect(successMessage).toContain('Order created successfully');
  });

  test('should display orders in the order book', async () => {
    // Wait for orders to load
    await page.waitForSelector('table tbody tr');
    
    // Check if there are any orders in the list
    const orderCount = await page.$$eval('table tbody tr', rows => rows.length);
    expect(orderCount).toBeGreaterThan(0);
  });

  test('should filter orders by type', async () => {
    // Get the total number of orders
    const totalOrders = await page.$$eval('table tbody tr', rows => rows.length);
    
    // Filter by buy orders
    await page.selectOption('select#filter', 'buy');
    
    // Wait for the filtered list to update
    await page.waitForTimeout(500);
    
    // Get the number of buy orders
    const buyOrders = await page.$$eval('table tbody tr', rows => rows.length);
    
    // Filter by sell orders
    await page.selectOption('select#filter', 'sell');
    
    // Wait for the filtered list to update
    await page.waitForTimeout(500);
    
    // Get the number of sell orders
    const sellOrders = await page.$$eval('table tbody tr', rows => rows.length);
    
    // Reset filter
    await page.selectOption('select#filter', 'all');
    
    // Check that the sum of buy and sell orders equals the total
    expect(buyOrders + sellOrders).toBe(totalOrders);
  });

  test('should sort orders by different criteria', async () => {
    // Sort by price ascending
    await page.selectOption('select#sortBy', 'price');
    await page.selectOption('select#sortOrder', 'asc');
    
    // Wait for the sorted list to update
    await page.waitForTimeout(500);
    
    // Get the prices
    const pricesAsc = await page.$$eval('table tbody tr td:nth-child(6)', cells => cells.map(cell => parseFloat(cell.textContent)));
    
    // Check that prices are in ascending order
    for (let i = 1; i < pricesAsc.length; i++) {
      expect(pricesAsc[i]).toBeGreaterThanOrEqual(pricesAsc[i - 1]);
    }
    
    // Sort by price descending
    await page.selectOption('select#sortOrder', 'desc');
    
    // Wait for the sorted list to update
    await page.waitForTimeout(500);
    
    // Get the prices
    const pricesDesc = await page.$$eval('table tbody tr td:nth-child(6)', cells => cells.map(cell => parseFloat(cell.textContent)));
    
    // Check that prices are in descending order
    for (let i = 1; i < pricesDesc.length; i++) {
      expect(pricesDesc[i]).toBeLessThanOrEqual(pricesDesc[i - 1]);
    }
  });

  test('should take an order', async () => {
    // Click take button on the first order
    await page.click('table tbody tr:first-child button:has-text("Take")');
    
    // Wait for success message
    await page.waitForSelector('.alert-success');
    
    const successMessage = await page.textContent('.alert-success');
    expect(successMessage).toContain('Trade proposed successfully');
  });

  test('should cancel an order', async () => {
    // Get the number of orders before cancelling
    const beforeCount = await page.$$eval('table tbody tr', rows => rows.length);
    
    // Click cancel button on the first order
    await page.click('table tbody tr:first-child button:has-text("Cancel")');
    
    // Wait for success message
    await page.waitForSelector('.alert-success');
    
    const successMessage = await page.textContent('.alert-success');
    expect(successMessage).toContain('Order cancelled successfully');
    
    // Check if the number of orders decreased
    const afterCount = await page.$$eval('table tbody tr', rows => rows.length);
    expect(afterCount).toBeLessThan(beforeCount);
  });
});