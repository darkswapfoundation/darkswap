# DarkSwap Bridge Web Interface

This directory contains the web interface for the DarkSwap Bridge, which provides a user-friendly way to interact with the bridge layer.

## Architecture

The web interface consists of two main components:

1. **Frontend**: A React application built with TypeScript, React Router, and Bootstrap.
2. **Backend**: An Express.js server that communicates with the bridge layer and provides API endpoints for the frontend.

```
darkswap-bridge/
├── web/                  # Frontend
│   ├── src/
│   │   ├── contexts/     # React contexts for state management
│   │   ├── components/   # React components
│   │   └── pages/        # React pages
│   ├── package.json      # NPM package configuration
│   └── tsconfig.json     # TypeScript configuration
└── server/               # Backend
    ├── src/
    │   ├── bridge/       # Bridge client
    │   ├── routes/       # API routes
    │   └── utils/        # Utility functions
    ├── package.json      # NPM package configuration
    └── tsconfig.json     # TypeScript configuration
```

## Frontend

The frontend is a React application that provides a user interface for interacting with the bridge layer. It includes:

- **Authentication**: Secure login system with JWT tokens
- **Theme Support**: Light and dark mode with automatic detection of system preferences
- **Real-time Updates**: WebSocket connection for real-time updates from the bridge
- **Responsive Design**: Bootstrap-based responsive design that works on all devices

### Key Components

1. **Context Providers**:
   - `AuthContext`: Manages authentication state and user sessions
   - `BridgeContext`: Manages communication with the bridge server
   - `ThemeContext`: Manages theme preferences

2. **UI Components**:
   - `Navigation`: Main navigation bar with status indicators
   - `ThemeToggle`: Toggle button for switching between light and dark mode
   - `ProtectedRoute`: Route component that requires authentication

3. **Pages**:
   - `Dashboard`: Overview of the system status
   - `Wallet`: Wallet management interface
   - `Network`: Network management interface
   - `OrderBook`: Order book display and management
   - `Trades`: Trade history and management
   - `Settings`: System settings

## Backend

The backend is an Express.js server that communicates with the bridge layer and provides API endpoints for the frontend. It includes:

- **Authentication**: JWT-based authentication system
- **Bridge Client**: Client for communicating with the bridge layer
- **API Routes**: RESTful API endpoints for the frontend
- **WebSocket Server**: Real-time updates for the frontend

### Key Components

1. **Bridge Client**:
   - Communicates with the bridge layer via IPC
   - Manages the bridge process
   - Provides methods for sending messages to the bridge

2. **API Routes**:
   - `/api/auth`: Authentication endpoints
   - `/api/bridge`: Bridge-related endpoints

3. **WebSocket Server**:
   - Provides real-time updates for the frontend
   - Emits events for wallet status, network status, etc.

## Getting Started

### Prerequisites

- Node.js 14+
- npm or yarn
- Rust toolchain (for building the bridge layer)

### Installation

1. Install frontend dependencies:
```bash
cd darkswap-bridge/web
npm install
```

2. Install backend dependencies:
```bash
cd darkswap-bridge/server
npm install
```

3. Create a `.env` file in the `server` directory:
```bash
cp darkswap-bridge/server/.env.example darkswap-bridge/server/.env
```

4. Edit the `.env` file to match your environment.

### Running the Web Interface

1. Start the backend server:
```bash
cd darkswap-bridge/server
npm run dev
```

2. Start the frontend development server:
```bash
cd darkswap-bridge/web
npm start
```

3. Access the web interface at http://localhost:3000

## API Endpoints

The backend server provides the following API endpoints:

- `/api/auth/login`: Authenticate a user
- `/api/auth/register`: Register a new user (for development only)
- `/api/bridge/wallet`: Send messages to the wallet component
- `/api/bridge/network`: Send messages to the network component
- `/api/bridge/system`: Send messages to the system
- `/api/bridge/wallet/status`: Get wallet status
- `/api/bridge/network/status`: Get network status
- `/api/bridge/wallet/balance`: Get wallet balance
- `/api/bridge/network/peers`: Get connected peers
- `/api/bridge/orders`: Get orders
- `/api/bridge/trades`: Get trades

## WebSocket Events

The backend server emits the following WebSocket events:

- `wallet_status`: Updates on wallet status
- `network_status`: Updates on network status
- `wallet_balance`: Updates on wallet balance
- `connected_peers`: Updates on connected peers
- `orders`: Updates on orders
- `trades`: Updates on trades

## Security

The web interface includes several security features:

- **Authentication**: JWT-based authentication system
- **Authorization**: Protected routes that require authentication
- **Input Validation**: Validation of all user input
- **Error Handling**: Comprehensive error handling

## Next Steps

1. Implement the remaining page components for the frontend
2. Add more API endpoints for specific functionality
3. Implement WebSocket events for real-time updates
4. Add more security features
5. Create a comprehensive test suite