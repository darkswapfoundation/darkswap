import { test, expect } from '@playwright/test';

test.describe('Trade Page', () => {
  test('should display the title', async ({ page }) => {
    await page.goto('/trade');
    
    // Check if the title is displayed
    const title = await page.locator('h1:has-text("Trade")');
    await expect(title).toBeVisible();
  });
  
  test('should display trading pairs', async ({ page }) => {
    await page.goto('/trade');
    
    // Check if the trading pairs are displayed
    const tradingPairs = await page.locator('.trading-pairs');
    await expect(tradingPairs).toBeVisible();
    
    // Check if there are multiple trading pairs
    const pairs = await page.locator('.trading-pair').all();
    expect(pairs.length).toBeGreaterThanOrEqual(3);
  });
  
  test('should display order book', async ({ page }) => {
    await page.goto('/trade');
    
    // Check if the order book is displayed
    const orderBook = await page.locator('.order-book');
    await expect(orderBook).toBeVisible();
    
    // Check if the order book has buy and sell sections
    const buyOrders = await page.locator('.order-book-buys');
    const sellOrders = await page.locator('.order-book-sells');
    
    await expect(buyOrders).toBeVisible();
    await expect(sellOrders).toBeVisible();
  });
  
  test('should display price chart', async ({ page }) => {
    await page.goto('/trade');
    
    // Check if the price chart is displayed
    const priceChart = await page.locator('.price-chart');
    await expect(priceChart).toBeVisible();
  });
  
  test('should display trade form', async ({ page }) => {
    await page.goto('/trade');
    
    // Check if the trade form is displayed
    const tradeForm = await page.locator('.trade-form');
    await expect(tradeForm).toBeVisible();
    
    // Check if the trade form has buy and sell tabs
    const buyTab = await page.locator('.trade-form-tab:has-text("Buy")');
    const sellTab = await page.locator('.trade-form-tab:has-text("Sell")');
    
    await expect(buyTab).toBeVisible();
    await expect(sellTab).toBeVisible();
  });
  
  test('should switch between buy and sell tabs', async ({ page }) => {
    await page.goto('/trade');
    
    // Check if the buy tab is active by default
    const buyTab = await page.locator('.trade-form-tab:has-text("Buy")');
    await expect(buyTab).toHaveClass(/active/);
    
    // Click on the sell tab
    const sellTab = await page.locator('.trade-form-tab:has-text("Sell")');
    await sellTab.click();
    
    // Check if the sell tab is now active
    await expect(sellTab).toHaveClass(/active/);
    await expect(buyTab).not.toHaveClass(/active/);
  });
  
  test('should update price when clicking on order book entry', async ({ page }) => {
    await page.goto('/trade');
    
    // Get the initial price
    const priceInput = await page.locator('.trade-form-price input');
    const initialPrice = await priceInput.inputValue();
    
    // Click on an order in the order book
    const firstOrder = await page.locator('.order-book-entry').first();
    await firstOrder.click();
    
    // Check if the price has been updated
    const newPrice = await priceInput.inputValue();
    expect(newPrice).not.toBe(initialPrice);
  });
  
  test('should calculate total when entering amount', async ({ page }) => {
    await page.goto('/trade');
    
    // Set a price
    const priceInput = await page.locator('.trade-form-price input');
    await priceInput.fill('10000');
    
    // Set an amount
    const amountInput = await page.locator('.trade-form-amount input');
    await amountInput.fill('2');
    
    // Check if the total is calculated correctly
    const totalValue = await page.locator('.trade-form-total-value');
    await expect(totalValue).toHaveText('20000');
  });
  
  test('should display error when amount exceeds balance', async ({ page }) => {
    await page.goto('/trade');
    
    // Set a price
    const priceInput = await page.locator('.trade-form-price input');
    await priceInput.fill('10000');
    
    // Set an amount that exceeds balance
    const amountInput = await page.locator('.trade-form-amount input');
    await amountInput.fill('999999');
    
    // Click the buy button
    const buyButton = await page.locator('.trade-form-submit-button');
    await buyButton.click();
    
    // Check if an error message is displayed
    const errorMessage = await page.locator('.trade-form-error');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('exceeds');
  });
  
  test('should navigate to specific trading pair', async ({ page }) => {
    // Navigate to a specific trading pair
    await page.goto('/trade/BTC/ETH');
    
    // Check if the correct trading pair is selected
    const selectedPair = await page.locator('.trading-pair-selected');
    await expect(selectedPair).toContainText('BTC/ETH');
    
    // Check if the trade form reflects the correct pair
    const baseAsset = await page.locator('.trade-form-base-asset');
    const quoteAsset = await page.locator('.trade-form-quote-asset');
    
    await expect(baseAsset).toContainText('BTC');
    await expect(quoteAsset).toContainText('ETH');
  });
  
  test('should update URL when changing trading pair', async ({ page }) => {
    await page.goto('/trade');
    
    // Click on a different trading pair
    const tradingPair = await page.locator('.trading-pair:has-text("RUNE/BTC")');
    await tradingPair.click();
    
    // Check if the URL has been updated
    await expect(page).toHaveURL(/\/trade\/RUNE\/BTC/);
  });
  
  test('should display recent trades', async ({ page }) => {
    await page.goto('/trade');
    
    // Check if the recent trades section is displayed
    const recentTrades = await page.locator('.recent-trades');
    await expect(recentTrades).toBeVisible();
    
    // Check if there are multiple recent trades
    const trades = await page.locator('.recent-trade').all();
    expect(trades.length).toBeGreaterThanOrEqual(1);
  });
  
  test('should display wallet connection prompt when trying to trade without wallet', async ({ page }) => {
    await page.goto('/trade');
    
    // Click the buy button
    const buyButton = await page.locator('.trade-form-submit-button');
    await buyButton.click();
    
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
  
  test('should display trade history when wallet is connected', async ({ page }) => {
    await page.goto('/trade');
    
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
    
    // Check if the trade history is displayed
    const tradeHistory = await page.locator('.trade-history');
    await expect(tradeHistory).toBeVisible();
  });
});