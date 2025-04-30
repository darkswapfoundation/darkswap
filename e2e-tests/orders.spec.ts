import { test, expect } from '@playwright/test';

test.describe('Orders Page', () => {
  test('should display the title', async ({ page }) => {
    await page.goto('/orders');
    
    // Check if the title is displayed
    const title = await page.locator('h1:has-text("Orders")');
    await expect(title).toBeVisible();
  });
  
  test('should display wallet connection prompt when not connected', async ({ page }) => {
    await page.goto('/orders');
    
    // Check if the wallet connection prompt is displayed
    const walletPrompt = await page.locator('.wallet-connection-prompt');
    await expect(walletPrompt).toBeVisible();
    
    // Check if the wallet connection buttons are displayed
    const metaMaskButton = await page.locator('button:has-text("Connect MetaMask")');
    const walletConnectButton = await page.locator('button:has-text("Connect WalletConnect")');
    const ledgerButton = await page.locator('button:has-text("Connect Ledger")');
    const trezorButton = await page.locator('button:has-text("Connect Trezor")');
    
    await expect(metaMaskButton).toBeVisible();
    await expect(walletConnectButton).toBeVisible();
    await expect(ledgerButton).toBeVisible();
    await expect(trezorButton).toBeVisible();
  });
  
  test('should display orders when wallet is connected', async ({ page }) => {
    await page.goto('/orders');
    
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
    
    // Check if the orders are displayed
    const orders = await page.locator('.orders-list');
    await expect(orders).toBeVisible();
  });
  
  test('should display order tabs', async ({ page }) => {
    await page.goto('/orders');
    
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
    
    // Check if the order tabs are displayed
    const openOrdersTab = await page.locator('.orders-tab:has-text("Open Orders")');
    const completedOrdersTab = await page.locator('.orders-tab:has-text("Completed Orders")');
    const cancelledOrdersTab = await page.locator('.orders-tab:has-text("Cancelled Orders")');
    
    await expect(openOrdersTab).toBeVisible();
    await expect(completedOrdersTab).toBeVisible();
    await expect(cancelledOrdersTab).toBeVisible();
  });
  
  test('should switch between order tabs', async ({ page }) => {
    await page.goto('/orders');
    
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
    
    // Check if the open orders tab is active by default
    const openOrdersTab = await page.locator('.orders-tab:has-text("Open Orders")');
    await expect(openOrdersTab).toHaveClass(/active/);
    
    // Click on the completed orders tab
    const completedOrdersTab = await page.locator('.orders-tab:has-text("Completed Orders")');
    await completedOrdersTab.click();
    
    // Check if the completed orders tab is now active
    await expect(completedOrdersTab).toHaveClass(/active/);
    await expect(openOrdersTab).not.toHaveClass(/active/);
    
    // Click on the cancelled orders tab
    const cancelledOrdersTab = await page.locator('.orders-tab:has-text("Cancelled Orders")');
    await cancelledOrdersTab.click();
    
    // Check if the cancelled orders tab is now active
    await expect(cancelledOrdersTab).toHaveClass(/active/);
    await expect(completedOrdersTab).not.toHaveClass(/active/);
  });
  
  test('should display order details', async ({ page }) => {
    await page.goto('/orders');
    
    // Mock the wallet connection with orders
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
      
      // Mock orders data
      const mockData = [
        {
          id: '1',
          type: 'buy',
          status: 'open',
          baseAsset: 'BTC',
          quoteAsset: 'ETH',
          price: '10',
          amount: '1',
          total: '10',
          filled: '0',
          date: new Date().toISOString(),
        },
      ];
      window.mockOrdersData = mockData;
      
      // Mock the orders API
      const mockFetch = (url: string) => {
        if (url.includes('/api/orders')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(window.mockOrdersData || []),
          });
        }
        return Promise.reject(new Error('Not found'));
      };
      window.fetchMock = mockFetch;
      
      // Override fetch
      const originalFetch = window.fetch;
      window.originalFetch = originalFetch;
      window.fetch = ((url: string, options: any) => {
        if (typeof url === 'string' && window.fetchMock) {
          return window.fetchMock(url);
        }
        return originalFetch(url, options);
      }) as typeof fetch;
    });
    
    // Click on the MetaMask button
    await page.click('button:has-text("Connect MetaMask")');
    
    // Wait for the connection to be established
    await page.waitForSelector('text=Connected With');
    
    // Wait for the orders to load
    await page.waitForSelector('.order-item');
    
    // Click on an order
    await page.click('.order-item');
    
    // Check if the order details are displayed
    const orderDetails = await page.locator('.order-details');
    await expect(orderDetails).toBeVisible();
    
    // Check if the order details contain the expected information
    await expect(orderDetails).toContainText('BTC/ETH');
    await expect(orderDetails).toContainText('Buy');
    await expect(orderDetails).toContainText('10');
  });
  
  test('should cancel an open order', async ({ page }) => {
    await page.goto('/orders');
    
    // Mock the wallet connection with orders
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
      
      // Mock orders data
      const mockData = [
        {
          id: '1',
          type: 'buy',
          status: 'open',
          baseAsset: 'BTC',
          quoteAsset: 'ETH',
          price: '10',
          amount: '1',
          total: '10',
          filled: '0',
          date: new Date().toISOString(),
        },
      ];
      window.mockOrdersData = mockData;
      
      // Mock the orders API
      const mockFetch = (url: string, options: any) => {
        if (url.includes('/api/orders') && options?.method === 'DELETE') {
          // Update the order status to cancelled
          if (window.mockOrdersData && window.mockOrdersData.length > 0) {
            window.mockOrdersData[0].status = 'cancelled';
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          });
        }
        if (url.includes('/api/orders')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(window.mockOrdersData || []),
          });
        }
        return Promise.reject(new Error('Not found'));
      };
      window.fetchMock = mockFetch;
      
      // Override fetch
      const originalFetch = window.fetch;
      window.originalFetch = originalFetch;
      window.fetch = ((url: string, options: any) => {
        if (typeof url === 'string' && window.fetchMock) {
          return window.fetchMock(url, options);
        }
        return originalFetch(url, options);
      }) as typeof fetch;
    });
    
    // Click on the MetaMask button
    await page.click('button:has-text("Connect MetaMask")');
    
    // Wait for the connection to be established
    await page.waitForSelector('text=Connected With');
    
    // Wait for the orders to load
    await page.waitForSelector('.order-item');
    
    // Click on the cancel button
    await page.click('.order-cancel-button');
    
    // Confirm the cancellation
    await page.click('.order-cancel-confirm-button');
    
    // Check if the order is now in the cancelled orders tab
    await page.click('.orders-tab:has-text("Cancelled Orders")');
    
    // Wait for the cancelled orders to load
    await page.waitForSelector('.order-item');
    
    // Check if the cancelled order is displayed
    const cancelledOrder = await page.locator('.order-item');
    await expect(cancelledOrder).toBeVisible();
    await expect(cancelledOrder).toContainText('BTC/ETH');
  });
  
  test('should filter orders by trading pair', async ({ page }) => {
    await page.goto('/orders');
    
    // Mock the wallet connection with orders
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
      
      // Mock orders data
      const mockData = [
        {
          id: '1',
          type: 'buy',
          status: 'open',
          baseAsset: 'BTC',
          quoteAsset: 'ETH',
          price: '10',
          amount: '1',
          total: '10',
          filled: '0',
          date: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'sell',
          status: 'open',
          baseAsset: 'RUNE',
          quoteAsset: 'BTC',
          price: '0.001',
          amount: '100',
          total: '0.1',
          filled: '0',
          date: new Date().toISOString(),
        },
      ];
      window.mockOrdersData = mockData;
      
      // Mock the orders API
      const mockFetch = (url: string) => {
        if (url.includes('/api/orders')) {
          // Filter orders based on the query parameters
          const mockOrdersData = window.mockOrdersData || [];
          if (url.includes('baseAsset=BTC')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve([mockOrdersData[0]]),
            });
          }
          if (url.includes('baseAsset=RUNE')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve([mockOrdersData[1]]),
            });
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockOrdersData),
          });
        }
        return Promise.reject(new Error('Not found'));
      };
      window.fetchMock = mockFetch;
      
      // Override fetch
      const originalFetch = window.fetch;
      window.originalFetch = originalFetch;
      window.fetch = ((url: string, options: any) => {
        if (typeof url === 'string' && window.fetchMock) {
          return window.fetchMock(url);
        }
        return originalFetch(url, options);
      }) as typeof fetch;
    });
    
    // Click on the MetaMask button
    await page.click('button:has-text("Connect MetaMask")');
    
    // Wait for the connection to be established
    await page.waitForSelector('text=Connected With');
    
    // Wait for the orders to load
    await page.waitForSelector('.order-item');
    
    // Check if both orders are displayed
    const orderItems = await page.locator('.order-item').all();
    expect(orderItems.length).toBe(2);
    
    // Select the BTC/ETH filter
    await page.selectOption('.orders-filter-pair', 'BTC/ETH');
    
    // Check if only the BTC/ETH order is displayed
    const filteredOrderItems = await page.locator('.order-item').all();
    expect(filteredOrderItems.length).toBe(1);
    await expect(page.locator('.order-item')).toContainText('BTC/ETH');
    
    // Select the RUNE/BTC filter
    await page.selectOption('.orders-filter-pair', 'RUNE/BTC');
    
    // Check if only the RUNE/BTC order is displayed
    const filteredOrderItems2 = await page.locator('.order-item').all();
    expect(filteredOrderItems2.length).toBe(1);
    await expect(page.locator('.order-item')).toContainText('RUNE/BTC');
  });
});