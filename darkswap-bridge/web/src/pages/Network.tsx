import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Table, Badge } from 'react-bootstrap';
import { useApi } from '../contexts/ApiContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useNotification } from '../contexts/NotificationContext';

// Define peer type
interface Peer {
  id: string;
  address: string;
  connected_since: number;
  last_seen: number;
  status: 'Connected' | 'Disconnected';
  direction: 'Inbound' | 'Outbound';
}

// Network page component
const NetworkPage: React.FC = () => {
  const { api, loading, error } = useApi();
  const { connected } = useWebSocket();
  const { addNotification } = useNotification();
  const [networkStatus, setNetworkStatus] = useState<any>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [peerAddress, setPeerAddress] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchNetworkStatus();
  }, []);

  // Fetch network status
  const fetchNetworkStatus = async () => {
    try {
      const response = await api.get('/api/bridge/network/status');
      setNetworkStatus(response.data);

      if (response.data.connected) {
        fetchPeers();
      }
    } catch (error) {
      console.error('Error fetching network status:', error);
    }
  };

  // Fetch peers
  const fetchPeers = async () => {
    try {
      const response = await api.get('/api/bridge/network/peers');
      setPeers(response.data.peers || []);
    } catch (error) {
      console.error('Error fetching peers:', error);
    }
  };

  // Connect to peer
  const handleConnectToPeer = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    try {
      await api.post('/api/bridge/network', {
        command: 'Connect',
        address: peerAddress,
      });

      setActionSuccess(`Connected to peer ${peerAddress} successfully`);
      addNotification('success', `Connected to peer ${peerAddress} successfully`);
      fetchPeers();
      setPeerAddress('');
    } catch (error: any) {
      setActionError(error.response?.data?.message || 'Failed to connect to peer');
      addNotification('error', error.response?.data?.message || 'Failed to connect to peer');
    }
  };

  // Disconnect from peer
  const handleDisconnectFromPeer = async (peerId: string) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      await api.post('/api/bridge/network', {
        command: 'Disconnect',
        peer_id: peerId,
      });

      setActionSuccess(`Disconnected from peer ${peerId} successfully`);
      addNotification('success', `Disconnected from peer ${peerId} successfully`);
      fetchPeers();
    } catch (error: any) {
      setActionError(error.response?.data?.message || 'Failed to disconnect from peer');
      addNotification('error', error.response?.data?.message || 'Failed to disconnect from peer');
    }
  };

  // Format timestamp as date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Calculate time since
  const timeSince = (timestamp: number) => {
    const seconds = Math.floor((Date.now() / 1000 - timestamp));
    
    if (seconds < 60) {
      return `${seconds} seconds`;
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hours`;
    }
    
    const days = Math.floor(hours / 24);
    return `${days} days`;
  };

  return (
    <Container>
      <h1 className="mb-4">Network</h1>

      {error && <Alert variant="danger">{error}</Alert>}
      {actionError && <Alert variant="danger">{actionError}</Alert>}
      {actionSuccess && <Alert variant="success">{actionSuccess}</Alert>}

      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>Network Status</Card.Header>
            <Card.Body>
              {loading ? (
                <p>Loading...</p>
              ) : networkStatus ? (
                <>
                  <p>
                    <strong>Connected:</strong> {networkStatus.connected ? 'Yes' : 'No'}
                  </p>
                  <p>
                    <strong>Peer Count:</strong> {networkStatus.peer_count}
                  </p>
                  <p>
                    <strong>WebSocket:</strong> {connected ? 'Connected' : 'Disconnected'}
                  </p>
                </>
              ) : (
                <p>No data available</p>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>Connect to Peer</Card.Header>
            <Card.Body>
              <Form onSubmit={handleConnectToPeer}>
                <Form.Group className="mb-3">
                  <Form.Label>Peer Address</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter peer address (e.g., /ip4/127.0.0.1/tcp/8000/p2p/QmHash)"
                    value={peerAddress}
                    onChange={(e) => setPeerAddress(e.target.value)}
                    required
                  />
                </Form.Group>
                <Button variant="primary" type="submit" disabled={loading}>
                  Connect
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>Connected Peers</Card.Header>
            <Card.Body>
              {loading ? (
                <p>Loading...</p>
              ) : peers.length > 0 ? (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Address</th>
                        <th>Connected Since</th>
                        <th>Last Seen</th>
                        <th>Status</th>
                        <th>Direction</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {peers.map((peer) => (
                        <tr key={peer.id}>
                          <td>{peer.id.substring(0, 8)}...</td>
                          <td>{peer.address}</td>
                          <td>{formatDate(peer.connected_since)}</td>
                          <td>{timeSince(peer.last_seen)} ago</td>
                          <td>
                            <Badge bg={peer.status === 'Connected' ? 'success' : 'danger'}>
                              {peer.status}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={peer.direction === 'Inbound' ? 'info' : 'primary'}>
                              {peer.direction}
                            </Badge>
                          </td>
                          <td>
                            {peer.status === 'Connected' && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDisconnectFromPeer(peer.id)}
                                disabled={loading}
                              >
                                Disconnect
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <p>No peers connected</p>
              )}
              <Button variant="secondary" onClick={fetchPeers} disabled={loading} className="mt-3">
                Refresh
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>Network Diagnostics</Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Card>
                    <Card.Header>Ping Test</Card.Header>
                    <Card.Body>
                      <p>Test connectivity to a specific peer by sending a ping request.</p>
                      <Form>
                        <Form.Group className="mb-3">
                          <Form.Label>Peer ID</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Enter peer ID"
                            required
                          />
                        </Form.Group>
                        <Button variant="primary" type="submit" disabled={loading}>
                          Ping Peer
                        </Button>
                      </Form>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card>
                    <Card.Header>Network Health</Card.Header>
                    <Card.Body>
                      <p>
                        <strong>Average Latency:</strong> 120ms
                      </p>
                      <p>
                        <strong>Packet Loss:</strong> 0.5%
                      </p>
                      <p>
                        <strong>Bandwidth:</strong> 1.2 MB/s
                      </p>
                      <Button variant="primary" disabled={loading}>
                        Run Diagnostics
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default NetworkPage;