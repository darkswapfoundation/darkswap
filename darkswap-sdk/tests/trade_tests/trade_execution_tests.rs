use darkswap_sdk::{
    DarkSwap,
    config::Config,
    orderbook::{Order, OrderId, OrderSide, OrderStatus},
    types::{Asset, RuneId, AlkaneId, Trade, TradeStatus},
};
use rust_decimal::Decimal;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::time::sleep;

// Mock wallet for testing
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
    
    async fn sign_psbt(&self, psbt: Vec<u8>) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        // Mock signing - in a real implementation, this would use the private key to sign the PSBT
        Ok(psbt) // Just return the same PSBT for testing
    }
}

#[tokio::test]
async fn test_create_trade() {
    // Initialize DarkSwap
    let config = Config::default();
    let mut darkswap = DarkSwap::new(config).expect("Failed to create DarkSwap instance");
    
    // Start DarkSwap
    darkswap.start().await.expect("Failed to start DarkSwap");
    
    // Create mock wallets
    let maker_wallet = MockWallet::new("maker-address");
    let taker_wallet = MockWallet::new("taker-address");
    
    // Create an order
    let order = Order {
        id: OrderId("test-order-1".to_string()),
        maker: maker_wallet.address().to_string(),
        base_asset: Asset::Bitcoin,
        quote_asset: Asset::Rune(RuneId(1)),
        side: OrderSide::Sell,
        amount: Decimal::new(100, 0),
        price: Decimal::new(50, 0),
        status: OrderStatus::Open,
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        expiry: None,
    };
    
    // Add order to orderbook
    darkswap.add_order(order.clone()).await.expect("Failed to add order");
    
    // Create a trade
    let trade = darkswap.create_trade(
        &order.id,
        taker_wallet.address().to_string(),
        order.amount,
    ).await.expect("Failed to create trade");
    
    // Verify trade properties
    assert_eq!(trade.order_id, order.id);
    assert_eq!(trade.maker, maker_wallet.address());
    assert_eq!(trade.taker, taker_wallet.address());
    assert_eq!(trade.amount, order.amount);
    assert_eq!(trade.status, TradeStatus::Created);
    
    // Shutdown DarkSwap
    darkswap.shutdown().await.expect("Failed to shutdown DarkSwap");
}

#[tokio::test]
async fn test_execute_trade() {
    // Initialize DarkSwap
    let config = Config::default();
    let mut darkswap = DarkSwap::new(config).expect("Failed to create DarkSwap instance");
    
    // Start DarkSwap
    darkswap.start().await.expect("Failed to start DarkSwap");
    
    // Create mock wallets
    let maker_wallet = MockWallet::new("maker-address");
    let taker_wallet = MockWallet::new("taker-address");
    
    // Create an order
    let order = Order {
        id: OrderId("test-order-2".to_string()),
        maker: maker_wallet.address().to_string(),
        base_asset: Asset::Bitcoin,
        quote_asset: Asset::Rune(RuneId(1)),
        side: OrderSide::Sell,
        amount: Decimal::new(100, 0),
        price: Decimal::new(50, 0),
        status: OrderStatus::Open,
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        expiry: None,
    };
    
    // Add order to orderbook
    darkswap.add_order(order.clone()).await.expect("Failed to add order");
    
    // Create a trade
    let trade = darkswap.create_trade(
        &order.id,
        taker_wallet.address().to_string(),
        order.amount,
    ).await.expect("Failed to create trade");
    
    // Execute trade
    let executed_trade = darkswap.execute_trade(
        &trade.id,
        |psbt| taker_wallet.sign_psbt(psbt),
        |psbt| maker_wallet.sign_psbt(psbt),
    ).await.expect("Failed to execute trade");
    
    // Verify trade status
    assert_eq!(executed_trade.status, TradeStatus::Completed);
    
    // Verify order status
    let updated_order = darkswap.get_order(&order.id).await.expect("Failed to get order");
    assert_eq!(updated_order.status, OrderStatus::Filled);
    
    // Shutdown DarkSwap
    darkswap.shutdown().await.expect("Failed to shutdown DarkSwap");
}

