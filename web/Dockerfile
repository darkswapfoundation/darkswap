# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Set build arguments with defaults
ARG API_URL=http://localhost:3000
ARG WS_URL=ws://localhost:3000/ws
ENV REACT_APP_API_URL=$API_URL
ENV REACT_APP_WS_URL=$WS_URL

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy nginx configuration
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy health check script
COPY nginx/health-check.sh /usr/local/bin/health-check.sh
RUN chmod +x /usr/local/bin/health-check.sh

# Create directory for SSL certificates
RUN mkdir -p /etc/nginx/certs

# Expose ports
EXPOSE 80
EXPOSE 443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD /usr/local/bin/health-check.sh

# Start nginx
CMD ["nginx", "-g", "daemon off;"]