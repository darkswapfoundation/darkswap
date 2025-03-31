# DarkSwap Phase 1 Consolidated Work List

This document provides a comprehensive list of all remaining tasks for Phase 1 of the DarkSwap project, consolidating information from various planning documents into a single source of truth.

## Overview

Phase 1 focuses on implementing the core functionality of the DarkSwap SDK, including P2P networking, orderbook management, trade execution, and asset support. The following sections outline the remaining tasks for each component.

## Bitcoin Crate v0.30 Compatibility

### Library Tests
- ✅ Fixed compatibility issues in library code
- ✅ All library tests are now passing

### Integration Tests
- ✅ Updated `alkane_transfer_test.rs` to work with Bitcoin crate v0.30
- ✅ Updated `alkane_mock_test.rs` to work with Bitcoin crate v0.30
- ✅ Updated `bitcoin_utils_test.rs` to work with Bitcoin crate v0.30
- ✅ Updated `alkane_process_transaction_test.rs` to work with Bitcoin crate v0.30
- ✅ Updated `alkane_protocol_balance_test.rs` to work with Bitcoin crate v0.30
- ✅ Updated `runes_test.rs` to work with Bitcoin crate v0.30
- ✅ Updated `runestone_test.rs` to work with Bitcoin crate v0.30
- ✅ Updated `trade_tests.rs` to work with Bitcoin crate v0.30
- ✅ Updated `orderbook_tests.rs` to work with Bitcoin crate v0.30
- ✅ Updated `alkane_trade_standalone.rs` to work with Bitcoin crate v0.30
- ✅ Updated `alkane_validation_test.rs` to work with Bitcoin crate v0.30
- ✅ Updated `alkanes_test.rs` to work with Bitcoin crate v0.30
- ✅ Updated `alkanes_tests/alkane_protocol_test.rs` to work with Bitcoin crate v0.30
- ✅ All integration tests have been updated:
  - ✅ `alkanes_tests/alkane_trade_test.rs` (updated)
  - ✅ `alkanes_tests/alkane_trading_test.rs` (updated)
  - ✅ `alkanes_tests/alkane_utils_test.rs` (updated)
  - ✅ `alkanes_tests/alkane_validation_test.rs` (updated)
  - ✅ `alkanes_tests/thread_safe_alkane_protocol_test.rs` (updated)
  - ✅ `bitcoin_utils_standalone.rs` (updated)
  - ✅ `darkswap_tests.rs` (already compatible)
  - ✅ `runes_tests/rune_protocol_test.rs` (updated)
  - ✅ `runes_tests/thread_safe_rune_protocol_test.rs` (updated)
  - ✅ `wallet_tests.rs` (already compatible)
  - ✅ `webrtc_test.rs` (already compatible)

#### Common Changes Required for Integration Tests

1. **Import Changes**
   - Use `bitcoin::PublicKey` directly instead of `bitcoin::key::PublicKey`
   - Import `bitcoin::PrivateKey` for creating private keys
   - Import `bitcoin::secp256k1::Secp256k1` for the secp256k1 context

2. **Public Key Creation**
   - Replace `PublicKey::from_secret_key(&secp, &secret_key)` with `PublicKey::from_private_key(&secp, &private_key)`
   - Create private keys using `PrivateKey::from_slice(&[bytes], Network::Regtest)`

3. **Address Creation**
   - Replace `Address::<NetworkUnchecked>::new(network, payload)` with `Address::p2pkh(&pubkey, network)`
   - For other address types, use the appropriate constructor method

4. **Hash Handling**
   - Replace `PubkeyHash::from_raw_hash(hash)` with `PubkeyHash::from_hash(hash)`
   - For other hash types, use the appropriate constructor method

5. **Script Changes**
   - Replace `ScriptBuf` with `Script`
   - Update script building methods to use the Builder pattern
   - Use `bitcoin::blockdata::script::Builder` instead of `bitcoin::script::Builder`
   - Use `builder.push_slice(data.as_bytes())` instead of pushing bytes one by one
   - Remove unused imports like `blockdata::opcodes::all::OP_RETURN`

6. **Transaction Changes**
   - Convert `LockTime::ZERO` to `PackedLockTime` using `.into()`
   - Use `builder.into_script()` to create a script from a builder

7. **Address Creation**
   - Replace `address.require_network(network)` with network-specific address creation
   - Use `match network { ... }` to create addresses for different networks

8. **Memory Safety**
   - Replace unsafe code that directly manipulates memory with safe alternatives
   - Use methods like `set_balance_for_testing` instead of directly modifying memory

9. **Type Changes**
   - Update code to handle changes in type structures
   - For example, `TradeId` is now a newtype wrapper around a string with field `0`
   - Access fields correctly (e.g., `trade_id.0` instead of `trade_id.id`)

10. **Event Handling**
    - Update event names to match the current API (e.g., `OrderCancelled` instead of `OrderCanceled`)
    - Fix error handling for async operations with `await?.ok_or(anyhow::anyhow!("No event received"))?`

## Network Module

- [x] Implement P2P network using rust-libp2p
- [x] Add WebRTC transport for browser compatibility
- [x] Implement circuit relay functionality for NAT traversal
- [x] Add GossipSub for orderbook distribution
- [x] Implement Kademlia DHT for peer discovery
- [x] Create event handling system
- [ ] Add comprehensive unit tests
- [ ] Optimize performance

## Orderbook Module

- [x] Define order data structures
- [x] Implement orderbook management
- [x] Add order matching functionality
- [x] Implement order expiry and cleanup
- [x] Create thread-safe orderbook with mutex protection
- [ ] Add comprehensive unit tests
- [ ] Optimize performance

## Trade Module

