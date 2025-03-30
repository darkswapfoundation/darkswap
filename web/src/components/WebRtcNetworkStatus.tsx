import React, { useState, useEffect } from 'react';
import { useWebRtc } from '../contexts/WebRtcContext';

/**
 * WebRTC Network Status component
 * Displays information about WebRTC connections and network status
 */
const WebRtcNetworkStatus: React.FC = () => {
  // WebRTC context
  const {
    isConnected,
    isConnecting,
    error,
    localPeerId,
    connectedPeers,
    webRtcManager,
  } = useWebRtc();

  // State
  const [networkStats, setNetworkStats] = useState<{
    connections: number;
    bytesReceived: number;
    bytesSent: number;
    packetsReceived: number;
    packetsSent: number;
    roundTripTime: number;
  }>({
    connections: 0,
    bytesReceived: 0,
    bytesSent: 0,
    packetsReceived: 0,
    packetsSent: 0,
    roundTripTime: 0,
  });

  // Update network stats
  useEffect(() => {
    if (!webRtcManager || connectedPeers.length === 0) return;

    const interval = setInterval(async () => {
      let totalBytesReceived = 0;
      let totalBytesSent = 0;
      let totalPacketsReceived = 0;
      let totalPacketsSent = 0;
      let totalRoundTripTime = 0;
      let connectionCount = 0;

      // Get stats for each connection
      for (const peerId of connectedPeers) {
        const connection = webRtcManager.getConnection(peerId);
        if (!connection) continue;

        const peerConnection = connection.getPeerConnection();
        if (!peerConnection) continue;

        try {
          const stats = await peerConnection.getStats();
          
          stats.forEach((report) => {
            if (report.type === 'inbound-rtp') {
              totalBytesReceived += report.bytesReceived || 0;
              totalPacketsReceived += report.packetsReceived || 0;
            } else if (report.type === 'outbound-rtp') {
              totalBytesSent += report.bytesSent || 0;
              totalPacketsSent += report.packetsSent || 0;
            } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              totalRoundTripTime += report.currentRoundTripTime || 0;
              connectionCount++;
            }
          });
        } catch (error) {
          console.error('Error getting stats:', error);
        }
      }

      // Update stats
      setNetworkStats({
        connections: connectedPeers.length,
        bytesReceived: totalBytesReceived,
        bytesSent: totalBytesSent,
        packetsReceived: totalPacketsReceived,
        packetsSent: totalPacketsSent,
        roundTripTime: connectionCount > 0 ? totalRoundTripTime / connectionCount : 0,
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [webRtcManager, connectedPeers]);

  // Format bytes to human-readable format
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div style={{
      backgroundColor: '#1a1a2e',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
    }}>
      <h2>WebRTC Network Status</h2>
      
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
      
      {/* Network stats */}
      {connectedPeers.length > 0 && (
        <div>
          <h3>Network Statistics</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '20px',
          }}>
            <div style={{
              backgroundColor: '#16213e',
              borderRadius: '8px',
              padding: '15px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '14px', color: '#ccc' }}>Connections</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{networkStats.connections}</div>
            </div>
            
            <div style={{
              backgroundColor: '#16213e',
              borderRadius: '8px',
              padding: '15px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '14px', color: '#ccc' }}>Data Received</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatBytes(networkStats.bytesReceived)}</div>
            </div>
            
            <div style={{
              backgroundColor: '#16213e',
              borderRadius: '8px',
              padding: '15px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '14px', color: '#ccc' }}>Data Sent</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatBytes(networkStats.bytesSent)}</div>
            </div>
            
            <div style={{
              backgroundColor: '#16213e',
              borderRadius: '8px',
              padding: '15px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '14px', color: '#ccc' }}>Round Trip Time</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {networkStats.roundTripTime > 0 
                  ? `${(networkStats.roundTripTime * 1000).toFixed(2)} ms` 
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Connected peers */}
      {connectedPeers.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Connected Peers</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {connectedPeers.map((peerId) => {
              const connection = webRtcManager?.getConnection(peerId);
              const peerConnection = connection?.getPeerConnection();
              const iceConnectionState = peerConnection?.iceConnectionState || 'unknown';
              const signalingState = peerConnection?.signalingState || 'unknown';
              
              return (
                <li key={peerId} style={{
                  backgroundColor: '#16213e',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '10px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{peerId}</div>
                      <div style={{ fontSize: '14px', color: '#ccc' }}>
                        ICE: <span style={{ 
                          color: 
                            iceConnectionState === 'connected' || iceConnectionState === 'completed' 
                              ? '#4cc9f0' 
                              : iceConnectionState === 'checking' 
                                ? '#f9c74f' 
                                : '#f94144'
                        }}>
                          {iceConnectionState}
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', color: '#ccc' }}>
                        Signaling: <span>{signalingState}</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        backgroundColor: 
                          iceConnectionState === 'connected' || iceConnectionState === 'completed' 
                            ? '#4cc9f0' 
                            : iceConnectionState === 'checking' 
                              ? '#f9c74f' 
                              : '#f94144',
                        display: 'inline-block',
                        marginLeft: '10px',
                      }}></div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => {
                        const dataChannel = connection?.getDataChannel('data');
                        if (connection && dataChannel && dataChannel.readyState === 'open') {
                          const pingMessage = JSON.stringify({
                            type: 'ping',
                            timestamp: Date.now(),
                          });
                          connection.sendString('data', pingMessage);
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#4cc9f0',
                        color: '#16213e',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Ping
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WebRtcNetworkStatus;