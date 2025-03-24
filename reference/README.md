# DarkSwap Reference Documentation

This directory contains reference documentation for the DarkSwap project, a decentralized peer-to-peer trading platform for Bitcoin, runes, and alkanes.

## Table of Contents

- [Overview](#overview)
- [Document Categories](#document-categories)
- [Key Documents](#key-documents)
- [How to Use This Documentation](#how-to-use-this-documentation)
- [Contributing](#contributing)

## Overview

The reference documentation provides in-depth information about the DarkSwap project, including architecture, implementation details, and analysis of related projects. It serves as a knowledge base for developers working on the project and for users who want to understand how DarkSwap works.

## Document Categories

The reference documentation is organized into the following categories:

### Overview Documents

These documents provide high-level overviews of the DarkSwap project and its components:

- [DarkSwap vs. PintSwap](darkswap-vs-pintswap.md) - Detailed comparison of DarkSwap and PintSwap architectures
- [DarkSwap Architecture Analysis](darkswap-architecture-analysis.md) - Analysis of DarkSwap's architecture
- [Core Functionality Analysis](core-functionality-analysis.md) - Analysis of DarkSwap's core functionality

### Implementation Guides

These documents provide detailed guides for implementing specific features:

- [WebRTC Implementation Guide](webrtc-implementation-guide.md) - Guide for implementing WebRTC support in rust-libp2p
- [Runes and Alkanes Implementation Plan](runes-alkanes-implementation-plan.md) - Plan for adding support for Bitcoin-based assets

### Analysis Documents

These documents provide analysis of related projects and technologies:

- [PintSwap Overview](pintswap-overview.md) - Overview of the PintSwap project
- [Bitcoin Components Overview](bitcoin-components-overview.md) - Overview of Bitcoin components used in DarkSwap
- [P2P Networking Overview](p2p-networking-overview.md) - Overview of P2P networking in DarkSwap
- [Subfrost Analysis](subfrost-analysis-updated.md) - Analysis of the Subfrost project's P2P networking implementation

## Key Documents

### [DarkSwap vs. PintSwap](darkswap-vs-pintswap.md)

This document provides a detailed comparison between DarkSwap and PintSwap architectures, highlighting the key differences, improvements, and design decisions. It covers programming language and runtime, supported assets, trade execution, P2P networking, orderbook management, and security model.

### [WebRTC Implementation Guide](webrtc-implementation-guide.md)

This document provides a guide for implementing WebRTC support in rust-libp2p for the DarkSwap project. It covers the key components, challenges, and solutions for enabling browser compatibility through WebRTC. It includes implementation approaches, circuit relay implementation, signaling implementation, browser integration, challenges and solutions, and testing.

### [Runes and Alkanes Implementation Plan](runes-alkanes-implementation-plan.md)

This document outlines the plan for implementing support for runes and alkanes in the DarkSwap SDK. It covers the key components, challenges, and solutions for enabling trading of these Bitcoin-based assets. It includes implementation approaches for the runes protocol, alkanes protocol, PSBT extensions, and orderbook extensions.

### [Subfrost Analysis](subfrost-analysis-updated.md)

This document provides an in-depth analysis of the Subfrost project's P2P networking implementation, focusing on its circuit relay functionality and QUIC transport. It outlines how to adapt these components for DarkSwap using WebRTC for browser compatibility.

## How to Use This Documentation

The reference documentation is designed to be used in the following ways:

1. **Understanding the Project**: Read the overview documents to understand the DarkSwap project and its components.
2. **Implementing Features**: Use the implementation guides to implement specific features.
3. **Learning from Related Projects**: Read the analysis documents to learn from related projects and technologies.
4. **Finding Specific Information**: Use the index.md file to find specific information.

## Contributing

Contributions to the reference documentation are welcome! If you find errors or have suggestions for improvement, please submit a pull request or open an issue.

When contributing to the reference documentation, please follow these guidelines:

1. **Use Markdown**: All documentation should be written in Markdown format.
2. **Be Clear and Concise**: Write clear and concise documentation that is easy to understand.
3. **Include Examples**: Include examples to illustrate concepts and implementation details.
4. **Keep It Up-to-Date**: Update the documentation when the project changes.
5. **Follow the Structure**: Follow the existing structure and organization of the documentation.

## License

This documentation is licensed under the MIT License - see the LICENSE file for details.