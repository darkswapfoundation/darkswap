#!/bin/bash

# Build script for DarkSwap
echo "Building DarkSwap..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed. Please install Node.js and try again."
  exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  echo "Error: npm is not installed. Please install npm and try again."
  exit 1
fi

# Parse command line arguments
BUILD_ALL=false
BUILD_SDK=false
BUILD_CLI=false
BUILD_DAEMON=false
BUILD_WEB=false
RELEASE=false

for arg in "$@"; do
  case $arg in
    --all)
      BUILD_ALL=true
      ;;
    --sdk)
      BUILD_SDK=true
      ;;
    --cli)
      BUILD_CLI=true
      ;;
    --daemon)
      BUILD_DAEMON=true
      ;;
    --web)
      BUILD_WEB=true
      ;;
    --release)
      RELEASE=true
      ;;
    *)
      echo "Unknown argument: $arg"
      echo "Usage: ./build.sh [--all] [--sdk] [--cli] [--daemon] [--web] [--release]"
      exit 1
      ;;
  esac
done

# If no specific component is specified, build all
if [ "$BUILD_ALL" = false ] && [ "$BUILD_SDK" = false ] && [ "$BUILD_CLI" = false ] && [ "$BUILD_DAEMON" = false ] && [ "$BUILD_WEB" = false ]; then
  BUILD_ALL=true
fi

# Build mode
BUILD_MODE="debug"
if [ "$RELEASE" = true ]; then
  BUILD_MODE="release"
  echo "Building in release mode..."
else
  echo "Building in debug mode..."
fi

# Build SDK
if [ "$BUILD_ALL" = true ] || [ "$BUILD_SDK" = true ]; then
  echo "Building darkswap-sdk..."
  
  # Navigate to the SDK directory
  cd darkswap-sdk || exit 1
  
  # Build the SDK
  if [ "$RELEASE" = true ]; then
    cargo build --release
  else
    cargo build
  fi
  
  # Check if the build was successful
  if [ $? -ne 0 ]; then
    echo "Error: Failed to build darkswap-sdk"
    exit 1
  fi
  
  echo "darkswap-sdk built successfully"
  
  # Navigate back to the root directory
  cd ..
fi

# Build CLI
if [ "$BUILD_ALL" = true ] || [ "$BUILD_CLI" = true ]; then
  echo "Building darkswap-cli..."
  
  # Navigate to the CLI directory
  cd darkswap-cli || exit 1
  
  # Build the CLI
  if [ "$RELEASE" = true ]; then
    cargo build --release
  else
    cargo build
  fi
  
  # Check if the build was successful
  if [ $? -ne 0 ]; then
    echo "Error: Failed to build darkswap-cli"
    exit 1
  fi
  
  echo "darkswap-cli built successfully"
  
  # Navigate back to the root directory
  cd ..
fi

# Build daemon
if [ "$BUILD_ALL" = true ] || [ "$BUILD_DAEMON" = true ]; then
  echo "Building darkswap-daemon..."
  
  # Navigate to the daemon directory
  cd darkswap-daemon || exit 1
  
  # Build the daemon
  if [ "$RELEASE" = true ]; then
    cargo build --release
  else
    cargo build
  fi
  
  # Check if the build was successful
  if [ $? -ne 0 ]; then
    echo "Error: Failed to build darkswap-daemon"
    exit 1
  fi
  
  echo "darkswap-daemon built successfully"
  
  # Navigate back to the root directory
  cd ..
fi

# Build web
if [ "$BUILD_ALL" = true ] || [ "$BUILD_WEB" = true ]; then
  echo "Building web interface..."
  
  # Navigate to the web directory
  cd web || exit 1
  
  # Install dependencies if needed
  if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
  fi
  
  # Build the web interface
  if [ "$RELEASE" = true ]; then
    npm run build
  else
    # For debug mode, we just make sure dependencies are installed
    echo "Web interface ready for development"
  fi
  
  # Check if the build was successful
  if [ "$RELEASE" = true ] && [ ! -d "build" ]; then
    echo "Error: Failed to build web interface"
    exit 1
  fi
  
  echo "Web interface built successfully"
  
  # Navigate back to the root directory
  cd ..
fi

echo "Build completed successfully!"

# If in debug mode, provide instructions for running the development server
if [ "$RELEASE" = false ] && ([ "$BUILD_ALL" = true ] || [ "$BUILD_WEB" = true ]); then
  echo ""
  echo "To start the development server for the web interface, run:"
  echo "cd web && npm start"
fi

# If in release mode, provide instructions for running the built binaries
if [ "$RELEASE" = true ]; then
  echo ""
  echo "The following binaries are available:"
  
  if [ "$BUILD_ALL" = true ] || [ "$BUILD_CLI" = true ]; then
    echo "- darkswap-cli: target/release/darkswap-cli"
  fi
  
  if [ "$BUILD_ALL" = true ] || [ "$BUILD_DAEMON" = true ]; then
    echo "- darkswap-daemon: target/release/darkswap-daemon"
  fi
  
  if [ "$BUILD_ALL" = true ] || [ "$BUILD_WEB" = true ]; then
    echo "- web interface: web/build"
    echo "  To serve the web interface, you can use a static file server:"
    echo "  cd web/build && npx serve"
  fi
fi