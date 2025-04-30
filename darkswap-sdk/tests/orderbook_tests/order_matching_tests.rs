use darkswap_sdk::{
    orderbook::{Order, OrderId, OrderSide, OrderStatus, Orderbook},
    types::{Asset, RuneId, AlkaneId},
};
use rust_decimal::Decimal;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::time::sleep;

#[tokio::test]
async fn test_add_order() {
    let mut orderbook = Orderbook::new();
    
    // Create a simple order
    let order = Order {
        id: OrderId("test-order-1".to_string()),
        maker: "maker-1".to_string(),
        base_asset: Asset::Bitcoin,
        quote_asset: Asset::Bitcoin,
        side: OrderSide::Buy,
        amount: Decimal::new(100, 0),
        price: Decimal::new(50000, 0),
        status: OrderStatus::Open,
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        expiry: None,
    };
    
    // Add order to orderbook
    let result = orderbook.add_order(order.clone()).await;
    assert!(result.is_ok(), "Failed to add order to orderbook");
    
    // Verify order was added
    let orders = orderbook.get_orders(&Asset::Bitcoin, &Asset::Bitcoin).await.unwrap();
    assert_eq!(orders.len(), 1, "Order not added to orderbook");
    assert_eq!(orders[0].id, order.id, "Order ID mismatch");
}

#[tokio::test]
async fn test_order_matching_same_price() {
    let mut orderbook = Orderbook::new();
    
    // Create a buy order
    let buy_order = Order {
        id: OrderId("test-buy-order-1".to_string()),
        maker: "buyer-1".to_string(),
        base_asset: Asset::Bitcoin,
        quote_asset: Asset::Rune(RuneId(1)),
        side: OrderSide::Buy,
        amount: Decimal::new(100, 0),
        price: Decimal::new(50, 0),
        status: OrderStatus::Open,
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        expiry: None,
    };
    
    // Add buy order to orderbook
    orderbook.add_order(buy_order.clone()).await.unwrap();
    
    // Create a matching sell order
    let sell_order = Order {
        id: OrderId("test-sell-order-1".to_string()),
        maker: "seller-1".to_string(),
        base_asset: Asset::Bitcoin,
        quote_asset: Asset::Rune(RuneId(1)),
        side: OrderSide::Sell,
        amount: Decimal::new(100, 0),
        price: Decimal::new(50, 0),
        status: OrderStatus::Open,
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        expiry: None,
    };
    
    // Match the sell order against the orderbook
    let matches = orderbook.match_order(&sell_order).await.unwrap();
    
    // Verify match
    assert_eq!(matches.len(), 1, "Expected 1 match");
    assert_eq!(matches[0].id, buy_order.id, "Order ID mismatch");
    assert_eq!(matches[0].amount, buy_order.amount, "Order amount mismatch");
}

#[tokio::test]
async fn test_order_matching_better_price() {
    let mut orderbook = Orderbook::new();
    
    // Create a buy order with a higher price
    let buy_order = Order {
        id: OrderId("test-buy-order-2".to_string()),
        maker: "buyer-2".to_string(),
        base_asset: Asset::Bitcoin,
        quote_asset: Asset::Rune(RuneId(1)),
        side: OrderSide::Buy,
        amount: Decimal::new(100, 0),
        price: Decimal::new(55, 0), // Higher price than the sell order
        status: OrderStatus::Open,
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        expiry: None,
    };
    
    // Add buy order to orderbook
    orderbook.add_order(buy_order.clone()).await.unwrap();
    
    // Create a sell order with a lower price
    let sell_order = Order {
        id: OrderId("test-sell-order-2".to_string()),
        maker: "seller-2".to_string(),
        base_asset: Asset::Bitcoin,
        quote_asset: Asset::Rune(RuneId(1)),
        side: OrderSide::Sell,
        amount: Decimal::new(100, 0),
        price: Decimal::new(50, 0), // Lower price than the buy order
        status: OrderStatus::Open,
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        expiry: None,
    };
    
    // Match the sell order against the orderbook
    let matches = orderbook.match_order(&sell_order).await.unwrap();
    
    // Verify match
    assert_eq!(matches.len(), 1, "Expected 1 match");
    assert_eq!(matches[0].id, buy_order.id, "Order ID mismatch");
    assert_eq!(matches[0].amount, buy_order.amount, "Order amount mismatch");
}

#[tokio::test]
async fn test_order_matching_partial_fill() {
    let mut orderbook = Orderbook::new();
    
    // Create a buy order with a larger amount
    let buy_order = Order {
        id: OrderId("test-buy-order-3".to_string()),
        maker: "buyer-3".to_string(),
        base_asset: Asset::Bitcoin,
        quote_asset: Asset::Rune(RuneId(1)),
        side: OrderSide::Buy,
        amount: Decimal::new(200, 0), // Larger amount than the sell order
        price: Decimal::new(50, 0),
        status: OrderStatus::Open,
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        expiry: None,
    };
    
    // Add buy order to orderbook
    orderbook.add_order(buy_order.clone()).await.unwrap();
    
    // Create a sell order with a smaller amount
    let sell_order = Order {
        id: OrderId("test-sell-order-3".to_string()),
        maker: "seller-3".to_string(),
        base_asset: Asset::Bitcoin,
        quote_asset: Asset::Rune(RuneId(1)),
        side: OrderSide::Sell,
        amount: Decimal::new(100, 0), // Smaller amount than the buy order
        price: Decimal::new(50, 0),
        status: OrderStatus::Open,
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        expiry: None,
    };
    
    // Match the sell order against the orderbook
    let matches = orderbook.match_order(&sell_order).await.unwrap();
    
    // Verify match
    assert_eq!(matches.len(), 1, "Expected 1 match");
    assert_eq!(matches[0].id, buy_order.id, "Order ID mismatch");
    assert_eq!(matches[0].amount, sell_order.amount, "Order amount should be limited to sell order amount");
    
    // Verify remaining buy order amount
    let orders = orderbook.get_orders(&Asset::Bitcoin, &Asset::Rune(RuneId(1))).await.unwrap();
    assert_eq!(orders.len(), 1, "Buy order should still be in orderbook");
    assert_eq!(orders[0].amount, Decimal::new(100, 0), "Remaining buy order amount incorrect");
}

