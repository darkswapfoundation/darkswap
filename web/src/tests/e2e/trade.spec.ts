import { test, expect } from '@playwright/test';

test.describe('Trade Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/trade/BTC/USDT');
  });

  test('should display the trade page with order book', async ({ page }) => {
    // Check if the page title is correct
    await expect(page).toHaveTitle(/BTC\/USDT - DarkSwap/);

    // Check if the order book is displayed
    await expect(page.locator('.trade-page-orderbook')).toBeVisible();
  });

  test('should be able to place a buy order', async ({ page }) => {
    // Click the buy tab
    await page.locator('.trade-form-tabs button').first().click();

    // Fill in the price and amount
    await page.locator('#price').fill('30000');
    await page.locator('#amount').fill('0.1');

    // Submit the form
    await page.locator('.trade-form-submit-button').click();

    // Check if the notification is displayed
    await expect(page.locator('.notification-success')).toBeVisible();
    await expect(page.locator('.notification-success')).toContainText('Your buy order has been created');
  });

  test('should be able to place a sell order', async ({ page }) => {
    // Click the sell tab
    await page.locator('.trade-form-tabs button').nth(1).click();

    // Fill in the price and amount
    await page.locator('#price').fill('31000');
    await page.locator('#amount').fill('0.1');

    // Submit the form
    await page.locator('.trade-form-submit-button').click();

    // Check if the notification is displayed
    await expect(page.locator('.notification-success')).toBeVisible();
    await expect(page.locator('.notification-success')).toContainText('Your sell order has been created');
  });

  test('should display error when submitting invalid order', async ({ page }) => {
    // Click the buy tab
    await page.locator('.trade-form-tabs button').first().click();

    // Fill in invalid price
    await page.locator('#price').fill('-1000');
    await page.locator('#amount').fill('0.1');

    // Submit the form
    await page.locator('.trade-form-submit-button').click();

    // Check if the error is displayed
    await expect(page.locator('.trade-form-error')).toBeVisible();
    await expect(page.locator('.trade-form-error')).toContainText('Please enter a valid price');
  });

  test('should update total when price and amount are entered', async ({ page }) => {
    // Click the buy tab
    await page.locator('.trade-form-tabs button').first().click();

    // Fill in price and amount
    await page.locator('#price').fill('30000');
    await page.locator('#amount').fill('0.1');

    // Check if total is updated
    await expect(page.locator('#total')).toHaveValue('3000');
  });

  test('should update amount when total is entered', async ({ page }) => {
    // Click the buy tab
    await page.locator('.trade-form-tabs button').first().click();

    // Fill in price and total
    await page.locator('#price').fill('30000');
    await page.locator('#total').fill('3000');

    // Check if amount is updated
    await expect(page.locator('#amount')).toHaveValue('0.1');
  });
});