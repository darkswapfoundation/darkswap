import React from 'react';
import { motion } from 'framer-motion';

// Icons
import {
  UsersIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export interface PeerStatusProps {
  peerCount: number;
  orderCount: number;
}

const PeerStatus: React.FC<PeerStatusProps> = ({ peerCount, orderCount }) => {
  // Determine connection quality based on peer count
  const getConnectionQuality = (): 'poor' | 'fair' | 'good' | 'excellent' => {
    if (peerCount < 5) return 'poor';
    if (peerCount < 10) return 'fair';
    if (peerCount < 20) return 'good';
    return 'excellent';
  };

  const connectionQuality = getConnectionQuality();
  
  // Get color based on connection quality
  const getConnectionColor = (): string => {
    switch (connectionQuality) {
      case 'poor':
        return 'text-red-400';
      case 'fair':
        return 'text-yellow-400';
      case 'good':
        return 'text-green-400';
      case 'excellent':
        return 'text-twilight-neon-green';
      default:
        return 'text-gray-400';
    }
  };

  // Get signal bars based on connection quality
  const getSignalBars = (): JSX.Element => {
    const bars = [];
    const totalBars = 4;
    let activeBars = 0;
    
    switch (connectionQuality) {
      case 'poor':
        activeBars = 1;
        break;
      case 'fair':
        activeBars = 2;
        break;
      case 'good':
        activeBars = 3;
        break;
      case 'excellent':
        activeBars = 4;
        break;
      default:
        activeBars = 0;
    }
    
    for (let i = 0; i < totalBars; i++) {
      bars.push(
        <div 
          key={i}
          className={`w-1 mx-0.5 rounded-sm ${i < activeBars ? getConnectionColor() : 'bg-twilight-dark'}`}
          style={{ height: `${(i + 1) * 3 + 2}px` }}
        />
      );
    }
    
    return <div className="flex items-end">{bars}</div>;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card-glass p-3 flex items-center space-x-4"
    >
      {/* Connection Quality */}
      <div className="flex items-center">
        <div className="mr-2">
          {getSignalBars()}
        </div>
        <div>
          <div className="text-xs text-gray-400">Network</div>
          <div className={`text-sm font-medium ${getConnectionColor()}`}>
            {connectionQuality.charAt(0).toUpperCase() + connectionQuality.slice(1)}
          </div>
        </div>
      </div>
      
      {/* Peer Count */}
      <div className="flex items-center">
        <UsersIcon className="w-5 h-5 text-twilight-neon-blue mr-2" />
        <div>
          <div className="text-xs text-gray-400">Peers</div>
          <div className="text-sm font-medium">{peerCount}</div>
        </div>
      </div>
      
      {/* Order Count */}
      <div className="flex items-center">
        <DocumentTextIcon className="w-5 h-5 text-twilight-neon-purple mr-2" />
        <div>
          <div className="text-xs text-gray-400">Orders</div>
          <div className="text-sm font-medium">{orderCount}</div>
        </div>
      </div>
    </motion.div>
  );
};

export default PeerStatus;