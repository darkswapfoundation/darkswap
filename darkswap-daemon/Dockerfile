FROM rust:1.68-slim-bullseye as builder

WORKDIR /app

# Install dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the source code
COPY . .

# Build the daemon
RUN cargo build --release --bin darkswap-daemon

# Create a minimal runtime image
FROM debian:bullseye-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl1.1 \
    && rm -rf /var/lib/apt/lists/*

# Copy the binary from the builder stage
COPY --from=builder /app/target/release/darkswap-daemon /app/darkswap-daemon

# Copy the configuration file
COPY darkswap-daemon/config.toml /app/config.toml

# Create data directory
RUN mkdir -p /app/data

# Expose the API port
EXPOSE 3000

# Set the entrypoint
ENTRYPOINT ["/app/darkswap-daemon"]

# Set the default command
CMD ["--config", "/app/config.toml"]