import { test, expect } from '@playwright/test';

/**
 * End-to-end tests for the P2P network functionality
 */
test.describe('P2P Network', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the settings page where P2P network settings are located
    await page.goto('/settings');
    
    // Wait for the page to load
    await page.waitForSelector('.settings-page', { timeout: 10000 });
  });
  
  test('should display peer status', async ({ page }) => {
    // Check that the peer status component is displayed
    await expect(page.locator('.peer-status')).toBeVisible();
    
    // Check that the local peer ID is displayed
    await expect(page.locator('.local-peer-id')).toBeVisible();
    const peerId = await page.locator('.local-peer-id').textContent();
    expect(peerId).toBeTruthy();
    
    // Check that the connected peers section is displayed
    await expect(page.locator('.connected-peers')).toBeVisible();
  });
  
  test('should display WebSocket status', async ({ page }) => {
    // Check that the WebSocket status component is displayed
    await expect(page.locator('.websocket-status')).toBeVisible();
    
    // Check that the status is displayed
    const status = await page.locator('.websocket-status').getAttribute('data-status');
    expect(['connected', 'connecting', 'disconnected']).toContain(status);
  });
  
  test('should connect to relay server', async ({ page }) => {
    // Click the connect button if not already connected
    if (await page.locator('.websocket-status[data-status="disconnected"]').isVisible()) {
      await page.click('button:text("Connect")');
      
      // Wait for the connection to establish
      await page.waitForSelector('.websocket-status[data-status="connected"]', { timeout: 10000 });
    }
    
    // Check that the WebSocket status is connected
    await expect(page.locator('.websocket-status[data-status="connected"]')).toBeVisible();
    
    // Check that the connected text is displayed
    const statusText = await page.locator('.websocket-status-text').textContent();
    expect(statusText).toContain('Connected');
  });
  
  test('should disconnect from relay server', async ({ page }) => {
    // Ensure we're connected first
    if (await page.locator('.websocket-status[data-status="disconnected"]').isVisible()) {
      await page.click('button:text("Connect")');
      await page.waitForSelector('.websocket-status[data-status="connected"]', { timeout: 10000 });
    }
    
    // Click the disconnect button
    await page.click('button:text("Disconnect")');
    
    // Wait for the disconnection to complete
    await page.waitForSelector('.websocket-status[data-status="disconnected"]', { timeout: 10000 });
    
    // Check that the WebSocket status is disconnected
    await expect(page.locator('.websocket-status[data-status="disconnected"]')).toBeVisible();
    
    // Check that the disconnected text is displayed
    const statusText = await page.locator('.websocket-status-text').textContent();
    expect(statusText).toContain('Disconnected');
  });
  
  test('should copy peer ID to clipboard', async ({ page }) => {
    // Click the copy button
    await page.click('.copy-peer-id');
    
    // Check that the success notification is displayed
    await page.waitForSelector('.notification.success', { timeout: 10000 });
    
    // Check that the notification contains the expected text
    const notification = await page.locator('.notification.success').textContent();
    expect(notification).toContain('Peer ID copied to clipboard');
    
    // Note: We can't directly test clipboard content in Playwright without additional setup
  });
  
  test('should display connected peers', async ({ page }) => {
    // Ensure we're connected first
    if (await page.locator('.websocket-status[data-status="disconnected"]').isVisible()) {
      await page.click('button:text("Connect")');
      await page.waitForSelector('.websocket-status[data-status="connected"]', { timeout: 10000 });
    }
    
    // Wait for peers to connect (this might take some time in a real environment)
    // In a test environment, we might need to mock this
    await page.waitForTimeout(5000);
    
    // Check if there are any connected peers
    const peerCount = await page.locator('.connected-peer').count();
    
    // If there are connected peers, check their properties
    if (peerCount > 0) {
      // Check that the peer ID is displayed
      const peerId = await page.locator('.connected-peer').first().getAttribute('data-peer-id');
      expect(peerId).toBeTruthy();
      
      // Check that the connection type is displayed
      const connectionType = await page.locator('.connection-type').first().textContent();
      expect(['Direct', 'Relay']).toContain(connectionType);
    } else {
      // If no peers are connected, check that the no peers message is displayed
      const noPeersMessage = await page.locator('.no-peers-message').textContent();
      expect(noPeersMessage).toContain('No peers connected');
    }
  });
  
  test('should handle reconnection', async ({ page }) => {
    // Ensure we're disconnected first
    if (await page.locator('.websocket-status[data-status="connected"]').isVisible()) {
      await page.click('button:text("Disconnect")');
      await page.waitForSelector('.websocket-status[data-status="disconnected"]', { timeout: 10000 });
    }
    
    // Click the connect button
    await page.click('button:text("Connect")');
    
    // Check that the WebSocket status is connecting
    await expect(page.locator('.websocket-status[data-status="connecting"]')).toBeVisible();
    
    // Wait for the connection to establish
    await page.waitForSelector('.websocket-status[data-status="connected"]', { timeout: 10000 });
    
    // Check that the WebSocket status is connected
    await expect(page.locator('.websocket-status[data-status="connected"]')).toBeVisible();
  });
  
  test('should configure relay server', async ({ page }) => {
    // Navigate to the network settings section
    await page.click('button:text("Network Settings")');
    
    // Wait for the network settings form to appear
    await page.waitForSelector('.network-settings-form', { timeout: 10000 });
    
    // Check that the relay server input is displayed
    await expect(page.locator('input[name="relayServer"]')).toBeVisible();
    
    // Get the current relay server value
    const currentRelayServer = await page.inputValue('input[name="relayServer"]');
    
    // Change the relay server
    await page.fill('input[name="relayServer"]', 'wss://new-relay.example.com');
    
    // Save the settings
    await page.click('button:text("Save Settings")');
    
    // Check that the success notification is displayed
    await page.waitForSelector('.notification.success', { timeout: 10000 });
    
    // Check that the notification contains the expected text
    const notification = await page.locator('.notification.success').textContent();
    expect(notification).toContain('Settings saved');
    
    // Reload the page to check if the settings were persisted
    await page.reload();
    
    // Wait for the page to load
    await page.waitForSelector('.settings-page', { timeout: 10000 });
    
    // Navigate to the network settings section again
    await page.click('button:text("Network Settings")');
    
    // Wait for the network settings form to appear
    await page.waitForSelector('.network-settings-form', { timeout: 10000 });
    
    // Check that the relay server input has the new value
    const newRelayServer = await page.inputValue('input[name="relayServer"]');
    expect(newRelayServer).toBe('wss://new-relay.example.com');
    
    // Restore the original value for cleanup
    await page.fill('input[name="relayServer"]', currentRelayServer);
    await page.click('button:text("Save Settings")');
  });
});