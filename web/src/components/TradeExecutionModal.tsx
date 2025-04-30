import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import TradeExecution from './TradeExecution';
import { Order } from '../utils/ApiClient';

export interface TradeExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: Order;
}

const TradeExecutionModal: React.FC<TradeExecutionModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  // State
  const [isVisible, setIsVisible] = useState<boolean>(false);
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);
  
  // Handle animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300); // Match the transition duration
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  // Handle close
  const handleClose = () => {
    onClose();
  };
  
  // Handle trade completion
  const handleTradeComplete = () => {
    // Wait a bit before closing the modal
    setTimeout(() => {
      handleClose();
    }, 3000);
  };
  
  // Format asset name
  const formatAssetName = (asset: string) => {
    if (asset.includes(':')) {
      const [type, id] = asset.split(':');
      return `${type}${id ? ` (${id.substring(0, 6)}...)` : ''}`;
    }
    return asset;
  };
  
  if (!isVisible) {
    return null;
  }
  
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      } transition-opacity duration-300`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-75"
        onClick={handleClose}
      ></div>
      
      {/* Modal */}
      <div
        className={`relative bg-twilight-primary border border-twilight-accent rounded-xl shadow-xl w-full max-w-md transform ${
          isOpen ? 'scale-100' : 'scale-95'
        } transition-transform duration-300`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-twilight-dark">
          <h2 className="text-lg font-display font-medium">
            Execute Trade
            {order && (
              <span className="ml-2 text-sm text-gray-400">
                {order.side === 'buy' ? 'Buy' : 'Sell'} {formatAssetName(order.base_asset)}
              </span>
            )}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-twilight-dark transition-colors duration-200"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-4">
          {order ? (
            <TradeExecution
              orderId={order.id}
              baseAsset={order.base_asset}
              quoteAsset={order.quote_asset}
              side={order.side}
              price={parseFloat(order.price)}
              maxAmount={parseFloat(order.amount)}
              onComplete={handleTradeComplete}
              onCancel={handleClose}
            />
          ) : (
            <div className="text-center py-8 text-gray-400">
              No order selected
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradeExecutionModal;