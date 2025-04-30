# Contributing to DarkSwap

Thank you for your interest in contributing to DarkSwap! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
   - [Setting Up the Development Environment](#setting-up-the-development-environment)
   - [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
   - [Branching Strategy](#branching-strategy)
   - [Commit Guidelines](#commit-guidelines)
   - [Pull Request Process](#pull-request-process)
4. [Coding Standards](#coding-standards)
   - [Rust](#rust)
   - [TypeScript](#typescript)
   - [Documentation](#documentation)
   - [Testing](#testing)
5. [Issue Tracking](#issue-tracking)
   - [Bug Reports](#bug-reports)
   - [Feature Requests](#feature-requests)
   - [Working on Issues](#working-on-issues)
6. [Release Process](#release-process)
7. [Community](#community)

## Code of Conduct

We expect all contributors to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before participating in the project.

## Getting Started

### Setting Up the Development Environment

#### Prerequisites

- Rust (latest stable version)
- Node.js (v16 or later)
- npm (v7 or later)
- Git
- Docker (for running tests and services)
- WebAssembly toolchain (wasm-pack, wasm-bindgen)

#### Installation

1. Clone the repository:

```bash
git clone https://github.com/darkswap/darkswap.git
cd darkswap
```

2. Install Rust dependencies:

```bash
rustup update stable
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
```

3. Install Node.js dependencies:

```bash
npm install
```

4. Build the project:

```bash
./build.sh --all
```

5. Run the tests:

```bash
./run-tests.sh
```

### Project Structure

The DarkSwap codebase is organized as a monorepo with the following structure:

```
darkswap/
├── darkswap-sdk/       # SDK libraries
├── darkswap-cli/       # Command-line interface
├── darkswap-daemon/    # Background service
├── darkswap-relay/     # Relay server
├── darkswap-p2p/       # P2P networking library
├── darkswap-lib/       # Core libraries
├── darkswap-wasm/      # WebAssembly modules
├── darkswap-web-sys/   # Web system bindings
├── web/                # Web client
└── docs/               # Documentation
```

For more details on the architecture, see the [Architecture Documentation](architecture.md).

## Development Workflow

### Branching Strategy

We use a modified version of the [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/) branching strategy:

- `main`: The main branch contains the latest stable release.
- `develop`: The development branch contains the latest development changes.
- `feature/*`: Feature branches are used for developing new features.
- `bugfix/*`: Bugfix branches are used for fixing bugs.
- `release/*`: Release branches are used for preparing releases.
- `hotfix/*`: Hotfix branches are used for urgent fixes to production.

### Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Changes that do not affect the meaning of the code (formatting, etc.)
- `refactor`: Code changes that neither fix a bug nor add a feature
- `perf`: Performance improvements
- `test`: Adding or fixing tests
- `chore`: Changes to the build process or auxiliary tools

Examples:
```
feat(orderbook): add support for limit orders
fix(wallet): correct fee calculation for large transactions
docs(api): update authentication documentation
```

### Pull Request Process

1. Create a new branch from `develop` (or `main` for hotfixes).
2. Make your changes and commit them following the commit guidelines.
3. Push your branch to the repository.
4. Create a pull request against the `develop` branch (or `main` for hotfixes).
5. Ensure that all CI checks pass.
6. Request a review from at least one maintainer.
7. Address any feedback from the reviewers.
8. Once approved, the pull request will be merged by a maintainer.

## Coding Standards

### Rust

We follow the [Rust Style Guide](https://doc.rust-lang.org/1.0.0/style/README.html) with the following additions:

- Use 4 spaces for indentation.
- Keep lines under 100 characters.
- Use meaningful variable names.
- Add documentation comments for public APIs.
- Use `rustfmt` to format your code.
- Use `clippy` to catch common mistakes.

### TypeScript

We follow the [TypeScript Style Guide](https://github.com/basarat/typescript-book/blob/master/docs/styleguide/styleguide.md) with the following additions:

- Use 2 spaces for indentation.
- Keep lines under 100 characters.
- Use meaningful variable names.
- Add JSDoc comments for public APIs.
- Use `prettier` to format your code.
- Use `eslint` to catch common mistakes.

### Documentation

- All public APIs should be documented.
- Use Markdown for documentation files.
- Keep documentation up-to-date with code changes.
- Include examples where appropriate.

### Testing

- Write tests for all new features and bug fixes.
- Maintain high test coverage.
- Use integration tests for complex functionality.
- Use end-to-end tests for critical user flows.

## Issue Tracking

We use GitHub Issues for tracking bugs, features, and other tasks.

### Bug Reports

When reporting a bug, please include:

- A clear and descriptive title.
- Steps to reproduce the bug.
- Expected behavior.
- Actual behavior.
- Screenshots or logs if applicable.
- Environment information (OS, browser, version, etc.).

### Feature Requests

When requesting a feature, please include:

- A clear and descriptive title.
- A detailed description of the feature.
- The problem it solves or the value it adds.
- Any relevant examples or mockups.

### Working on Issues

1. Find an issue you want to work on.
2. Comment on the issue to express your interest.
3. Wait for a maintainer to assign the issue to you.
4. Create a branch and start working on the issue.
5. Submit a pull request when you're ready.

## Release Process

1. Create a release branch from `develop`.
2. Update the version number in relevant files.
3. Update the changelog.
4. Create a pull request against `main`.
5. Once approved and merged, create a tag for the release.
6. Build and publish the release artifacts.
7. Merge `main` back into `develop`.

## Community

- [Discord](https://discord.gg/darkswap): For real-time discussion and help.
- [Forum](https://forum.darkswap.io): For longer discussions and announcements.
- [Twitter](https://twitter.com/darkswap): For news and updates.

Thank you for contributing to DarkSwap!