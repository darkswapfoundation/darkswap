import { test, expect } from '@playwright/test';

test.describe('Vault Page', () => {
  test('should display the title', async ({ page }) => {
    await page.goto('/vault');
    
    // Check if the title is displayed
    const title = await page.locator('h1:has-text("Vault")');
    await expect(title).toBeVisible();
  });
  
  test('should display wallet connection options when not connected', async ({ page }) => {
    await page.goto('/vault');
    
    // Check if the wallet connection options are displayed
    const connectMessage = await page.locator('text=Connect your wallet to view your assets');
    await expect(connectMessage).toBeVisible();
    
    // Check if the wallet buttons are displayed
    const metaMaskButton = await page.locator('button:has-text("Connect MetaMask")');
    const walletConnectButton = await page.locator('button:has-text("Connect WalletConnect")');
    const ledgerButton = await page.locator('button:has-text("Connect Ledger")');
    const trezorButton = await page.locator('button:has-text("Connect Trezor")');
    
    await expect(metaMaskButton).toBeVisible();
    await expect(walletConnectButton).toBeVisible();
    await expect(ledgerButton).toBeVisible();
    await expect(trezorButton).toBeVisible();
  });
  
  test('should show empty state when no assets are available', async ({ page }) => {
    await page.goto('/vault');
    
    // Mock the wallet connection
    await page.evaluate(() => {
      // Mock the MetaMask provider
      window.ethereum = {
        isMetaMask: true,
        request: async (params: any) => {
          if (params.method === 'eth_requestAccounts') {
            return ['0x0000000000000000000000000000000000000000'];
          }
          if (params.method === 'eth_chainId') {
            return '0x1';
          }
          if (params.method === 'eth_getBalance') {
            return '0x0';
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
      };
      
      // Dispatch the event to notify the app that MetaMask is available
      window.dispatchEvent(new Event('ethereum#initialized'));
    });
    
    // Click on the MetaMask button
    await page.click('button:has-text("Connect MetaMask")');
    
    // Wait for the connection to be established
    await page.waitForSelector('text=Connected With');
    
    // Check if the empty state is displayed when no assets are available
    const emptyState = await page.locator('text=No assets found');
    await expect(emptyState).toBeVisible();
  });
  
  test('should display asset details when an asset is selected', async ({ page }) => {
    await page.goto('/vault');
    
    // Mock the wallet connection with assets
    await page.evaluate(() => {
      // Mock the MetaMask provider
      window.ethereum = {
        isMetaMask: true,
        request: async (params: any) => {
          if (params.method === 'eth_requestAccounts') {
            return ['0x0000000000000000000000000000000000000000'];
          }
          if (params.method === 'eth_chainId') {
            return '0x1';
          }
          if (params.method === 'eth_getBalance') {
            return '0x1000000000000000000'; // 1 ETH
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
      };
      
      // Dispatch the event to notify the app that MetaMask is available
      window.dispatchEvent(new Event('ethereum#initialized'));
    });
    
    // Click on the MetaMask button
    await page.click('button:has-text("Connect MetaMask")');
    
    // Wait for the connection to be established
    await page.waitForSelector('text=Connected With');
    
    // Wait for the assets to load
    await page.waitForSelector('.vault-asset');
    
    // Click on the first asset
    await page.click('.vault-asset:first-child');
    
    // Check if the asset details are displayed
    const assetDetails = await page.locator('.vault-details');
    await expect(assetDetails).toBeVisible();
    
    // Check if the asset actions are displayed
    const depositButton = await page.locator('button:has-text("Deposit")');
    const withdrawButton = await page.locator('button:has-text("Withdraw")');
    const tradeButton = await page.locator('button:has-text("Trade")');
    
    await expect(depositButton).toBeVisible();
    await expect(withdrawButton).toBeVisible();
    await expect(tradeButton).toBeVisible();
  });
  
  test('should display asset information', async ({ page }) => {
    await page.goto('/vault');
    
    // Mock the wallet connection with assets
    await page.evaluate(() => {
      // Mock the MetaMask provider
      window.ethereum = {
        isMetaMask: true,
        request: async (params: any) => {
          if (params.method === 'eth_requestAccounts') {
            return ['0x0000000000000000000000000000000000000000'];
          }
          if (params.method === 'eth_chainId') {
            return '0x1';
          }
          if (params.method === 'eth_getBalance') {
            return '0x1000000000000000000'; // 1 ETH
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
      };
      
      // Dispatch the event to notify the app that MetaMask is available
      window.dispatchEvent(new Event('ethereum#initialized'));
    });
    
    // Click on the MetaMask button
    await page.click('button:has-text("Connect MetaMask")');
    
    // Wait for the connection to be established
    await page.waitForSelector('text=Connected With');
    
    // Wait for the assets to load
    await page.waitForSelector('.vault-asset');
    
    // Click on the first asset
    await page.click('.vault-asset:first-child');
    
    // Check if the asset information is displayed
    const assetInfo = await page.locator('.vault-details-section:has-text("Asset Information")');
    await expect(assetInfo).toBeVisible();
    
    // Check if the asset information contains the expected fields
    const typeRow = await page.locator('.vault-details-row:has-text("Type")');
    const symbolRow = await page.locator('.vault-details-row:has-text("Symbol")');
    const balanceRow = await page.locator('.vault-details-row:has-text("Balance")');
    const valueRow = await page.locator('.vault-details-row:has-text("Value")');
    
    await expect(typeRow).toBeVisible();
    await expect(symbolRow).toBeVisible();
    await expect(balanceRow).toBeVisible();
    await expect(valueRow).toBeVisible();
  });
  
  test('should display recent transactions', async ({ page }) => {
    await page.goto('/vault');
    
    // Mock the wallet connection with assets
    await page.evaluate(() => {
      // Mock the MetaMask provider
      window.ethereum = {
        isMetaMask: true,
        request: async (params: any) => {
          if (params.method === 'eth_requestAccounts') {
            return ['0x0000000000000000000000000000000000000000'];
          }
          if (params.method === 'eth_chainId') {
            return '0x1';
          }
          if (params.method === 'eth_getBalance') {
            return '0x1000000000000000000'; // 1 ETH
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
      };
      
      // Dispatch the event to notify the app that MetaMask is available
      window.dispatchEvent(new Event('ethereum#initialized'));
    });
    
    // Click on the MetaMask button
    await page.click('button:has-text("Connect MetaMask")');
    
    // Wait for the connection to be established
    await page.waitForSelector('text=Connected With');
    
    // Wait for the assets to load
    await page.waitForSelector('.vault-asset');
    
    // Click on the first asset
    await page.click('.vault-asset:first-child');
    
    // Check if the recent transactions are displayed
    const transactionsSection = await page.locator('.vault-details-section:has-text("Recent Transactions")');
    await expect(transactionsSection).toBeVisible();
    
    // Check if the transactions contain the expected types
    const depositTransaction = await page.locator('.vault-transaction-type-deposit');
    const withdrawTransaction = await page.locator('.vault-transaction-type-withdraw');
    const tradeTransaction = await page.locator('.vault-transaction-type-trade');
    
    await expect(depositTransaction).toBeVisible();
    await expect(withdrawTransaction).toBeVisible();
    await expect(tradeTransaction).toBeVisible();
  });
});