#[tokio::test]
async fn test_partial_trade() {
    // Initialize DarkSwap
    let config = Config::default();
    let mut darkswap = DarkSwap::new(config).expect("Failed to create DarkSwap instance");
    
    // Start DarkSwap
    darkswap.start().await.expect("Failed to start DarkSwap");
    
    // Create mock wallets
    let maker_wallet = MockWallet::new("maker-address");
    let taker_wallet = MockWallet::new("taker-address");
    
    // Create an order
    let order = Order {
        id: OrderId("test-order-3".to_string()),
        maker: maker_wallet.address().to_string(),
        base_asset: Asset::Bitcoin,
        quote_asset: Asset::Rune(RuneId(1)),
        side: OrderSide::Sell,
        amount: Decimal::new(200, 0),
        price: Decimal::new(50, 0),
        status: OrderStatus::Open,
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        expiry: None,
    };
    
    // Add order to orderbook
    darkswap.add_order(order.clone()).await.expect("Failed to add order");
    
    // Create a partial trade
    let partial_amount = Decimal::new(100, 0); // Half of the order amount
    let trade = darkswap.create_trade(
        &order.id,
        taker_wallet.address().to_string(),
        partial_amount,
    ).await.expect("Failed to create trade");
    
    // Execute trade
    let executed_trade = darkswap.execute_trade(
        &trade.id,
        |psbt| taker_wallet.sign_psbt(psbt),
        |psbt| maker_wallet.sign_psbt(psbt),
    ).await.expect("Failed to execute trade");
    
    // Verify trade status and amount
    assert_eq!(executed_trade.status, TradeStatus::Completed);
    assert_eq!(executed_trade.amount, partial_amount);
    
    // Verify order status and remaining amount
    let updated_order = darkswap.get_order(&order.id).await.expect("Failed to get order");
    assert_eq!(updated_order.status, OrderStatus::Open); // Still open because partially filled
    assert_eq!(updated_order.amount, Decimal::new(100, 0)); // Remaining amount
    
    // Shutdown DarkSwap
    darkswap.shutdown().await.expect("Failed to shutdown DarkSwap");
}

#[tokio::test]
async fn test_trade_with_predicate_alkane() {
    // Initialize DarkSwap
    let config = Config::default();
    let mut darkswap = DarkSwap::new(config).expect("Failed to create DarkSwap instance");
    
    // Start DarkSwap
    darkswap.start().await.expect("Failed to start DarkSwap");
    
    // Create mock wallets
    let maker_wallet = MockWallet::new("maker-address");
    let taker_wallet = MockWallet::new("taker-address");
    
    // Create a predicate alkane
    let predicate = darkswap.create_equality_predicate_alkane(
        AlkaneId("alkane1".to_string()),
        100,
        AlkaneId("alkane2".to_string()),
        200,
    ).await.expect("Failed to create predicate alkane");
    
    // Create an order with the predicate alkane
    let order = Order {
        id: OrderId("test-order-4".to_string()),
        maker: maker_wallet.address().to_string(),
        base_asset: Asset::Alkane(AlkaneId("alkane1".to_string())),
        quote_asset: Asset::Alkane(AlkaneId("alkane2".to_string())),
        side: OrderSide::Sell,
        amount: Decimal::new(100, 0),
        price: Decimal::new(2, 0), // 1 alkane1 = 2 alkane2
        status: OrderStatus::Open,
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        expiry: None,
    };
    
    // Add order to orderbook
    darkswap.add_order(order.clone()).await.expect("Failed to add order");
    
    // Create a trade
    let trade = darkswap.create_trade(
        &order.id,
        taker_wallet.address().to_string(),
        order.amount,
    ).await.expect("Failed to create trade");
    
    // Execute trade with predicate
    let executed_trade = darkswap.execute_trade_with_predicate(
        &trade.id,
        &predicate.id,
        |psbt| taker_wallet.sign_psbt(psbt),
        |psbt| maker_wallet.sign_psbt(psbt),
    ).await.expect("Failed to execute trade with predicate");
    
    // Verify trade status
    assert_eq!(executed_trade.status, TradeStatus::Completed);
    
    // Verify order status
    let updated_order = darkswap.get_order(&order.id).await.expect("Failed to get order");
    assert_eq!(updated_order.status, OrderStatus::Filled);
    
    // Shutdown DarkSwap
    darkswap.shutdown().await.expect("Failed to shutdown DarkSwap");
}