//! Wallet routes for the REST API
//!
//! This module provides wallet routes for the REST API.

use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;

use crate::bridge::Bridge;
use crate::error::Result;
use crate::message::{Message, ResponseMessage, WalletMessage};

/// Handle wallet message
pub async fn handle_wallet_message(
    State(bridge): State<Arc<Mutex<Bridge>>>,
    Json(message): Json<WalletMessage>,
) -> Result<(StatusCode, Json<ResponseMessage>)> {
    // Get bridge
    let bridge = bridge.lock().await;
    
    // Send message to wallet adapter
    bridge.send_to_wallet(Message::Wallet(message))?;
    
    // TODO: Wait for response
    
    // Return success response
    let response = ResponseMessage::Success;
    
    Ok((StatusCode::OK, Json(response)))
}

/// Get wallet status
pub async fn get_wallet_status(
    State(bridge): State<Arc<Mutex<Bridge>>>,
) -> Result<(StatusCode, Json<ResponseMessage>)> {
    // Get bridge
    let bridge = bridge.lock().await;
    
    // Send message to wallet adapter
    bridge.send_to_wallet(Message::Wallet(WalletMessage::GetStatus))?;
    
    // TODO: Wait for response
    
    // Return status response
    let response = ResponseMessage::WalletStatus {
        connected: true,
        open: false,
        name: None,
    };
    
    Ok((StatusCode::OK, Json(response)))
}

/// Get wallet balance
pub async fn get_wallet_balance(
    State(bridge): State<Arc<Mutex<Bridge>>>,
) -> Result<(StatusCode, Json<ResponseMessage>)> {
    // Get bridge
    let bridge = bridge.lock().await;
    
    // Send message to wallet adapter
    bridge.send_to_wallet(Message::Wallet(WalletMessage::GetBalance))?;
    
    // TODO: Wait for response
    
    // Return balance response
    let response = ResponseMessage::WalletBalance {
        confirmed: 0,
        unconfirmed: 0,
    };
    
    Ok((StatusCode::OK, Json(response)))
}

/// Get wallet addresses
pub async fn get_wallet_addresses(
    State(bridge): State<Arc<Mutex<Bridge>>>,
) -> Result<(StatusCode, Json<ResponseMessage>)> {
    // Get bridge
    let bridge = bridge.lock().await;
    
    // Send message to wallet adapter
    bridge.send_to_wallet(Message::Wallet(WalletMessage::GetAddresses))?;
    
    // TODO: Wait for response
    
    // Return addresses response
    let response = ResponseMessage::Addresses {
        addresses: vec![],
    };
    
    Ok((StatusCode::OK, Json(response)))
}

/// Get wallet transactions
pub async fn get_wallet_transactions(
    State(bridge): State<Arc<Mutex<Bridge>>>,
) -> Result<(StatusCode, Json<ResponseMessage>)> {
    // Get bridge
    let bridge = bridge.lock().await;
    
    // Send message to wallet adapter
    bridge.send_to_wallet(Message::Wallet(WalletMessage::GetTransactions))?;
    
    // TODO: Wait for response
    
    // Return transactions response
    let response = ResponseMessage::Transactions {
        transactions: vec![],
    };
    
    Ok((StatusCode::OK, Json(response)))
}

/// Get wallet UTXOs
pub async fn get_wallet_utxos(
    State(bridge): State<Arc<Mutex<Bridge>>>,
) -> Result<(StatusCode, Json<ResponseMessage>)> {
    // Get bridge
    let bridge = bridge.lock().await;
    
    // Send message to wallet adapter
    bridge.send_to_wallet(Message::Wallet(WalletMessage::GetUtxos))?;
    
    // TODO: Wait for response
    
    // Return UTXOs response
    let response = ResponseMessage::Utxos {
        utxos: vec![],
    };
    
    Ok((StatusCode::OK, Json(response)))
}