# DarkSwap Bridge Web Interface

This is the web interface for the DarkSwap Bridge, which provides a user-friendly way to interact with the bridge's REST API and WebSocket server.

## Features

- **Authentication**: Login, registration, and account management
- **Wallet Management**: Create, open, and manage wallets
- **Network Management**: Connect to peers and manage network settings
- **Order Book**: View and manage orders
- **Trade Management**: View and manage trades
- **Settings**: Configure application settings
- **Real-time Updates**: Get real-time updates via WebSocket
- **Responsive Design**: Works on desktop and mobile devices
- **Theme Support**: Light and dark themes

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher
- DarkSwap Bridge running locally or remotely

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/darkswap.git
cd darkswap/darkswap-bridge/web
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with the following content:

```
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_VERSION=0.1.0
```

4. Start the development server:

```bash
npm start
```

5. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Building for Production

```bash
npm run build
```

This will create a `build` directory with the production build of the app.

## Project Structure

```
darkswap-bridge/web/
├── package.json        # NPM package configuration
├── tsconfig.json       # TypeScript configuration
├── src/
│   ├── index.tsx       # Entry point
│   ├── App.tsx         # Main application component
│   ├── index.css       # Global styles
│   ├── App.css         # Application-specific styles
│   ├── reportWebVitals.ts # Performance reporting
│   ├── contexts/       # React contexts
│   │   ├── AuthContext.tsx      # Authentication context
│   │   ├── ApiContext.tsx       # API context
│   │   ├── WebSocketContext.tsx # WebSocket context
│   │   ├── NotificationContext.tsx # Notification context
│   │   └── ThemeContext.tsx     # Theme context
│   ├── components/     # React components
│   │   ├── Navigation.tsx       # Navigation component
│   │   ├── ProtectedRoute.tsx   # Protected route component
│   │   ├── ThemeToggle.tsx      # Theme toggle component
│   │   ├── WebSocketStatus.tsx  # WebSocket status component
│   │   └── NotificationDropdown.tsx # Notification dropdown component
│   └── pages/          # React pages
│       ├── Home.tsx            # Home page
│       ├── Login.tsx           # Login page
│       ├── Register.tsx        # Register page
│       ├── Dashboard.tsx       # Dashboard page
│       ├── Wallet.tsx          # Wallet page
│       ├── Network.tsx         # Network page
│       ├── OrderBook.tsx       # Order book page
│       ├── Trades.tsx          # Trades page
│       ├── Settings.tsx        # Settings page
│       └── NotFound.tsx        # Not found page
```

## Testing

```bash
npm test
```

This will run the test suite using Jest and React Testing Library.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.