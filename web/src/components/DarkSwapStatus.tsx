/**
 * DarkSwapStatus - Component for displaying DarkSwap status
 * 
 * This component displays the current status of the DarkSwap WebAssembly module,
 * including whether it is initialized, any errors, and the current configuration.
 */

import React from 'react';
import { useDarkSwapContext } from '../contexts/DarkSwapContext';
import { Card } from './MemoizedComponents';

export interface DarkSwapStatusProps {
  /** CSS class name */
  className?: string;
}

/**
 * DarkSwapStatus component
 */
export const DarkSwapStatus: React.FC<DarkSwapStatusProps> = ({ 
  className = '',
}) => {
  // DarkSwap context
  const { isInitialized, isInitializing, error } = useDarkSwapContext();
  
  return (
    <Card className={`darkswap-status ${className}`}>
      <h2>DarkSwap Status</h2>
      
      <div className="status-indicators">
        <div className={`status-indicator ${isInitialized ? 'initialized' : 'not-initialized'}`}>
          <span className="label">Status:</span>
          <span className="value">
            {isInitializing ? 'Initializing...' : isInitialized ? 'Initialized' : 'Not Initialized'}
          </span>
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          {error.message}
        </div>
      )}
    </Card>
  );
};

export default DarkSwapStatus;