#!/bin/bash

# Run tests for DarkSwap
echo "Running tests for DarkSwap..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Install Jest if needed
if ! command -v jest &> /dev/null; then
  echo "Installing Jest..."
  npm install --save-dev jest @babel/core @babel/preset-env @babel/preset-react babel-jest
fi

# Install Playwright if needed
if ! command -v playwright &> /dev/null; then
  echo "Installing Playwright..."
  npm install --save-dev @playwright/test
  npx playwright install
fi

# Create .babelrc if it doesn't exist
if [ ! -f ".babelrc" ]; then
  echo "Creating .babelrc..."
  echo '{
  "presets": ["@babel/preset-env", "@babel/preset-react"]
}' > .babelrc
fi

# Run unit tests
echo "Running unit tests..."
npx jest --config=jest.config.js

# Run end-to-end tests
echo "Running end-to-end tests..."
npx playwright test tests/e2e/trading.test.js

echo "All tests completed!"