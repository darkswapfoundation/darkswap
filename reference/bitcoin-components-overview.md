# Bitcoin Components Overview

This document provides an overview of the Bitcoin components used in DarkSwap.

## Introduction

DarkSwap is a decentralized peer-to-peer trading platform for Bitcoin, runes, and alkanes. It leverages several Bitcoin components to enable secure and efficient trading. This document explains these components and how they are used in DarkSwap.

## Bitcoin Components

### Bitcoin Network

The Bitcoin network is the foundation of DarkSwap. It provides the infrastructure for broadcasting transactions and confirming them. DarkSwap supports multiple Bitcoin networks:

- **Mainnet**: The main Bitcoin network
- **Testnet**: A test network for Bitcoin
- **Signet**: A more controlled test network
- **Regtest**: A local regression test network

DarkSwap uses the appropriate network based on the user's configuration.

### Bitcoin Transactions

Bitcoin transactions are the building blocks of trades in DarkSwap. A transaction consists of inputs and outputs:

- **Inputs**: References to previous transaction outputs that are being spent
- **Outputs**: New outputs that are being created, each with a value and a script

DarkSwap creates transactions that represent trades between users.

### PSBTs (Partially Signed Bitcoin Transactions)

PSBTs are a key component of DarkSwap's trade execution process. A PSBT is a standardized format for representing a Bitcoin transaction that is not fully signed yet. It allows multiple parties to collaborate on creating and signing a transaction.

The PSBT workflow in DarkSwap is as follows:

1. **PSBT Creation**: Both the maker and taker create PSBTs representing their side of the trade
2. **PSBT Exchange**: The maker and taker exchange PSBTs
3. **PSBT Combination**: The PSBTs are combined into a single PSBT
4. **PSBT Signing**: Both parties sign the combined PSBT
5. **Transaction Extraction**: The final transaction is extracted from the PSBT
6. **Transaction Broadcast**: The transaction is broadcast to the Bitcoin network

This approach ensures that the trade is atomic and secure.

### Bitcoin Scripts

Bitcoin scripts are used to specify the conditions under which Bitcoin can be spent. DarkSwap uses several types of scripts:

- **P2PKH (Pay to Public Key Hash)**: Standard script for paying to a Bitcoin address
- **P2WPKH (Pay to Witness Public Key Hash)**: SegWit version of P2PKH
- **P2SH (Pay to Script Hash)**: Script that allows more complex spending conditions
- **P2WSH (Pay to Witness Script Hash)**: SegWit version of P2SH

DarkSwap primarily uses P2WPKH for its transactions, as it provides a good balance of security and efficiency.

### Bitcoin Wallets

Bitcoin wallets are used to manage keys and sign transactions. DarkSwap includes a simple Bitcoin wallet implementation that supports:

- **Key Management**: Generating and storing keys
- **Address Generation**: Creating Bitcoin addresses
- **Transaction Signing**: Signing transactions
- **UTXO Management**: Tracking and selecting UTXOs

Users can also connect external wallets to DarkSwap.

### Runes

Runes are a protocol for creating fungible tokens on Bitcoin. They are implemented as special Bitcoin transactions with additional metadata. DarkSwap supports trading runes by:

1. **Runestone Creation**: Creating runestones that represent token transfers
2. **Runestone Validation**: Validating runestones to ensure they are valid
3. **Runestone Inclusion**: Including runestones in Bitcoin transactions

### Alkanes

Alkanes are a protocol built on top of runes. They provide additional functionality for token management. DarkSwap supports trading alkanes by:

1. **Alkane Creation**: Creating alkanes that represent token transfers
2. **Alkane Validation**: Validating alkanes to ensure they are valid
3. **Alkane Inclusion**: Including alkanes in Bitcoin transactions

## Implementation in DarkSwap

### Bitcoin Utils Module

The `bitcoin_utils` module in DarkSwap provides functionality for working with Bitcoin:

- **BitcoinWallet**: A simple Bitcoin wallet implementation
- **PsbtUtils**: Utilities for working with PSBTs

### Trade Module

The `trade` module in DarkSwap uses Bitcoin components to execute trades:

- **Trade Creation**: Creating trades between users
- **PSBT Creation**: Creating PSBTs for trades
- **PSBT Signing**: Signing PSBTs
- **Transaction Broadcasting**: Broadcasting transactions to the Bitcoin network

### Runes and Alkanes Support

DarkSwap includes support for runes and alkanes:

- **Runes Module**: Functionality for working with runes
- **Alkanes Module**: Functionality for working with alkanes

## Security Considerations

### Transaction Validation

DarkSwap implements comprehensive transaction validation to ensure security:

- **Input Validation**: Verify all inputs belong to the expected parties
- **Output Validation**: Ensure outputs match the trade parameters
- **Signature Validation**: Verify all signatures are valid
- **Fee Validation**: Ensure fees are reasonable and as expected

### Key Management

Secure key management is essential for DarkSwap:

- **Private Key Security**: Private keys are never exposed
- **Signing Security**: Signing is done locally
- **Key Storage**: Keys can be stored securely

### Transaction Broadcasting

DarkSwap ensures transactions are broadcast securely:

- **Network Selection**: Use the appropriate Bitcoin network
- **Broadcast Confirmation**: Confirm transactions are broadcast successfully
- **Transaction Monitoring**: Monitor transactions for confirmation

## Conclusion

Bitcoin components are at the core of DarkSwap's functionality. By leveraging PSBTs, Bitcoin scripts, and other Bitcoin features, DarkSwap provides a secure and efficient platform for trading Bitcoin, runes, and alkanes. The modular design of DarkSwap makes it easy to extend and enhance these components as needed.