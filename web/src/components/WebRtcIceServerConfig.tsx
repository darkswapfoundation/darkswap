import React, { useState, useEffect } from 'react';
import { WebRtcIceServers, IceServerConfig } from '../utils/WebRtcIceServers';

/**
 * WebRTC ICE Server Configuration component
 * Allows users to configure STUN and TURN servers for improved NAT traversal
 */
const WebRtcIceServerConfig: React.FC = () => {
  // State
  const [iceServers, setIceServers] = useState<RTCIceServer[]>([]);
  const [newServerUrl, setNewServerUrl] = useState<string>('');
  const [newServerType, setNewServerType] = useState<'stun' | 'turn'>('stun');
  const [newServerUsername, setNewServerUsername] = useState<string>('');
  const [newServerCredential, setNewServerCredential] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [testResults, setTestResults] = useState<{ url: string; reachable: boolean }[]>([]);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  // Load ICE servers
  useEffect(() => {
    const servers = WebRtcIceServers.getIceServers();
    setIceServers(servers);
  }, []);

  // Add a new ICE server
  const addIceServer = () => {
    if (!newServerUrl) {
      setStatusMessage('Please enter a server URL');
      return;
    }

    try {
      // Validate URL format
      if (!newServerUrl.startsWith('stun:') && !newServerUrl.startsWith('turn:') && !newServerUrl.startsWith('turns:')) {
        setStatusMessage(`Server URL must start with 'stun:', 'turn:', or 'turns:'`);
        return;
      }

      // Add the server
      if (newServerType === 'stun') {
        WebRtcIceServers.addStunServer(newServerUrl);
      } else {
        if (!newServerUsername || !newServerCredential) {
          setStatusMessage('Please enter username and credential for TURN server');
          return;
        }
        WebRtcIceServers.addTurnServer(newServerUrl, newServerUsername, newServerCredential);
      }

      // Reload servers
      const servers = WebRtcIceServers.getIceServers();
      setIceServers(servers);

      // Clear form
      setNewServerUrl('');
      setNewServerUsername('');
      setNewServerCredential('');

      setStatusMessage(`${newServerType.toUpperCase()} server added successfully`);
    } catch (error) {
      console.error('Error adding ICE server:', error);
      setStatusMessage(`Error adding ICE server: ${error}`);
    }
  };

  // Remove an ICE server
  const removeIceServer = (url: string) => {
    try {
      WebRtcIceServers.removeIceServer(url);

      // Reload servers
      const servers = WebRtcIceServers.getIceServers();
      setIceServers(servers);

      setStatusMessage('ICE server removed successfully');
    } catch (error) {
      console.error('Error removing ICE server:', error);
      setStatusMessage(`Error removing ICE server: ${error}`);
    }
  };

  // Reset ICE servers to default
  const resetIceServers = () => {
    try {
      WebRtcIceServers.resetIceServers();

      // Reload servers
      const servers = WebRtcIceServers.getIceServers();
      setIceServers(servers);

      setStatusMessage('ICE servers reset to default');
    } catch (error) {
      console.error('Error resetting ICE servers:', error);
      setStatusMessage(`Error resetting ICE servers: ${error}`);
    }
  };

  // Test ICE servers
  const testIceServers = async () => {
    setIsTesting(true);
    setStatusMessage('Testing ICE servers...');

    try {
      const results = await WebRtcIceServers.testAllIceServers();
      setTestResults(results);
      
      const reachableCount = results.filter(r => r.reachable).length;
      setStatusMessage(`ICE server testing complete. ${reachableCount} of ${results.length} servers are reachable.`);
    } catch (error) {
      console.error('Error testing ICE servers:', error);
      setStatusMessage(`Error testing ICE servers: ${error}`);
    } finally {
      setIsTesting(false);
    }
  };

  // Get server type from URL
  const getServerType = (url: string): 'STUN' | 'TURN' | 'TURNS' | 'Unknown' => {
    if (url.startsWith('stun:')) return 'STUN';
    if (url.startsWith('turn:')) return 'TURN';
    if (url.startsWith('turns:')) return 'TURNS';
    return 'Unknown';
  };

  return (
    <div style={{
      backgroundColor: '#1a1a2e',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
    }}>
      <h2>ICE Server Configuration</h2>
      
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
      
      {/* Add new server form */}
      <div style={{
        backgroundColor: '#16213e',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <h3>Add New ICE Server</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Server Type</label>
          <select
            value={newServerType}
            onChange={(e) => setNewServerType(e.target.value as 'stun' | 'turn')}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #333',
              backgroundColor: '#1a1a2e',
              color: 'white',
            }}
          >
            <option value="stun">STUN</option>
            <option value="turn">TURN</option>
          </select>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Server URL</label>
          <input
            type="text"
            value={newServerUrl}
            onChange={(e) => setNewServerUrl(e.target.value)}
            placeholder={newServerType === 'stun' ? 'stun:stun.example.com:19302' : 'turn:turn.example.com:3478'}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #333',
              backgroundColor: '#1a1a2e',
              color: 'white',
            }}
          />
        </div>
        
        {newServerType === 'turn' && (
          <>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Username</label>
              <input
                type="text"
                value={newServerUsername}
                onChange={(e) => setNewServerUsername(e.target.value)}
                placeholder="Username"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #333',
                  backgroundColor: '#1a1a2e',
                  color: 'white',
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Credential</label>
              <input
                type="password"
                value={newServerCredential}
                onChange={(e) => setNewServerCredential(e.target.value)}
                placeholder="Credential"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #333',
                  backgroundColor: '#1a1a2e',
                  color: 'white',
                }}
              />
            </div>
          </>
        )}
        
        <button
          onClick={addIceServer}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4cc9f0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Add Server
        </button>
      </div>
      
      {/* Current servers */}
      <div style={{
        backgroundColor: '#16213e',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3>Current ICE Servers</h3>
          <div>
            <button
              onClick={testIceServers}
              disabled={isTesting}
              style={{
                padding: '6px 12px',
                backgroundColor: '#4cc9f0',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isTesting ? 'not-allowed' : 'pointer',
                marginRight: '10px',
              }}
            >
              {isTesting ? 'Testing...' : 'Test Servers'}
            </button>
            
            <button
              onClick={resetIceServers}
              style={{
                padding: '6px 12px',
                backgroundColor: '#f72585',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Reset to Default
            </button>
          </div>
        </div>
        
        {iceServers.length === 0 ? (
          <p>No ICE servers configured</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>URL</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>Auth</th>
                <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #333' }}>Status</th>
                <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {iceServers.map((server) => {
                const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
                
                return urls.map((url, index) => {
                  const serverType = getServerType(url.toString());
                  const hasAuth = !!server.username && !!server.credential;
                  const testResult = testResults.find((r) => r.url === url.toString());
                  
                  return (
                    <tr key={`${url}-${index}`}>
                      <td style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>
                        {serverType}
                      </td>
                      <td style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>
                        {url.toString()}
                      </td>
                      <td style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>
                        {hasAuth ? 'Yes' : 'No'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #333' }}>
                        {testResult ? (
                          <span style={{
                            display: 'inline-block',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: testResult.reachable ? '#90be6d' : '#f94144',
                          }}></span>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>
                        <button
                          onClick={() => removeIceServer(url.toString())}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#f72585',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Information */}
      <div style={{
        backgroundColor: '#16213e',
        borderRadius: '8px',
        padding: '20px',
      }}>
        <h3>About ICE Servers</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <h4>STUN Servers</h4>
          <p>
            STUN (Session Traversal Utilities for NAT) servers help peers discover their public IP address and port when they are behind a NAT (Network Address Translation).
            This is essential for establishing direct peer-to-peer connections.
          </p>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <h4>TURN Servers</h4>
          <p>
            TURN (Traversal Using Relays around NAT) servers act as a fallback when direct peer-to-peer connections cannot be established.
            They relay traffic between peers, ensuring connectivity even in challenging network environments.
            TURN servers require authentication (username and credential) and consume more bandwidth.
          </p>
        </div>
        
        <div>
          <h4>Best Practices</h4>
          <ul style={{ paddingLeft: '20px' }}>
            <li>Configure multiple STUN servers for redundancy</li>
            <li>Add at least one TURN server as a fallback for difficult NAT scenarios</li>
            <li>Test your servers regularly to ensure they are reachable</li>
            <li>Consider using a TURN server with TLS (turns:) for secure relay connections</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WebRtcIceServerConfig;