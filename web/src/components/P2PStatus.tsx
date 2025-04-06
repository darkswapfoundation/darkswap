/**
 * P2PStatus - Component for displaying P2P network status
 * 
 * This component displays the status of the P2P network, including
 * connected peers, relay status, and network health.
 */

import React, { useState, useEffect } from 'react';
import { useDarkSwapContext } from '../contexts/DarkSwapContext';
import { Card } from './MemoizedComponents';
import { EventType, PeerConnectedEvent, PeerDisconnectedEvent, NetworkHealthChangedEvent } from '../wasm/EventTypes';

export interface P2PStatusProps {
  /** CSS class name */
  className?: string;
}

interface Peer {
  id: string;
  address: string;
  connected: boolean;
  lastSeen: number;
}

/**
 * P2PStatus component
 */
export const P2PStatus: React.FC<P2PStatusProps> = ({ 
  className = '',
}) => {
  // DarkSwap context
  const { isInitialized, on, off } = useDarkSwapContext();
  
  // P2P state
  const [peers, setPeers] = useState<Peer[]>([]);
  const [relayConnected, setRelayConnected] = useState<boolean>(false);
  const [networkHealth, setNetworkHealth] = useState<'good' | 'fair' | 'poor'>('poor');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Load P2P status
  useEffect(() => {
    if (!isInitialized) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // This is a placeholder for actual P2P status loading
      // In a real implementation, this would load P2P status from the DarkSwap WebAssembly module
      
      // Simulate loading P2P status
      setTimeout(() => {
        // Generate mock peers
        const mockPeers: Peer[] = [];
        const now = Date.now();
        
        for (let i = 0; i < 5; i++) {
          mockPeers.push({
            id: `peer-${i}`,
            address: `/ip4/192.168.1.${100 + i}/tcp/8080`,
            connected: Math.random() > 0.3,
            lastSeen: now - Math.floor(Math.random() * 60000), // 0-60 seconds ago
          });
        }
        
        // Update state
        setPeers(mockPeers);
        setRelayConnected(true);
        setNetworkHealth('good');
        setIsLoading(false);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
    }
  }, [isInitialized]);
  
  // Handle P2P events
  useEffect(() => {
    if (!isInitialized) return;
    
    // Define event handlers
    const handlePeerConnected = (event: PeerConnectedEvent) => {
      const peer = event.data;
      setPeers(prevPeers => {
        // Check if the peer already exists
        const existingPeerIndex = prevPeers.findIndex(p => p.id === peer.id);
        
        if (existingPeerIndex !== -1) {
          // Update existing peer
          const updatedPeers = [...prevPeers];
          updatedPeers[existingPeerIndex] = {
            ...updatedPeers[existingPeerIndex],
            connected: true,
            lastSeen: Date.now(),
          };
          return updatedPeers;
        } else {
          // Add new peer
          return [...prevPeers, {
            ...peer,
            connected: true,
            lastSeen: Date.now(),
          }];
        }
      });
    };
    
    const handlePeerDisconnected = (event: PeerDisconnectedEvent) => {
      const peerId = event.data.id;
      setPeers(prevPeers => {
        // Check if the peer exists
        const existingPeerIndex = prevPeers.findIndex(p => p.id === peerId);
        
        if (existingPeerIndex !== -1) {
          // Update existing peer
          const updatedPeers = [...prevPeers];
          updatedPeers[existingPeerIndex] = {
            ...updatedPeers[existingPeerIndex],
            connected: false,
            lastSeen: Date.now(),
          };
          return updatedPeers;
        } else {
          return prevPeers;
        }
      });
    };
    
    const handleRelayConnected = () => {
      setRelayConnected(true);
    };
    
    const handleRelayDisconnected = () => {
      setRelayConnected(false);
    };
    
    const handleNetworkHealthChanged = (event: NetworkHealthChangedEvent) => {
      setNetworkHealth(event.data.health);
    };
    
    // Register event handlers
    on<PeerConnectedEvent>(EventType.PeerConnected, handlePeerConnected);
    on<PeerDisconnectedEvent>(EventType.PeerDisconnected, handlePeerDisconnected);
    on(EventType.RelayConnected, handleRelayConnected);
    on(EventType.RelayDisconnected, handleRelayDisconnected);
    on<NetworkHealthChangedEvent>(EventType.NetworkHealthChanged, handleNetworkHealthChanged);
    
    // Clean up event handlers
    return () => {
      off<PeerConnectedEvent>(EventType.PeerConnected, handlePeerConnected);
      off<PeerDisconnectedEvent>(EventType.PeerDisconnected, handlePeerDisconnected);
      off(EventType.RelayConnected, handleRelayConnected);
      off(EventType.RelayDisconnected, handleRelayDisconnected);
      off<NetworkHealthChangedEvent>(EventType.NetworkHealthChanged, handleNetworkHealthChanged);
    };
  }, [isInitialized, on, off]);
  
  // Format time ago
  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) {
      return `${seconds} seconds ago`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)} minutes ago`;
    } else {
      return `${Math.floor(seconds / 3600)} hours ago`;
    }
  };
  
  return (
    <Card className={`p2p-status ${className}`}>
      <h2>P2P Network Status</h2>
      
      {isLoading && (
        <div className="loading">Loading P2P status...</div>
      )}
      
      {error && (
        <div className="error-message">
          {error.message}
        </div>
      )}
      
      <div className="p2p-status-content">
        <div className="status-indicators">
          <div className={`status-indicator relay-status ${relayConnected ? 'connected' : 'disconnected'}`}>
            <span className="label">Relay:</span>
            <span className="value">{relayConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          
          <div className={`status-indicator network-health ${networkHealth}`}>
            <span className="label">Network Health:</span>
            <span className="value">{networkHealth.charAt(0).toUpperCase() + networkHealth.slice(1)}</span>
          </div>
          
          <div className="status-indicator peer-count">
            <span className="label">Connected Peers:</span>
            <span className="value">{peers.filter(p => p.connected).length}</span>
          </div>
        </div>
        
        <div className="peers-list">
          <h3>Peers</h3>
          
          {peers.length > 0 ? (
            <div className="peers">
              <div className="peers-header">
                <div className="peer-id">ID</div>
                <div className="peer-address">Address</div>
                <div className="peer-status">Status</div>
                <div className="peer-last-seen">Last Seen</div>
              </div>
              
              {peers.map((peer) => (
                <div
                  key={peer.id}
                  className={`peer ${peer.connected ? 'connected' : 'disconnected'}`}
                >
                  <div className="peer-id">{peer.id}</div>
                  <div className="peer-address">{peer.address}</div>
                  <div className="peer-status">
                    {peer.connected ? 'Connected' : 'Disconnected'}
                  </div>
                  <div className="peer-last-seen">
                    {formatTimeAgo(peer.lastSeen)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-peers">No peers found</div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default P2PStatus;