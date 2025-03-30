import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useWebRtc } from '../contexts/WebRtcContext';

/**
 * WebRTC demo component
 */
const WebRtcDemo: React.FC = () => {
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
  const [targetPeerId, setTargetPeerId] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<{ peerId: string; message: string; incoming: boolean }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle incoming messages
  useEffect(() => {
    const handleMessage = (peerId: string, data: any) => {
      const message = typeof data === 'string' ? data : new TextDecoder().decode(data);
      setMessages((prev) => [...prev, { peerId, message, incoming: true }]);
    };

    onMessage(handleMessage);

    return () => {
      offMessage(handleMessage);
    };
  }, [onMessage, offMessage]);

  // Connect to a peer
  const handleConnect = async () => {
    if (!targetPeerId) return;

    try {
      await connect(targetPeerId);
    } catch (err) {
      console.error('Failed to connect:', err);
    }
  };

  // Disconnect from a peer
  const handleDisconnect = (peerId: string) => {
    disconnect(peerId);
  };

  // Send a message
  const handleSendMessage = (peerId: string) => {
    if (!message) return;

    sendString(peerId, message);
    setMessages((prev) => [...prev, { peerId, message, incoming: false }]);
    setMessage('');
  };

  return (
    <div className="webrtc-demo" style={{ padding: '20px', maxWidth: '600px', margin: '20px auto', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>WebRTC Demo</h2>

      {/* Connection status */}
      <div style={{ marginBottom: '20px' }}>
        <p>
          Status: {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
        </p>
        {error && (
          <p style={{ color: 'red' }}>
            Error: {error.message}
          </p>
        )}
        <p>Local Peer ID: {localPeerId}</p>
      </div>

      {/* Connect to peer */}
      <div style={{ display: 'flex', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Peer ID"
          value={targetPeerId}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setTargetPeerId(e.target.value)}
          style={{ flexGrow: 1, marginRight: '10px', padding: '8px' }}
        />
        <button 
          onClick={handleConnect} 
          disabled={!targetPeerId || isConnecting}
          style={{ padding: '8px 16px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Connect
        </button>
      </div>

      {/* Connected peers */}
      {connectedPeers.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Connected Peers</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {connectedPeers.map((peerId) => (
              <li key={peerId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                <span>{peerId}</span>
                <button 
                  onClick={() => handleDisconnect(peerId)}
                  style={{ padding: '4px 8px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px' }}
                >
                  Disconnect
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Messages */}
      {connectedPeers.length > 0 && (
        <>
          <h3>Messages</h3>
          <div
            style={{
              height: '200px',
              overflow: 'auto',
              padding: '16px',
              marginBottom: '16px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  textAlign: msg.incoming ? 'left' : 'right',
                  marginBottom: '8px',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    backgroundColor: msg.incoming ? '#e0e0e0' : '#2196f3',
                    color: msg.incoming ? 'black' : 'white',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    maxWidth: '80%',
                  }}
                >
                  <p style={{ margin: 0 }}>{msg.message}</p>
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  {msg.incoming ? `From: ${msg.peerId}` : `To: ${msg.peerId}`}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Send message */}
          {connectedPeers.map((peerId) => (
            <div key={peerId} style={{ display: 'flex', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder={`Message to ${peerId}`}
                value={message}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                style={{ flexGrow: 1, marginRight: '10px', padding: '8px' }}
              />
              <button
                onClick={() => handleSendMessage(peerId)}
                disabled={!message}
                style={{ padding: '8px 16px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                Send
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default WebRtcDemo;