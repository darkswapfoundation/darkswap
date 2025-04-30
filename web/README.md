# DarkSwap Web Interface (`web`)

This directory contains the React-based web interface for DarkSwap, the decentralized peer-to-peer trading platform for Bitcoin, Runes, and Alkanes. It utilizes the `darkswap-lib` TypeScript library, which in turn uses WASM bindings (`darkswap-web-sys`) generated from the core Rust `darkswap-sdk` to interact with the P2P network and perform trading operations.

**Project Status:** This component is the primary focus of Phase 3 (IN PROGRESS). Core features are implemented, but testing, documentation, and cross-cutting concerns (accessibility, i18n, etc.) are ongoing.

## Features

-   User-friendly graphical interface for DarkSwap trading.
-   Connects to the DarkSwap P2P network via `darkswap-lib` and WASM.
-   Displays decentralized order book data (`components/Orderbook.tsx`, `components/P2POrderbook.tsx`).
-   Allows users to create, view, and manage orders (`components/AdvancedOrderForm.tsx`, `pages/Orders.tsx`).
-   Facilitates initiating and monitoring peer-to-peer trades (`components/TradeExecution.tsx`, `pages/Trade.tsx`).
-   Integrates with browser wallets (e.g., MetaMask, WalletConnect) and internal WASM wallet (`components/WalletConnector.tsx`, `contexts/WalletContext.tsx`).
-   Displays wallet balances for BTC, Runes, and Alkanes (`components/WalletBalancesDisplay.tsx`).
-   Visualizes network status, peer connections, and relay status (`components/WebRtcNetworkStatus.tsx`, `components/PeerNetworkStatus.tsx`).
-   Includes components for displaying Runes/Alkanes details and potentially visualizing transactions (`components/RunesDisplay.tsx`, `components/AlkanesDisplay.tsx`).
-   Provides user settings and configuration options (`pages/Settings.tsx`).
-   Built with React, TypeScript, Vite (likely), and potentially Tailwind CSS.

## Getting Started

### Prerequisites

-   Node.js (Check `package.json` for specific version, likely >= 18.0)
-   Yarn (Recommended package manager, check project docs)
-   Rust toolchain (Required for building WASM dependencies, check root `rust-toolchain.toml`)
-   `wasm-pack` (For building `darkswap-web-sys`)

### Installation & Setup

1.  **Clone the main DarkSwap repository** (if not already done):
    ```bash
    git clone https://github.com/darkswap/darkswap.git
    cd darkswap
    ```

2.  **Build Core Dependencies:** Ensure the Rust SDK, WASM bindings, and TypeScript library are built. This is typically handled by the root build scripts:
    ```bash
    # From the root directory (../)
    ./build-all.sh # Or ./build.sh --all, or specific scripts like ./build-wasm.sh
    ```
    *(This step compiles the Rust code and generates the necessary WASM/JS files used by `darkswap-lib` and this `web` package.)*

3.  **Install Web Dependencies:**
    ```bash
    cd web
    yarn install # Or npm install
    ```

### Running the Development Server

1.  **Start the development server:**
    ```bash
    cd web
    yarn dev # Or npm run start / npm run dev - check package.json scripts
    ```

2.  Open your browser and navigate to the local address provided (e.g., `http://localhost:5173` or `http://localhost:3000`).

## Project Structure (`web/src/`)

-   **`components/`**: Reusable React UI components (e.g., OrderBook, TradeForm, WalletConnect, WebRtc*).
-   **`pages/`**: Top-level page components/views (e.g., Trade, Orders, Settings, WasmDemo, P2PTrade).
-   **`contexts/`**: React Context providers for global state (e.g., WalletContext, OrderbookContext, WebRtcContext, DarkSwapContext).
-   **`hooks/`**: Custom React hooks (e.g., useWallet, useTradeHooks, useDarkSwap).
-   **`services/`**: Logic for interacting with APIs or backend services (e.g., DarkSwapService, WasmWalletService).
-   **`utils/`**: Utility functions, helpers, type definitions (e.g., WebRTC clients, formatters, validators, DarkSwapClient).
-   **`styles/`**: CSS files or styling configuration (e.g., Tailwind CSS, CSS Modules).
-   **`assets/`**: Static assets like images, fonts.
-   **`wasm/` / `wasm-bindings/`**: (Potentially) Code related to loading/interacting with the WASM module if not fully handled by `darkswap-lib`.
-   **`types/`**: Shared TypeScript type definitions.
-   **`tests/`**: Unit and integration tests (e.g., using Vitest/Jest, React Testing Library).
-   **`main.tsx` / `index.tsx`**: Application entry point.
-   **`App.tsx`**: Root application component, likely handling routing.

*(Note: This structure is inferred; check the actual directories for specifics.)*

## Available Scripts (`package.json`)

Common scripts likely include:

-   `dev` (or `start`): Runs the app in development mode with hot-reloading.
-   `build`: Builds the app for production deployment.
-   `test`: Runs the unit and integration test suite.
-   `lint`: Runs the code linter (e.g., ESLint).
-   `e2e`: (May exist here or in root) Runs end-to-end tests.

*(Check `web/package.json` for the definitive list of scripts.)*

## Contributing

Contributions are welcome! Please follow the guidelines in the main repository README and ensure code adheres to project standards (`.clinerules`).

## License

MIT