#[tokio::test]
async fn test_order_expiry() {
    let mut orderbook = Orderbook::new();
    
    // Create an order that expires in 1 second
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
    let order = Order {
        id: OrderId("test-expiry-order-1".to_string()),
        maker: "maker-expiry-1".to_string(),
        base_asset: Asset::Bitcoin,
        quote_asset: Asset::Alkane(AlkaneId("alkane1".to_string())),
        side: OrderSide::Buy,
        amount: Decimal::new(100, 0),
        price: Decimal::new(50, 0),
        status: OrderStatus::Open,
        timestamp: now,
        expiry: Some(now + 1), // Expires in 1 second
    };
    
    // Add order to orderbook
    orderbook.add_order(order.clone()).await.unwrap();
    
    // Verify order was added
    let orders = orderbook.get_orders(&Asset::Bitcoin, &Asset::Alkane(AlkaneId("alkane1".to_string()))).await.unwrap();
    assert_eq!(orders.len(), 1, "Order not added to orderbook");
    
    // Wait for order to expire
    sleep(Duration::from_secs(2)).await;
    
    // Run expiry check
    orderbook.cleanup_expired_orders().await;
    
    // Verify order was removed
    let orders = orderbook.get_orders(&Asset::Bitcoin, &Asset::Alkane(AlkaneId("alkane1".to_string()))).await.unwrap();
    assert_eq!(orders.len(), 0, "Expired order not removed from orderbook");
}

#[tokio::test]
async fn test_cancel_order() {
    let mut orderbook = Orderbook::new();
    
    // Create an order
    let order = Order {
        id: OrderId("test-cancel-order-1".to_string()),
        maker: "maker-cancel-1".to_string(),
        base_asset: Asset::Bitcoin,
        quote_asset: Asset::Bitcoin,
        side: OrderSide::Buy,
        amount: Decimal::new(100, 0),
        price: Decimal::new(50000, 0),
        status: OrderStatus::Open,
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        expiry: None,
    };
    
    // Add order to orderbook
    orderbook.add_order(order.clone()).await.unwrap();
    
    // Cancel the order
    let result = orderbook.cancel_order(&order.id).await;
    assert!(result.is_ok(), "Failed to cancel order");
    
    // Verify order was removed
    let orders = orderbook.get_orders(&Asset::Bitcoin, &Asset::Bitcoin).await.unwrap();
    assert_eq!(orders.len(), 0, "Cancelled order not removed from orderbook");
}

#[tokio::test]
async fn test_get_best_bid_ask() {
    let mut orderbook = Orderbook::new();
    
    // Create buy orders
    let buy_order1 = Order {
        id: OrderId("test-buy-order-4".to_string()),
        maker: "buyer-4".to_string(),
        base_asset: Asset::Bitcoin,
        quote_asset: Asset::Rune(RuneId(1)),
        side: OrderSide::Buy,
        amount: Decimal::new(100, 0),
        price: Decimal::new(50, 0),
        status: OrderStatus::Open,
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        expiry: None,
    };
    
    let buy_order2 = Order {
        id: OrderId("test-buy-order-5".to_string()),
        maker: "buyer-5".to_string(),
        base_asset: Asset::Bitcoin,
        quote_asset: Asset::Rune(RuneId(1)),
        side: OrderSide::Buy,
        amount: Decimal::new(100, 0),
        price: Decimal::new(52, 0), // Higher price
        status: OrderStatus::Open,
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        expiry: None,
    };
    
    // Create sell orders
    let sell_order1 = Order {
        id: OrderId("test-sell-order-4".to_string()),
        maker: "seller-4".to_string(),
        base_asset: Asset::Bitcoin,
        quote_asset: Asset::Rune(RuneId(1)),
        side: OrderSide::Sell,
        amount: Decimal::new(100, 0),
        price: Decimal::new(55, 0),
        status: OrderStatus::Open,
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        expiry: None,
    };
    
    let sell_order2 = Order {
        id: OrderId("test-sell-order-5".to_string()),
        maker: "seller-5".to_string(),
        base_asset: Asset::Bitcoin,
        quote_asset: Asset::Rune(RuneId(1)),
        side: OrderSide::Sell,
        amount: Decimal::new(100, 0),
        price: Decimal::new(53, 0), // Lower price
        status: OrderStatus::Open,
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        expiry: None,
    };
    
    // Add orders to orderbook
    orderbook.add_order(buy_order1.clone()).await.unwrap();
    orderbook.add_order(buy_order2.clone()).await.unwrap();
    orderbook.add_order(sell_order1.clone()).await.unwrap();
    orderbook.add_order(sell_order2.clone()).await.unwrap();
    
    // Get best bid and ask
    let (bid, ask) = orderbook.get_best_bid_ask(&Asset::Bitcoin, &Asset::Rune(RuneId(1))).await.unwrap();
    
    // Verify best bid is the highest buy price
    assert_eq!(bid, Some(Decimal::new(52, 0)), "Best bid incorrect");
    
    // Verify best ask is the lowest sell price
    assert_eq!(ask, Some(Decimal::new(53, 0)), "Best ask incorrect");
}