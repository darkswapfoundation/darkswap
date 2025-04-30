#!/bin/bash

# Exit on error
set -e

echo "Installing dependencies for DarkSwap Mobile App..."

# Navigate to the mobile app directory
cd "$(dirname "$0")"

# Install npm dependencies
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs \
  react-native-paper react-native-vector-icons react-native-safe-area-context \
  @react-native-async-storage/async-storage react-native-keychain socket.io-client \
  react-native-dotenv react-native-push-notification @react-native-community/push-notification-ios \
  axios react-native-gesture-handler react-native-reanimated react-native-screens \
  react-native-chart-kit react-native-svg

# Install dev dependencies
npm install --save-dev @babel/core @babel/preset-env @babel/runtime \
  @react-native-community/eslint-config @tsconfig/react-native @types/jest \
  @types/react @types/react-native-vector-icons @types/react-test-renderer \
  babel-jest eslint jest metro-react-native-babel-preset prettier \
  react-test-renderer typescript

echo "Dependencies installed successfully!"
echo "You can now run the app with 'npm start'"