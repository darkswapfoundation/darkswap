#!/bin/bash

# Exit on error
set -e

echo "Starting DarkSwap Mobile App..."

# Navigate to the mobile app directory
cd "$(dirname "$0")"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
  echo "Dependencies not found. Installing..."
  ./install-dependencies.sh
fi

# Start the Metro bundler
echo "Starting Metro bundler..."
npm start