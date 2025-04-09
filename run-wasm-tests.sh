#!/bin/bash

# Run tests for the WebAssembly integration
echo "Running tests for the WebAssembly integration..."

# Change to the web directory
cd web

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Run the tests
echo "Running tests..."
npm test

# Check if tests passed
if [ $? -eq 0 ]; then
  echo "Tests passed!"
else
  echo "Tests failed!"
  exit 1
fi

echo "Done!"