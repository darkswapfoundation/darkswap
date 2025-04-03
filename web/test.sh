#!/bin/bash

# Test script for DarkSwap web interface

# Exit on error
set -e

echo "Testing DarkSwap web interface..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm 8+ and try again."
    exit 1
fi

# Run unit tests
echo "Running unit tests..."
cd ../web
npm test

# Run end-to-end tests if Playwright is installed
if command -v npx playwright &> /dev/null; then
    echo "Running end-to-end tests..."
    npx playwright test
else
    echo "Playwright is not installed. Skipping end-to-end tests."
    echo "To install Playwright, run: npm install -D @playwright/test"
fi

echo "Tests completed!"