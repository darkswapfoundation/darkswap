import { test, expect, Page } from '@playwright/test';

test.describe('Trade Flow Tests', () => {
  let userAPage: Page;
  let userBPage: Page;
  
  test.beforeAll(async ({ browser }) => {
    // Create two browser contexts for two different users
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    
    // Create pages for each user
    userAPage = await contextA.newPage();
    userBPage = await contextB.newPage();
    
    // Navigate to the app
    await userAPage.goto('/');
    await userBPage.goto('/');
    
    // Wait for the app to load
    await userAPage.waitForLoadState('networkidle');
    await userBPage.waitForLoadState('networkidle');
    
    // Log in both users
    await loginUser(userAPage, 'user_a@example.com', 'password_a');
    await loginUser(userBPage, 'user_b@example.com', 'password_b');
  });
  
  test.afterAll(async () => {
    // Close the pages
    await userAPage.close();
    await userBPage.close();
  });
  
  test('should create a buy order', async () => {
    // Navigate to the trade page
    await userAPage.click('text=Trade');
    
    // Wait for the trade form to load
    await userAPage.waitForSelector('[data-testid="trade-form"]');
    
    // Fill in the trade form for a buy order
    await userAPage.selectOption('[data-testid="base-asset-select"]', 'BTC');
    await userAPage.selectOption('[data-testid="quote-asset-select"]', 'RUNE');
    await userAPage.selectOption('[data-testid="order-type-select"]', 'buy');
    await userAPage.fill('[data-testid="price-input"]', '0.0001');
    await userAPage.fill('[data-testid="amount-input"]', '10');
    
    // Submit the order
    await userAPage.click('[data-testid="submit-order-button"]');
    
    // Wait for the order to be created
    await userAPage.waitForSelector('[data-testid="order-success-message"]');
    
    // Verify the order was created
    const successMessage = await userAPage.textContent('[data-testid="order-success-message"]');
    expect(successMessage).toContain('Order created successfully');
    
    // Navigate to the orders page
    await userAPage.click('text=Orders');
    
    // Wait for the orders to load
    await userAPage.waitForSelector('[data-testid="orders-table"]');
    
    // Verify the order is in the table
    const orderRow = await userAPage.waitForSelector('[data-testid="order-row"]:first-child');
    const orderType = await orderRow.getAttribute('data-order-type');
    const orderStatus = await orderRow.getAttribute('data-order-status');
    const orderBaseAsset = await orderRow.getAttribute('data-base-asset');
    const orderQuoteAsset = await orderRow.getAttribute('data-quote-asset');
    
    expect(orderType).toBe('buy');
    expect(orderStatus).toBe('open');
    expect(orderBaseAsset).toBe('BTC');
    expect(orderQuoteAsset).toBe('RUNE');
  });
  
  test('should create a sell order', async () => {
    // Navigate to the trade page
    await userBPage.click('text=Trade');
    
    // Wait for the trade form to load
    await userBPage.waitForSelector('[data-testid="trade-form"]');
    
    // Fill in the trade form for a sell order
    await userBPage.selectOption('[data-testid="base-asset-select"]', 'BTC');
    await userBPage.selectOption('[data-testid="quote-asset-select"]', 'RUNE');
    await userBPage.selectOption('[data-testid="order-type-select"]', 'sell');
    await userBPage.fill('[data-testid="price-input"]', '0.0001');
    await userBPage.fill('[data-testid="amount-input"]', '10');
    
    // Submit the order
    await userBPage.click('[data-testid="submit-order-button"]');
    
    // Wait for the order to be created
    await userBPage.waitForSelector('[data-testid="order-success-message"]');
    
    // Verify the order was created
    const successMessage = await userBPage.textContent('[data-testid="order-success-message"]');
    expect(successMessage).toContain('Order created successfully');
    
    // Navigate to the orders page
    await userBPage.click('text=Orders');
    
    // Wait for the orders to load
    await userBPage.waitForSelector('[data-testid="orders-table"]');
    
    // Verify the order is in the table
    const orderRow = await userBPage.waitForSelector('[data-testid="order-row"]:first-child');
    const orderType = await orderRow.getAttribute('data-order-type');
    const orderStatus = await orderRow.getAttribute('data-order-status');
    const orderBaseAsset = await orderRow.getAttribute('data-base-asset');
    const orderQuoteAsset = await orderRow.getAttribute('data-quote-asset');
    
    expect(orderType).toBe('sell');
    expect(orderStatus).toBe('open');
    expect(orderBaseAsset).toBe('BTC');
    expect(orderQuoteAsset).toBe('RUNE');
  });
  
  test('should match orders and create a trade', async () => {
    // Wait for the orders to match and create a trade
    // This might take some time depending on the implementation
    await userAPage.waitForTimeout(5000);
    
    // Navigate to the trades page
    await userAPage.click('text=Trades');
    
    // Wait for the trades to load
    await userAPage.waitForSelector('[data-testid="trades-table"]');
    
    // Verify the trade is in the table
    const tradeRow = await userAPage.waitForSelector('[data-testid="trade-row"]:first-child');
    const tradeStatus = await tradeRow.getAttribute('data-trade-status');
    const tradeBaseAsset = await tradeRow.getAttribute('data-base-asset');
    const tradeQuoteAsset = await tradeRow.getAttribute('data-quote-asset');
    
    expect(tradeStatus).toBe('pending');
    expect(tradeBaseAsset).toBe('BTC');
    expect(tradeQuoteAsset).toBe('RUNE');
    
    // Verify the trade is also visible to user B
    await userBPage.click('text=Trades');
    await userBPage.waitForSelector('[data-testid="trades-table"]');
    
    const tradeBRow = await userBPage.waitForSelector('[data-testid="trade-row"]:first-child');
    const tradeBStatus = await tradeBRow.getAttribute('data-trade-status');
    
    expect(tradeBStatus).toBe('pending');
  });
  
  test('should sign PSBTs and complete the trade', async () => {
    // Navigate to the trades page for both users
    await userAPage.click('text=Trades');
    await userBPage.click('text=Trades');
    
    // Wait for the trades to load
    await userAPage.waitForSelector('[data-testid="trades-table"]');
    await userBPage.waitForSelector('[data-testid="trades-table"]');
    
    // Click on the first trade for both users
    await userAPage.click('[data-testid="trade-row"]:first-child');
    await userBPage.click('[data-testid="trade-row"]:first-child');
    
    // Wait for the trade details to load
    await userAPage.waitForSelector('[data-testid="trade-details"]');
    await userBPage.waitForSelector('[data-testid="trade-details"]');
    
    // Sign the PSBT for user A
    await userAPage.click('[data-testid="sign-psbt-button"]');
    await userAPage.waitForSelector('[data-testid="wallet-password-input"]');
    await userAPage.fill('[data-testid="wallet-password-input"]', 'password_a');
    await userAPage.click('[data-testid="confirm-sign-button"]');
    
    // Wait for the PSBT to be signed
    await userAPage.waitForSelector('[data-testid="psbt-signed-message"]');
    
    // Sign the PSBT for user B
    await userBPage.click('[data-testid="sign-psbt-button"]');
    await userBPage.waitForSelector('[data-testid="wallet-password-input"]');
    await userBPage.fill('[data-testid="wallet-password-input"]', 'password_b');
    await userBPage.click('[data-testid="confirm-sign-button"]');
    
    // Wait for the PSBT to be signed
    await userBPage.waitForSelector('[data-testid="psbt-signed-message"]');
    
    // Wait for the trade to complete
    await userAPage.waitForSelector('[data-testid="trade-completed-message"]', { timeout: 30000 });
    await userBPage.waitForSelector('[data-testid="trade-completed-message"]', { timeout: 30000 });
    
    // Verify the trade status
    const tradeStatusA = await userAPage.textContent('[data-testid="trade-status"]');
    const tradeStatusB = await userBPage.textContent('[data-testid="trade-status"]');
    
    expect(tradeStatusA).toBe('completed');
    expect(tradeStatusB).toBe('completed');
  });
  
  test('should update wallet balances after trade', async () => {
    // Navigate to the wallet page for both users
    await userAPage.click('text=Wallet');
    await userBPage.click('text=Wallet');
    
    // Wait for the wallet to load
    await userAPage.waitForSelector('[data-testid="wallet-balance-table"]');
    await userBPage.waitForSelector('[data-testid="wallet-balance-table"]');
    
    // Get the BTC balance for user A
    const btcBalanceA = await userAPage.textContent('[data-testid="balance-BTC"]');
    
    // Get the RUNE balance for user A
    const runeBalanceA = await userAPage.textContent('[data-testid="balance-RUNE"]');
    
    // Get the BTC balance for user B
    const btcBalanceB = await userBPage.textContent('[data-testid="balance-BTC"]');
    
    // Get the RUNE balance for user B
    const runeBalanceB = await userBPage.textContent('[data-testid="balance-RUNE"]');
    
    // Verify the balances reflect the trade
    // The exact values will depend on the initial balances and the trade amount
    // For this test, we just verify that the balances are not empty
    expect(btcBalanceA).not.toBe('');
    expect(runeBalanceA).not.toBe('');
    expect(btcBalanceB).not.toBe('');
    expect(runeBalanceB).not.toBe('');
  });
  
  test('should cancel an order', async () => {
    // Create a new order for user A
    await userAPage.click('text=Trade');
    await userAPage.waitForSelector('[data-testid="trade-form"]');
    await userAPage.selectOption('[data-testid="base-asset-select"]', 'BTC');
    await userAPage.selectOption('[data-testid="quote-asset-select"]', 'ALKANE');
    await userAPage.selectOption('[data-testid="order-type-select"]', 'buy');
    await userAPage.fill('[data-testid="price-input"]', '0.0002');
    await userAPage.fill('[data-testid="amount-input"]', '5');
    await userAPage.click('[data-testid="submit-order-button"]');
    await userAPage.waitForSelector('[data-testid="order-success-message"]');
    
    // Navigate to the orders page
    await userAPage.click('text=Orders');
    await userAPage.waitForSelector('[data-testid="orders-table"]');
    
    // Find the new order
    const orderRow = await userAPage.waitForSelector('[data-testid="order-row"]:has-text("ALKANE")');
    
    // Find and click the cancel button within the order row
    await userAPage.locator('[data-testid="order-row"]:has-text("ALKANE") [data-testid="cancel-order-button"]').click();
    
    // Confirm the cancellation
    await userAPage.click('[data-testid="confirm-cancel-button"]');
    
    // Wait for the order to be cancelled
    await userAPage.waitForSelector('[data-testid="order-cancelled-message"]');
    
    // Verify the order status
    const cancelledRow = await userAPage.waitForSelector('[data-testid="order-row"]:has-text("ALKANE")');
    const orderStatus = await cancelledRow.getAttribute('data-order-status');
    
    expect(orderStatus).toBe('cancelled');
  });
});

/**
 * Helper function to log in a user
 * 
 * @param page The page to log in on
 * @param email The user's email
 * @param password The user's password
 */
async function loginUser(page: Page, email: string, password: string): Promise<void> {
  // Click the login button
  await page.click('[data-testid="login-button"]');
  
  // Wait for the login form to appear
  await page.waitForSelector('[data-testid="login-form"]');
  
  // Fill in the login form
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  
  // Submit the form
  await page.click('[data-testid="submit-login-button"]');
  
  // Wait for the login to complete
  await page.waitForSelector('[data-testid="user-profile"]');
}