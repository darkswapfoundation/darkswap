import React from 'react';
import { Badge } from 'react-bootstrap';
import { BsWifi, BsWifiOff } from 'react-icons/bs';
import { useWebSocket } from '../contexts/WebSocketContext';

// WebSocket status component
const WebSocketStatus: React.FC = () => {
  const { connected } = useWebSocket();

  return (
    <div className="d-flex align-items-center me-3">
      {connected ? (
        <Badge bg="success" className="d-flex align-items-center">
          <BsWifi className="me-1" /> Connected
        </Badge>
      ) : (
        <Badge bg="danger" className="d-flex align-items-center">
          <BsWifiOff className="me-1" /> Disconnected
        </Badge>
      )}
    </div>
  );
};

export default WebSocketStatus;