#!/bin/bash

# DarkSwap Deployment Script
# This script deploys the DarkSwap platform to production

# Exit on error
set -e

# Print commands
set -x

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Parse command line arguments
ENVIRONMENT="production"
SKIP_BUILD=false
SKIP_TESTS=false
SKIP_BACKUP=false

while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        --environment|-e)
            ENVIRONMENT="$2"
            shift
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --environment, -e <env>  Deployment environment (default: production)"
            echo "  --skip-build             Skip building the Docker images"
            echo "  --skip-tests             Skip running tests"
            echo "  --skip-backup            Skip backing up data"
            echo "  --help, -h               Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $key"
            exit 1
            ;;
    esac
done

# Set environment-specific variables
case $ENVIRONMENT in
    production)
        COMPOSE_FILE="docker-compose.yml"
        ENV_FILE=".env.production"
        ;;
    staging)
        COMPOSE_FILE="docker-compose.staging.yml"
        ENV_FILE=".env.staging"
        ;;
    development)
        COMPOSE_FILE="docker-compose.dev.yml"
        ENV_FILE=".env.development"
        ;;
    *)
        echo "Unknown environment: $ENVIRONMENT"
        exit 1
        ;;
esac

# Create .env file if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
    echo "Creating $ENV_FILE..."
    cat > "$ENV_FILE" << EOF
# DarkSwap Environment Variables
NODE_ENV=$ENVIRONMENT
API_URL=http://localhost:3000
WS_URL=ws://localhost:3000/ws
RELAY_SERVER=darkswap-relay:9000
BITCOIN_NETWORK=testnet
EOF
fi

# Run tests if not skipped
if [ "$SKIP_TESTS" = false ]; then
    echo "Running tests..."
    
    # Run Rust tests
    cargo test --all
    
    # Run TypeScript tests
    cd web && npm test && cd ..
    
    # Run end-to-end tests
    cd web && npm run test:e2e && cd ..
fi

# Backup data if not skipped
if [ "$SKIP_BACKUP" = false ]; then
    echo "Backing up data..."
    
    # Create backup directory
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup Docker volumes
    docker run --rm \
        -v darkswap_relay-data:/source/relay-data \
        -v darkswap_daemon-data:/source/daemon-data \
        -v "$(pwd)/$BACKUP_DIR:/backup" \
        alpine \
        tar czf /backup/data.tar.gz /source
    
    echo "Backup created in $BACKUP_DIR"
fi

# Build Docker images if not skipped
if [ "$SKIP_BUILD" = false ]; then
    echo "Building Docker images..."
    docker-compose -f "$COMPOSE_FILE" build
fi

# Deploy the application
echo "Deploying DarkSwap to $ENVIRONMENT..."
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 10

# Check if services are running
echo "Checking if services are running..."
docker-compose -f "$COMPOSE_FILE" ps

# Print logs
echo "Printing logs..."
docker-compose -f "$COMPOSE_FILE" logs --tail=20

echo "Deployment completed successfully!"
echo "DarkSwap is now running in $ENVIRONMENT environment."
echo "Web interface: http://localhost"
echo "API: http://localhost:3000"
echo "WebSocket: ws://localhost:3000/ws"
echo "Grafana: http://localhost:3001 (admin/darkswap)"
echo "Prometheus: http://localhost:9090"

# Print additional instructions
echo ""
echo "Additional commands:"
echo "  docker-compose -f $COMPOSE_FILE logs -f                # Follow logs"
echo "  docker-compose -f $COMPOSE_FILE ps                     # Check service status"
echo "  docker-compose -f $COMPOSE_FILE down                   # Stop services"
echo "  docker-compose -f $COMPOSE_FILE down -v                # Stop services and remove volumes"
echo "  docker-compose -f $COMPOSE_FILE restart <service>      # Restart a specific service"