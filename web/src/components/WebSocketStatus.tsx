import React from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

// Icons
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  SignalSlashIcon,
} from '@heroicons/react/24/outline';

interface WebSocketStatusProps {
  showLabel?: boolean;
  className?: string;
}

const WebSocketStatus: React.FC<WebSocketStatusProps> = ({ 
  showLabel = true,
  className = ''
}) => {
  const { connectionStatus, isConnecting } = useWebSocket();

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
      case 'connecting':
        return <ArrowPathIcon className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'reconnecting':
        return <ArrowPathIcon className="w-5 h-5 text-yellow-400 animate-spin" />;
      case 'failed':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />;
      case 'disconnected':
      default:
        return <SignalSlashIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusLabel = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'failed':
        return 'Connection Failed';
      case 'disconnected':
      default:
        return 'Disconnected';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-400';
      case 'connecting':
        return 'text-blue-400';
      case 'reconnecting':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      case 'disconnected':
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className="mr-2">
        {getStatusIcon()}
      </div>
      {showLabel && (
        <span className={`text-sm ${getStatusColor()}`}>
          {getStatusLabel()}
        </span>
      )}
    </div>
  );
};

export default WebSocketStatus;