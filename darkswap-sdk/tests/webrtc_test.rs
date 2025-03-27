//! WebRTC integration tests for DarkSwap
//!
//! These tests verify the WebRTC functionality of the DarkSwap SDK.
//! They are only run when the "webrtc" feature is enabled.

#[cfg(feature = "webrtc")]
mod tests {
    use darkswap_sdk::config::NetworkConfig;
    use darkswap_sdk::error::Result;
    use darkswap_sdk::network::Network;
    use darkswap_sdk::types::PeerId;
    use darkswap_sdk::webrtc_signaling::{SessionDescription, SessionDescriptionType, IceCandidate};
    use std::time::Duration;

    #[tokio::test]
    #[ignore = "WebRTC implementation is not complete yet"]
    async fn test_webrtc_network_creation() -> Result<()> {
        // Create two network instances
        let config1 = NetworkConfig::default();
        let mut network1 = Network::new(&config1)?;

        let config2 = NetworkConfig::default();
        let mut network2 = Network::new(&config2)?;

        // Start the networks
        network1.start().await?;
        network2.start().await?;

        // Get peer IDs
        let peer_id1 = network1.local_peer_id();
        let peer_id2 = network2.local_peer_id();

        // Create a mock offer
        let offer = SessionDescription {
            type_: SessionDescriptionType::Offer,
            sdp: "v=0\r\no=- 123456 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\n".to_string(),
        };

        // Create a mock answer
        let answer = SessionDescription {
            type_: SessionDescriptionType::Answer,
            sdp: "v=0\r\no=- 654321 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\n".to_string(),
        };

        // Create a mock ICE candidate
        let candidate = IceCandidate {
            candidate: "candidate:1 1 UDP 2122252543 192.168.1.1 12345 typ host".to_string(),
            sdp_mid: Some("0".to_string()),
            sdp_m_line_index: Some(0),
        };

        // Send offer from network1 to network2
        network1.send_webrtc_offer(&peer_id2, &offer).await?;

        // Send answer from network2 to network1
        network2.send_webrtc_answer(&peer_id1, &answer).await?;

        // Send ICE candidate from network1 to network2
        network1.send_webrtc_ice_candidate(&peer_id2, &candidate).await?;

        // Wait a bit for the messages to be processed
        tokio::time::sleep(Duration::from_millis(100)).await;

        // Stop the networks
        network1.stop().await?;
        network2.stop().await?;

        Ok(())
    }

    #[tokio::test]
    #[ignore = "WebRTC implementation is not complete yet"]
    async fn test_webrtc_relay() -> Result<()> {
        // Create two network instances
        let config1 = NetworkConfig::default();
        let mut network1 = Network::new(&config1)?;

        let config2 = NetworkConfig::default();
        let mut network2 = Network::new(&config2)?;

        // Start the networks
        network1.start().await?;
        network2.start().await?;

        // Get peer IDs
        let peer_id1 = network1.local_peer_id();
        let peer_id2 = network2.local_peer_id();

        // Make a reservation with network1 as the relay
        network2.make_relay_reservation(peer_id1.clone()).await?;

        // Connect to a third peer through network1 as the relay
        let peer_id3 = PeerId("peer3".to_string());
        network2.connect_through_relay(peer_id1.clone(), peer_id3).await?;

        // Stop the networks
        network1.stop().await?;
        network2.stop().await?;

        Ok(())
    }
}