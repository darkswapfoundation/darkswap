# DarkSwap Mobile App

This is the mobile app for DarkSwap, a decentralized exchange for Bitcoin, Runes, and Alkanes.

## Features

- Authentication
- Wallet management
- P2P networking
- Order book
- Trade execution
- Settings

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/darkswap.git
cd darkswap/darkswap-bridge/mobile
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Start the Metro server:

```bash
npm start
# or
yarn start
```

4. Run the app:

```bash
# For Android
npm run android
# or
yarn android

# For iOS
npm run ios
# or
yarn ios
```

## Project Structure

```
darkswap-bridge/mobile/
├── src/
│   ├── assets/         # Static assets like images
│   ├── components/     # Reusable components
│   ├── contexts/       # React contexts for state management
│   ├── navigation/     # Navigation configuration
│   ├── screens/        # Screen components
│   ├── services/       # API and other services
│   ├── styles/         # Global styles
│   └── utils/          # Utility functions
├── App.tsx             # Main app component
├── .env               # Environment variables
├── .env.development   # Development environment variables
├── .env.production    # Production environment variables
├── babel.config.js    # Babel configuration
├── metro.config.js    # Metro bundler configuration
├── package.json       # Dependencies and scripts
└── tsconfig.json      # TypeScript configuration
```

## Development

### Environment Variables

The app uses environment variables for configuration. These are stored in the following files:

- `.env`: Default environment variables
- `.env.development`: Development environment variables
- `.env.production`: Production environment variables

### Adding a New Screen

1. Create a new file in the `src/screens` directory
2. Add the screen to the appropriate navigator in the `src/navigation` directory
3. Update the navigation types in `src/navigation/types.ts`

### Adding a New Component

1. Create a new file in the `src/components` directory
2. Import and use the component in your screens

### Adding a New Service

1. Create a new file in the `src/services` directory
2. Import and use the service in your components or screens

## Building for Production

### Android

```bash
npm run android -- --variant=release
# or
yarn android --variant=release
```

### iOS

```bash
npm run ios -- --configuration Release
# or
yarn ios --configuration Release
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.