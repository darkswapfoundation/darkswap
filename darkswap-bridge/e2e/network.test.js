/**
 * End-to-end tests for the network functionality
 */

const { chromium } = require('playwright');
const assert = require('assert');

describe('Network Page', () => {
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

  test('should navigate to network page', async () => {
    await page.click('a[href="/network"]');
    await page.waitForURL('http://localhost:3000/network');
    
    const title = await page.textContent('h1');
    expect(title).toBe('Network');
  });

  test('should display network status', async () => {
    const statusText = await page.textContent('.network-status .status-indicator');
    expect(['connected', 'disconnected']).toContain(statusText.toLowerCase());
  });

  test('should connect to a peer', async () => {
    // Fill in peer address
    await page.fill('input[placeholder="Enter peer address (e.g., peer1.example.com:8333)"]', 'localhost:8333');
    
    // Click connect button
    await page.click('button:has-text("Connect")');
    
    // Wait for success message or peer to appear in the list
    try {
      await page.waitForSelector('.alert-success', { timeout: 5000 });
      const successMessage = await page.textContent('.alert-success');
      expect(successMessage).toContain('Connected to peer');
    } catch (e) {
      // If no success message, check if peer was added to the list
      const peerExists = await page.isVisible('text=localhost:8333');
      expect(peerExists).toBe(true);
    }
  });

  test('should display connected peers', async () => {
    // Wait for peer list to load
    await page.waitForSelector('table tbody');
    
    // Check if there are any peers in the list
    const peerCount = await page.$$eval('table tbody tr', rows => rows.length);
    expect(peerCount).toBeGreaterThan(0);
  });

  test('should disconnect from a peer', async () => {
    // Get the number of peers before disconnecting
    const beforeCount = await page.$$eval('table tbody tr', rows => rows.length);
    
    // Click disconnect button on the first peer
    await page.click('table tbody tr:first-child button:has-text("Disconnect")');
    
    // Wait for success message
    await page.waitForSelector('.alert-success');
    
    const successMessage = await page.textContent('.alert-success');
    expect(successMessage).toContain('Disconnected from peer');
    
    // Check if the number of peers decreased
    const afterCount = await page.$$eval('table tbody tr', rows => rows.length);
    expect(afterCount).toBeLessThan(beforeCount);
  });

  test('should send a message to a peer', async () => {
    // Make sure we have at least one peer
    await page.fill('input[placeholder="Enter peer address (e.g., peer1.example.com:8333)"]', 'localhost:8334');
    await page.click('button:has-text("Connect")');
    
    // Wait for peer to appear in the list
    await page.waitForSelector('table tbody tr');
    
    // Fill in peer address and message
    await page.fill('input[placeholder="Enter peer address"]', 'localhost:8334');
    await page.fill('input[placeholder="Enter message"]', 'Hello, peer!');
    
    // Click send button
    await page.click('button:has-text("Send to Peer")');
    
    // Wait for success message
    await page.waitForSelector('.alert-success');
    
    const successMessage = await page.textContent('.alert-success');
    expect(successMessage).toContain('Message sent to peer');
  });

  test('should broadcast a message to all peers', async () => {
    // Fill in message
    await page.fill('input[placeholder="Enter message"]', 'Hello, everyone!');
    
    // Click broadcast button
    await page.click('button:has-text("Broadcast to All Peers")');
    
    // Wait for success message
    await page.waitForSelector('.alert-success');
    
    const successMessage = await page.textContent('.alert-success');
    expect(successMessage).toContain('Message broadcast to all peers');
  });

  test('should display received messages', async () => {
    // This test assumes that the server is configured to send back a response message
    // when it receives a message from a client
    
    // Send a message to trigger a response
    await page.fill('input[placeholder="Enter peer address"]', 'localhost:8334');
    await page.fill('input[placeholder="Enter message"]', 'Please respond!');
    await page.click('button:has-text("Send to Peer")');
    
    // Wait for the response message to appear in the received messages list
    await page.waitForSelector('table:nth-of-type(2) tbody tr');
    
    // Check if there are any messages in the list
    const messageCount = await page.$$eval('table:nth-of-type(2) tbody tr', rows => rows.length);
    expect(messageCount).toBeGreaterThan(0);
    
    // Check if the message contains the expected content
    const messageText = await page.textContent('table:nth-of-type(2) tbody tr:first-child td:nth-child(2)');
    expect(messageText).toBeTruthy();
  });
});