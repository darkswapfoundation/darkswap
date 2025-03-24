#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check if Node.js is installed
if ! command_exists node; then
  echo -e "${RED}Error: Node.js is not installed.${NC}"
  echo -e "Please install Node.js from https://nodejs.org/"
  exit 1
fi

# Check if npm is installed
if ! command_exists npm; then
  echo -e "${RED}Error: npm is not installed.${NC}"
  echo -e "Please install npm (it usually comes with Node.js)"
  exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Dependencies not found. Installing...${NC}"
  npm install
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install dependencies.${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}Dependencies installed successfully.${NC}"
fi

# Clean the dist directory if it exists
if [ -d "dist" ]; then
  echo -e "${YELLOW}Cleaning previous build...${NC}"
  rm -rf dist
fi

# Build the application
echo -e "${BLUE}Building the application...${NC}"
npm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}Build failed.${NC}"
  exit 1
fi

echo -e "${GREEN}Build completed successfully.${NC}"
echo -e "${BLUE}The build output is in the 'dist' directory.${NC}"

# Optional: Preview the build
read -p "Do you want to preview the build? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${BLUE}Starting preview server...${NC}"
  npm run preview
fi