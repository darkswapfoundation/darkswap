#!/bin/sh

# Simple health check script for the nginx container
# This script checks if nginx is running and if the index.html file exists

# Check if nginx is running
if ! pgrep -x "nginx" > /dev/null; then
    echo "Nginx is not running"
    exit 1
fi

# Check if index.html exists
if [ ! -f /usr/share/nginx/html/index.html ]; then
    echo "index.html not found"
    exit 1
fi

# Check if nginx can serve the health endpoint
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health)
if [ "$RESPONSE" != "200" ]; then
    echo "Health endpoint returned $RESPONSE instead of 200"
    exit 1
fi

# All checks passed
echo "Health check passed"
exit 0