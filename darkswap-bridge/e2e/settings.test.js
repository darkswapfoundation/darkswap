/**
 * End-to-end tests for the settings functionality
 */

const { chromium } = require('playwright');
const assert = require('assert');

describe('Settings Page', () => {
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

  test('should navigate to settings page', async () => {
    await page.click('a[href="/settings"]');
    await page.waitForURL('http://localhost:3000/settings');
    
    const title = await page.textContent('h1');
    expect(title).toBe('Settings');
  });

  test('should toggle theme', async () => {
    // Get the current theme
    const initialTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    
    // Toggle theme
    await page.click('#theme-switch');
    
    // Wait for theme to change
    await page.waitForTimeout(500);
    
    // Get the new theme
    const newTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    
    // Check that the theme changed
    expect(newTheme).not.toBe(initialTheme);
    expect(['light', 'dark']).toContain(newTheme);
  });

  test('should change log level', async () => {
    // Select a different log level
    await page.selectOption('select#logLevel', 'debug');
    
    // Save settings
    await page.click('button:has-text("Save Settings")');
    
    // Wait for success message
    await page.waitForSelector('.alert-success');
    
    const successMessage = await page.textContent('.alert-success');
    expect(successMessage).toContain('Settings saved successfully');
    
    // Check that the log level was saved
    const selectedLogLevel = await page.$eval('select#logLevel', select => select.value);
    expect(selectedLogLevel).toBe('debug');
  });

  test('should update path settings', async () => {
    // Update bridge path
    const newBridgePath = '../target/debug/darkswap-bridge';
    await page.fill('input#bridgePath', newBridgePath);
    
    // Save settings
    await page.click('button:has-text("Save Settings")');
    
    // Wait for success message
    await page.waitForSelector('.alert-success');
    
    const successMessage = await page.textContent('.alert-success');
    expect(successMessage).toContain('Settings saved successfully');
    
    // Check that the bridge path was saved
    const savedBridgePath = await page.$eval('input#bridgePath', input => input.value);
    expect(savedBridgePath).toBe(newBridgePath);
  });

  test('should toggle auto-start setting', async () => {
    // Get the current auto-start setting
    const initialAutoStart = await page.$eval('#auto-start-switch', input => input.checked);
    
    // Toggle auto-start
    await page.click('#auto-start-switch');
    
    // Save settings
    await page.click('button:has-text("Save Settings")');
    
    // Wait for success message
    await page.waitForSelector('.alert-success');
    
    const successMessage = await page.textContent('.alert-success');
    expect(successMessage).toContain('Settings saved successfully');
    
    // Check that the auto-start setting was toggled
    const newAutoStart = await page.$eval('#auto-start-switch', input => input.checked);
    expect(newAutoStart).not.toBe(initialAutoStart);
  });

  test('should toggle auto-connect setting', async () => {
    // Get the current auto-connect setting
    const initialAutoConnect = await page.$eval('#auto-connect-switch', input => input.checked);
    
    // Toggle auto-connect
    await page.click('#auto-connect-switch');
    
    // Save settings
    await page.click('button:has-text("Save Settings")');
    
    // Wait for success message
    await page.waitForSelector('.alert-success');
    
    const successMessage = await page.textContent('.alert-success');
    expect(successMessage).toContain('Settings saved successfully');
    
    // Check that the auto-connect setting was toggled
    const newAutoConnect = await page.$eval('#auto-connect-switch', input => input.checked);
    expect(newAutoConnect).not.toBe(initialAutoConnect);
  });

  test('should reset settings to default', async () => {
    // First, change some settings
    await page.fill('input#bridgePath', '/custom/path/darkswap-bridge');
    await page.fill('input#storageDir', '/custom/storage');
    
    // Reset settings
    await page.click('button:has-text("Reset to Default")');
    
    // Wait for success message
    await page.waitForSelector('.alert-success');
    
    const successMessage = await page.textContent('.alert-success');
    expect(successMessage).toContain('Settings reset to default values');
    
    // Check that settings were reset
    const bridgePath = await page.$eval('input#bridgePath', input => input.value);
    expect(bridgePath).toBe('../target/release/darkswap-bridge');
    
    const storageDir = await page.$eval('input#storageDir', input => input.value);
    expect(storageDir).toBe('./storage');
  });

  test('should restart bridge', async () => {
    // Click restart button
    await page.click('button:has-text("Restart Bridge")');
    
    // Wait for success message
    await page.waitForSelector('.alert-success');
    
    const successMessage = await page.textContent('.alert-success');
    expect(successMessage).toContain('Bridge restarted successfully');
  });
});