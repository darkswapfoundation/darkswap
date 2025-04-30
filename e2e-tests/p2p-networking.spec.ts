import { test, expect } from '@playwright/test';

test.describe('P2P Networking', () => {
  test('should display P2P networking demo page', async ({ page }) => {
    await page.goto('/p2p-demo');
    
    // Check if the title is displayed
    const title = await page.locator('h1:has-text("P2P Networking Demo")');
    await expect(title).toBeVisible();
  });
  
  test('should display peer ID', async ({ page }) => {
    await page.goto('/p2p-demo');
    
    // Wait for the peer ID to be generated
    await page.waitForSelector('.p2p-peer-id:not(:empty)');
    
    // Check if the peer ID is displayed
    const peerId = await page.locator('.p2p-peer-id');
    const peerIdText = await peerId.textContent();
    
    // The peer ID should not be empty
    expect(peerIdText).toBeTruthy();
    expect(peerIdText?.length).toBeGreaterThan(5);
  });
  
  test('should display connection status', async ({ page }) => {
    await page.goto('/p2p-demo');
    
    // Check if the connection status is displayed
    const connectionStatus = await page.locator('.p2p-connection-status');
    await expect(connectionStatus).toBeVisible();
  });
  
  test('should discover peers', async ({ page, context }) => {
    // Create two pages for peer discovery
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    // Navigate to the P2P demo page on both pages
    await page1.goto('/p2p-demo');
    await page2.goto('/p2p-demo');
    
    // Wait for the peer IDs to be generated
    await page1.waitForSelector('.p2p-peer-id:not(:empty)');
    await page2.waitForSelector('.p2p-peer-id:not(:empty)');
    
    // Get the peer IDs
    const peerId1 = await page1.locator('.p2p-peer-id').textContent();
    const peerId2 = await page2.locator('.p2p-peer-id').textContent();
    
    // Click the discover peers button on both pages
    await page1.click('.p2p-discover-button');
    await page2.click('.p2p-discover-button');
    
    // Wait for the peers to be discovered
    await page1.waitForSelector(`.p2p-discovered-peer:has-text("${peerId2}")`);
    await page2.waitForSelector(`.p2p-discovered-peer:has-text("${peerId1}")`);
    
    // Check if the discovered peers are displayed
    const discoveredPeer1 = await page1.locator(`.p2p-discovered-peer:has-text("${peerId2}")`);
    const discoveredPeer2 = await page2.locator(`.p2p-discovered-peer:has-text("${peerId1}")`);
    
    await expect(discoveredPeer1).toBeVisible();
    await expect(discoveredPeer2).toBeVisible();
    
    // Close the pages
    await page1.close();
    await page2.close();
  });
  
  test('should connect to discovered peers', async ({ page, context }) => {
    // Create two pages for peer connection
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    // Navigate to the P2P demo page on both pages
    await page1.goto('/p2p-demo');
    await page2.goto('/p2p-demo');
    
    // Wait for the peer IDs to be generated
    await page1.waitForSelector('.p2p-peer-id:not(:empty)');
    await page2.waitForSelector('.p2p-peer-id:not(:empty)');
    
    // Get the peer IDs
    const peerId1 = await page1.locator('.p2p-peer-id').textContent();
    const peerId2 = await page2.locator('.p2p-peer-id').textContent();
    
    // Click the discover peers button on both pages
    await page1.click('.p2p-discover-button');
    await page2.click('.p2p-discover-button');
    
    // Wait for the peers to be discovered
    await page1.waitForSelector(`.p2p-discovered-peer:has-text("${peerId2}")`);
    await page2.waitForSelector(`.p2p-discovered-peer:has-text("${peerId1}")`);
    
    // Click on the discovered peer to connect
    await page1.click(`.p2p-discovered-peer:has-text("${peerId2}")`);
    
    // Wait for the connection to be established
    await page1.waitForSelector('.p2p-connection-status:has-text("Connected")');
    await page2.waitForSelector('.p2p-connection-status:has-text("Connected")');
    
    // Check if the connection status is "Connected" on both pages
    const connectionStatus1 = await page1.locator('.p2p-connection-status');
    const connectionStatus2 = await page2.locator('.p2p-connection-status');
    
    await expect(connectionStatus1).toContainText('Connected');
    await expect(connectionStatus2).toContainText('Connected');
    
    // Close the pages
    await page1.close();
    await page2.close();
  });
  
  test('should broadcast messages', async ({ page, context }) => {
    // Create three pages for message broadcasting
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    const page3 = await context.newPage();
    
    // Navigate to the P2P demo page on all pages
    await page1.goto('/p2p-demo');
    await page2.goto('/p2p-demo');
    await page3.goto('/p2p-demo');
    
    // Wait for the peer IDs to be generated
    await page1.waitForSelector('.p2p-peer-id:not(:empty)');
    await page2.waitForSelector('.p2p-peer-id:not(:empty)');
    await page3.waitForSelector('.p2p-peer-id:not(:empty)');
    
    // Click the discover peers button on all pages
    await page1.click('.p2p-discover-button');
    await page2.click('.p2p-discover-button');
    await page3.click('.p2p-discover-button');
    
    // Wait for all peers to discover each other
    await page1.waitForSelector('.p2p-discovered-peers-count:has-text("2")');
    await page2.waitForSelector('.p2p-discovered-peers-count:has-text("2")');
    await page3.waitForSelector('.p2p-discovered-peers-count:has-text("2")');
    
    // Connect all peers to each other
    await page1.click('.p2p-connect-all-button');
    await page2.click('.p2p-connect-all-button');
    await page3.click('.p2p-connect-all-button');
    
    // Wait for all connections to be established
    await page1.waitForSelector('.p2p-connected-peers-count:has-text("2")');
    await page2.waitForSelector('.p2p-connected-peers-count:has-text("2")');
    await page3.waitForSelector('.p2p-connected-peers-count:has-text("2")');
    
    // Broadcast a message from page1
    const message = 'Hello from page1!';
    await page1.fill('.p2p-message-input', message);
    await page1.click('.p2p-broadcast-button');
    
    // Wait for the message to be received on page2 and page3
    await page2.waitForSelector(`.p2p-message:has-text("${message}")`);
    await page3.waitForSelector(`.p2p-message:has-text("${message}")`);
    
    // Check if the message is displayed on page2 and page3
    const receivedMessage2 = await page2.locator(`.p2p-message:has-text("${message}")`);
    const receivedMessage3 = await page3.locator(`.p2p-message:has-text("${message}")`);
    
    await expect(receivedMessage2).toBeVisible();
    await expect(receivedMessage3).toBeVisible();
    
    // Close the pages
    await page1.close();
    await page2.close();
    await page3.close();
  });
  
  test('should handle network partitions', async ({ page, context }) => {
    // Create three pages for network partition testing
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    const page3 = await context.newPage();
    
    // Navigate to the P2P demo page on all pages
    await page1.goto('/p2p-demo');
    await page2.goto('/p2p-demo');
    await page3.goto('/p2p-demo');
    
    // Wait for the peer IDs to be generated
    await page1.waitForSelector('.p2p-peer-id:not(:empty)');
    await page2.waitForSelector('.p2p-peer-id:not(:empty)');
    await page3.waitForSelector('.p2p-peer-id:not(:empty)');
    
    // Get the peer IDs
    const peerId1 = await page1.locator('.p2p-peer-id').textContent();
    const peerId2 = await page2.locator('.p2p-peer-id').textContent();
    const peerId3 = await page3.locator('.p2p-peer-id').textContent();
    
    // Click the discover peers button on all pages
    await page1.click('.p2p-discover-button');
    await page2.click('.p2p-discover-button');
    await page3.click('.p2p-discover-button');
    
    // Wait for all peers to discover each other
    await page1.waitForSelector('.p2p-discovered-peers-count:has-text("2")');
    await page2.waitForSelector('.p2p-discovered-peers-count:has-text("2")');
    await page3.waitForSelector('.p2p-discovered-peers-count:has-text("2")');
    
    // Connect all peers to each other
    await page1.click('.p2p-connect-all-button');
    await page2.click('.p2p-connect-all-button');
    await page3.click('.p2p-connect-all-button');
    
    // Wait for all connections to be established
    await page1.waitForSelector('.p2p-connected-peers-count:has-text("2")');
    await page2.waitForSelector('.p2p-connected-peers-count:has-text("2")');
    await page3.waitForSelector('.p2p-connected-peers-count:has-text("2")');
    
    // Disconnect page2 from the network
    await page2.click(`.p2p-disconnect-button:has-text("${peerId1}")`);
    await page2.click(`.p2p-disconnect-button:has-text("${peerId3}")`);
    
    // Wait for the connections to be closed on page2
    await page2.waitForSelector('.p2p-connected-peers-count:has-text("0")');
    
    // Broadcast a message from page1
    const message = 'Hello from page1!';
    await page1.fill('.p2p-message-input', message);
    await page1.click('.p2p-broadcast-button');
    
    // Wait for the message to be received on page3 but not on page2
    await page3.waitForSelector(`.p2p-message:has-text("${message}")`);
    
    // Check if the message is displayed on page3
    const receivedMessage3 = await page3.locator(`.p2p-message:has-text("${message}")`);
    await expect(receivedMessage3).toBeVisible();
    
    // Check if the message is not displayed on page2
    const receivedMessage2 = await page2.locator(`.p2p-message:has-text("${message}")`);
    await expect(receivedMessage2).not.toBeVisible();
    
    // Close the pages
    await page1.close();
    await page2.close();
    await page3.close();
  });
  
  test('should reconnect after disconnection', async ({ page, context }) => {
    // Create two pages for reconnection testing
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    // Navigate to the P2P demo page on both pages
    await page1.goto('/p2p-demo');
    await page2.goto('/p2p-demo');
    
    // Wait for the peer IDs to be generated
    await page1.waitForSelector('.p2p-peer-id:not(:empty)');
    await page2.waitForSelector('.p2p-peer-id:not(:empty)');
    
    // Get the peer IDs
    const peerId1 = await page1.locator('.p2p-peer-id').textContent();
    const peerId2 = await page2.locator('.p2p-peer-id').textContent();
    
    // Click the discover peers button on both pages
    await page1.click('.p2p-discover-button');
    await page2.click('.p2p-discover-button');
    
    // Wait for the peers to be discovered
    await page1.waitForSelector(`.p2p-discovered-peer:has-text("${peerId2}")`);
    await page2.waitForSelector(`.p2p-discovered-peer:has-text("${peerId1}")`);
    
    // Connect the peers
    await page1.click(`.p2p-discovered-peer:has-text("${peerId2}")`);
    
    // Wait for the connection to be established
    await page1.waitForSelector('.p2p-connection-status:has-text("Connected")');
    await page2.waitForSelector('.p2p-connection-status:has-text("Connected")');
    
    // Disconnect the peers
    await page1.click(`.p2p-disconnect-button:has-text("${peerId2}")`);
    
    // Wait for the connection to be closed
    await page1.waitForSelector('.p2p-connection-status:has-text("Disconnected")');
    await page2.waitForSelector('.p2p-connection-status:has-text("Disconnected")');
    
    // Reconnect the peers
    await page1.click(`.p2p-discovered-peer:has-text("${peerId2}")`);
    
    // Wait for the connection to be re-established
    await page1.waitForSelector('.p2p-connection-status:has-text("Connected")');
    await page2.waitForSelector('.p2p-connection-status:has-text("Connected")');
    
    // Check if the connection status is "Connected" on both pages
    const connectionStatus1 = await page1.locator('.p2p-connection-status');
    const connectionStatus2 = await page2.locator('.p2p-connection-status');
    
    await expect(connectionStatus1).toContainText('Connected');
    await expect(connectionStatus2).toContainText('Connected');
    
    // Close the pages
    await page1.close();
    await page2.close();
  });
  
  test('should handle large message payloads', async ({ page, context }) => {
    // Create two pages for large message testing
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    // Navigate to the P2P demo page on both pages
    await page1.goto('/p2p-demo');
    await page2.goto('/p2p-demo');
    
    // Wait for the peer IDs to be generated
    await page1.waitForSelector('.p2p-peer-id:not(:empty)');
    await page2.waitForSelector('.p2p-peer-id:not(:empty)');
    
    // Get the peer IDs
    const peerId1 = await page1.locator('.p2p-peer-id').textContent();
    const peerId2 = await page2.locator('.p2p-peer-id').textContent();
    
    // Click the discover peers button on both pages
    await page1.click('.p2p-discover-button');
    await page2.click('.p2p-discover-button');
    
    // Wait for the peers to be discovered
    await page1.waitForSelector(`.p2p-discovered-peer:has-text("${peerId2}")`);
    await page2.waitForSelector(`.p2p-discovered-peer:has-text("${peerId1}")`);
    
    // Connect the peers
    await page1.click(`.p2p-discovered-peer:has-text("${peerId2}")`);
    
    // Wait for the connection to be established
    await page1.waitForSelector('.p2p-connection-status:has-text("Connected")');
    await page2.waitForSelector('.p2p-connection-status:has-text("Connected")');
    
    // Generate a large message (100 KB)
    const largeMessage = await page1.evaluate(() => {
      const message = 'A'.repeat(100 * 1024); // 100 KB
      return message;
    });
    
    // Send the large message from page1 to page2
    await page1.fill('.p2p-message-input', largeMessage);
    await page1.click('.p2p-send-button');
    
    // Wait for the message to be received on page2
    await page2.waitForSelector('.p2p-message-received');
    
    // Check if the message size is displayed correctly on page2
    const messageSize = await page2.locator('.p2p-message-size');
    await expect(messageSize).toContainText('100 KB');
    
    // Close the pages
    await page1.close();
    await page2.close();
  });
  
  test('should handle peer churn', async ({ page, context }) => {
    // Create four pages for peer churn testing
    const pages = await Promise.all([
      context.newPage(),
      context.newPage(),
      context.newPage(),
      context.newPage(),
    ]);
    
    // Navigate to the P2P demo page on all pages
    await Promise.all(pages.map(page => page.goto('/p2p-demo')));
    
    // Wait for the peer IDs to be generated
    await Promise.all(pages.map(page => page.waitForSelector('.p2p-peer-id:not(:empty)')));
    
    // Click the discover peers button on all pages
    await Promise.all(pages.map(page => page.click('.p2p-discover-button')));
    
    // Wait for all peers to discover each other
    await Promise.all(pages.map(page => page.waitForSelector('.p2p-discovered-peers-count:has-text("3")')));
    
    // Connect all peers to each other
    await Promise.all(pages.map(page => page.click('.p2p-connect-all-button')));
    
    // Wait for all connections to be established
    await Promise.all(pages.map(page => page.waitForSelector('.p2p-connected-peers-count:has-text("3")')));
    
    // Close the third page to simulate a peer leaving the network
    await pages[2].close();
    
    // Wait for the remaining pages to update their connected peers count
    await Promise.all(pages.slice(0, 2).concat(pages.slice(3)).map(page => page.waitForSelector('.p2p-connected-peers-count:has-text("2")')));
    
    // Broadcast a message from the first page
    const message = 'Hello after peer churn!';
    await pages[0].fill('.p2p-message-input', message);
    await pages[0].click('.p2p-broadcast-button');
    
    // Wait for the message to be received on the remaining pages
    await Promise.all(pages.slice(1, 2).concat(pages.slice(3)).map(page => page.waitForSelector(`.p2p-message:has-text("${message}")`)));
    
    // Check if the message is displayed on the remaining pages
    for (const page of pages.slice(1, 2).concat(pages.slice(3))) {
      const receivedMessage = await page.locator(`.p2p-message:has-text("${message}")`);
      await expect(receivedMessage).toBeVisible();
    }
    
    // Close the remaining pages
    await Promise.all(pages.slice(0, 2).concat(pages.slice(3)).map(page => page.close()));
  });
});