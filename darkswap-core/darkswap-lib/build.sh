#!/bin/bash

# Build script for the DarkSwap TypeScript Library

set -e

echo "Building DarkSwap TypeScript Library..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed"
    echo "Please install npm from https://www.npmjs.com/"
    exit 1
fi

# Parse command line arguments
DOCS=false
TEST=false
PUBLISH=false

for arg in "$@"; do
    case $arg in
        --docs)
            DOCS=true
            shift
            ;;
        --test)
            TEST=true
            shift
            ;;
        --publish)
            PUBLISH=true
            shift
            ;;
        *)
            # Unknown option
            echo "Unknown option: $arg"
            echo "Usage: $0 [--docs] [--test] [--publish]"
            exit 1
            ;;
    esac
done

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the library
echo "Building library..."
npm run build

# Run tests if requested
if [ "$TEST" = true ]; then
    echo "Running tests..."
    npm test
fi

# Generate documentation if requested
if [ "$DOCS" = true ]; then
    echo "Generating documentation..."
    npm run docs
    
    # Open the documentation
    if command -v xdg-open &> /dev/null; then
        xdg-open docs/index.html
    elif command -v open &> /dev/null; then
        open docs/index.html
    else
        echo "Documentation generated at docs/index.html"
    fi
fi

# Publish to npm if requested
if [ "$PUBLISH" = true ]; then
    echo "Publishing to npm..."
    npm publish
fi

echo "DarkSwap TypeScript Library built successfully!"