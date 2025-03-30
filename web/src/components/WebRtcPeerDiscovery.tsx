import React, { useState, useEffect } from 'react';
import { useWebRtc } from '../contexts/WebRtcContext';

interface DiscoveredPeer {
  id: string;
  name: string;
  lastSeen: Date;
  metadata: {
    version: string;
    features: string[];
    [key: string]: any;
  };
}

/**
 * WebRTC Peer Discovery component
 * Allows users to discover other peers without manual ID exchange
 */
const WebRtcPeerDiscovery: React.FC = () => {
  // WebRTC context
  const {
    isConnected,
    isConnecting,
    error,
    localPeerId,
    connectedPeers,
    connect,
    disconnect,
    sendString,
    onMessage,
    offMessage,
  } = useWebRtc();

  // State
  const [discoveredPeers, setDiscoveredPeers] = useState<DiscoveredPeer[]>([]);
  const [announceInterval, setAnnounceInterval] = useState<NodeJS.Timeout | null>(null);
  const [peerName, setPeerName] = useState<string>(`User-${Math.floor(Math.random() * 10000)}`);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [discoveryEnabled, setDiscoveryEnabled] = useState<boolean>(false);
  const [selectedPeer, setSelectedPeer] = useState<string | null>(null);

  // Discovery server peer ID (in a real implementation, this would be a well-known peer ID)
  const DISCOVERY_SERVER_ID = 'discovery-server';

  // Handle incoming messages
  useEffect(() => {
    const handleMessage = (peerId: string, data: any) => {
      try {
        // Parse the message
        const message = typeof data === 'string' ? JSON.parse(data) : data;
        
        // Handle different message types
        switch (message.type) {
          case 'peer_announce':
            handlePeerAnnounce(message);
            break;
          case 'peer_list':
            handlePeerList(message);
            break;
          case 'peer_request':
            handlePeerRequest();
            break;
          default:
            // Ignore other message types
            break;
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    };

    onMessage(handleMessage);

    return () => {
      offMessage(handleMessage);
    };
  }, [onMessage, offMessage]);

  // Start/stop discovery when enabled/disabled
  useEffect(() => {
    if (discoveryEnabled) {
      startDiscovery();
    } else {
      stopDiscovery();
    }

    return () => {
      stopDiscovery();
    };
  }, [discoveryEnabled]);

  // Handle peer announce
  const handlePeerAnnounce = (message: any) => {
    const { peerId, name, metadata } = message;
    
    // Don't add ourselves to the list
    if (peerId === localPeerId) {
      return;
    }
    
    // Update the discovered peers list
    setDiscoveredPeers((prev) => {
      // Check if the peer is already in the list
      const existingPeerIndex = prev.findIndex((p) => p.id === peerId);
      
      if (existingPeerIndex >= 0) {
        // Update the existing peer
        const updatedPeers = [...prev];
        updatedPeers[existingPeerIndex] = {
          ...updatedPeers[existingPeerIndex],
          name,
          lastSeen: new Date(),
          metadata,
        };
        return updatedPeers;
      } else {
        // Add the new peer
        return [
          ...prev,
          {
            id: peerId,
            name,
            lastSeen: new Date(),
            metadata,
          },
        ];
      }
    });
  };

  // Handle peer list
  const handlePeerList = (message: any) => {
    const { peers } = message;
    
    // Update the discovered peers list
    setDiscoveredPeers((prev) => {
      const newPeers = [...prev];
      
      // Update or add each peer from the list
      peers.forEach((peer: any) => {
        const { peerId, name, metadata } = peer;
        
        // Don't add ourselves to the list
        if (peerId === localPeerId) {
          return;
        }
        
        // Check if the peer is already in the list
        const existingPeerIndex = newPeers.findIndex((p) => p.id === peerId);
        
        if (existingPeerIndex >= 0) {
          // Update the existing peer
          newPeers[existingPeerIndex] = {
            ...newPeers[existingPeerIndex],
            name,
            lastSeen: new Date(),
            metadata,
          };
        } else {
          // Add the new peer
          newPeers.push({
            id: peerId,
            name,
            lastSeen: new Date(),
            metadata,
          });
        }
      });
      
      return newPeers;
    });
    
    setStatusMessage(`Received peer list with ${message.peers.length} peers`);
  };

  // Handle peer request
  const handlePeerRequest = () => {
    // Send our peer information
    announcePeer();
  };

  // Start discovery
  const startDiscovery = () => {
    // Connect to the discovery server
    if (!connectedPeers.includes(DISCOVERY_SERVER_ID)) {
      connect(DISCOVERY_SERVER_ID).catch((error) => {
        console.error('Failed to connect to discovery server:', error);
        setStatusMessage('Failed to connect to discovery server');
      });
    }
    
    // Announce ourselves
    announcePeer();
    
    // Request the peer list
    requestPeerList();
    
    // Set up periodic announcements
    const interval = setInterval(() => {
      announcePeer();
    }, 30000); // Every 30 seconds
    
    setAnnounceInterval(interval);
    setStatusMessage('Peer discovery started');
  };

  // Stop discovery
  const stopDiscovery = () => {
    // Clear the announcement interval
    if (announceInterval) {
      clearInterval(announceInterval);
      setAnnounceInterval(null);
    }
    
    // Disconnect from the discovery server
    if (connectedPeers.includes(DISCOVERY_SERVER_ID)) {
      disconnect(DISCOVERY_SERVER_ID);
    }
    
    setStatusMessage('Peer discovery stopped');
  };

  // Announce ourselves to the network
  const announcePeer = () => {
    if (!localPeerId) return;
    
    // Create the announcement message
    const message = {
      type: 'peer_announce',
      peerId: localPeerId,
      name: peerName,
      metadata: {
        version: '1.0.0',
        features: ['chat', 'trade', 'orderbook'],
        platform: navigator.platform,
        lastActive: new Date().toISOString(),
      },
    };
    
    // Send to all connected peers
    connectedPeers.forEach((peerId) => {
      sendString(peerId, JSON.stringify(message));
    });
    
    // If connected to the discovery server, send it there too
    if (connectedPeers.includes(DISCOVERY_SERVER_ID)) {
      sendString(DISCOVERY_SERVER_ID, JSON.stringify(message));
    }
  };

  // Request the peer list from the discovery server
  const requestPeerList = () => {
    if (!connectedPeers.includes(DISCOVERY_SERVER_ID)) return;
    
    // Create the request message
    const message = {
      type: 'peer_request',
    };
    
    // Send to the discovery server
    sendString(DISCOVERY_SERVER_ID, JSON.stringify(message));
  };

  // Connect to a discovered peer
  const connectToPeer = (peerId: string) => {
    if (connectedPeers.includes(peerId)) {
      setStatusMessage(`Already connected to ${peerId}`);
      return;
    }
    
    connect(peerId)
      .then(() => {
        setStatusMessage(`Connected to ${peerId}`);
        setSelectedPeer(peerId);
      })
      .catch((error) => {
        console.error(`Failed to connect to ${peerId}:`, error);
        setStatusMessage(`Failed to connect to ${peerId}`);
      });
  };

  // Remove stale peers (not seen in the last 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      setDiscoveredPeers((prev) => 
        prev.filter((peer) => peer.lastSeen > fiveMinutesAgo)
      );
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      backgroundColor: '#1a1a2e',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
    }}>
      <h2>Peer Discovery</h2>
      
      {/* Status message */}
      {statusMessage && (
        <div style={{
          backgroundColor: '#16213e',
          borderRadius: '4px',
          padding: '10px',
          marginBottom: '20px',
          color: '#4cc9f0',
        }}>
          {statusMessage}
        </div>
      )}
      
      {/* Connection status */}
      <div style={{ marginBottom: '20px' }}>
        <p>
          Status: {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
        </p>
        {error && (
          <p style={{ color: '#ff6b6b' }}>
            Error: {error.message}
          </p>
        )}
        <p>Local Peer ID: {localPeerId}</p>
        <p>Connected Peers: {connectedPeers.length}</p>
      </div>
      
      {/* Peer name and discovery toggle */}
      <div style={{
        backgroundColor: '#16213e',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Your Name</label>
          <input
            type="text"
            value={peerName}
            onChange={(e) => setPeerName(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #333',
              backgroundColor: '#1a1a2e',
              color: 'white',
              marginBottom: '10px',
            }}
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Peer Discovery</span>
          <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
            <input
              type="checkbox"
              checked={discoveryEnabled}
              onChange={() => setDiscoveryEnabled(!discoveryEnabled)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute',
              cursor: 'pointer',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: discoveryEnabled ? '#4cc9f0' : '#ccc',
              transition: '.4s',
              borderRadius: '34px',
            }}>
              <span style={{
                position: 'absolute',
                content: '""',
                height: '26px',
                width: '26px',
                left: discoveryEnabled ? '26px' : '4px',
                bottom: '4px',
                backgroundColor: 'white',
                transition: '.4s',
                borderRadius: '50%',
              }}></span>
            </span>
          </label>
        </div>
      </div>
      
      {/* Discovered peers */}
      <div>
        <h3>Discovered Peers</h3>
        {discoveredPeers.length === 0 ? (
          <p>No peers discovered yet</p>
        ) : (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {discoveredPeers.map((peer) => (
              <div
                key={peer.id}
                style={{
                  backgroundColor: selectedPeer === peer.id ? '#2a3f5f' : '#16213e',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold' }}>{peer.name}</div>
                  <div style={{ fontSize: '12px', color: '#ccc' }}>{peer.id}</div>
                  <div style={{ fontSize: '12px', color: '#ccc' }}>
                    Last seen: {peer.lastSeen.toLocaleTimeString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#ccc' }}>
                    Version: {peer.metadata.version}
                  </div>
                </div>
                <div>
                  {connectedPeers.includes(peer.id) ? (
                    <button
                      onClick={() => disconnect(peer.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#f72585',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => connectToPeer(peer.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#4cc9f0',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Manual connection */}
      <div style={{
        backgroundColor: '#16213e',
        borderRadius: '8px',
        padding: '20px',
        marginTop: '20px',
      }}>
        <h3>Manual Connection</h3>
        <p>If a peer is not discovered automatically, you can connect manually using their Peer ID:</p>
        
        <div style={{ display: 'flex', marginTop: '10px' }}>
          <input
            type="text"
            placeholder="Peer ID"
            value={selectedPeer || ''}
            onChange={(e) => setSelectedPeer(e.target.value)}
            style={{
              flexGrow: 1,
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #333',
              backgroundColor: '#1a1a2e',
              color: 'white',
              marginRight: '10px',
            }}
          />
          <button
            onClick={() => selectedPeer && connectToPeer(selectedPeer)}
            disabled={!selectedPeer}
            style={{
              padding: '8px 16px',
              backgroundColor: selectedPeer ? '#4cc9f0' : '#333',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedPeer ? 'pointer' : 'not-allowed',
            }}
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebRtcPeerDiscovery;