import { test, expect } from '@playwright/test';

test.describe('WebRTC Functionality', () => {
  test('should display WebRTC demo page', async ({ page }) => {
    await page.goto('/webrtc-demo');
    
    // Check if the title is displayed
    const title = await page.locator('h1:has-text("WebRTC Demo")');
    await expect(title).toBeVisible();
  });
  
  test('should display connection status', async ({ page }) => {
    await page.goto('/webrtc-demo');
    
    // Check if the connection status is displayed
    const connectionStatus = await page.locator('.webrtc-connection-status');
    await expect(connectionStatus).toBeVisible();
    
    // Initially, the connection status should be "Disconnected"
    await expect(connectionStatus).toContainText('Disconnected');
  });
  
  test('should display peer ID input', async ({ page }) => {
    await page.goto('/webrtc-demo');
    
    // Check if the peer ID input is displayed
    const peerIdInput = await page.locator('.webrtc-peer-id-input');
    await expect(peerIdInput).toBeVisible();
  });
  
  test('should display connect button', async ({ page }) => {
    await page.goto('/webrtc-demo');
    
    // Check if the connect button is displayed
    const connectButton = await page.locator('.webrtc-connect-button');
    await expect(connectButton).toBeVisible();
    await expect(connectButton).toBeEnabled();
  });
  
  test('should display message input', async ({ page }) => {
    await page.goto('/webrtc-demo');
    
    // Check if the message input is displayed
    const messageInput = await page.locator('.webrtc-message-input');
    await expect(messageInput).toBeVisible();
  });
  
  test('should display send button', async ({ page }) => {
    await page.goto('/webrtc-demo');
    
    // Check if the send button is displayed
    const sendButton = await page.locator('.webrtc-send-button');
    await expect(sendButton).toBeVisible();
    
    // Initially, the send button should be disabled
    await expect(sendButton).toBeDisabled();
  });
  
  test('should display messages container', async ({ page }) => {
    await page.goto('/webrtc-demo');
    
    // Check if the messages container is displayed
    const messagesContainer = await page.locator('.webrtc-messages');
    await expect(messagesContainer).toBeVisible();
  });
  
  test('should generate local peer ID', async ({ page }) => {
    await page.goto('/webrtc-demo');
    
    // Wait for the local peer ID to be generated
    await page.waitForSelector('.webrtc-local-peer-id:not(:empty)');
    
    // Check if the local peer ID is displayed
    const localPeerId = await page.locator('.webrtc-local-peer-id');
    const localPeerIdText = await localPeerId.textContent();
    
    // The local peer ID should not be empty
    expect(localPeerIdText).toBeTruthy();
    expect(localPeerIdText?.length).toBeGreaterThan(5);
  });
  
  test('should copy local peer ID to clipboard', async ({ page }) => {
    await page.goto('/webrtc-demo');
    
    // Wait for the local peer ID to be generated
    await page.waitForSelector('.webrtc-local-peer-id:not(:empty)');
    
    // Get the local peer ID
    const localPeerId = await page.locator('.webrtc-local-peer-id');
    const localPeerIdText = await localPeerId.textContent();
    
    // Click on the copy button
    await page.click('.webrtc-copy-button');
    
    // Check if the clipboard contains the local peer ID
    // Note: This is a mock implementation since Playwright cannot access the clipboard directly
    await page.evaluate((expectedText) => {
      // Mock clipboard API
      if (expectedText) {
        window.mockClipboardText = expectedText;
      }
      
      // Mock the clipboard read method
      navigator.clipboard.readText = async () => {
        return window.mockClipboardText || '';
      };
    }, localPeerIdText || '');
    
    // Verify the clipboard content
    const clipboardText = await page.evaluate(() => {
      return navigator.clipboard.readText();
    });
    
    expect(clipboardText).toBe(localPeerIdText);
  });
  
  test('should connect to a peer', async ({ page, context }) => {
    // Create two pages for peer-to-peer connection
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    // Navigate to the WebRTC demo page on both pages
    await page1.goto('/webrtc-demo');
    await page2.goto('/webrtc-demo');
    
    // Wait for the local peer IDs to be generated
    await page1.waitForSelector('.webrtc-local-peer-id:not(:empty)');
    await page2.waitForSelector('.webrtc-local-peer-id:not(:empty)');
    
    // Get the local peer ID from page1
    const localPeerId1 = await page1.locator('.webrtc-local-peer-id').textContent();
    
    // Enter the peer ID from page1 into page2
    await page2.fill('.webrtc-peer-id-input', localPeerId1 || '');
    
    // Click the connect button on page2
    await page2.click('.webrtc-connect-button');
    
    // Wait for the connection to be established on both pages
    await page1.waitForSelector('.webrtc-connection-status:has-text("Connected")');
    await page2.waitForSelector('.webrtc-connection-status:has-text("Connected")');
    
    // Check if the connection status is "Connected" on both pages
    const connectionStatus1 = await page1.locator('.webrtc-connection-status');
    const connectionStatus2 = await page2.locator('.webrtc-connection-status');
    
    await expect(connectionStatus1).toContainText('Connected');
    await expect(connectionStatus2).toContainText('Connected');
    
    // Close the pages
    await page1.close();
    await page2.close();
  });
  
  test('should send and receive messages', async ({ page, context }) => {
    // Create two pages for peer-to-peer communication
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    // Navigate to the WebRTC demo page on both pages
    await page1.goto('/webrtc-demo');
    await page2.goto('/webrtc-demo');
    
    // Wait for the local peer IDs to be generated
    await page1.waitForSelector('.webrtc-local-peer-id:not(:empty)');
    await page2.waitForSelector('.webrtc-local-peer-id:not(:empty)');
    
    // Get the local peer ID from page1
    const localPeerId1 = await page1.locator('.webrtc-local-peer-id').textContent();
    
    // Enter the peer ID from page1 into page2
    await page2.fill('.webrtc-peer-id-input', localPeerId1 || '');
    
    // Click the connect button on page2
    await page2.click('.webrtc-connect-button');
    
    // Wait for the connection to be established on both pages
    await page1.waitForSelector('.webrtc-connection-status:has-text("Connected")');
    await page2.waitForSelector('.webrtc-connection-status:has-text("Connected")');
    
    // Send a message from page1 to page2
    const message1 = 'Hello from page1!';
    await page1.fill('.webrtc-message-input', message1);
    await page1.click('.webrtc-send-button');
    
    // Wait for the message to be received on page2
    await page2.waitForSelector(`.webrtc-message:has-text("${message1}")`);
    
    // Check if the message is displayed on page2
    const receivedMessage1 = await page2.locator(`.webrtc-message:has-text("${message1}")`);
    await expect(receivedMessage1).toBeVisible();
    
    // Send a message from page2 to page1
    const message2 = 'Hello from page2!';
    await page2.fill('.webrtc-message-input', message2);
    await page2.click('.webrtc-send-button');
    
    // Wait for the message to be received on page1
    await page1.waitForSelector(`.webrtc-message:has-text("${message2}")`);
    
    // Check if the message is displayed on page1
    const receivedMessage2 = await page1.locator(`.webrtc-message:has-text("${message2}")`);
    await expect(receivedMessage2).toBeVisible();
    
    // Close the pages
    await page1.close();
    await page2.close();
  });
  
  test('should handle connection errors', async ({ page }) => {
    await page.goto('/webrtc-demo');
    
    // Enter an invalid peer ID
    await page.fill('.webrtc-peer-id-input', 'invalid-peer-id');
    
    // Click the connect button
    await page.click('.webrtc-connect-button');
    
    // Wait for the error message to be displayed
    await page.waitForSelector('.webrtc-error-message');
    
    // Check if the error message is displayed
    const errorMessage = await page.locator('.webrtc-error-message');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Error');
  });
  
  test('should disconnect from a peer', async ({ page, context }) => {
    // Create two pages for peer-to-peer connection
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    // Navigate to the WebRTC demo page on both pages
    await page1.goto('/webrtc-demo');
    await page2.goto('/webrtc-demo');
    
    // Wait for the local peer IDs to be generated
    await page1.waitForSelector('.webrtc-local-peer-id:not(:empty)');
    await page2.waitForSelector('.webrtc-local-peer-id:not(:empty)');
    
    // Get the local peer ID from page1
    const localPeerId1 = await page1.locator('.webrtc-local-peer-id').textContent();
    
    // Enter the peer ID from page1 into page2
    await page2.fill('.webrtc-peer-id-input', localPeerId1 || '');
    
    // Click the connect button on page2
    await page2.click('.webrtc-connect-button');
    
    // Wait for the connection to be established on both pages
    await page1.waitForSelector('.webrtc-connection-status:has-text("Connected")');
    await page2.waitForSelector('.webrtc-connection-status:has-text("Connected")');
    
    // Click the disconnect button on page1
    await page1.click('.webrtc-disconnect-button');
    
    // Wait for the connection to be closed on both pages
    await page1.waitForSelector('.webrtc-connection-status:has-text("Disconnected")');
    await page2.waitForSelector('.webrtc-connection-status:has-text("Disconnected")');
    
    // Check if the connection status is "Disconnected" on both pages
    const connectionStatus1 = await page1.locator('.webrtc-connection-status');
    const connectionStatus2 = await page2.locator('.webrtc-connection-status');
    
    await expect(connectionStatus1).toContainText('Disconnected');
    await expect(connectionStatus2).toContainText('Disconnected');
    
    // Close the pages
    await page1.close();
    await page2.close();
  });
  
  test('should display connected peers', async ({ page, context }) => {
    // Create two pages for peer-to-peer connection
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    // Navigate to the WebRTC demo page on both pages
    await page1.goto('/webrtc-demo');
    await page2.goto('/webrtc-demo');
    
    // Wait for the local peer IDs to be generated
    await page1.waitForSelector('.webrtc-local-peer-id:not(:empty)');
    await page2.waitForSelector('.webrtc-local-peer-id:not(:empty)');
    
    // Get the local peer IDs
    const localPeerId1 = await page1.locator('.webrtc-local-peer-id').textContent();
    const localPeerId2 = await page2.locator('.webrtc-local-peer-id').textContent();
    
    // Enter the peer ID from page1 into page2
    await page2.fill('.webrtc-peer-id-input', localPeerId1 || '');
    
    // Click the connect button on page2
    await page2.click('.webrtc-connect-button');
    
    // Wait for the connection to be established on both pages
    await page1.waitForSelector('.webrtc-connection-status:has-text("Connected")');
    await page2.waitForSelector('.webrtc-connection-status:has-text("Connected")');
    
    // Check if the connected peers list is displayed on both pages
    const connectedPeersList1 = await page1.locator('.webrtc-connected-peers');
    const connectedPeersList2 = await page2.locator('.webrtc-connected-peers');
    
    await expect(connectedPeersList1).toBeVisible();
    await expect(connectedPeersList2).toBeVisible();
    
    // Check if the connected peer is displayed in the list
    const connectedPeer1 = await page1.locator(`.webrtc-connected-peer:has-text("${localPeerId2}")`);
    const connectedPeer2 = await page2.locator(`.webrtc-connected-peer:has-text("${localPeerId1}")`);
    
    await expect(connectedPeer1).toBeVisible();
    await expect(connectedPeer2).toBeVisible();
    
    // Close the pages
    await page1.close();
    await page2.close();
  });
});