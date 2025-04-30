#!/bin/bash

# Script to start the mock API server for DarkSwap

# Exit on error
set -e

# Check if json-server is installed
if ! command -v json-server &> /dev/null; then
  echo "json-server is not installed. Installing..."
  npm install -g json-server
fi

# Start the mock API server
echo "Starting mock API server..."
json-server --watch mock-api/db.json --port 8000 --routes mock-api/routes.json --middlewares mock-api/middleware.js