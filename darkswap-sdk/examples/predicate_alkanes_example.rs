use darkswap_sdk::{
    DarkSwap,
    config::Config,
    types::{Asset, AlkaneId, RuneId, PredicateId},
    orderbook::{Order, OrderSide},
};
use rust_decimal::Decimal;
use std::error::Error;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

// Mock wallet for the example
struct MockWallet {
    address: String,
    private_key: Vec<u8>,
}

impl MockWallet {
    fn new(address: &str) -> Self {
        Self {
            address: address.to_string(),
            private_key: vec![1, 2, 3, 4], // Mock private key
        }
    }
    
    fn address(&self) -> &str {
        &self.address
    }
    
    async fn sign_psbt(&self, psbt: Vec<u8>) -> Result<Vec<u8>, Box<dyn Error>> {
        // Mock signing - in a real implementation, this would use the private key to sign the PSBT
        Ok(psbt) // Just return the same PSBT for testing
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    println!("DarkSwap Predicate Alkanes Example");
    println!("==================================");
    
    // Initialize DarkSwap
    let config = Config::default();
    let mut darkswap = DarkSwap::new(config)?;
    
    // Start DarkSwap
    println!("Starting DarkSwap...");
    darkswap.start().await?;
    println!("DarkSwap started successfully.");
    
    // Create mock wallets
    let alice_wallet = MockWallet::new("alice-address");
    let bob_wallet = MockWallet::new("bob-address");
    
    println!("\nExample 1: Equality Predicate Alkane");
    println!("-----------------------------------");
    
    // Create an equality predicate alkane
    println!("Creating equality predicate alkane...");
    let equality_predicate = darkswap.create_equality_predicate_alkane(
        AlkaneId("alkane1".to_string()),
        100,
        AlkaneId("alkane2".to_string()),
        200,
    ).await?;
    
    println!("Equality predicate created with ID: {}", equality_predicate.id.0);
    println!("This predicate ensures that exactly 100 alkane1 and 200 alkane2 are exchanged.");
    
    // Create an order using the predicate
    let order = Order {
        id: darkswap.generate_order_id(),
        maker: alice_wallet.address().to_string(),
        base_asset: Asset::Alkane(AlkaneId("alkane1".to_string())),
        quote_asset: Asset::Alkane(AlkaneId("alkane2".to_string())),
        side: OrderSide::Sell,
        amount: Decimal::new(100, 0),
        price: Decimal::new(2, 0), // 1 alkane1 = 2 alkane2
        status: darkswap.order_status_open(),
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        expiry: None,
    };
    
    // Add order to orderbook
    println!("Adding order to orderbook...");
    darkswap.add_order(order.clone()).await?;
    println!("Order added with ID: {}", order.id.0);
    
    // Bob takes Alice's order
    println!("\nBob takes Alice's order...");
    let trade = darkswap.create_trade(
        &order.id,
        bob_wallet.address().to_string(),
        order.amount,
    ).await?;
    println!("Trade created with ID: {}", trade.id.0);
    
    // Execute trade with predicate
    println!("Executing trade with equality predicate...");
    let executed_trade = darkswap.execute_trade_with_predicate(
        &trade.id,
        &equality_predicate.id,
        |psbt| bob_wallet.sign_psbt(psbt),
        |psbt| alice_wallet.sign_psbt(psbt),
    ).await?;
    
    println!("Trade executed successfully!");
    println!("Trade status: {:?}", executed_trade.status);
    
    println!("\nExample 2: Time-Locked Predicate Alkane");
    println!("--------------------------------------");
    
    // Create a time-locked predicate alkane
    println!("Creating time-locked predicate alkane...");
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
    let deadline = now + 3600; // 1 hour from now
    
    let time_locked_predicate = darkswap.create_time_locked_predicate_alkane(
        AlkaneId("alkane3".to_string()),
        100,
        deadline,
    ).await?;
    
    println!("Time-locked predicate created with ID: {}", time_locked_predicate.id.0);
    println!("This predicate ensures that the trade can only be executed before the deadline.");
    
    // Create an order using the predicate
    let time_locked_order = Order {
        id: darkswap.generate_order_id(),
        maker: alice_wallet.address().to_string(),
        base_asset: Asset::Alkane(AlkaneId("alkane3".to_string())),
        quote_asset: Asset::Bitcoin,
        side: OrderSide::Sell,
        amount: Decimal::new(100, 0),
        price: Decimal::new(1, 2), // 0.01 BTC per alkane3
        status: darkswap.order_status_open(),
        timestamp: now,
        expiry: Some(deadline),
    };
    
    // Add order to orderbook
    println!("Adding time-locked order to orderbook...");
    darkswap.add_order(time_locked_order.clone()).await?;
    println!("Order added with ID: {}", time_locked_order.id.0);
    
    // Bob takes Alice's time-locked order
    println!("\nBob takes Alice's time-locked order...");
    let time_locked_trade = darkswap.create_trade(
        &time_locked_order.id,
        bob_wallet.address().to_string(),
        time_locked_order.amount,
    ).await?;
    println!("Trade created with ID: {}", time_locked_trade.id.0);
    
    // Execute trade with time-locked predicate
    println!("Executing trade with time-locked predicate...");
    let executed_time_locked_trade = darkswap.execute_trade_with_predicate(
        &time_locked_trade.id,
        &time_locked_predicate.id,
        |psbt| bob_wallet.sign_psbt(psbt),
        |psbt| alice_wallet.sign_psbt(psbt),
    ).await?;
    
    println!("Trade executed successfully!");
    println!("Trade status: {:?}", executed_time_locked_trade.status);
    
    println!("\nExample 3: Multi-Signature Predicate Alkane");
    println!("-----------------------------------------");
    
    // Create a multi-signature predicate alkane
    println!("Creating multi-signature predicate alkane...");
    let charlie_wallet = MockWallet::new("charlie-address");
    
    let multi_sig_predicate = darkswap.create_multi_signature_predicate_alkane(
        AlkaneId("alkane4".to_string()),
        100,
        vec![
            alice_wallet.address().to_string(),
            bob_wallet.address().to_string(),
            charlie_wallet.address().to_string(),
        ],
        2, // Requires 2 of 3 signatures
    ).await?;
    
    println!("Multi-signature predicate created with ID: {}", multi_sig_predicate.id.0);
    println!("This predicate requires 2 out of 3 signatures to execute the trade.");
    
    // Create an order using the predicate
    let multi_sig_order = Order {
        id: darkswap.generate_order_id(),
        maker: alice_wallet.address().to_string(),
        base_asset: Asset::Alkane(AlkaneId("alkane4".to_string())),
        quote_asset: Asset::Rune(RuneId(1)),
        side: OrderSide::Sell,
        amount: Decimal::new(100, 0),
        price: Decimal::new(10, 0), // 10 runes per alkane4
        status: darkswap.order_status_open(),
        timestamp: now,
        expiry: None,
    };
    
    // Add order to orderbook
    println!("Adding multi-signature order to orderbook...");
    darkswap.add_order(multi_sig_order.clone()).await?;
    println!("Order added with ID: {}", multi_sig_order.id.0);
    
    // Bob takes Alice's multi-signature order
    println!("\nBob takes Alice's multi-signature order...");
    let multi_sig_trade = darkswap.create_trade(
        &multi_sig_order.id,
        bob_wallet.address().to_string(),
        multi_sig_order.amount,
    ).await?;
    println!("Trade created with ID: {}", multi_sig_trade.id.0);
    
    // Execute trade with multi-signature predicate
    println!("Executing trade with multi-signature predicate...");
    let executed_multi_sig_trade = darkswap.execute_trade_with_multi_sig_predicate(
        &multi_sig_trade.id,
        &multi_sig_predicate.id,
        vec![
            |psbt| alice_wallet.sign_psbt(psbt),
            |psbt| bob_wallet.sign_psbt(psbt),
        ],
    ).await?;
    
    println!("Trade executed successfully!");
    println!("Trade status: {:?}", executed_multi_sig_trade.status);
    
    println!("\nExample 4: Composite Predicate Alkane");
    println!("-----------------------------------");
    
    // Create a composite predicate alkane that combines time-locked and equality predicates
    println!("Creating composite predicate alkane...");
    
    // First, create the individual predicates
    let time_predicate = darkswap.create_time_locked_predicate_alkane(
        AlkaneId("alkane5".to_string()),
        100,
        deadline,
    ).await?;
    
    let equality_predicate2 = darkswap.create_equality_predicate_alkane(
        AlkaneId("alkane5".to_string()),
        100,
        AlkaneId("alkane6".to_string()),
        150,
    ).await?;
    
    // Create a composite predicate that requires both conditions
    let composite_predicate = darkswap.create_composite_predicate_alkane(
        vec![time_predicate.id.clone(), equality_predicate2.id.clone()],
        true, // AND operator (both predicates must be satisfied)
    ).await?;
    
    println!("Composite predicate created with ID: {}", composite_predicate.id.0);
    println!("This predicate requires both time and equality conditions to be met.");
    
    // Create an order using the composite predicate
    let composite_order = Order {
        id: darkswap.generate_order_id(),
        maker: alice_wallet.address().to_string(),
        base_asset: Asset::Alkane(AlkaneId("alkane5".to_string())),
        quote_asset: Asset::Alkane(AlkaneId("alkane6".to_string())),
        side: OrderSide::Sell,
        amount: Decimal::new(100, 0),
        price: Decimal::new(15, 1), // 1.5 alkane6 per alkane5
        status: darkswap.order_status_open(),
        timestamp: now,
        expiry: Some(deadline),
    };
    
    // Add order to orderbook
    println!("Adding composite order to orderbook...");
    darkswap.add_order(composite_order.clone()).await?;
    println!("Order added with ID: {}", composite_order.id.0);
    
    // Bob takes Alice's composite order
    println!("\nBob takes Alice's composite order...");
    let composite_trade = darkswap.create_trade(
        &composite_order.id,
        bob_wallet.address().to_string(),
        composite_order.amount,
    ).await?;
    println!("Trade created with ID: {}", composite_trade.id.0);
    
    // Execute trade with composite predicate
    println!("Executing trade with composite predicate...");
    let executed_composite_trade = darkswap.execute_trade_with_predicate(
        &composite_trade.id,
        &composite_predicate.id,
        |psbt| bob_wallet.sign_psbt(psbt),
        |psbt| alice_wallet.sign_psbt(psbt),
    ).await?;
    
    println!("Trade executed successfully!");
    println!("Trade status: {:?}", executed_composite_trade.status);
    
    // Shutdown DarkSwap
    println!("\nShutting down DarkSwap...");
    darkswap.shutdown().await?;
    println!("DarkSwap shutdown successfully.");
    
    Ok(())
}