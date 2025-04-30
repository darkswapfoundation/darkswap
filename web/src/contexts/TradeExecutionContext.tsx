import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import TradeExecutionService, {
  TradeExecutionState,
  TradeExecutionEventType,
  TradeExecutionEvent,
  TradeExecutionResult,
  PsbtData,
  TradeExecutionErrorType,
  TradeExecutionError,
} from '../services/TradeExecutionService';
import { useApi } from './ApiContext';
import { useNotification } from './NotificationContext';

/**
 * Trade execution context type
 */
interface TradeExecutionContextType {
  service: TradeExecutionService;
  state: TradeExecutionState;
  error?: TradeExecutionError;
  psbt?: PsbtData;
  isExecuting: boolean;
  executeTrade: (orderId: string, amount: string) => Promise<TradeExecutionResult>;
  cancelTrade: () => Promise<boolean>;
  reset: () => void;
}

/**
 * Trade execution context
 */
const TradeExecutionContext = createContext<TradeExecutionContextType | undefined>(undefined);

/**
 * Trade execution provider props
 */
interface TradeExecutionProviderProps {
  children: ReactNode;
}

/**
 * Trade execution provider
 */
export const TradeExecutionProvider: React.FC<TradeExecutionProviderProps> = ({ children }) => {
  // Contexts
  const { client } = useApi();
  const { addNotification } = useNotification();
  
  // State
  const [service] = useState<TradeExecutionService>(() => new TradeExecutionService(client));
  const [state, setState] = useState<TradeExecutionState>(TradeExecutionState.INITIALIZED);
  const [error, setError] = useState<TradeExecutionError | undefined>(undefined);
  const [psbt, setPsbt] = useState<PsbtData | undefined>(undefined);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  
  // Handle state changes
  useEffect(() => {
    const handleStateChanged = (event: TradeExecutionEvent) => {
      setState(event.data.currentState);
      
      // Show notification for important state changes
      switch (event.data.currentState) {
        case TradeExecutionState.PSBT_CREATED:
          addNotification('info', 'PSBT created successfully');
          break;
        case TradeExecutionState.PSBT_SIGNED:
          addNotification('info', 'PSBT signed successfully');
          break;
        case TradeExecutionState.COUNTERPARTY_SIGNED:
          addNotification('info', 'Counterparty signed the PSBT');
          break;
        case TradeExecutionState.COMPLETED:
          addNotification('success', 'Trade completed successfully');
          break;
        case TradeExecutionState.FAILED:
          addNotification('error', 'Trade failed');
          break;
        case TradeExecutionState.CANCELLED:
          addNotification('warning', 'Trade cancelled');
          break;
      }
    };
    
    const handleError = (event: TradeExecutionEvent) => {
      setError(event.data);
      addNotification('error', `Trade error: ${event.data.message}`);
    };
    
    const handleCompleted = (event: TradeExecutionEvent) => {
      setIsExecuting(false);
      setPsbt(service.getPsbt());
      addNotification('success', 'Trade completed successfully');
    };
    
    const handleCancelled = (event: TradeExecutionEvent) => {
      setIsExecuting(false);
      addNotification('warning', 'Trade cancelled');
    };
    
    // Add event listeners
    service.addEventListener(TradeExecutionEventType.STATE_CHANGED, handleStateChanged);
    service.addEventListener(TradeExecutionEventType.ERROR, handleError);
    service.addEventListener(TradeExecutionEventType.COMPLETED, handleCompleted);
    service.addEventListener(TradeExecutionEventType.CANCELLED, handleCancelled);
    
    return () => {
      // Remove event listeners
      service.removeEventListener(TradeExecutionEventType.STATE_CHANGED, handleStateChanged);
      service.removeEventListener(TradeExecutionEventType.ERROR, handleError);
      service.removeEventListener(TradeExecutionEventType.COMPLETED, handleCompleted);
      service.removeEventListener(TradeExecutionEventType.CANCELLED, handleCancelled);
    };
  }, [service, addNotification]);
  
  // Execute trade
  const executeTrade = async (orderId: string, amount: string): Promise<TradeExecutionResult> => {
    setIsExecuting(true);
    setError(undefined);
    
    try {
      const result = await service.executeTrade(orderId, amount);
      
      if (result.success) {
        setPsbt(result.psbt);
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Error executing trade:', error);
      addNotification('error', `Error executing trade: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        success: false,
        error: {
          type: TradeExecutionErrorType.UNKNOWN_ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        state: TradeExecutionState.FAILED,
      };
    } finally {
      if (state !== TradeExecutionState.COMPLETED && state !== TradeExecutionState.WAITING_FOR_COUNTERPARTY) {
        setIsExecuting(false);
      }
    }
  };
  
  // Cancel trade
  const cancelTrade = async (): Promise<boolean> => {
    try {
      return await service.cancelTrade();
    } catch (error) {
      console.error('Error cancelling trade:', error);
      addNotification('error', `Error cancelling trade: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };
  
  // Reset
  const reset = () => {
    service.reset();
    setState(TradeExecutionState.INITIALIZED);
    setError(undefined);
    setPsbt(undefined);
    setIsExecuting(false);
  };
  
  return (
    <TradeExecutionContext.Provider
      value={{
        service,
        state,
        error,
        psbt,
        isExecuting,
        executeTrade,
        cancelTrade,
        reset,
      }}
    >
      {children}
    </TradeExecutionContext.Provider>
  );
};

/**
 * Use trade execution hook
 */
export const useTradeExecution = (): TradeExecutionContextType => {
  const context = useContext(TradeExecutionContext);
  if (context === undefined) {
    throw new Error('useTradeExecution must be used within a TradeExecutionProvider');
  }
  return context;
};

export default TradeExecutionProvider;