import React from 'react';
import { motion } from 'framer-motion';
import { useWasmWallet } from '../contexts/WasmWalletContext';
import OrderHistory from '../components/OrderHistory';

// Icons
import {
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const Orders: React.FC = () => {
  // Get wallet context
  const { isConnected: isWalletConnected, isInitialized: isSDKInitialized } = useWasmWallet();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">
            <span className="text-white">My Orders</span>
          </h1>
          <p className="text-gray-400 mt-1">
            View and manage your open and past orders
          </p>
        </div>
      </div>

      {/* Connection Warning */}
      {!isWalletConnected && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-glass p-4 border border-ui-warning border-opacity-50"
        >
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-ui-warning mr-2" />
            <span className="text-ui-warning">
              Connect your wallet to view your orders
            </span>
          </div>
        </motion.div>
      )}

      {/* SDK Warning */}
      {isWalletConnected && !isSDKInitialized && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-glass p-4 border border-ui-warning border-opacity-50"
        >
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-ui-warning mr-2" />
            <span className="text-ui-warning">
              Initializing DarkSwap SDK...
            </span>
          </div>
        </motion.div>
      )}

      {/* Orders */}
      <OrderHistory />
    </div>
  );
};

export default Orders;