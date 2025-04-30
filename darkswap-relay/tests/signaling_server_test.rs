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
async fn test_signaling_server() {
    println!("Starting signaling server test");

    // Create HTTP client
    let client = Client::new();

    // Test parameters
    let ws_url = "ws://127.0.0.1:19002/signaling";
    let peer1_id = "signaling_test_peer1";
    let peer2_id = "signaling_test_peer2";

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

    // Create an offer from peer 1 to peer 2
    let offer_sdp = "v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=msid-semantic: WMS\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:test\r\na=ice-pwd:test\r\na=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00\r\na=setup:actpass\r\na=mid:0\r\na=sctp-port:5000\r\n";
    let offer_msg = json!({
        "type": "Offer",
        "payload": {
            "from": peer1_id,
            "to": peer2_id,
            "sdp": offer_sdp,
        }
    }).to_string();
    peer1_ws_tx.send(Message::Text(offer_msg)).await.unwrap();

    // Wait for peer 2 to receive the offer
    let mut received_offer = false;
    let timeout = Duration::from_secs(5);
    let start = std::time::Instant::now();

    while start.elapsed() < timeout && !received_offer {
        tokio::select! {
            Some(msg) = peer2_ws_rx.next() => {
                let msg = msg.unwrap();
                if let Message::Text(text) = msg {
                    println!("Peer 2 received: {}", text);
                    let json: serde_json::Value = serde_json::from_str(&text).unwrap();
                    if json["type"] == "Offer" {
                        assert_eq!(json["payload"]["from"], peer1_id);
                        assert_eq!(json["payload"]["to"], peer2_id);
                        assert_eq!(json["payload"]["sdp"], offer_sdp);
                        received_offer = true;
                    }
                }
            }
            _ = sleep(Duration::from_millis(100)) => {}
        }
    }

    assert!(received_offer, "Peer 2 did not receive the offer");

    // Create an answer from peer 2 to peer 1
    let answer_sdp = "v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=msid-semantic: WMS\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:test\r\na=ice-pwd:test\r\na=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00\r\na=setup:active\r\na=mid:0\r\na=sctp-port:5000\r\n";
    let answer_msg = json!({
        "type": "Answer",
        "payload": {
            "from": peer2_id,
            "to": peer1_id,
            "sdp": answer_sdp,
        }
    }).to_string();
    peer2_ws_tx.send(Message::Text(answer_msg)).await.unwrap();

    // Wait for peer 1 to receive the answer
    let mut received_answer = false;
    let timeout = Duration::from_secs(5);
    let start = std::time::Instant::now();

    while start.elapsed() < timeout && !received_answer {
        tokio::select! {
            Some(msg) = peer1_ws_rx.next() => {
                let msg = msg.unwrap();
                if let Message::Text(text) = msg {
                    println!("Peer 1 received: {}", text);
                    let json: serde_json::Value = serde_json::from_str(&text).unwrap();
                    if json["type"] == "Answer" {
                        assert_eq!(json["payload"]["from"], peer2_id);
                        assert_eq!(json["payload"]["to"], peer1_id);
                        assert_eq!(json["payload"]["sdp"], answer_sdp);
                        received_answer = true;
                    }
                }
            }
            _ = sleep(Duration::from_millis(100)) => {}
        }
    }

    assert!(received_answer, "Peer 1 did not receive the answer");

    // Send an ICE candidate from peer 1 to peer 2
    let ice_candidate = "candidate:1 1 UDP 2130706431 192.168.1.1 8000 typ host";
    let ice_msg = json!({
        "type": "IceCandidate",
        "payload": {
            "from": peer1_id,
            "to": peer2_id,
            "candidate": ice_candidate,
            "sdp_mid": "0",
            "sdp_mline_index": 0,
        }
    }).to_string();
    peer1_ws_tx.send(Message::Text(ice_msg)).await.unwrap();

    // Wait for peer 2 to receive the ICE candidate
    let mut received_ice = false;
    let timeout = Duration::from_secs(5);
    let start = std::time::Instant::now();

    while start.elapsed() < timeout && !received_ice {
        tokio::select! {
            Some(msg) = peer2_ws_rx.next() => {
                let msg = msg.unwrap();
                if let Message::Text(text) = msg {
                    println!("Peer 2 received: {}", text);
                    let json: serde_json::Value = serde_json::from_str(&text).unwrap();
                    if json["type"] == "IceCandidate" {
                        assert_eq!(json["payload"]["from"], peer1_id);
                        assert_eq!(json["payload"]["to"], peer2_id);
                        assert_eq!(json["payload"]["candidate"], ice_candidate);
                        assert_eq!(json["payload"]["sdp_mid"], "0");
                        assert_eq!(json["payload"]["sdp_mline_index"], 0);
                        received_ice = true;
                    }
                }
            }
            _ = sleep(Duration::from_millis(100)) => {}
        }
    }

    assert!(received_ice, "Peer 2 did not receive the ICE candidate");

    // Close the WebSocket connections
    peer1_ws_tx.close().await.unwrap();
    peer2_ws_tx.close().await.unwrap();

    println!("Signaling server test completed successfully");
}