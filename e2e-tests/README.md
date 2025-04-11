# DarkSwap End-to-End Tests

This directory contains end-to-end tests for the DarkSwap application using Playwright.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Install Playwright browsers:

```bash
npx playwright install
```

## Running Tests

Run all tests:

```bash
npx playwright test
```

Run tests in a specific browser:

```bash
npx playwright test --project=chromium
```

Run tests in headed mode (with browser UI):

```bash
npx playwright test --headed
```

Run a specific test file:

```bash
npx playwright test e2e-tests/home.spec.ts
```

## Test Structure

- `e2e-tests/home.spec.ts`: Tests for the home page
- `e2e-tests/vault.spec.ts`: Tests for the vault page
- `e2e-tests/trade.spec.ts`: Tests for the trade page
- `e2e-tests/orders.spec.ts`: Tests for the orders page
- `e2e-tests/webrtc.spec.ts`: Tests for WebRTC functionality
- `e2e-tests/wasm-integration.spec.ts`: Tests for WebAssembly integration
- `e2e-tests/p2p-networking.spec.ts`: Tests for P2P networking
- `e2e-tests/security.spec.ts`: Tests for security features
- `e2e-tests/performance.spec.ts`: Tests for performance benchmarks
- `e2e-tests/mnemonic-generator.spec.ts`: Tests for the mnemonic generator

## Adding New Tests

1. Create a new test file in the `e2e-tests` directory
2. Import the Playwright test utilities:

```typescript
import { test, expect } from '@playwright/test';
```

3. Define your test suite:

```typescript
test.describe('Your Feature', () => {
  test('should do something', async ({ page }) => {
    // Your test code here
  });
});
```

4. Run your tests:

```bash
npx playwright test e2e-tests/your-feature.spec.ts
```

## Best Practices

### 1. Use Page Objects

For complex pages, create page objects to encapsulate page-specific logic:

```typescript
// e2e-tests/page-objects/TradePage.ts
export class TradePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/trade');
  }

  async selectTradingPair(baseAsset: string, quoteAsset: string) {
    await this.page.click(`.trading-pair:has-text("${baseAsset}/${quoteAsset}")`);
  }

  async enterPrice(price: string) {
    await this.page.fill('.trade-form-price input', price);
  }

  async enterAmount(amount: string) {
    await this.page.fill('.trade-form-amount input', amount);
  }

  async clickBuyButton() {
    await this.page.click('.trade-form-submit-button');
  }
}
```

### 2. Use Test Fixtures

Create custom fixtures for common setup:

```typescript
// e2e-tests/fixtures.ts
import { test as base } from '@playwright/test';
import { TradePage } from './page-objects/TradePage';

type MyFixtures = {
  tradePage: TradePage;
};

export const test = base.extend<MyFixtures>({
  tradePage: async ({ page }, use) => {
    const tradePage = new TradePage(page);
    await use(tradePage);
  },
});
```

### 3. Use Test Data

Keep test data separate from test logic:

```typescript
// e2e-tests/test-data/orders.ts
export const testOrders = [
  {
    baseAsset: 'BTC',
    quoteAsset: 'ETH',
    price: '10',
    amount: '1',
    type: 'buy',
  },
  {
    baseAsset: 'RUNE',
    quoteAsset: 'BTC',
    price: '0.001',
    amount: '100',
    type: 'sell',
  },
];
```

### 4. Use Test Hooks

Use test hooks for setup and teardown:

```typescript
test.describe('Trade Page', () => {
  test.beforeEach(async ({ page }) => {
    // Setup code that runs before each test
    await page.goto('/trade');
  });

  test.afterEach(async ({ page }) => {
    // Teardown code that runs after each test
    await page.evaluate(() => localStorage.clear());
  });

  // Tests go here
});
```

### 5. Use Test Tags

Use test tags to categorize tests:

```typescript
test('should display trading pairs @smoke', async ({ page }) => {
  // Test code here
});
```

Then run only smoke tests:

```bash
npx playwright test --grep @smoke
```

## Continuous Integration

The end-to-end tests are automatically run on GitHub Actions for every push to the main branch and for every pull request. The workflow is defined in `.github/workflows/e2e-tests.yml`.

To view the test results, go to the GitHub Actions tab in the repository and click on the latest workflow run. The test report is available as an artifact.

## Troubleshooting

### 1. Tests are failing in CI but passing locally

This is often due to timing issues. Try increasing the timeout for the failing tests:

```typescript
test('should display trading pairs', async ({ page }) => {
  test.setTimeout(60000); // Increase timeout to 60 seconds
  // Test code here
});
```

### 2. Tests are flaky

Flaky tests are tests that sometimes pass and sometimes fail without any changes to the code. To fix flaky tests:

1. Add retry logic for operations that might fail:

```typescript
async function retryClick(page: Page, selector: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.click(selector);
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await page.waitForTimeout(1000);
    }
  }
}
```

2. Use more specific selectors:

```typescript
// Instead of
await page.click('button');

// Use
await page.click('button:has-text("Submit")');
```

3. Wait for specific conditions:

```typescript
// Instead of
await page.click('button');
await page.waitForTimeout(1000);

// Use
await page.click('button');
await page.waitForSelector('.success-message');
```

### 3. Tests are slow

To speed up tests:

1. Run tests in parallel:

```bash
npx playwright test --workers=4
```

2. Use test sharding in CI:

```yaml
- name: Run Playwright tests (shard 1/2)
  run: npx playwright test --shard=1/2

- name: Run Playwright tests (shard 2/2)
  run: npx playwright test --shard=2/2
```

3. Reuse authentication state:

```typescript
test.describe('Authenticated tests', () => {
  test.use({ storageState: 'auth.json' });

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/login');
    await page.fill('#username', 'testuser');
    await page.fill('#password', 'testpassword');
    await page.click('#login-button');
    await page.waitForSelector('.logged-in');
    await page.context().storageState({ path: 'auth.json' });
    await page.close();
  });

  // Tests that require authentication
});