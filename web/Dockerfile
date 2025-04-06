# DarkSwap Web Application Dockerfile
# Multi-stage build for optimized production image

# Build stage
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from build stage
COPY --from=build /app/build ./build
COPY --from=build /app/server.js ./
COPY --from=build /app/api ./api

# Create directories for logs and certificates
RUN mkdir -p logs certs

# Set environment variables
ENV NODE_ENV=production \
    PORT=80

# Expose ports
EXPOSE 80 443

# Set user to node for security
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost/api/health || exit 1

# Start the server
CMD ["node", "server.js"]