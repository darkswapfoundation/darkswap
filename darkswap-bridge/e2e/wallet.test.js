/**
 * End-to-end tests for the wallet functionality
 */

const { chromium } = require('playwright');
const assert = require('assert');

describe('Wallet Page', () => {
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

  test('should navigate to wallet page', async () => {
    await page.click('a[href="/wallet"]');
    await page.waitForURL('http://localhost:3000/wallet');
    
    const title = await page.textContent('h1');
    expect(title).toBe('Wallet');
  });

  test('should display wallet status', async () => {
    const statusText = await page.textContent('.wallet-status .status-indicator');
    expect(['connected', 'disconnected']).toContain(statusText.toLowerCase());
  });

  test('should create a new wallet', async () => {
    // Click on "Create new wallet" if not already in create mode
    const createLink = await page.$('text=Create new wallet');
    if (createLink) {
      await createLink.click();
    }

    // Fill in wallet details
    await page.fill('input[placeholder="Enter wallet name"]', 'test_wallet');
    await page.fill('input[placeholder="Enter passphrase"]', 'password123');
    
    // Click create button
    await page.click('button:has-text("Create")');
    
    // Wait for success message
    await page.waitForSelector('.alert-success');
    
    const successMessage = await page.textContent('.alert-success');
    expect(successMessage).toContain('created successfully');
  });

  test('should open an existing wallet', async () => {
    // Click on "Open existing wallet" if not already in open mode
    const openLink = await page.$('text=Open existing wallet');
    if (openLink) {
      await openLink.click();
    }

    // Fill in wallet details
    await page.fill('input[placeholder="Enter wallet name"]', 'test_wallet');
    await page.fill('input[placeholder="Enter passphrase"]', 'password123');
    
    // Click open button
    await page.click('button:has-text("Open")');
    
    // Wait for success message
    await page.waitForSelector('.alert-success');
    
    const successMessage = await page.textContent('.alert-success');
    expect(successMessage).toContain('opened successfully');
  });

  test('should display wallet balance', async () => {
    // Wait for balance to load
    await page.waitForSelector('.balance-value');
    
    const confirmedBalance = await page.textContent('.balance-item:nth-child(1) .balance-value');
    const unconfirmedBalance = await page.textContent('.balance-item:nth-child(2) .balance-value');
    
    expect(confirmedBalance).toMatch(/\d+ sats/);
    expect(unconfirmedBalance).toMatch(/\d+ sats/);
  });

  test('should create a new address', async () => {
    await page.click('button:has-text("Create New Address")');
    
    // Wait for success message
    await page.waitForSelector('.alert-success');
    
    const successMessage = await page.textContent('.alert-success');
    expect(successMessage).toContain('New address created');
    
    // Check if address is added to the list
    await page.waitForSelector('.address-item');
    
    const addressCount = await page.$$eval('.address-item', items => items.length);
    expect(addressCount).toBeGreaterThan(0);
  });

  test('should send a transaction', async () => {
    // Fill in transaction details
    await page.fill('input[placeholder="Enter recipient address"]', 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq');
    await page.fill('input[placeholder="Enter amount"]', '1000');
    await page.fill('input[placeholder="Enter fee rate"]', '1');
    
    // Click send button
    await page.click('button:has-text("Send")');
    
    // Wait for success message
    await page.waitForSelector('.alert-success');
    
    const successMessage = await page.textContent('.alert-success');
    expect(successMessage).toContain('Transaction sent successfully');
    
    // Check if transaction is added to the list
    await page.waitForSelector('table tbody tr');
    
    const transactionCount = await page.$$eval('table tbody tr', items => items.length);
    expect(transactionCount).toBeGreaterThan(0);
  });
});