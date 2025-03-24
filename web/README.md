# DarkSwap Web Interface

A decentralized peer-to-peer trading platform for Bitcoin, runes, and alkanes.

## Overview

DarkSwap is a decentralized trading platform that enables direct peer-to-peer trading of Bitcoin, runes, and alkanes without intermediaries. The platform uses WebRTC for peer-to-peer communication and Bitcoin's Partially Signed Bitcoin Transactions (PSBTs) for secure, atomic swaps between different assets.

## Features

- **P2P Trading**: Direct peer-to-peer trading without intermediaries
- **Secure Transactions**: Built on Bitcoin's secure blockchain with PSBTs
- **Asset Management**: Manage your Bitcoin, runes, and alkanes in one place
- **Order Management**: Track your open orders and trade history
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Networking**: WebRTC, libp2p (Rust implementation)
- **Blockchain**: Bitcoin, PSBTs, Runes, Alkanes

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/darkswap.git
   cd darkswap/web
   ```

2. Run the setup script to install dependencies:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

```
darkswap/web/
├── index.html                # HTML template
├── package.json              # Project dependencies and scripts
├── postcss.config.js         # PostCSS configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
├── tsconfig.node.json        # Node-specific TypeScript configuration
├── vite.config.ts            # Vite configuration
├── public/                   # Static assets
│   └── favicon.svg           # Application favicon
└── src/
    ├── App.tsx               # Main application component
    ├── main.tsx              # Application entry point
    ├── index.css             # Global styles and Tailwind imports
    ├── components/           # Reusable components
    │   ├── Footer.tsx        # Page footer
    │   ├── Header.tsx        # Navigation header
    │   ├── Layout.tsx        # Page layout wrapper
    │   ├── Orderbook.tsx     # Trading orderbook component
    │   ├── PeerStatus.tsx    # P2P network status component
    │   ├── TradeForm.tsx     # Trading form component
    │   └── WalletConnect.tsx # Wallet connection component
    ├── contexts/             # React contexts
    │   ├── SDKContext.tsx    # DarkSwap SDK integration
    │   ├── ThemeContext.tsx  # Theme management
    │   └── WalletContext.tsx # Wallet connection management
    ├── pages/                # Application pages
    │   ├── About.tsx         # About page
    │   ├── Home.tsx          # Landing page
    │   ├── NotFound.tsx      # 404 page
    │   ├── Orders.tsx        # Orders management page
    │   ├── Settings.tsx      # User settings page
    │   ├── Trade.tsx         # Trading interface
    │   └── Vault.tsx         # Asset vault page
    ├── hooks/                # Custom React hooks
    └── utils/                # Utility functions
```

## Integration with DarkSwap SDK

The web interface integrates with the DarkSwap SDK, which provides the following functionality:

- P2P network communication
- Order management
- Trade execution
- Wallet integration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.