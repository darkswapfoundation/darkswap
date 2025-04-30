#!/bin/bash

# Start script for DarkSwap Bridge

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
DOCKER_COMPOSE=false
DEVELOPMENT=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -d|--docker)
      DOCKER_COMPOSE=true
      shift
      ;;
    -dev|--development)
      DEVELOPMENT=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  -d, --docker       Use Docker Compose"
      echo "  -dev, --development  Start in development mode"
      echo "  -h, --help         Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${GREEN}Starting DarkSwap Bridge...${NC}"

if [ "$DOCKER_COMPOSE" = true ]; then
  echo -e "${YELLOW}Starting with Docker Compose...${NC}"
  cd "$PROJECT_DIR"
  
  if [ "$DEVELOPMENT" = true ]; then
    echo -e "${YELLOW}Starting in development mode...${NC}"
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
  else
    docker-compose up
  fi
else
  echo -e "${YELLOW}Starting services...${NC}"
  cd "$PROJECT_DIR"
  
  # Create storage directory if it doesn't exist
  mkdir -p "$PROJECT_DIR/storage"
  
  # Start the bridge in the background
  echo -e "${YELLOW}Starting bridge...${NC}"
  if [ "$DEVELOPMENT" = true ]; then
    echo -e "${YELLOW}Starting bridge in development mode...${NC}"
    RUST_LOG=debug cargo run -- --server &
  else
    "$PROJECT_DIR/target/release/darkswap-bridge" --server &
  fi
  BRIDGE_PID=$!
  
  # Start the server
  echo -e "${YELLOW}Starting server...${NC}"
  cd "$PROJECT_DIR/server"
  if [ "$DEVELOPMENT" = true ]; then
    echo -e "${YELLOW}Starting server in development mode...${NC}"
    npm run dev &
  else
    npm start &
  fi
  SERVER_PID=$!
  
  # Start the web interface
  echo -e "${YELLOW}Starting web interface...${NC}"
  cd "$PROJECT_DIR/web"
  if [ "$DEVELOPMENT" = true ]; then
    echo -e "${YELLOW}Starting web interface in development mode...${NC}"
    npm start &
  else
    # Use a simple HTTP server for production
    npx serve -s build &
  fi
  WEB_PID=$!
  
  # Save PIDs to file
  echo "$BRIDGE_PID" > "$PROJECT_DIR/.bridge.pid"
  echo "$SERVER_PID" > "$PROJECT_DIR/.server.pid"
  echo "$WEB_PID" > "$PROJECT_DIR/.web.pid"
  
  echo -e "${GREEN}All services started!${NC}"
  echo -e "${YELLOW}Bridge PID: ${BRIDGE_PID}${NC}"
  echo -e "${YELLOW}Server PID: ${SERVER_PID}${NC}"
  echo -e "${YELLOW}Web PID: ${WEB_PID}${NC}"
  echo ""
  echo -e "${YELLOW}Web interface: http://localhost:3000${NC}"
  echo -e "${YELLOW}API: http://localhost:3001${NC}"
  echo ""
  echo -e "${YELLOW}To stop the services, run: ${PROJECT_DIR}/scripts/stop.sh${NC}"
  
  # Wait for all processes to finish
  wait
fi