#!/bin/bash

# Deploy script for DarkSwap Bridge

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="production"
TARGET_DIR="/opt/darkswap-bridge"
DOCKER_COMPOSE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -e|--environment)
      ENVIRONMENT="$2"
      shift
      shift
      ;;
    -t|--target)
      TARGET_DIR="$2"
      shift
      shift
      ;;
    -d|--docker)
      DOCKER_COMPOSE=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  -e, --environment <env>  Deployment environment (default: production)"
      echo "  -t, --target <dir>       Target directory (default: /opt/darkswap-bridge)"
      echo "  -d, --docker             Use Docker Compose for deployment"
      echo "  -h, --help               Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo -e "${GREEN}Deploying DarkSwap Bridge to ${ENVIRONMENT} environment...${NC}"

# Create target directory if it doesn't exist
if [ ! -d "$TARGET_DIR" ]; then
  echo -e "${YELLOW}Creating target directory: ${TARGET_DIR}${NC}"
  mkdir -p "$TARGET_DIR"
fi

# Copy files to target directory
echo -e "${YELLOW}Copying files to target directory...${NC}"
rsync -av --exclude='.git' --exclude='target' --exclude='node_modules' . "$TARGET_DIR"

# Set up environment variables
echo -e "${YELLOW}Setting up environment variables...${NC}"
if [ "$ENVIRONMENT" == "production" ]; then
  cp "$TARGET_DIR/server/.env.example" "$TARGET_DIR/server/.env"
  sed -i 's/NODE_ENV=development/NODE_ENV=production/g' "$TARGET_DIR/server/.env"
  sed -i 's/your-secret-key/'"$(openssl rand -hex 32)"'/g' "$TARGET_DIR/server/.env"
else
  cp "$TARGET_DIR/server/.env.example" "$TARGET_DIR/server/.env"
fi

# Build the project
if [ "$DOCKER_COMPOSE" = true ]; then
  echo -e "${YELLOW}Building with Docker Compose...${NC}"
  cd "$TARGET_DIR"
  docker-compose build
else
  echo -e "${YELLOW}Building the project...${NC}"
  cd "$TARGET_DIR"
  
  # Build Rust components
  echo -e "${YELLOW}Building Rust components...${NC}"
  cargo build --release
  
  # Build web interface
  echo -e "${YELLOW}Building web interface...${NC}"
  cd "$TARGET_DIR/web"
  npm ci
  npm run build
  
  # Build backend server
  echo -e "${YELLOW}Building backend server...${NC}"
  cd "$TARGET_DIR/server"
  npm ci
  npm run build
fi

# Start the services
if [ "$DOCKER_COMPOSE" = true ]; then
  echo -e "${YELLOW}Starting services with Docker Compose...${NC}"
  cd "$TARGET_DIR"
  docker-compose up -d
else
  echo -e "${YELLOW}Starting services...${NC}"
  cd "$TARGET_DIR"
  
  # Create systemd service files
  echo -e "${YELLOW}Creating systemd service files...${NC}"
  
  # Bridge service
  cat > /tmp/darkswap-bridge.service << EOF
[Unit]
Description=DarkSwap Bridge
After=network.target

[Service]
ExecStart=${TARGET_DIR}/target/release/darkswap-bridge --server
WorkingDirectory=${TARGET_DIR}
User=darkswap
Group=darkswap
Restart=always
RestartSec=5
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=darkswap-bridge

[Install]
WantedBy=multi-user.target
EOF

  # Server service
  cat > /tmp/darkswap-bridge-server.service << EOF
[Unit]
Description=DarkSwap Bridge Server
After=network.target darkswap-bridge.service

[Service]
ExecStart=node ${TARGET_DIR}/server/dist/index.js
WorkingDirectory=${TARGET_DIR}/server
User=darkswap
Group=darkswap
Restart=always
RestartSec=5
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=darkswap-bridge-server
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
EOF

  # Web service (using nginx)
  cat > /tmp/darkswap-bridge-web.conf << EOF
server {
    listen 80;
    server_name localhost;
    root ${TARGET_DIR}/web/build;
    index index.html;

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

  # Install service files
  echo -e "${YELLOW}Installing service files...${NC}"
  sudo mv /tmp/darkswap-bridge.service /etc/systemd/system/
  sudo mv /tmp/darkswap-bridge-server.service /etc/systemd/system/
  sudo mv /tmp/darkswap-bridge-web.conf /etc/nginx/conf.d/
  
  # Create user if it doesn't exist
  if ! id -u darkswap > /dev/null 2>&1; then
    echo -e "${YELLOW}Creating darkswap user...${NC}"
    sudo useradd -r -s /bin/false darkswap
  fi
  
  # Set permissions
  echo -e "${YELLOW}Setting permissions...${NC}"
  sudo chown -R darkswap:darkswap "$TARGET_DIR"
  
  # Reload systemd and nginx
  echo -e "${YELLOW}Reloading systemd and nginx...${NC}"
  sudo systemctl daemon-reload
  sudo systemctl restart nginx
  
  # Start services
  echo -e "${YELLOW}Starting services...${NC}"
  sudo systemctl enable darkswap-bridge
  sudo systemctl enable darkswap-bridge-server
  sudo systemctl start darkswap-bridge
  sudo systemctl start darkswap-bridge-server
fi

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo ""
if [ "$DOCKER_COMPOSE" = true ]; then
  echo -e "${YELLOW}Services are running with Docker Compose.${NC}"
  echo -e "${YELLOW}Web interface: http://localhost:3000${NC}"
  echo -e "${YELLOW}API: http://localhost:3001${NC}"
else
  echo -e "${YELLOW}Services are running with systemd.${NC}"
  echo -e "${YELLOW}Web interface: http://localhost${NC}"
  echo -e "${YELLOW}API: http://localhost/api${NC}"
fi
echo ""
echo -e "${YELLOW}To check the status of the services:${NC}"
if [ "$DOCKER_COMPOSE" = true ]; then
  echo -e "${YELLOW}docker-compose ps${NC}"
else
  echo -e "${YELLOW}sudo systemctl status darkswap-bridge${NC}"
  echo -e "${YELLOW}sudo systemctl status darkswap-bridge-server${NC}"
fi