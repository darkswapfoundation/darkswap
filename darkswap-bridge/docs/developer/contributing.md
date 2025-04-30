# Contributing to DarkSwap Bridge

Thank you for your interest in contributing to the DarkSwap Bridge project! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)
- [Issue Tracking](#issue-tracking)
- [Communication](#communication)

## Code of Conduct

We expect all contributors to follow our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before participating in the project.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork to your local machine
3. Add the original repository as a remote named "upstream"
4. Create a new branch for your changes
5. Make your changes
6. Push your changes to your fork
7. Submit a pull request

```bash
# Clone your fork
git clone https://github.com/your-username/darkswap-bridge.git
cd darkswap-bridge

# Add the original repository as a remote
git remote add upstream https://github.com/darkswap/darkswap-bridge.git

# Create a new branch
git checkout -b feature/your-feature-name

# Make your changes
# ...

# Push your changes
git push origin feature/your-feature-name
```

## Development Environment

### Prerequisites

- Rust 1.68 or later
- Node.js 18.x or later
- npm 9.x or later
- Docker (optional, for containerized development)

### Setup

1. Install Rust:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

2. Install Node.js and npm:
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
nvm install 18
nvm use 18

# Or download from nodejs.org
```

3. Install project dependencies:
```bash
# Rust dependencies
cargo build

# Web interface dependencies
cd web
npm install
cd ..

# Server dependencies
cd server
npm install
cd ..
```

### Running the Project

1. Start the bridge:
```bash
cargo run --bin darkswap-bridge -- --server
```

2. Start the server:
```bash
cd server
npm run dev
```

3. Start the web interface:
```bash
cd web
npm start
```

### Using Docker

Alternatively, you can use Docker Compose to run the entire project:

```bash
docker-compose up -d
```

## Project Structure

The project is structured as follows:

```
darkswap-bridge/
├── src/                  # Rust source code
│   ├── lib.rs            # Core bridge functionality
│   ├── integration.rs    # Integration with DarkSwap application
│   ├── auth.rs           # Authentication and encryption
│   ├── storage.rs        # Persistent storage
│   └── bin/              # Binary executables
│       ├── wallet_adapter.rs    # Adapter for wallet component
│       ├── network_adapter.rs   # Adapter for network component
│       ├── bridge_cli.rs        # CLI for interacting with the bridge
│       └── integration_example.rs # Example of using the integration
├── web/                  # Web interface
│   ├── src/
│   │   ├── contexts/     # React contexts for state management
│   │   ├── components/   # React components
│   │   └── pages/        # React pages
│   ├── package.json      # NPM package configuration
│   └── tsconfig.json     # TypeScript configuration
├── server/               # Backend server
│   ├── src/
│   │   ├── bridge/       # Bridge client
│   │   ├── routes/       # API routes
│   │   └── utils/        # Utility functions
│   ├── package.json      # NPM package configuration
│   └── tsconfig.json     # TypeScript configuration
├── docs/                 # Documentation
│   ├── user/             # User documentation
│   └── developer/        # Developer documentation
├── e2e/                  # End-to-end tests
├── performance/          # Performance tests
└── scripts/              # Utility scripts
```

## Coding Standards

### Rust

- Follow the [Rust Style Guide](https://doc.rust-lang.org/1.0.0/style/README.html)
- Use `cargo fmt` to format your code
- Use `cargo clippy` to check for common mistakes
- Write documentation comments for public APIs
- Use meaningful variable names
- Keep functions small and focused
- Use error handling with `Result` and `Option` types

### TypeScript

- Follow the [TypeScript Style Guide](https://github.com/basarat/typescript-book/blob/master/docs/styleguide/styleguide.md)
- Use ESLint to check for common mistakes
- Use Prettier to format your code
- Write JSDoc comments for public APIs
- Use meaningful variable names
- Keep functions small and focused
- Use async/await for asynchronous code

### Git Commits

- Write clear, concise commit messages
- Use the imperative mood in the subject line
- Limit the subject line to 50 characters
- Capitalize the subject line
- Do not end the subject line with a period
- Separate subject from body with a blank line
- Wrap the body at 72 characters
- Use the body to explain what and why vs. how

Example:
```
Add wallet balance endpoint

This endpoint allows clients to retrieve the current wallet balance.
It returns both confirmed and unconfirmed balances in satoshis.
```

## Pull Request Process

1. Ensure your code follows the coding standards
2. Update the documentation if necessary
3. Add tests for your changes
4. Ensure all tests pass
5. Update the CHANGELOG.md file if necessary
6. Submit a pull request to the `main` branch
7. Wait for a maintainer to review your pull request
8. Address any feedback from the maintainer
9. Once approved, your pull request will be merged

## Testing

### Running Tests

```bash
# Run Rust tests
cargo test

# Run web interface tests
cd web
npm test
cd ..

# Run server tests
cd server
npm test
cd ..

# Run end-to-end tests
npm run test:e2e

# Run performance tests
npm run test:performance
```

### Writing Tests

- Write unit tests for all new code
- Write integration tests for API endpoints
- Write end-to-end tests for user flows
- Write performance tests for critical paths
- Use meaningful test names
- Keep tests small and focused
- Use test fixtures for complex test data
- Mock external dependencies

## Documentation

### User Documentation

User documentation should be written in Markdown and stored in the `docs/user` directory. It should include:

- Getting started guide
- Installation instructions
- Usage instructions
- Troubleshooting guide

### Developer Documentation

Developer documentation should be written in Markdown and stored in the `docs/developer` directory. It should include:

- Architecture overview
- API reference
- WebSocket reference
- Contributing guide

### Code Documentation

- Write documentation comments for all public APIs
- Use `///` for documentation comments in Rust
- Use JSDoc comments in TypeScript
- Include examples where appropriate
- Explain parameters and return values
- Document error conditions

## Issue Tracking

We use GitHub Issues for tracking bugs, features, and other tasks. When creating an issue, please:

- Use a clear, descriptive title
- Provide a detailed description
- Include steps to reproduce for bugs
- Include expected and actual behavior for bugs
- Include screenshots or logs if applicable
- Use labels to categorize the issue
- Assign the issue to yourself if you plan to work on it

## Communication

- Use GitHub Issues for bug reports and feature requests
- Use GitHub Discussions for general questions and discussions
- Use GitHub Pull Requests for code reviews
- Join our [Discord server](https://discord.gg/darkswap) for real-time communication

## License

By contributing to this project, you agree that your contributions will be licensed under the project's license.