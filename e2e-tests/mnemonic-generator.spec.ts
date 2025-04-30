import { test, expect } from '@playwright/test';

test.describe('Mnemonic Generator Page', () => {
  test('should display the title', async ({ page }) => {
    await page.goto('/mnemonic-generator');
    
    // Check if the title is displayed
    const title = await page.locator('h1:has-text("Mnemonic Generator")');
    await expect(title).toBeVisible();
  });
  
  test('should generate a mnemonic phrase', async ({ page }) => {
    await page.goto('/mnemonic-generator');
    
    // Wait for the mnemonic generator to load
    await page.waitForSelector('.mnemonic-generator');
    
    // Get the initial mnemonic phrase
    const initialMnemonic = await page.locator('.mnemonic-generator-textarea').inputValue();
    
    // Check if the initial mnemonic is valid
    const initialValidation = await page.locator('.mnemonic-generator-validation');
    await expect(initialValidation).toHaveClass(/valid/);
    
    // Click on the generate button
    await page.click('button:has-text("Generate New Mnemonic")');
    
    // Get the new mnemonic phrase
    const newMnemonic = await page.locator('.mnemonic-generator-textarea').inputValue();
    
    // Check if the new mnemonic is different from the initial one
    expect(newMnemonic).not.toBe(initialMnemonic);
    
    // Check if the new mnemonic is valid
    const newValidation = await page.locator('.mnemonic-generator-validation');
    await expect(newValidation).toHaveClass(/valid/);
  });
  
  test('should validate mnemonic phrases', async ({ page }) => {
    await page.goto('/mnemonic-generator');
    
    // Wait for the mnemonic generator to load
    await page.waitForSelector('.mnemonic-generator');
    
    // Enter an invalid mnemonic phrase
    await page.fill('.mnemonic-generator-textarea', 'invalid mnemonic phrase');
    
    // Check if the validation shows that the mnemonic is invalid
    const validation = await page.locator('.mnemonic-generator-validation');
    await expect(validation).toHaveClass(/invalid/);
    await expect(validation).toHaveText('Invalid mnemonic');
    
    // Enter a valid mnemonic phrase
    await page.fill('.mnemonic-generator-textarea', 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    
    // Check if the validation shows that the mnemonic is valid
    await expect(validation).toHaveClass(/valid/);
    await expect(validation).toHaveText('Valid mnemonic');
  });
  
  test('should show word count', async ({ page }) => {
    await page.goto('/mnemonic-generator');
    
    // Wait for the mnemonic generator to load
    await page.waitForSelector('.mnemonic-generator');
    
    // Check if the word count is displayed
    const wordCount = await page.locator('.mnemonic-generator-word-count');
    await expect(wordCount).toBeVisible();
    
    // Check if the word count is correct for the initial mnemonic
    const initialMnemonic = await page.locator('.mnemonic-generator-textarea').inputValue();
    const initialWordCount = initialMnemonic.trim().split(/\s+/).length;
    await expect(wordCount).toContainText(`Word count: ${initialWordCount} / 12`);
    
    // Enter a different mnemonic phrase
    await page.fill('.mnemonic-generator-textarea', 'abandon abandon abandon abandon abandon abandon');
    
    // Check if the word count is updated
    await expect(wordCount).toContainText('Word count: 6 / 12');
  });
  
  test('should change mnemonic strength', async ({ page }) => {
    await page.goto('/mnemonic-generator');
    
    // Wait for the mnemonic generator to load
    await page.waitForSelector('.mnemonic-generator');
    
    // Get the initial mnemonic phrase
    const initialMnemonic = await page.locator('.mnemonic-generator-textarea').inputValue();
    const initialWordCount = initialMnemonic.trim().split(/\s+/).length;
    
    // Check if the initial word count is 12
    expect(initialWordCount).toBe(12);
    
    // Change the strength to 24 words
    await page.selectOption('#mnemonic-strength', { value: '256' });
    
    // Wait for the new mnemonic to be generated
    await page.waitForTimeout(500);
    
    // Get the new mnemonic phrase
    const newMnemonic = await page.locator('.mnemonic-generator-textarea').inputValue();
    const newWordCount = newMnemonic.trim().split(/\s+/).length;
    
    // Check if the new word count is 24
    expect(newWordCount).toBe(24);
  });
  
  test('should change mnemonic language', async ({ page }) => {
    await page.goto('/mnemonic-generator');
    
    // Wait for the mnemonic generator to load
    await page.waitForSelector('.mnemonic-generator');
    
    // Get the initial mnemonic phrase
    const initialMnemonic = await page.locator('.mnemonic-generator-textarea').inputValue();
    
    // Change the language to Spanish
    await page.selectOption('#mnemonic-language', { value: 'spanish' });
    
    // Wait for the new mnemonic to be generated
    await page.waitForTimeout(500);
    
    // Get the new mnemonic phrase
    const newMnemonic = await page.locator('.mnemonic-generator-textarea').inputValue();
    
    // Check if the new mnemonic is different from the initial one
    expect(newMnemonic).not.toBe(initialMnemonic);
  });
  
  test('should generate seed from mnemonic', async ({ page }) => {
    await page.goto('/mnemonic-generator');
    
    // Wait for the mnemonic generator to load
    await page.waitForSelector('.mnemonic-generator');
    
    // Enter a valid mnemonic phrase
    await page.fill('.mnemonic-generator-textarea', 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    
    // Click on the generate seed button
    await page.click('button:has-text("Generate Seed")');
    
    // Check if the seed is displayed
    const seed = await page.locator('.mnemonic-generator-page-seed-value');
    await expect(seed).toBeVisible();
    
    // Check if the seed is correct
    await expect(seed).toContainText('5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4');
  });
  
  test('should add passphrase to seed generation', async ({ page }) => {
    await page.goto('/mnemonic-generator');
    
    // Wait for the mnemonic generator to load
    await page.waitForSelector('.mnemonic-generator');
    
    // Enter a valid mnemonic phrase
    await page.fill('.mnemonic-generator-textarea', 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    
    // Enter a passphrase
    await page.fill('#passphrase', 'password');
    
    // Click on the generate seed button
    await page.click('button:has-text("Generate Seed")');
    
    // Check if the seed is displayed
    const seed = await page.locator('.mnemonic-generator-page-seed-value');
    await expect(seed).toBeVisible();
    
    // Check if the seed is correct with the passphrase
    await expect(seed).toContainText('2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b5d0a9e6f711edc4ac81b0a04622d658b9d1492d80eb7c57b5549ead7a503bc41');
  });
  
  test('should display security tips', async ({ page }) => {
    await page.goto('/mnemonic-generator');
    
    // Check if the security tips section is displayed
    const securityTips = await page.locator('h2:has-text("Security Tips")');
    await expect(securityTips).toBeVisible();
    
    // Check if the security tips list is displayed
    const securityTipsList = await page.locator('.mnemonic-generator-page-security-tips');
    await expect(securityTipsList).toBeVisible();
    
    // Check if there are at least 5 security tips
    const securityTipsItems = await page.locator('.mnemonic-generator-page-security-tips li');
    await expect(securityTipsItems).toHaveCount(5);
  });
});