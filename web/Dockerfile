FROM node:16-alpine as builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy the source code
COPY . .

# Build the web interface
RUN npm run build:web:prod

# Create a minimal runtime image
FROM nginx:alpine

# Copy the built files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the nginx configuration
COPY web/nginx.conf /etc/nginx/conf.d/default.conf

# Expose the web server port
EXPOSE 80

# Set the entrypoint
ENTRYPOINT ["nginx", "-g", "daemon off;"]