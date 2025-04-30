import { test, expect, Page } from '@playwright/test';

test.describe('Responsive Design Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
  });
  
  test('should display correctly on desktop', async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Check that the navigation is horizontal
    const navBar = await page.locator('nav');
    const navBarDisplay = await navBar.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    
    expect(navBarDisplay).toBe('flex');
    
    // Check that the main content has appropriate width
    const mainContent = await page.locator('main');
    const mainContentWidth = await mainContent.evaluate((el) => {
      return window.getComputedStyle(el).maxWidth;
    });
    
    // Should be using a container with max width
    expect(parseInt(mainContentWidth)).toBeGreaterThan(0);
    
    // Check that the sidebar is visible
    const sidebar = await page.locator('[data-testid="sidebar"]');
    const sidebarDisplay = await sidebar.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    
    expect(sidebarDisplay).not.toBe('none');
    
    // Take a screenshot for visual comparison
    await page.screenshot({ path: 'test-results/desktop-home.png' });
    
    // Navigate to the trade page
    await page.click('text=Trade');
    await page.waitForSelector('[data-testid="trade-form"]');
    
    // Check that the trade form and orderbook are side by side
    const tradeForm = await page.locator('[data-testid="trade-form"]');
    const orderbook = await page.locator('[data-testid="orderbook"]');
    
    const tradeFormRect = await tradeForm.boundingBox();
    const orderbookRect = await orderbook.boundingBox();
    
    // On desktop, the trade form should be to the left of the orderbook
    expect(tradeFormRect?.x).toBeLessThan(orderbookRect?.x || 0);
    
    // Take a screenshot of the trade page
    await page.screenshot({ path: 'test-results/desktop-trade.png' });
  });
  
  test('should display correctly on tablet', async ({ page }) => {
    // Set viewport to tablet size
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Check that the navigation is still horizontal
    const navBar = await page.locator('nav');
    const navBarDisplay = await navBar.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    
    expect(navBarDisplay).toBe('flex');
    
    // Check that the main content has appropriate width
    const mainContent = await page.locator('main');
    const mainContentWidth = await mainContent.evaluate((el) => {
      return window.getComputedStyle(el).maxWidth;
    });
    
    // Should be using a container with max width
    expect(parseInt(mainContentWidth)).toBeGreaterThan(0);
    
    // Check if the sidebar is collapsed or shown as a toggle
    const sidebarToggle = await page.locator('[data-testid="sidebar-toggle"]');
    const sidebarToggleVisible = await sidebarToggle.isVisible();
    
    // On tablet, we might have a toggle for the sidebar
    if (sidebarToggleVisible) {
      // Click the toggle to show the sidebar
      await sidebarToggle.click();
      
      // Check that the sidebar appears
      const sidebar = await page.locator('[data-testid="sidebar"]');
      await sidebar.waitFor({ state: 'visible' });
      
      // Close the sidebar
      await sidebarToggle.click();
    }
    
    // Take a screenshot for visual comparison
    await page.screenshot({ path: 'test-results/tablet-home.png' });
    
    // Navigate to the trade page
    await page.click('text=Trade');
    await page.waitForSelector('[data-testid="trade-form"]');
    
    // Check the layout of trade form and orderbook
    const tradeForm = await page.locator('[data-testid="trade-form"]');
    const orderbook = await page.locator('[data-testid="orderbook"]');
    
    const tradeFormRect = await tradeForm.boundingBox();
    const orderbookRect = await orderbook.boundingBox();
    
    // On tablet, the trade form might be above the orderbook
    if (tradeFormRect && orderbookRect) {
      const isStacked = tradeFormRect.y + tradeFormRect.height <= orderbookRect.y;
      const isSideBySide = tradeFormRect.x + tradeFormRect.width <= orderbookRect.x;
      
      expect(isStacked || isSideBySide).toBeTruthy();
    }
    
    // Take a screenshot of the trade page
    await page.screenshot({ path: 'test-results/tablet-trade.png' });
  });
  
  test('should display correctly on mobile', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if there's a mobile menu button
    const mobileMenuButton = await page.locator('[data-testid="mobile-menu-button"]');
    const mobileMenuVisible = await mobileMenuButton.isVisible();
    
    expect(mobileMenuVisible).toBeTruthy();
    
    // Click the mobile menu button
    await mobileMenuButton.click();
    
    // Check that the mobile menu appears
    const mobileMenu = await page.locator('[data-testid="mobile-menu"]');
    await mobileMenu.waitFor({ state: 'visible' });
    
    // Close the mobile menu
    await page.click('[data-testid="close-menu-button"]');
    
    // Take a screenshot for visual comparison
    await page.screenshot({ path: 'test-results/mobile-home.png' });
    
    // Navigate to the trade page
    await mobileMenuButton.click();
    await page.click('text=Trade');
    await page.waitForSelector('[data-testid="trade-form"]');
    
    // Check that the trade form and orderbook are stacked
    const tradeForm = await page.locator('[data-testid="trade-form"]');
    const orderbook = await page.locator('[data-testid="orderbook"]');
    
    const tradeFormRect = await tradeForm.boundingBox();
    const orderbookRect = await orderbook.boundingBox();
    
    // On mobile, the trade form should be above the orderbook
    expect(tradeFormRect?.y).toBeLessThan(orderbookRect?.y || 0);
    
    // Take a screenshot of the trade page
    await page.screenshot({ path: 'test-results/mobile-trade.png' });
  });
  
  test('should handle orientation change on mobile', async ({ page }) => {
    // Set viewport to mobile portrait
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to the trade page
    await page.click('[data-testid="mobile-menu-button"]');
    await page.click('text=Trade');
    await page.waitForSelector('[data-testid="trade-form"]');
    
    // Take a screenshot in portrait mode
    await page.screenshot({ path: 'test-results/mobile-portrait.png' });
    
    // Change to landscape orientation
    await page.setViewportSize({ width: 667, height: 375 });
    
    // Wait for the layout to adjust
    await page.waitForTimeout(500);
    
    // Take a screenshot in landscape mode
    await page.screenshot({ path: 'test-results/mobile-landscape.png' });
    
    // Check that the UI is still usable in landscape
    const tradeForm = await page.locator('[data-testid="trade-form"]');
    const isTradeFormVisible = await tradeForm.isVisible();
    
    expect(isTradeFormVisible).toBeTruthy();
  });
  
  test('should have touch-friendly UI elements on mobile', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to the trade page
    await page.click('[data-testid="mobile-menu-button"]');
    await page.click('text=Trade');
    await page.waitForSelector('[data-testid="trade-form"]');
    
    // Check that form elements are large enough for touch
    const submitButton = await page.locator('[data-testid="submit-order-button"]');
    const buttonRect = await submitButton.boundingBox();
    
    // Button should be at least 44x44 pixels for touch accessibility
    expect(buttonRect?.width).toBeGreaterThanOrEqual(44);
    expect(buttonRect?.height).toBeGreaterThanOrEqual(44);
    
    // Check that input fields are large enough
    const priceInput = await page.locator('[data-testid="price-input"]');
    const inputRect = await priceInput.boundingBox();
    
    // Input height should be at least 44 pixels for touch accessibility
    expect(inputRect?.height).toBeGreaterThanOrEqual(44);
    
    // Check that there's adequate spacing between elements
    const amountInput = await page.locator('[data-testid="amount-input"]');
    const amountInputRect = await amountInput.boundingBox();
    
    if (inputRect && amountInputRect) {
      const spacing = amountInputRect.y - (inputRect.y + inputRect.height);
      // There should be at least 8px spacing between elements
      expect(spacing).toBeGreaterThanOrEqual(8);
    }
  });
  
  test('should load appropriate images for different screen sizes', async ({ page }) => {
    // Helper function to get image URL
    async function getLogoImageUrl(page: Page): Promise<string> {
      return page.evaluate(() => {
        const img = document.querySelector('[data-testid="logo-image"]') as HTMLImageElement;
        return img ? img.currentSrc : '';
      });
    }
    
    // Check on desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const desktopImageUrl = await getLogoImageUrl(page);
    
    // Check on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const mobileImageUrl = await getLogoImageUrl(page);
    
    // If responsive images are implemented, the URLs might be different
    // But at minimum, both should load a valid image
    expect(desktopImageUrl).toBeTruthy();
    expect(mobileImageUrl).toBeTruthy();
  });
});