# DarkSwap Relay Server Dockerfile
# Multi-stage build for smaller image size

# Build stage
FROM rust:1.70-slim-bullseye as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    cmake \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy Cargo.toml and Cargo.lock
COPY Cargo.toml ./

# Create dummy source file to build dependencies
RUN mkdir -p src && \
    echo "fn main() {}" > src/main.rs

# Build dependencies
RUN cargo build --release

# Remove the dummy source file
RUN rm -rf src

# Copy the actual source code
COPY . .

# Build the application
RUN cargo build --release

# Runtime stage
FROM debian:bullseye-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl1.1 \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/target/release/darkswap-relay /app/darkswap-relay

# Copy configuration files
COPY config.toml /app/config.toml
COPY generate-certs.sh /app/generate-certs.sh

# Make the certificate generator executable
RUN chmod +x /app/generate-certs.sh

# Create certificates directory
RUN mkdir -p /app/certs

# Generate certificates
RUN ./generate-certs.sh --cert-dir /app/certs

# Expose ports
# 9002: Signaling server
# 9003: WebRTC server
# 9090: Metrics server
EXPOSE 9002 9003 9090

# Set environment variables
ENV RUST_LOG=info

# Run the application
CMD ["/app/darkswap-relay", "--config", "/app/config.toml"]