import { test, expect } from '@playwright/test';

test.describe('Orders Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/orders');
  });

  test('should display the orders page', async ({ page }) => {
    // Check if the page title is correct
    await expect(page).toHaveTitle(/Orders - DarkSwap/);

    // Check if the orders table is displayed
    await expect(page.locator('.orders-table')).toBeVisible();
  });

  test('should filter orders by status', async ({ page }) => {
    // Select "Open" status filter
    await page.selectOption('#statusFilter', 'open');

    // Check if the URL contains the status filter
    await expect(page.url()).toContain('status=open');

    // Check if only open orders are displayed
    const orderStatuses = await page.locator('.order-status').allTextContents();
    for (const status of orderStatuses) {
      expect(status.toLowerCase()).toBe('open');
    }
  });

  test('should filter orders by side', async ({ page }) => {
    // Select "Buy" side filter
    await page.selectOption('#sideFilter', 'buy');

    // Check if the URL contains the side filter
    await expect(page.url()).toContain('side=buy');

    // Check if only buy orders are displayed
    const orderSides = await page.locator('.buy-side').allTextContents();
    for (const side of orderSides) {
      expect(side.toLowerCase()).toBe('buy');
    }
  });

  test('should search orders by ID', async ({ page }) => {
    // Get the first order ID
    const firstOrderId = await page.locator('.orders-table tbody tr:first-child td:nth-child(1)').textContent();
    
    // Search for the order ID
    await page.fill('#searchTerm', firstOrderId || '');

    // Check if only one order is displayed
    await expect(page.locator('.orders-table tbody tr')).toHaveCount(1);
  });

  test('should cancel an open order', async ({ page }) => {
    // Find the first open order
    const cancelButton = page.locator('.cancel-button').first();
    
    // Check if the cancel button is visible
    await expect(cancelButton).toBeVisible();
    
    // Click the cancel button
    await cancelButton.click();
    
    // Check if the confirmation dialog is displayed
    await expect(page.locator('.confirmation-dialog')).toBeVisible();
    
    // Confirm the cancellation
    await page.locator('.confirmation-dialog .confirm-button').click();
    
    // Check if the notification is displayed
    await expect(page.locator('.notification-success')).toBeVisible();
    await expect(page.locator('.notification-success')).toContainText('Your order has been canceled');
  });
});