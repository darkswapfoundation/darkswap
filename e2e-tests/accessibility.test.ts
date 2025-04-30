import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
  });
  
  test('home page should not have accessibility violations', async ({ page }) => {
    // Analyze the page with axe
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    // Assert that there are no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  
  test('trade page should not have accessibility violations', async ({ page }) => {
    // Navigate to the trade page
    await page.click('text=Trade');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="trade-form"]');
    
    // Analyze the page with axe
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    // Assert that there are no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  
  test('orders page should not have accessibility violations', async ({ page }) => {
    // Navigate to the orders page
    await page.click('text=Orders');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="orders-table"]');
    
    // Analyze the page with axe
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    // Assert that there are no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  
  test('should support keyboard navigation', async ({ page }) => {
    // Focus on the first focusable element
    await page.keyboard.press('Tab');
    
    // Check that something is focused
    const focusedElement = await page.evaluate(() => {
      const activeElement = document.activeElement;
      return activeElement ? activeElement.tagName : null;
    });
    
    expect(focusedElement).not.toBeNull();
    
    // Navigate to the trade link using keyboard
    let found = false;
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      
      const isTradeLinkFocused = await page.evaluate(() => {
        const activeElement = document.activeElement;
        return activeElement?.textContent?.includes('Trade') || false;
      });
      
      if (isTradeLinkFocused) {
        found = true;
        break;
      }
    }
    
    expect(found).toBe(true);
    
    // Activate the trade link
    await page.keyboard.press('Enter');
    
    // Check that we navigated to the trade page
    await page.waitForSelector('[data-testid="trade-form"]');
    
    // Tab to the first form element
    await page.keyboard.press('Tab');
    
    // Check that a form element is focused
    const formElementFocused = await page.evaluate(() => {
      const activeElement = document.activeElement;
      return activeElement?.tagName === 'INPUT' || 
             activeElement?.tagName === 'SELECT' || 
             activeElement?.tagName === 'BUTTON';
    });
    
    expect(formElementFocused).toBe(true);
  });
  
  test('should have proper focus indicators', async ({ page }) => {
    // Tab to focus on an element
    await page.keyboard.press('Tab');
    
    // Get the focused element's outline style
    const outlineStyle = await page.evaluate(() => {
      const activeElement = document.activeElement;
      if (!activeElement) return null;
      
      const computedStyle = window.getComputedStyle(activeElement);
      return {
        outlineWidth: computedStyle.outlineWidth,
        outlineStyle: computedStyle.outlineStyle,
        outlineColor: computedStyle.outlineColor,
      };
    });
    
    // Check that there is a visible outline
    expect(outlineStyle).not.toBeNull();
    expect(outlineStyle?.outlineWidth).not.toBe('0px');
    expect(outlineStyle?.outlineStyle).not.toBe('none');
  });
  
  test('should have proper heading structure', async ({ page }) => {
    // Get all headings
    const headings = await page.evaluate(() => {
      const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      return headingElements.map(heading => ({
        level: parseInt(heading.tagName.substring(1)),
        text: heading.textContent?.trim() || '',
      }));
    });
    
    // Check that there is at least one heading
    expect(headings.length).toBeGreaterThan(0);
    
    // Check that there is exactly one h1
    const h1Headings = headings.filter(h => h.level === 1);
    expect(h1Headings.length).toBe(1);
    
    // Check that headings are properly nested
    let previousLevel = 0;
    let valid = true;
    
    for (const heading of headings) {
      // A heading can be at most one level deeper than the previous heading
      if (heading.level > previousLevel + 1) {
        valid = false;
        break;
      }
      previousLevel = heading.level;
    }
    
    expect(valid).toBe(true);
  });
  
  test('should have alt text for images', async ({ page }) => {
    // Get all images
    const images = await page.evaluate(() => {
      const imageElements = Array.from(document.querySelectorAll('img'));
      return imageElements.map(img => ({
        src: img.src,
        alt: img.alt,
        role: img.getAttribute('role'),
      }));
    });
    
    // Check that all images have alt text or are marked as decorative
    for (const image of images) {
      expect(image.alt || image.role === 'presentation').toBeTruthy();
    }
  });
  
  test('should have sufficient color contrast', async ({ page }) => {
    // Run axe with just the color-contrast rule
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();
    
    // Assert that there are no color contrast violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  
  test('should support screen readers', async ({ page }) => {
    // Check for ARIA landmarks
    const landmarks = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('[role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"], header, nav, main, aside, footer'));
      return elements.map(el => ({
        role: el.getAttribute('role') || el.tagName.toLowerCase(),
      }));
    });
    
    // Check that there are at least some landmarks
    expect(landmarks.length).toBeGreaterThan(0);
    
    // Check for a main landmark
    const hasMainLandmark = landmarks.some(l => l.role === 'main');
    expect(hasMainLandmark).toBe(true);
    
    // Check for form labels
    await page.click('text=Trade');
    await page.waitForSelector('[data-testid="trade-form"]');
    
    const formControls = await page.evaluate(() => {
      const controls = Array.from(document.querySelectorAll('input, select, textarea'));
      return controls.map(control => {
        const id = control.id;
        const label = id ? document.querySelector(`label[for="${id}"]`) : null;
        const ariaLabel = control.getAttribute('aria-label');
        const ariaLabelledBy = control.getAttribute('aria-labelledby');
        
        return {
          hasLabel: !!label || !!ariaLabel || !!ariaLabelledBy,
        };
      });
    });
    
    // Check that all form controls have labels
    for (const control of formControls) {
      expect(control.hasLabel).toBe(true);
    }
  });
  
  test('should support high contrast mode', async ({ page }) => {
    // Enable high contrast mode
    await page.evaluate(() => {
      document.documentElement.classList.add('high-contrast');
    });
    
    // Take a screenshot for visual comparison
    await page.screenshot({ path: 'test-results/high-contrast-mode.png' });
    
    // Check that text elements have sufficient contrast in high contrast mode
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();
    
    // Assert that there are no color contrast violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  
  test('should support text resizing', async ({ page }) => {
    // Increase the font size
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    
    // Take a screenshot for visual comparison
    await page.screenshot({ path: 'test-results/large-text-mode.png' });
    
    // Check that the page is still usable with larger text
    const isPageUsable = await page.evaluate(() => {
      // Check if any text is overlapping or cut off
      const elements = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button'));
      
      for (const element of elements) {
        const rect = element.getBoundingClientRect();
        
        // Check if the element is cut off horizontally
        if (rect.right > window.innerWidth) {
          return false;
        }
      }
      
      return true;
    });
    
    expect(isPageUsable).toBe(true);
  });
});