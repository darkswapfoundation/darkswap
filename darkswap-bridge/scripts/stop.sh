#!/bin/bash

# Stop script for DarkSwap Bridge

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
DOCKER_COMPOSE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -d|--docker)
      DOCKER_COMPOSE=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  -d, --docker  Use Docker Compose"
      echo "  -h, --help    Show this help message"
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

echo -e "${GREEN}Stopping DarkSwap Bridge...${NC}"

if [ "$DOCKER_COMPOSE" = true ]; then
  echo -e "${YELLOW}Stopping with Docker Compose...${NC}"
  cd "$PROJECT_DIR"
  docker-compose down
else
  echo -e "${YELLOW}Stopping services...${NC}"
  
  # Check if PID files exist
  if [ -f "$PROJECT_DIR/.bridge.pid" ]; then
    BRIDGE_PID=$(cat "$PROJECT_DIR/.bridge.pid")
    echo -e "${YELLOW}Stopping bridge (PID: ${BRIDGE_PID})...${NC}"
    kill -15 "$BRIDGE_PID" 2>/dev/null || true
    rm "$PROJECT_DIR/.bridge.pid"
  else
    echo -e "${YELLOW}Bridge PID file not found, trying to find process...${NC}"
    BRIDGE_PID=$(pgrep -f "darkswap-bridge --server" || true)
    if [ -n "$BRIDGE_PID" ]; then
      echo -e "${YELLOW}Found bridge process (PID: ${BRIDGE_PID}), stopping...${NC}"
      kill -15 "$BRIDGE_PID" 2>/dev/null || true
    else
      echo -e "${YELLOW}Bridge process not found.${NC}"
    fi
  fi
  
  if [ -f "$PROJECT_DIR/.server.pid" ]; then
    SERVER_PID=$(cat "$PROJECT_DIR/.server.pid")
    echo -e "${YELLOW}Stopping server (PID: ${SERVER_PID})...${NC}"
    kill -15 "$SERVER_PID" 2>/dev/null || true
    rm "$PROJECT_DIR/.server.pid"
  else
    echo -e "${YELLOW}Server PID file not found, trying to find process...${NC}"
    SERVER_PID=$(pgrep -f "node.*darkswap-bridge/server" || true)
    if [ -n "$SERVER_PID" ]; then
      echo -e "${YELLOW}Found server process (PID: ${SERVER_PID}), stopping...${NC}"
      kill -15 "$SERVER_PID" 2>/dev/null || true
    else
      echo -e "${YELLOW}Server process not found.${NC}"
    fi
  fi
  
  if [ -f "$PROJECT_DIR/.web.pid" ]; then
    WEB_PID=$(cat "$PROJECT_DIR/.web.pid")
    echo -e "${YELLOW}Stopping web interface (PID: ${WEB_PID})...${NC}"
    kill -15 "$WEB_PID" 2>/dev/null || true
    rm "$PROJECT_DIR/.web.pid"
  else
    echo -e "${YELLOW}Web PID file not found, trying to find process...${NC}"
    WEB_PID=$(pgrep -f "node.*darkswap-bridge/web" || true)
    if [ -n "$WEB_PID" ]; then
      echo -e "${YELLOW}Found web process (PID: ${WEB_PID}), stopping...${NC}"
      kill -15 "$WEB_PID" 2>/dev/null || true
    else
      echo -e "${YELLOW}Web process not found.${NC}"
    fi
  fi
  
  # Wait for processes to stop
  echo -e "${YELLOW}Waiting for processes to stop...${NC}"
  sleep 2
  
  # Check if processes are still running
  if [ -n "$BRIDGE_PID" ] && ps -p "$BRIDGE_PID" > /dev/null; then
    echo -e "${RED}Bridge process is still running, forcing stop...${NC}"
    kill -9 "$BRIDGE_PID" 2>/dev/null || true
  fi
  
  if [ -n "$SERVER_PID" ] && ps -p "$SERVER_PID" > /dev/null; then
    echo -e "${RED}Server process is still running, forcing stop...${NC}"
    kill -9 "$SERVER_PID" 2>/dev/null || true
  fi
  
  if [ -n "$WEB_PID" ] && ps -p "$WEB_PID" > /dev/null; then
    echo -e "${RED}Web process is still running, forcing stop...${NC}"
    kill -9 "$WEB_PID" 2>/dev/null || true
  fi
fi

echo -e "${GREEN}All services stopped!${NC}"