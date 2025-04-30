#[macro_use]
extern crate criterion;

use criterion::{black_box, Criterion, BenchmarkId};
use darkswap_sdk::{
    DarkSwap,
    config::Config,
    orderbook::{Order, OrderId, OrderSide, OrderStatus},
    types::{Asset, RuneId, AlkaneId, Trade, TradeStatus},
};
use rust_decimal::Decimal;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::runtime::Runtime;

// Mock wallet for benchmarking
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

fn create_test_order(id: &str, maker: &str, side: OrderSide) -> Order {
    Order {
        id: OrderId(id.to_string()),
        maker: maker.to_string(),
        base_asset: Asset::Bitcoin,
        quote_asset: Asset::Rune(RuneId(1)),
        side,
        amount: Decimal::new(100, 0),
        price: Decimal::new(50000, 0),
        status: OrderStatus::Open,
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        expiry: None,
    }
}

fn bench_create_trade(c: &mut Criterion) {
    let rt = Runtime::new().unwrap();
    
    let mut group = c.benchmark_group("create_trade");
    group.measurement_time(Duration::from_secs(10));
    
    group.bench_function("simple_trade", |b| {
        b.iter(|| {
            rt.block_on(async {
                // Initialize DarkSwap
                let config = Config::default();
                let mut darkswap = DarkSwap::new(config).expect("Failed to create DarkSwap instance");
                
                // Start DarkSwap
                darkswap.start().await.expect("Failed to start DarkSwap");
                
                // Create mock wallets
                let maker_wallet = MockWallet::new("maker-address");
                let taker_wallet = MockWallet::new("taker-address");
                
                // Create an order
                let order = create_test_order("bench-order-1", maker_wallet.address(), OrderSide::Sell);
                
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
                
                // Shutdown DarkSwap
                darkswap.shutdown().await.expect("Failed to shutdown DarkSwap");
            });
        });
    });
    
    group.finish();
}

fn bench_execute_trade(c: &mut Criterion) {
    let rt = Runtime::new().unwrap();
    
    let mut group = c.benchmark_group("execute_trade");
    group.measurement_time(Duration::from_secs(10));
    
    group.bench_function("simple_execution", |b| {
        b.iter(|| {
            rt.block_on(async {
                // Initialize DarkSwap
                let config = Config::default();
                let mut darkswap = DarkSwap::new(config).expect("Failed to create DarkSwap instance");
                
                // Start DarkSwap
                darkswap.start().await.expect("Failed to start DarkSwap");
                
                // Create mock wallets
                let maker_wallet = MockWallet::new("maker-address");
                let taker_wallet = MockWallet::new("taker-address");
                
                // Create an order
                let order = create_test_order("bench-order-2", maker_wallet.address(), OrderSide::Sell);
                
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
                
                // Shutdown DarkSwap
                darkswap.shutdown().await.expect("Failed to shutdown DarkSwap");
            });
        });
    });
    
    group.finish();
}

fn bench_psbt_creation(c: &mut Criterion) {
    let rt = Runtime::new().unwrap();
    
    let mut group = c.benchmark_group("psbt_creation");
    group.measurement_time(Duration::from_secs(10));
    
    for &input_count in &[1, 5, 10] {
        group.bench_with_input(BenchmarkId::new("inputs", input_count), &input_count, |b, &input_count| {
            b.iter(|| {
                rt.block_on(async {
                    // Initialize DarkSwap
                    let config = Config::default();
                    let mut darkswap = DarkSwap::new(config).expect("Failed to create DarkSwap instance");
                    
                    // Create a PSBT with specified number of inputs
                    let psbt = darkswap.create_test_psbt(input_count).await.expect("Failed to create PSBT");
                    
                    // Verify PSBT
                    assert!(psbt.len() > 0, "PSBT should not be empty");
                });
            });
        });
    }
    
    group.finish();
}

fn bench_psbt_signing(c: &mut Criterion) {
    let rt = Runtime::new().unwrap();
    
    let mut group = c.benchmark_group("psbt_signing");
    group.measurement_time(Duration::from_secs(10));
    
    for &input_count in &[1, 5, 10] {
        group.bench_with_input(BenchmarkId::new("inputs", input_count), &input_count, |b, &input_count| {
            // Setup: Create a PSBT with specified number of inputs
            let psbt = rt.block_on(async {
                let config = Config::default();
                let mut darkswap = DarkSwap::new(config).expect("Failed to create DarkSwap instance");
                darkswap.create_test_psbt(input_count).await.expect("Failed to create PSBT")
            });
            
            // Create a wallet for signing
            let wallet = MockWallet::new("signer-address");
            
            // Benchmark signing the PSBT
            b.iter(|| {
                rt.block_on(async {
                    let signed_psbt = wallet.sign_psbt(psbt.clone()).await.expect("Failed to sign PSBT");
                    black_box(signed_psbt);
                });
            });
        });
    }
    
    group.finish();
}

fn bench_trade_with_predicate(c: &mut Criterion) {
    let rt = Runtime::new().unwrap();
    
    let mut group = c.benchmark_group("trade_with_predicate");
    group.measurement_time(Duration::from_secs(10));
    
    group.bench_function("equality_predicate", |b| {
        b.iter(|| {
            rt.block_on(async {
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
                    id: OrderId("bench-order-3".to_string()),
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
                
                // Shutdown DarkSwap
                darkswap.shutdown().await.expect("Failed to shutdown DarkSwap");
            });
        });
    });
    
    group.finish();
}

criterion_group!(
    benches,
    bench_create_trade,
    bench_execute_trade,
    bench_psbt_creation,
    bench_psbt_signing,
    bench_trade_with_predicate
);
criterion_main!(benches);