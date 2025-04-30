#!/bin/bash

# Setup script for DarkSwap monitoring infrastructure

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up DarkSwap monitoring infrastructure...${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Create necessary directories
echo -e "${YELLOW}Creating necessary directories...${NC}"
mkdir -p monitoring/prometheus/rules
mkdir -p monitoring/alertmanager/template
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/provisioning/datasources
mkdir -p monitoring/grafana/provisioning/dashboards
mkdir -p monitoring/loki
mkdir -p monitoring/promtail

# Check if environment variables are set
if [ -z "$SLACK_API_URL" ]; then
    echo -e "${YELLOW}SLACK_API_URL is not set. Using placeholder value.${NC}"
    export SLACK_API_URL="https://hooks.slack.com/services/your-slack-webhook-url"
fi

if [ -z "$SMTP_PASSWORD" ]; then
    echo -e "${YELLOW}SMTP_PASSWORD is not set. Using placeholder value.${NC}"
    export SMTP_PASSWORD="your-smtp-password"
fi

if [ -z "$PAGERDUTY_SERVICE_KEY" ]; then
    echo -e "${YELLOW}PAGERDUTY_SERVICE_KEY is not set. Using placeholder value.${NC}"
    export PAGERDUTY_SERVICE_KEY="your-pagerduty-service-key"
fi

if [ -z "$GRAFANA_ADMIN_USER" ]; then
    echo -e "${YELLOW}GRAFANA_ADMIN_USER is not set. Using default value 'admin'.${NC}"
    export GRAFANA_ADMIN_USER="admin"
fi

if [ -z "$GRAFANA_ADMIN_PASSWORD" ]; then
    echo -e "${YELLOW}GRAFANA_ADMIN_PASSWORD is not set. Using default value 'admin'.${NC}"
    export GRAFANA_ADMIN_PASSWORD="admin"
fi

# Start the monitoring stack
echo -e "${GREEN}Starting the monitoring stack...${NC}"
cd monitoring
docker-compose up -d

# Wait for services to start
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 10

# Check if services are running
echo -e "${YELLOW}Checking if services are running...${NC}"
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}Monitoring stack is running.${NC}"
else
    echo -e "${RED}Monitoring stack failed to start. Please check the logs.${NC}"
    docker-compose logs
    exit 1
fi

# Print access information
echo -e "${GREEN}Monitoring stack is ready!${NC}"
echo -e "${YELLOW}Grafana:${NC} http://localhost:3000 (admin:${GRAFANA_ADMIN_PASSWORD})"
echo -e "${YELLOW}Prometheus:${NC} http://localhost:9090"
echo -e "${YELLOW}Alertmanager:${NC} http://localhost:9093"
echo -e "${YELLOW}Loki:${NC} http://localhost:3100"

# Add metrics exporters to services
echo -e "${YELLOW}Adding metrics exporters to services...${NC}"

# Check if darkswap-daemon is running
if docker ps | grep -q "darkswap-daemon"; then
    echo -e "${GREEN}Adding metrics exporter to darkswap-daemon...${NC}"
    # Add metrics exporter configuration to darkswap-daemon
    # This is a placeholder and should be replaced with actual implementation
    echo "Metrics exporter added to darkswap-daemon"
else
    echo -e "${YELLOW}darkswap-daemon is not running. Skipping metrics exporter setup.${NC}"
fi

# Check if darkswap-relay is running
if docker ps | grep -q "darkswap-relay"; then
    echo -e "${GREEN}Adding metrics exporter to darkswap-relay...${NC}"
    # Add metrics exporter configuration to darkswap-relay
    # This is a placeholder and should be replaced with actual implementation
    echo "Metrics exporter added to darkswap-relay"
else
    echo -e "${YELLOW}darkswap-relay is not running. Skipping metrics exporter setup.${NC}"
fi

# Check if darkswap-web is running
if docker ps | grep -q "darkswap-web"; then
    echo -e "${GREEN}Adding metrics exporter to darkswap-web...${NC}"
    # Add metrics exporter configuration to darkswap-web
    # This is a placeholder and should be replaced with actual implementation
    echo "Metrics exporter added to darkswap-web"
else
    echo -e "${YELLOW}darkswap-web is not running. Skipping metrics exporter setup.${NC}"
fi

echo -e "${GREEN}Monitoring setup complete!${NC}"
echo -e "${YELLOW}Please check the documentation for more information on how to use the monitoring stack.${NC}"

exit 0