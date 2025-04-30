#[macro_use]
extern crate criterion;

use criterion::{black_box, Criterion, BenchmarkId};
use darkswap_sdk::{
    orderbook::{Order, OrderId, OrderSide, OrderStatus, Orderbook},
    types::{Asset, RuneId, AlkaneId},
};
use rust_decimal::Decimal;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::runtime::Runtime;

fn create_test_order(id: &str, side: OrderSide, price: i64) -> Order {
    Order {
        id: OrderId(id.to_string()),
        maker: "maker-1".to_string(),
        base_asset: Asset::Bitcoin,
        quote_asset: Asset::Rune(RuneId(1)),
        side,
        amount: Decimal::new(100, 0),
        price: Decimal::new(price, 0),
        status: OrderStatus::Open,
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        expiry: None,
    }
}

fn bench_add_order(c: &mut Criterion) {
    let rt = Runtime::new().unwrap();
    
    let mut group = c.benchmark_group("add_order");
    group.measurement_time(Duration::from_secs(10));
    
    group.bench_function("single_order", |b| {
        b.iter(|| {
            rt.block_on(async {
                let mut orderbook = Orderbook::new();
                let order = create_test_order("bench-order-1", OrderSide::Buy, 50000);
                orderbook.add_order(order).await.expect("Failed to add order");
            });
        });
    });
    
    group.finish();
}

fn bench_order_matching(c: &mut Criterion) {
    let rt = Runtime::new().unwrap();
    
    let mut group = c.benchmark_group("order_matching");
    
    for &order_count in &[10, 100, 1000] {
        group.bench_with_input(BenchmarkId::new("orders", order_count), &order_count, |b, &order_count| {
            b.iter(|| {
                rt.block_on(async {
                    // Create orderbook with specified number of orders
                    let mut orderbook = Orderbook::new();
                    
                    // Add buy orders with different prices
                    for i in 0..order_count {
                        let price = 50000 - (i % 100); // Vary price slightly
                        let order = create_test_order(&format!("bench-buy-{}", i), OrderSide::Buy, price);
                        orderbook.add_order(order).await.expect("Failed to add buy order");
                    }
                    
                    // Create a sell order to match against
                    let sell_order = create_test_order("bench-sell-1", OrderSide::Sell, 49950);
                    
                    // Match the sell order against the orderbook
                    let matches = orderbook.match_order(&sell_order).await.expect("Failed to match order");
                    
                    // Verify we got at least one match
                    assert!(!matches.is_empty(), "No matches found");
                });
            });
        });
    }
    
    group.finish();
}

fn bench_get_orders(c: &mut Criterion) {
    let rt = Runtime::new().unwrap();
    
    let mut group = c.benchmark_group("get_orders");
    
    for &order_count in &[10, 100, 1000] {
        group.bench_with_input(BenchmarkId::new("orders", order_count), &order_count, |b, &order_count| {
            // Setup: Create orderbook with specified number of orders
            let orderbook = rt.block_on(async {
                let mut orderbook = Orderbook::new();
                
                // Add orders with different assets
                for i in 0..order_count {
                    let base_asset = if i % 2 == 0 { Asset::Bitcoin } else { Asset::Rune(RuneId(i as u128 % 5 + 1)) };
                    let quote_asset = if i % 2 == 0 { Asset::Rune(RuneId(i as u128 % 5 + 1)) } else { Asset::Bitcoin };
                    
                    let order = Order {
                        id: OrderId(format!("bench-order-{}", i)),
                        maker: "maker-1".to_string(),
                        base_asset,
                        quote_asset,
                        side: if i % 2 == 0 { OrderSide::Buy } else { OrderSide::Sell },
                        amount: Decimal::new(100, 0),
                        price: Decimal::new(50000, 0),
                        status: OrderStatus::Open,
                        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
                        expiry: None,
                    };
                    
                    orderbook.add_order(order).await.expect("Failed to add order");
                }
                
                orderbook
            });
            
            // Benchmark getting orders for a specific pair
            b.iter(|| {
                rt.block_on(async {
                    let orders = orderbook.get_orders(&Asset::Bitcoin, &Asset::Rune(RuneId(1))).await.expect("Failed to get orders");
                    black_box(orders);
                });
            });
        });
    }
    
    group.finish();
}

fn bench_get_best_bid_ask(c: &mut Criterion) {
    let rt = Runtime::new().unwrap();
    
    let mut group = c.benchmark_group("get_best_bid_ask");
    
    for &order_count in &[10, 100, 1000] {
        group.bench_with_input(BenchmarkId::new("orders", order_count), &order_count, |b, &order_count| {
            // Setup: Create orderbook with specified number of orders
            let orderbook = rt.block_on(async {
                let mut orderbook = Orderbook::new();
                
                // Add buy and sell orders with different prices
                for i in 0..order_count {
                    let side = if i % 2 == 0 { OrderSide::Buy } else { OrderSide::Sell };
                    let price = if side == OrderSide::Buy { 
                        50000 - (i % 100) 
                    } else { 
                        50100 + (i % 100) 
                    };
                    
                    let order = create_test_order(&format!("bench-order-{}", i), side, price);
                    orderbook.add_order(order).await.expect("Failed to add order");
                }
                
                orderbook
            });
            
            // Benchmark getting best bid and ask
            b.iter(|| {
                rt.block_on(async {
                    let (bid, ask) = orderbook.get_best_bid_ask(&Asset::Bitcoin, &Asset::Rune(RuneId(1))).await.expect("Failed to get best bid ask");
                    black_box((bid, ask));
                });
            });
        });
    }
    
    group.finish();
}

fn bench_cleanup_expired_orders(c: &mut Criterion) {
    let rt = Runtime::new().unwrap();
    
    let mut group = c.benchmark_group("cleanup_expired_orders");
    
    for &order_count in &[10, 100, 1000] {
        group.bench_with_input(BenchmarkId::new("orders", order_count), &order_count, |b, &order_count| {
            // Setup: Create orderbook with specified number of orders, some expired
            let orderbook = rt.block_on(async {
                let mut orderbook = Orderbook::new();
                let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
                
                // Add orders, half of them expired
                for i in 0..order_count {
                    let expiry = if i % 2 == 0 { 
                        Some(now - 1) // Expired
                    } else { 
                        None // No expiry
                    };
                    
                    let order = Order {
                        id: OrderId(format!("bench-order-{}", i)),
                        maker: "maker-1".to_string(),
                        base_asset: Asset::Bitcoin,
                        quote_asset: Asset::Rune(RuneId(1)),
                        side: if i % 2 == 0 { OrderSide::Buy } else { OrderSide::Sell },
                        amount: Decimal::new(100, 0),
                        price: Decimal::new(50000, 0),
                        status: OrderStatus::Open,
                        timestamp: now - 3600, // 1 hour ago
                        expiry,
                    };
                    
                    orderbook.add_order(order).await.expect("Failed to add order");
                }
                
                orderbook
            });
            
            // Benchmark cleaning up expired orders
            b.iter(|| {
                rt.block_on(async {
                    orderbook.cleanup_expired_orders().await;
                });
            });
        });
    }
    
    group.finish();
}

criterion_group!(
    benches,
    bench_add_order,
    bench_order_matching,
    bench_get_orders,
    bench_get_best_bid_ask,
    bench_cleanup_expired_orders
);
criterion_main!(benches);