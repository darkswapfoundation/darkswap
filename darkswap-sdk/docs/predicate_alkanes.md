# Predicate Alkanes Guide

This guide provides comprehensive information about predicate alkanes in DarkSwap, including their purpose, types, and usage.

## What are Predicate Alkanes?

Predicate alkanes are specialized alkane contracts that enforce constraints on their inputs. They are particularly useful when composed with protostones that should edict value conditionally based on an agreement between different signers on inputs to a transaction.

In the context of DarkSwap, predicate alkanes enable secure and conditional trading by enforcing specific rules that must be satisfied for a trade to be valid.

## Types of Predicate Alkanes

DarkSwap supports several types of predicate alkanes, each serving a different purpose:

### 1. Equality Predicate Alkane

The Equality Predicate Alkane ensures that exactly two alkanes are present in the transaction and that they match the required sequence numbers and amounts.

**Use Case**: Ensuring that a trade involves the exact specified amounts of two assets.

**Example**:
```rust
let equality_predicate = darkswap.create_equality_predicate_alkane(
    AlkaneId("alkane1".to_string()),
    100,
    AlkaneId("alkane2".to_string()),
    200,
).await?;
```

This creates a predicate that ensures exactly 100 units of alkane1 and 200 units of alkane2 are exchanged.

### 2. Time-Locked Predicate Alkane

The Time-Locked Predicate Alkane enforces time constraints on alkane transactions, allowing them to be executed only before, after, or between specific timestamps.

**Use Cases**:
- Creating offers that expire after a certain time
- Implementing time-based vesting schedules
- Setting up future-dated trades

**Example**:
```rust
// Create a predicate that can only be executed before a deadline
let deadline = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() + 3600; // 1 hour from now
let time_locked_predicate = darkswap.create_time_locked_predicate_alkane(
    AlkaneId("alkane1".to_string()),
    100,
    deadline,
).await?;
```

### 3. Multi-Signature Predicate Alkane

The Multi-Signature Predicate Alkane requires multiple signatures for alkane transactions, implementing an m-of-n signature scheme.

**Use Cases**:
- Escrow services requiring approval from multiple parties
- Shared custody of assets
- Governance mechanisms

**Example**:
```rust
let multi_sig_predicate = darkswap.create_multi_signature_predicate_alkane(
    AlkaneId("alkane1".to_string()),
    100,
    vec![
        "address1".to_string(),
        "address2".to_string(),
        "address3".to_string(),
    ],
    2, // Requires 2 of 3 signatures
).await?;
```

### 4. Composite Predicate Alkane

The Composite Predicate Alkane combines multiple predicates using logical operators (AND/OR), allowing for complex trade conditions.

**Use Cases**:
- Complex trade agreements with multiple conditions
- Combining time constraints with equality requirements
- Implementing fallback mechanisms

**Example**:
```rust
// Create a composite predicate that requires both time and equality conditions
let composite_predicate = darkswap.create_composite_predicate_alkane(
    vec![time_predicate_id, equality_predicate_id],
    true, // AND operator (both predicates must be satisfied)
).await?;
```

## Implementation Details

### Opcode-Based Dispatch

Predicate alkanes use opcode-based dispatch for different operations:

- **Opcode 0**: Initialize()
- **Opcode 7**: Filter(sequence_left, amount_left, sequence_right, amount_right)

### Security Features

1. **Initialization Guard**: Prevents multiple initializations, which could lead to unexpected behavior.
2. **Input Validation**: Validates all inputs to prevent unexpected behavior or exploitation.
3. **Error Handling**: Provides comprehensive error messages to aid in debugging and understanding failures.
4. **No Unsafe Code**: Avoids unsafe Rust code to prevent memory safety issues.

## Integration with DarkSwap

### Creating Predicate Alkanes

```rust
// Create an equality predicate alkane
let equality_predicate = darkswap.create_equality_predicate_alkane(
    AlkaneId("alkane1".to_string()),
    100,
    AlkaneId("alkane2".to_string()),
    200,
).await?;
```

### Trading with Predicate Alkanes

```rust
// Create a trade
let trade = darkswap.create_trade(
    &order_id,
    taker_address,
    amount,
).await?;

// Execute trade with predicate
let executed_trade = darkswap.execute_trade_with_predicate(
    &trade.id,
    &predicate.id,
    |psbt| taker_wallet.sign_psbt(psbt),
    |psbt| maker_wallet.sign_psbt(psbt),
).await?;
```

### Validating Predicate Conditions

When executing a trade with a predicate alkane, DarkSwap performs the following validation steps:

1. **Predicate Validation**: Checks that the predicate conditions are satisfied.
2. **Transaction Validation**: Ensures the transaction is valid according to Bitcoin rules.
3. **Signature Verification**: Verifies that all required signatures are present and valid.
4. **Amount Verification**: Confirms that the amounts match the predicate requirements.

## Best Practices

1. **Test Thoroughly**: Always test predicate alkanes with small amounts before using them for significant trades.
2. **Use Appropriate Time Buffers**: When using time-locked predicates, include appropriate buffers to account for transaction confirmation times.
3. **Consider Fallbacks**: Use composite predicates to implement fallback mechanisms for critical trades.
4. **Validate Inputs**: Always validate inputs to predicates to prevent unexpected behavior.
5. **Document Predicates**: Maintain clear documentation of predicate conditions for all parties involved in a trade.

## Advanced Usage

### Escrow with Predicate Alkanes

You can implement an escrow service using predicate alkanes:

```rust
// Create a multi-signature predicate with buyer, seller, and arbitrator
let escrow_predicate = darkswap.create_multi_signature_predicate_alkane(
    AlkaneId("alkane1".to_string()),
    100,
    vec![buyer_address, seller_address, arbitrator_address],
    2, // Requires 2 of 3 signatures
).await?;
```

### Time-Limited Offers

Create offers that automatically expire after a certain time:

```rust
// Create a time-locked predicate that expires after 24 hours
let deadline = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() + 86400;
let offer_predicate = darkswap.create_time_locked_predicate_alkane(
    AlkaneId("alkane1".to_string()),
    100,
    deadline,
).await?;
```

### Atomic Swaps

Implement atomic swaps between different assets:

```rust
// Create an equality predicate for an atomic swap
let atomic_swap_predicate = darkswap.create_equality_predicate_alkane(
    AlkaneId("alkane1".to_string()),
    100,
    AlkaneId("alkane2".to_string()),
    200,
).await?;
```

## Troubleshooting

### Common Issues

1. **Predicate Validation Failure**: Ensure that all predicate conditions are met before executing the trade.
2. **Time-Locked Predicate Expired**: Check that the current time is within the valid range for time-locked predicates.
3. **Insufficient Signatures**: Verify that all required signatures are provided for multi-signature predicates.
4. **Incorrect Amounts**: Confirm that the transaction involves the exact amounts specified in the predicate.

### Debugging Tips

1. **Check Predicate Parameters**: Verify that the predicate was created with the correct parameters.
2. **Inspect Transaction Details**: Examine the transaction details to ensure they match the predicate requirements.
3. **Verify Signatures**: Confirm that all signatures are valid and from the correct parties.
4. **Check Timestamps**: For time-locked predicates, verify that the current time is within the valid range.

## Conclusion

Predicate alkanes provide a powerful mechanism for implementing secure and conditional trading in DarkSwap. By understanding the different types of predicates and their usage, you can create complex trading agreements that enforce specific conditions and protect all parties involved.

For more information, refer to the [DarkSwap SDK documentation](https://docs.darkswap.xyz) or check out the example code in the `examples/predicate_alkanes_example.rs` file.