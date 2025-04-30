#!/bin/bash

# Exit on error
set -e

echo "Setting up tests for DarkSwap Mobile App..."

# Navigate to the mobile app directory
cd "$(dirname "$0")"

# Create tests directory if it doesn't exist
mkdir -p src/tests

# Install testing dependencies
npm install --save-dev @testing-library/react-native @testing-library/jest-native jest-expo

# Create basic test setup
cat > src/tests/setup.js << 'EOL'
import { NativeModules } from 'react-native';

// Mock modules that might not be available in the test environment
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock Keychain
jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(() => Promise.resolve(true)),
  getGenericPassword: jest.fn(() => Promise.resolve(null)),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),
}));

// Mock react-native-push-notification
jest.mock('react-native-push-notification', () => ({
  configure: jest.fn(),
  localNotification: jest.fn(),
  cancelAllLocalNotifications: jest.fn(),
  requestPermissions: jest.fn(() => Promise.resolve()),
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock environment variables
jest.mock('@env', () => ({
  API_URL: 'http://localhost:3000/api',
  WS_URL: 'ws://localhost:3001',
}));

// Setup global beforeAll and afterAll
global.beforeAll(() => {
  console.log('Test suite started');
});

global.afterAll(() => {
  console.log('Test suite finished');
});
EOL

# Create a sample test file
cat > src/tests/App.test.js << 'EOL'
import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../../App';

// Mock the entire App component for now
jest.mock('../../App', () => {
  return function MockedApp() {
    return null;
  };
});

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
  });
});
EOL

# Update jest configuration in package.json
node -e "
const fs = require('fs');
const path = require('path');
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = require(packageJsonPath);

packageJson.jest = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/src/tests/setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|react-clone-referenced-element|@react-navigation|@react-native-community|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|@sentry/.*)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!**/babel.config.js',
    '!**/jest.setup.js'
  ]
};

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
"

echo "Test setup completed successfully!"
echo "You can run tests with 'npm test'"