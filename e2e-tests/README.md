# DarkSwap End-to-End Tests (`e2e-tests`)

This directory contains end-to-end (E2E) tests for the DarkSwap application, primarily focusing on the web interface (`web/`). It uses [Playwright](https://playwright.dev/) for browser automation and testing user workflows across different browsers.

**Project Status:** These tests are likely developed alongside the `web` interface during Phase 3 (IN PROGRESS) and expanded during Phase 4 (Testing & Refinement).

## Purpose

E2E tests simulate real user interactions with the application in a browser environment to verify complete workflows, including:

-   UI interactions (clicking buttons, filling forms).
-   Integration between the frontend (`web`), TypeScript library (`darkswap-lib`), WASM module (`darkswap-web-sys`), and potentially backend components (like a running daemon or relay for full P2P interaction).
-   Core trading flows (order creation, matching, execution).
-   Wallet interactions.
-   P2P networking aspects visible through the UI.
-   Security flows (e.g., login/auth if applicable).
-   Performance characteristics under simulated load.
-   Responsive design and accessibility checks.

## Setup

1.  **Ensure the main project and web dependencies are installed:**
    ```bash
    # From root directory
    ./build-all.sh # Or relevant build scripts
    cd web && yarn install && cd ..
    cd e2e-tests && yarn install # Or npm install
    ```

2.  **Install Playwright browsers:**
    ```bash
    # From e2e-tests directory
    npx playwright install
    ```

3.  **Environment Setup:** E2E tests often require running instances of the application components (e.g., `web` dev server, `darkswap-daemon`, `darkswap-relay`). Refer to specific test setup instructions or scripts (`scripts/run-e2e-tests.sh` might exist).

## Running Tests

*(Commands are typically run from the `e2e-tests` directory or the project root depending on `package.json` configuration)*

-   **Run all E2E tests:**
    ```bash
    npx playwright test
    # Or potentially: yarn test:e2e / npm run test:e2e (check package.json)
    # Or potentially: ../scripts/run-e2e-tests.sh
    ```

-   **Run tests in a specific browser:**
    ```bash
    npx playwright test --project=chromium
    npx playwright test --project=firefox
    npx playwright test --project=webkit
    ```

-   **Run tests in headed mode (visible browser):**
    ```bash
    npx playwright test --headed
    ```

-   **Run a specific test file:**
    ```bash
    npx playwright test home.spec.ts
    ```

-   **Run tests with a specific tag:**
    ```bash
    npx playwright test --grep @smoke
    ```

## Test Structure

Test files (`*.spec.ts`) cover different aspects of the application:

-   `home.spec.ts`: Basic home page checks.
-   `vault.spec.ts`: Wallet/Vault related functionality.
-   `trade.spec.ts`: Core trading page interactions.
-   `orders.spec.ts`: Order creation, listing, cancellation.
-   `webrtc.spec.ts`: Tests specifically targeting WebRTC UI elements or flows.
-   `wasm-integration.spec.ts`: Tests verifying WASM module interactions.
-   `p2p-networking.spec.ts`: Tests related to P2P status display or interactions.
-   `security.spec.ts`: Security-related workflows (e.g., login).
-   `performance.spec.ts`: Performance-related scenarios.
-   `mnemonic-generator.spec.ts`: Tests for the mnemonic generation utility.
-   `responsive-design.test.ts`: (Likely `.spec.ts`) Tests for layout on different viewports.
-   `accessibility.test.ts`: (Likely `.spec.ts`) Automated accessibility checks.

Helper files and page objects might be used to improve test organization (e.g., `helpers.ts`, `page-objects/`).

## Continuous Integration

E2E tests are configured to run automatically via GitHub Actions (see `.github/workflows/e2e-tests.yml`). Results and artifacts (like reports or videos) are typically available on the workflow run page in GitHub.

## Troubleshooting

Refer to the "Troubleshooting" section in the original README content for tips on handling flaky tests, timeouts, and improving test speed.

## License

MIT
