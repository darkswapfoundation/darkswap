FROM rust:1.70-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    protobuf-compiler \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Cargo.toml and Cargo.lock
COPY Cargo.toml Cargo.lock ./
COPY darkswap-daemon/Cargo.toml ./darkswap-daemon/

# Create dummy source files to build dependencies
RUN mkdir -p src && \
    echo "fn main() {}" > src/main.rs && \
    mkdir -p darkswap-daemon/src && \
    echo "fn main() {}" > darkswap-daemon/src/main.rs

# Build dependencies
RUN cargo build --release --package darkswap-daemon

# Remove the dummy source files
RUN rm -rf src darkswap-daemon/src

# Copy the actual source code
COPY src ./src
COPY darkswap-daemon/src ./darkswap-daemon/src
COPY darkswap-sdk ./darkswap-sdk
COPY darkswap-p2p ./darkswap-p2p
COPY darkswap-lib ./darkswap-lib
COPY darkswap-support ./darkswap-support

# Build the application
RUN cargo build --release --package darkswap-daemon

# Create runtime image
FROM debian:bullseye-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl1.1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/target/release/darkswap-daemon /usr/local/bin/darkswap-daemon

# Create data directory
RUN mkdir -p /app/data && chown -R nobody:nogroup /app/data

# Switch to non-root user
USER nobody:nogroup

# Expose ports
EXPOSE 3000
EXPOSE 9101

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["darkswap-daemon", "--listen", "0.0.0.0:3000", "--data-dir", "/app/data"]