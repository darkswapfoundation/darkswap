# DarkSwap Web Interface

This is the web interface for DarkSwap, a decentralized peer-to-peer trading platform for Bitcoin, runes, and alkanes.

## Features

- Decentralized peer-to-peer trading
- Support for Bitcoin, runes, and alkanes
- Direct WebRTC connections
- Circuit relay for NAT traversal
- Atomic swaps using PSBTs
- No KYC or registration required
- Open source and transparent

## Getting Started

### Prerequisites

- Node.js 16+
- npm 8+
- Rust 1.60+
- wasm-pack

### Installation

1. Clone the repository:

```bash
git clone https://github.com/darkswap/darkswap.git
cd darkswap
```

2. Install dependencies:

```bash
# Install Rust dependencies
./install-bitcoin-deps.sh

# Install web dependencies
cd web
npm install
```

3. Build the WebAssembly bindings:

```bash
cd ../darkswap-web-sys
wasm-pack build --target web
```

4. Build the TypeScript library:

```bash
cd ../darkswap-lib
npm install
npm run build
```

5. Start the development server:

```bash
cd ../web
npm start
```

6. Open your browser and navigate to `http://localhost:3000`

## Project Structure

- `src/components`: React components
- `src/pages`: Page components
- `src/hooks`: React hooks
- `src/utils`: Utility functions
- `src/styles`: CSS files
- `public`: Static assets

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.