- [x] Define trade data structures
- [x] Implement trade negotiation protocol
- [x] Add PSBT creation and signing
- [x] Implement transaction validation and broadcasting
- [ ] Add comprehensive unit tests
- [ ] Optimize performance

## Bitcoin Utilities Module

- [x] Create Bitcoin wallet interface
- [x] Implement simple wallet for testing
- [x] Add PSBT utilities for creating and signing PSBTs
- [x] Implement transaction validation and broadcasting
- [ ] Add comprehensive unit tests
- [ ] Optimize performance

## Runes Protocol

- [x] Complete Runestone structure implementation
- [x] Implement Runestone parsing from transactions
- [x] Add Runestone creation functionality
- [x] Implement rune transfer transaction creation
- [x] Add rune etching transaction creation
- [x] Implement rune transaction validation
- [ ] Add comprehensive unit tests
- [ ] Optimize performance

## Alkanes Protocol

- [x] Complete Alkane structure implementation
- [x] Implement alkane protocol parsing from runes
- [x] Add alkane creation functionality
- [x] Implement alkane transfer transaction creation
- [x] Add alkane etching transaction creation
- [x] Implement alkane transaction validation
- [ ] Add comprehensive unit tests
- [ ] Optimize performance

## Predicate Alkanes

- [x] Reference implementation of EqualityPredicateAlkane
- [x] Port EqualityPredicateAlkane to darkswap-sdk
- [x] Integrate predicate alkanes with trade execution
- [x] Implement predicate validation in transaction processing
- [ ] Create additional predicate types for different trade conditions
- [ ] Implement predicate composition for complex trade scenarios
- [ ] Add comprehensive unit tests
- [ ] Optimize performance

## Trading Integration

- [ ] Update orderbook to support runes and alkanes trading pairs
- [ ] Implement rune order creation and matching
- [ ] Add alkane order creation and matching
- [ ] Implement rune trade execution
- [ ] Add alkane trade execution
- [ ] Integrate with P2P network for order distribution
- [ ] Implement predicate-based trade conditions
- [ ] Add UI components for predicate creation and management
- [ ] Create predicate templates for common trade scenarios
- [ ] Add comprehensive unit tests
- [ ] Optimize performance

## WASM Bindings

- [x] Create JavaScript API for the Rust code
- [x] Implement event handling for order and trade events
- [x] Add wallet connection functionality
- [x] Create promise-based API for asynchronous operations
- [ ] Add comprehensive unit tests
- [ ] Optimize performance

## Configuration and Error Handling

- [x] Implement configuration system
- [x] Create error handling system
- [x] Add logging functionality
- [ ] Add comprehensive unit tests

## Documentation

### API Documentation
- [ ] Document network module API
- [ ] Document orderbook module API
- [ ] Document trade module API
- [ ] Document Bitcoin utilities module API
- [ ] Document runes protocol API
- [ ] Document alkanes protocol API
- [ ] Document predicate alkanes API
- [ ] Document WASM bindings API

### Usage Examples
- [ ] Create examples for P2P networking
- [ ] Add examples for orderbook management
- [ ] Create examples for trade execution
- [x] Add examples for runes functionality
- [x] Create examples for alkanes functionality
- [x] Develop examples for predicate alkanes

### Comprehensive Guides
- [ ] Create runes protocol guide
- [ ] Add alkanes protocol guide
- [ ] Develop predicate alkanes guide
- [ ] Create trading guide
- [ ] Add integration guide

## Implementation Approach

### Phase 1.1: Complete Bitcoin Crate v0.30 Compatibility ✅
1. ✅ Update remaining integration tests
2. ✅ Ensure all tests pass with the new Bitcoin crate version

### Phase 1.2: Implement Runes Support ✅
1. ✅ Implement the core runes protocol functionality
2. ✅ Extend the PSBT handling for runes
3. [x] Extend the orderbook for runes
4. [x] Add tests for runes functionality

### Phase 1.3: Implement Alkanes Support ✅
1. ✅ Implement the core alkanes protocol functionality
2. ✅ Extend the PSBT handling for alkanes
3. [x] Extend the orderbook for alkanes
4. [x] Add tests for alkanes functionality

### Phase 1.4: Implement Predicate Alkanes ✅
1. ✅ Port the EqualityPredicateAlkane reference implementation to darkswap-sdk
2. ✅ Integrate predicate alkanes with trade execution
3. ✅ Implement predicate validation in transaction processing
4. [x] Create additional predicate types for different trade conditions
5. [x] Add tests for predicate alkanes functionality

### Phase 1.5: Integration and Testing
1. [x] Integrate the runes and alkanes modules with the DarkSwap SDK
2. [x] Add comprehensive tests for the integrated functionality
3. [ ] Optimize performance
4. Create documentation

## Timeline

| Task | Duration | Dependencies |
|------|----------|--------------|
| ✅ Complete Bitcoin Crate v0.30 Compatibility | 1 week | None |
| ✅ Implement Runes Support | 1 week | Bitcoin Crate v0.30 Compatibility |
| ✅ Implement Alkanes Support | 1 week | Runes Support |
| ✅ Implement Predicate Alkanes | 1 week | Alkanes Support |
| [x] Integration and Testing | 1 week | All previous tasks |

## Conclusion

This consolidated work list outlines all the remaining tasks for Phase 1 of the DarkSwap project. By completing these tasks, we will have a functional DarkSwap SDK with P2P networking, orderbook management, trade execution, and support for Bitcoin, runes, and alkanes.

The work list is organized by component and includes dependencies and a timeline to help track progress and ensure that tasks are completed in the correct order. Regular reviews of the work list should be conducted to ensure that the project is on track and to make any necessary adjustments.