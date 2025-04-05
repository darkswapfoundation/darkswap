# Dockerfile for DarkSwap Bridge

# Use the official Rust image as a builder
FROM rust:1.68 as builder

# Set working directory
WORKDIR /usr/src/darkswap-bridge

# Copy the entire project
COPY . .

# Build the project
RUN cargo build --release

# Use a smaller base image for the final image
FROM debian:bullseye-slim

# Install dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy the built binary from the builder stage
COPY --from=builder /usr/src/darkswap-bridge/target/release/darkswap-bridge .
COPY --from=builder /usr/src/darkswap-bridge/target/release/darkswap-wallet-adapter .
COPY --from=builder /usr/src/darkswap-bridge/target/release/darkswap-network-adapter .

# Create storage directory
RUN mkdir -p /app/storage

# Set environment variables
ENV RUST_LOG=info

# Expose ports
EXPOSE 8080

# Set the entrypoint
ENTRYPOINT ["./darkswap-bridge", "--server"]