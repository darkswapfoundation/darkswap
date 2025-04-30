import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the title', async ({ page }) => {
    await page.goto('/');
    
    // Check if the title is displayed
    const title = await page.locator('h1:has-text("Welcome to DarkSwap")');
    await expect(title).toBeVisible();
  });
  
  test('should have navigation links', async ({ page }) => {
    await page.goto('/');
    
    // Check if the navigation links are displayed
    const tradeLink = await page.locator('nav a:has-text("Trade")');
    const ordersLink = await page.locator('nav a:has-text("Orders")');
    const vaultLink = await page.locator('nav a:has-text("Vault")');
    
    await expect(tradeLink).toBeVisible();
    await expect(ordersLink).toBeVisible();
    await expect(vaultLink).toBeVisible();
  });
  
  test('should navigate to Trade page', async ({ page }) => {
    await page.goto('/');
    
    // Click on the Trade link
    await page.click('nav a:has-text("Trade")');
    
    // Check if the URL has changed
    await expect(page).toHaveURL(/\/trade/);
    
    // Check if the Trade page is displayed
    const tradeTitle = await page.locator('h1:has-text("Trade")');
    await expect(tradeTitle).toBeVisible();
  });
  
  test('should navigate to Orders page', async ({ page }) => {
    await page.goto('/');
    
    // Click on the Orders link
    await page.click('nav a:has-text("Orders")');
    
    // Check if the URL has changed
    await expect(page).toHaveURL(/\/orders/);
    
    // Check if the Orders page is displayed
    const ordersTitle = await page.locator('h1:has-text("Orders")');
    await expect(ordersTitle).toBeVisible();
  });
  
  test('should navigate to Vault page', async ({ page }) => {
    await page.goto('/');
    
    // Click on the Vault link
    await page.click('nav a:has-text("Vault")');
    
    // Check if the URL has changed
    await expect(page).toHaveURL(/\/vault/);
    
    // Check if the Vault page is displayed
    const vaultTitle = await page.locator('h1:has-text("Vault")');
    await expect(vaultTitle).toBeVisible();
  });
  
  test('should display feature cards', async ({ page }) => {
    await page.goto('/');
    
    // Check if the feature cards are displayed
    const featureCards = await page.locator('.feature-card');
    
    // Check if there are at least 4 feature cards
    await expect(featureCards).toHaveCount(4);
  });
  
  test('should display demo sections', async ({ page }) => {
    await page.goto('/');
    
    // Check if the demo sections are displayed
    const demoSections = await page.locator('.demo-section');
    
    // Check if there are multiple demo sections
    await expect(demoSections).toHaveCount(10);
  });
  
  test('should display getting started steps', async ({ page }) => {
    await page.goto('/');
    
    // Check if the getting started steps are displayed
    const steps = await page.locator('.step');
    
    // Check if there are 3 steps
    await expect(steps).toHaveCount(3);
  });
  
  test('should toggle theme', async ({ page }) => {
    await page.goto('/');
    
    // Get the initial theme
    const initialTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    
    // Click on the theme toggle button
    await page.click('.header-actions button:has-text("Toggle theme")');
    
    // Get the new theme
    const newTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    
    // Check if the theme has changed
    expect(newTheme).not.toBe(initialTheme);
  });
});