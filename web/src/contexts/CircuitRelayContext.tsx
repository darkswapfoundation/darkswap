import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import CircuitRelayService, {
  RelayInfo,
  RelayType,
  RelayRoute,
  CircuitRelayEventType,
  CircuitRelayEvent,
} from '../services/CircuitRelayService';
import { useNotification } from './NotificationContext';

// Context type
interface CircuitRelayContextType {
  service: CircuitRelayService;
  relays: RelayInfo[];
  connectedRelays: RelayInfo[];
  routes: RelayRoute[];
  activeRoutes: RelayRoute[];
  isStarted: boolean;
  startRelay: () => Promise<void>;
  stopRelay: () => void;
  addRelay: (address: string, type?: RelayType) => string;
  removeRelay: (relayId: string) => void;
  connectToRelay: (relayId: string) => Promise<boolean>;
  disconnectFromRelay: (relayId: string) => void;
  createRoute: (targetPeerId: string) => Promise<string | null>;
  closeRoute: (routeId: string) => void;
  sendMessageThroughRoute: (routeId: string, message: any) => boolean;
}

// Create context
const CircuitRelayContext = createContext<CircuitRelayContextType | undefined>(undefined);

// Provider props
interface CircuitRelayProviderProps {
  children: ReactNode;
  relays?: string[];
  maxRelays?: number;
  enableAutoRelay?: boolean;
  autoStart?: boolean;
}

