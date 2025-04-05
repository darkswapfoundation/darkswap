use std::{
    sync::Arc,
    time::Duration,
};
use tokio::{
    sync::mpsc,
    time::sleep,
};
use reqwest::Client;
use serde_json::json;

#[tokio::test]
async fn test_circuit_relay() {
    println!("Starting circuit relay test");

    // Create HTTP client
    let client = Client::new();

    // Test parameters
    let ws_url = "ws://127.0.0.1:19002/signaling";
    let peer1_id = "peer1";
    let peer2_id = "peer2";

    // Connect to signaling server for peer 1
    let (peer1_tx, mut peer1_rx) = mpsc::channel::<String>(100);
    let peer1_ws = tokio_tungstenite::connect_async(ws_url).await.unwrap().0;
    let (mut peer1_ws_tx, mut peer1_ws_rx) = peer1_ws.split();

    // Connect to signaling server for peer 2
    let (peer2_tx, mut peer2_rx) = mpsc::channel::<String>(100);
    let peer2_ws = tokio_tungstenite::connect_async(ws_url).await.unwrap().0;
    let (mut peer2_ws_tx, mut peer2_ws_rx) = peer2_ws.split();

    // Register peer 1
    let register_msg = json!({
        "type": "Register",
        "payload": {
            "peer_id": peer1_id,
        }
    }).to_string();
    use tokio_tungstenite::tungstenite::Message;
    peer1_ws_tx.send(Message::Text(register_msg)).await.unwrap();

    // Register peer 2
    let register_msg = json!({
        "type": "Register",
        "payload": {
            "peer_id": peer2_id,
        }
    }).to_string();
    peer2_ws_tx.send(Message::Text(register_msg)).await.unwrap();

    // Wait for registration to complete
    sleep(Duration::from_secs(1)).await;

    // Request relay from peer 1 to peer 2
    let relay_request_msg = json!({
        "type": "RelayRequest",
        "payload": {
            "from": peer1_id,
            "to": peer2_id,
        }
    }).to_string();
    peer1_ws_tx.send(Message::Text(relay_request_msg)).await.unwrap();

    // Wait for relay response
    let mut relay_id = None;
    let timeout = Duration::from_secs(5);
    let start = std::time::Instant::now();

    while start.elapsed() < timeout {
        tokio::select! {
            Some(msg) = peer1_ws_rx.next() => {
                let msg = msg.unwrap();
                if let Message::Text(text) = msg {
                    println!("Peer 1 received: {}", text);
                    let json: serde_json::Value = serde_json::from_str(&text).unwrap();
                    if json["type"] == "RelayResponse" {
                        if json["payload"]["accepted"] == true {
                            relay_id = json["payload"]["relay_id"].as_str().map(|s| s.to_string());
                            break;
                        }
                    }
                }
            }
            _ = sleep(Duration::from_millis(100)) => {}
        }
    }

    // Check if we got a relay ID
    let relay_id = relay_id.expect("Failed to get relay ID");
    println!("Got relay ID: {}", relay_id);

    // Create data channels for the relay
    let data_channel_msg = json!({
        "type": "DataChannel",
        "payload": {
            "peer_id": peer1_id,
            "relay_id": relay_id,
            "channel": "test",
        }
    }).to_string();
    peer1_ws_tx.send(Message::Text(data_channel_msg)).await.unwrap();

    let data_channel_msg = json!({
        "type": "DataChannel",
        "payload": {
            "peer_id": peer2_id,
            "relay_id": relay_id,
            "channel": "test",
        }
    }).to_string();
    peer2_ws_tx.send(Message::Text(data_channel_msg)).await.unwrap();

    // Wait for data channels to be established
    sleep(Duration::from_secs(1)).await;

    // Send a message from peer 1 to peer 2
    let test_message = "Hello, Circuit Relay!";
    let relay_data_msg = json!({
        "type": "RelayData",
        "payload": {
            "from": peer1_id,
            "relay_id": relay_id,
            "data": base64::encode(test_message),
        }
    }).to_string();
    peer1_ws_tx.send(Message::Text(relay_data_msg)).await.unwrap();

    // Wait for peer 2 to receive the message
    let mut received_message = None;
    let timeout = Duration::from_secs(5);
    let start = std::time::Instant::now();

    while start.elapsed() < timeout {
        tokio::select! {
            Some(msg) = peer2_ws_rx.next() => {
                let msg = msg.unwrap();
                if let Message::Text(text) = msg {
                    println!("Peer 2 received: {}", text);
                    let json: serde_json::Value = serde_json::from_str(&text).unwrap();
                    if json["type"] == "RelayData" {
                        if let Some(data) = json["payload"]["data"].as_str() {
                            if let Ok(decoded) = base64::decode(data) {
                                if let Ok(text) = String::from_utf8(decoded) {
                                    received_message = Some(text);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            _ = sleep(Duration::from_millis(100)) => {}
        }
    }

    // Check if we received the message
    let received_message = received_message.expect("Failed to receive message");
    assert_eq!(received_message, test_message);
    println!("Received message: {}", received_message);

    // Close the relay
    let close_relay_msg = json!({
        "type": "CloseRelay",
        "payload": {
            "relay_id": relay_id,
        }
    }).to_string();
    peer1_ws_tx.send(Message::Text(close_relay_msg)).await.unwrap();

    // Wait for the relay to close
    sleep(Duration::from_secs(1)).await;

    // Close the WebSocket connections
    peer1_ws_tx.close().await.unwrap();
    peer2_ws_tx.close().await.unwrap();

    println!("Circuit relay test completed successfully");
}