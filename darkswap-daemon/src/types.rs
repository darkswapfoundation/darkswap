use std::collections::HashMap;
use tokio::sync::{mpsc, Mutex};
use darkswap_sdk::DarkSwap;

/// Application state
pub struct AppState {
    /// DarkSwap instance
    pub darkswap: Mutex<DarkSwap>,
    /// Connected clients
    pub clients: Mutex<HashMap<String, mpsc::Sender<String>>>,
}