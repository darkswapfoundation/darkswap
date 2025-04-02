use wasm_bindgen_test::*;
use wasm_bindgen::JsValue;
use wasm_bindgen_futures::JsFuture;
use darkswap_web_sys::{Wallet, initialize};

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
async fn test_initialize() {
    // Initialize the WebAssembly bindings
    let result = initialize().await;
    assert!(result.is_ok());
}

#[wasm_bindgen_test]
async fn test_wallet_creation() {
    // Initialize the WebAssembly bindings
    initialize().await.unwrap();
    
    // Create a wallet instance
    let wallet = Wallet::new();
    assert!(wallet.is_ok());
}

#[wasm_bindgen_test]
async fn test_wallet_connect() {
    // Initialize the WebAssembly bindings
    initialize().await.unwrap();
    
    // Create a wallet instance
    let wallet = Wallet::new().unwrap();
    
    // Connect to the wallet
    let connect_promise = wallet.connect();
    let connect_result = JsFuture::from(connect_promise).await.unwrap();
    
    // Check if the connection was successful
    assert_eq!(connect_result, JsValue::from_bool(true));
    
    // Check if the wallet is connected
    assert!(wallet.is_connected());
    
    // Get the wallet address
    let address = wallet.get_address();
    assert!(!address.is_empty());
}

#[wasm_bindgen_test]
async fn test_wallet_balance() {
    // Initialize the WebAssembly bindings
    initialize().await.unwrap();
    
    // Create a wallet instance
    let wallet = Wallet::new().unwrap();
    
    // Connect to the wallet
    let connect_promise = wallet.connect();
    JsFuture::from(connect_promise).await.unwrap();
    
    // Get the wallet balance
    let balance_promise = wallet.get_balance();
    let balance = JsFuture::from(balance_promise).await.unwrap();
    
    // Check if the balance is valid
    assert!(!balance.is_null());
    assert!(!balance.is_undefined());
}

#[wasm_bindgen_test]
async fn test_wallet_sign_message() {
    // Initialize the WebAssembly bindings
    initialize().await.unwrap();
    
    // Create a wallet instance
    let wallet = Wallet::new().unwrap();
    
    // Connect to the wallet
    let connect_promise = wallet.connect();
    JsFuture::from(connect_promise).await.unwrap();
    
    // Sign a message
    let message = "Hello, DarkSwap!";
    let sign_promise = wallet.sign_message(message);
    let signature = JsFuture::from(sign_promise).await.unwrap();
    
    // Check if the signature is valid
    assert!(!signature.is_null());
    assert!(!signature.is_undefined());
    assert!(signature.as_string().unwrap().len() > 0);
}

#[wasm_bindgen_test]
async fn test_wallet_disconnect() {
    // Initialize the WebAssembly bindings
    initialize().await.unwrap();
    
    // Create a wallet instance
    let wallet = Wallet::new().unwrap();
    
    // Connect to the wallet
    let connect_promise = wallet.connect();
    JsFuture::from(connect_promise).await.unwrap();
    
    // Disconnect from the wallet
    wallet.disconnect();
    
    // Check if the wallet is disconnected
    assert!(!wallet.is_connected());
}