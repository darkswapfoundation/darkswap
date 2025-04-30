use std::time::Duration;
use tokio::time::sleep;
use webrtc::{
    api::{
        interceptor_registry::register_default_interceptors,
        media_engine::MediaEngine,
        setting_engine::SettingEngine,
        APIBuilder,
    },
    data_channel::{
        data_channel::DataChannel,
        RTCDataChannel,
    },
    ice::{
        ice_server::RTCIceServer,
        network_type::NetworkType,
    },
    ice_transport::ice_connection_state::RTCIceConnectionState,
    interceptor::registry::Registry,
    peer_connection::{
        configuration::RTCConfiguration,
        peer_connection_state::RTCPeerConnectionState,
        RTCPeerConnection,
    },
    sctp::transport::SCTPTransportState,
};

#[tokio::test]
async fn test_webrtc_connection() {
    println!("Starting WebRTC connection test");

    // Create a media engine
    let mut media_engine = MediaEngine::default();
    
    // Create a registry
    let mut registry = Registry::new();
    
    // Register default interceptors
    registry = register_default_interceptors(registry, &mut media_engine).unwrap();
    
    // Create a setting engine
    let mut setting_engine = SettingEngine::default();
    
    // Set ICE timeouts
    setting_engine.set_ice_timeouts(
        Some(Duration::from_secs(5)),
        Some(Duration::from_secs(25)),
        Some(Duration::from_secs(5)),
    );
    
    // Create the API
    let api = APIBuilder::new()
        .with_media_engine(media_engine)
        .with_interceptor_registry(registry)
        .with_setting_engine(setting_engine)
        .build();
    
    // Create ICE servers
    let ice_servers = vec![
        RTCIceServer {
            urls: vec!["stun:stun.l.google.com:19302".to_string()],
            ..Default::default()
        },
    ];
    
    // Create configuration
    let config = RTCConfiguration {
        ice_servers,
        ..Default::default()
    };
    
    // Create peer connections
    let peer_connection1 = api.new_peer_connection(config.clone()).await.unwrap();
    let peer_connection2 = api.new_peer_connection(config).await.unwrap();
    
    // Create a data channel on peer connection 1
    let data_channel1 = peer_connection1.create_data_channel("test", None).await.unwrap();
    
    // Set up on open handler for data channel 1
    let (dc1_open_tx, mut dc1_open_rx) = tokio::sync::mpsc::channel::<()>(1);
    let dc1_open_tx_clone = dc1_open_tx.clone();
    data_channel1.on_open(Box::new(move || {
        println!("Data channel 1 opened");
        let tx = dc1_open_tx_clone.clone();
        Box::pin(async move {
            let _ = tx.send(()).await;
        })
    }));
    
    // Set up on message handler for data channel 2
    let (dc2_message_tx, mut dc2_message_rx) = tokio::sync::mpsc::channel::<String>(1);
    let dc2_message_tx_clone = dc2_message_tx.clone();
    
    // Set up on data channel handler for peer connection 2
    peer_connection2.on_data_channel(Box::new(move |data_channel: Arc<RTCDataChannel>| {
        println!("Data channel 2 created");
        let tx = dc2_message_tx_clone.clone();
        
        data_channel.on_message(Box::new(move |msg: webrtc::data::Data| {
            println!("Data channel 2 received message");
            let tx = tx.clone();
            let msg_str = String::from_utf8(msg.data.to_vec()).unwrap();
            Box::pin(async move {
                let _ = tx.send(msg_str).await;
            })
        }));
        
        Box::pin(async {})
    }));
    
    // Create an offer
    let offer = peer_connection1.create_offer(None).await.unwrap();
    
    // Set the local description for peer connection 1
    peer_connection1.set_local_description(offer.clone()).await.unwrap();
    
    // Set the remote description for peer connection 2
    peer_connection2.set_remote_description(offer).await.unwrap();
    
    // Create an answer
    let answer = peer_connection2.create_answer(None).await.unwrap();
    
    // Set the local description for peer connection 2
    peer_connection2.set_local_description(answer.clone()).await.unwrap();
    
    // Set the remote description for peer connection 1
    peer_connection1.set_remote_description(answer).await.unwrap();
    
    // Wait for ICE gathering to complete
    let (ice_complete_tx, mut ice_complete_rx) = tokio::sync::mpsc::channel::<()>(2);
    let ice_complete_tx_clone = ice_complete_tx.clone();
    
    peer_connection1.on_ice_candidate(Box::new(move |candidate| {
        let tx = ice_complete_tx_clone.clone();
        Box::pin(async move {
            if candidate.is_none() {
                println!("ICE gathering completed for peer connection 1");
                let _ = tx.send(()).await;
            }
        })
    }));
    
    let ice_complete_tx_clone = ice_complete_tx.clone();
    peer_connection2.on_ice_candidate(Box::new(move |candidate| {
        let tx = ice_complete_tx_clone.clone();
        Box::pin(async move {
            if candidate.is_none() {
                println!("ICE gathering completed for peer connection 2");
                let _ = tx.send(()).await;
            }
        })
    }));
    
    // Wait for ICE gathering to complete
    for _ in 0..2 {
        tokio::select! {
            _ = ice_complete_rx.recv() => {},
            _ = sleep(Duration::from_secs(10)) => {
                panic!("Timed out waiting for ICE gathering to complete");
            }
        }
    }
    
    // Wait for data channel 1 to open
    tokio::select! {
        _ = dc1_open_rx.recv() => {},
        _ = sleep(Duration::from_secs(10)) => {
            panic!("Timed out waiting for data channel 1 to open");
        }
    }
    
    // Send a message from data channel 1
    let test_message = "Hello, WebRTC!";
    data_channel1.send_text(test_message.to_string()).await.unwrap();
    println!("Sent message: {}", test_message);
    
    // Wait for data channel 2 to receive the message
    let received_message = tokio::select! {
        msg = dc2_message_rx.recv() => msg.unwrap(),
        _ = sleep(Duration::from_secs(10)) => {
            panic!("Timed out waiting for data channel 2 to receive message");
        }
    };
    
    // Verify the message
    assert_eq!(received_message, test_message);
    println!("Received message: {}", received_message);
    
    // Close the peer connections
    peer_connection1.close().await.unwrap();
    peer_connection2.close().await.unwrap();
    
    println!("WebRTC connection test completed successfully");
}