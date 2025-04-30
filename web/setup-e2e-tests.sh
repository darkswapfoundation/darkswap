#!/bin/bash

# Script to set up and run end-to-end tests for DarkSwap

# Exit on error
set -e

# Print commands
set -x

# Install dependencies if package.json has changed
if [ ! -d "node_modules" ] || [ package.json -nt node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

# Install Playwright browsers
echo "Installing Playwright browsers..."
npx playwright install --with-deps

# Create a .env.test file for testing
echo "Creating .env.test file..."
cat > .env.test << EOL
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_WS_URL=ws://localhost:8000/ws
REACT_APP_ENV=test
REACT_APP_DEBUG=true
REACT_APP_VERSION=0.1.0
EOL

# Run the tests
echo "Running end-to-end tests..."
npm run test:e2e

# Print test results location
echo "Test results are available in the playwright-report directory."
echo "You can view the HTML report by running: npx playwright show-report"