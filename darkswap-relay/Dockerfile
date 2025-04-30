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

# Build the relay server
RUN cargo build --release --bin darkswap-relay

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
COPY --from=builder /app/target/release/darkswap-relay /app/darkswap-relay

# Copy the configuration file
COPY config.toml /app/config.toml

# Expose the relay server port
EXPOSE 8080

# Set the entrypoint
ENTRYPOINT ["/app/darkswap-relay"]

# Set the default command
CMD ["--config", "/app/config.toml"]