// Provider component
export const CircuitRelayProvider: React.FC<CircuitRelayProviderProps> = ({
  children,
  relays,
  maxRelays = 3,
  enableAutoRelay = true,
  autoStart = false,
}) => {
  // Get the circuit relay service
  const service = CircuitRelayService.getInstance({
    relays,
    maxRelays,
    enableAutoRelay,
  });
  const { addNotification } = useNotification();
  
  // State
  const [allRelays, setAllRelays] = useState<RelayInfo[]>([]);
  const [connectedRelays, setConnectedRelays] = useState<RelayInfo[]>([]);
  const [allRoutes, setAllRoutes] = useState<RelayRoute[]>([]);
  const [activeRoutes, setActiveRoutes] = useState<RelayRoute[]>([]);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  
  // Update relays and routes
  const updateRelaysAndRoutes = () => {
    setAllRelays(service.getAllRelays());
    setConnectedRelays(service.getConnectedRelays());
    setAllRoutes(service.getAllRoutes());
    setActiveRoutes(service.getActiveRoutes());
  };
  
  // Handle relay connected
  const handleRelayConnected = (event: CircuitRelayEvent) => {
    updateRelaysAndRoutes();
    const relay = service.getRelayInfo(event.data.relayId);
    if (relay) {
      addNotification('success', `Connected to relay: ${relay.address}`);
    }
  };
  
  // Handle relay disconnected
  const handleRelayDisconnected = (event: CircuitRelayEvent) => {
    updateRelaysAndRoutes();
    const relay = service.getRelayInfo(event.data.relayId);
    if (relay) {
      addNotification('info', `Disconnected from relay: ${relay.address}`);
    }
  };
  
  // Handle route established
  const handleRouteEstablished = (event: CircuitRelayEvent) => {
    updateRelaysAndRoutes();
    addNotification('success', `Route established to peer: ${event.data.targetPeerId}`);
  };
  
  // Handle route closed
  const handleRouteClosed = (event: CircuitRelayEvent) => {
    updateRelaysAndRoutes();
    addNotification('info', `Route closed: ${event.data.routeId}`);
  };
  
  // Handle error
  const handleError = (event: CircuitRelayEvent) => {
    addNotification('error', `Circuit relay error: ${event.data.message}`);
  };
  
  // Set up event listeners
  useEffect(() => {
    // Add event listeners
    service.addEventListener(CircuitRelayEventType.RELAY_CONNECTED, handleRelayConnected);
    service.addEventListener(CircuitRelayEventType.RELAY_DISCONNECTED, handleRelayDisconnected);
    service.addEventListener(CircuitRelayEventType.ROUTE_ESTABLISHED, handleRouteEstablished);
    service.addEventListener(CircuitRelayEventType.ROUTE_CLOSED, handleRouteClosed);
    service.addEventListener(CircuitRelayEventType.ERROR, handleError);
    
    // Initial update
    updateRelaysAndRoutes();
    
    // Auto-start if enabled
    if (autoStart) {
      startRelay();
    }
    
    return () => {
      // Remove event listeners
      service.removeEventListener(CircuitRelayEventType.RELAY_CONNECTED, handleRelayConnected);
      service.removeEventListener(CircuitRelayEventType.RELAY_DISCONNECTED, handleRelayDisconnected);
      service.removeEventListener(CircuitRelayEventType.ROUTE_ESTABLISHED, handleRouteEstablished);
      service.removeEventListener(CircuitRelayEventType.ROUTE_CLOSED, handleRouteClosed);
      service.removeEventListener(CircuitRelayEventType.ERROR, handleError);
      
      // Stop service
      service.stop();
    };
  }, [service, autoStart]);
  
  // Start relay
  const startRelay = async () => {
    try {
      await service.start();
      setIsStarted(true);
      updateRelaysAndRoutes();
      addNotification('success', 'Circuit relay service started');
    } catch (error) {
      console.error('Failed to start circuit relay service:', error);
      addNotification('error', `Failed to start circuit relay service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Stop relay
  const stopRelay = () => {
    service.stop();
    setIsStarted(false);
    updateRelaysAndRoutes();
    addNotification('info', 'Circuit relay service stopped');
  };
  
  // Add relay
  const addRelay = (address: string, type?: RelayType) => {
    const relayId = service.addRelay(address, type);
    updateRelaysAndRoutes();
    addNotification('info', `Added relay: ${address}`);
    return relayId;
  };
  
  // Remove relay
  const removeRelay = (relayId: string) => {
    const relay = service.getRelayInfo(relayId);
    service.removeRelay(relayId);
    updateRelaysAndRoutes();
    if (relay) {
      addNotification('info', `Removed relay: ${relay.address}`);
    }
  };
  
  // Connect to relay
  const connectToRelay = async (relayId: string) => {
    try {
      const result = await service.connectToRelay(relayId);
      updateRelaysAndRoutes();
      return result;
    } catch (error) {
      console.error(`Failed to connect to relay ${relayId}:`, error);
      addNotification('error', `Failed to connect to relay: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };
  
  // Disconnect from relay
  const disconnectFromRelay = (relayId: string) => {
    service.disconnectFromRelay(relayId);
    updateRelaysAndRoutes();
  };
  
  // Create route
  const createRoute = async (targetPeerId: string) => {
    try {
      const routeId = await service.createRoute(targetPeerId);
      updateRelaysAndRoutes();
      return routeId;
    } catch (error) {
      console.error(`Failed to create route to peer ${targetPeerId}:`, error);
      addNotification('error', `Failed to create route: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };
  
  // Close route
  const closeRoute = (routeId: string) => {
    service.closeRoute(routeId);
    updateRelaysAndRoutes();
  };
  
  // Send message through route
  const sendMessageThroughRoute = (routeId: string, message: any) => {
    return service.sendMessageThroughRoute(routeId, message);
  };
  
  return (
    <CircuitRelayContext.Provider
      value={{
        service,
        relays: allRelays,
        connectedRelays,
        routes: allRoutes,
        activeRoutes,
        isStarted,
        startRelay,
        stopRelay,
        addRelay,
        removeRelay,
        connectToRelay,
        disconnectFromRelay,
        createRoute,
        closeRoute,
        sendMessageThroughRoute,
      }}
    >
      {children}
    </CircuitRelayContext.Provider>
  );
};

// Hook for using the circuit relay context
export const useCircuitRelay = (): CircuitRelayContextType => {
  const context = useContext(CircuitRelayContext);
  if (context === undefined) {
    throw new Error('useCircuitRelay must be used within a CircuitRelayProvider');
  }
  return context;
};

export default CircuitRelayProvider;