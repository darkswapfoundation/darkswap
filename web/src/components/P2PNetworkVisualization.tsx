import React, { useEffect, useRef, useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useApi } from '../contexts/ApiContext';
import ForceGraph2D from 'react-force-graph-2d';
import { useTheme } from '../contexts/ThemeContext';
import { Box, Typography, Paper, CircularProgress, Button, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';

interface Node {
  id: string;
  name: string;
  val: number;
  color: string;
  type: 'self' | 'peer' | 'relay';
}

interface Link {
  source: string;
  target: string;
  value: number;
  color: string;
  type: 'direct' | 'relay';
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

/**
 * P2P Network Visualization Component
 * 
 * This component visualizes the P2P network topology, showing the current node,
 * connected peers, and relay servers.
 */
const P2PNetworkVisualization: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { isConnected, peerId, peers } = useWebSocket();
  const { getRelayStatus } = useApi();
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const graphRef = useRef<any>(null);
  
  // Colors for the graph
  const colors = {
    self: '#4caf50',
    peer: '#2196f3',
    relay: '#ff9800',
    directLink: '#aaaaaa',
    relayLink: '#ff9800',
    background: isDarkMode ? '#1e1e2f' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#000000',
  };
  
  // Fetch network data and build the graph
  const fetchNetworkData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get relay status
      const relayStatus = await getRelayStatus();
      
      // Build nodes
      const nodes: Node[] = [];
      const links: Link[] = [];
      
      // Add self node
      nodes.push({
        id: peerId || 'self',
        name: 'You',
        val: 10,
        color: colors.self,
        type: 'self',
      });
      
      // Add peer nodes
      peers.forEach(peer => {
        nodes.push({
          id: peer.id,
          name: peer.id.substring(0, 8) + '...',
          val: 5,
          color: colors.peer,
          type: 'peer',
        });
        
        // Add direct link to peer
        links.push({
          source: peerId || 'self',
          target: peer.id,
          value: 1,
          color: colors.directLink,
          type: 'direct',
        });
      });
      
      // Add relay nodes
      relayStatus.relays.forEach(relay => {
        nodes.push({
          id: relay.id,
          name: relay.address.split('/').pop() || 'Relay',
          val: 8,
          color: colors.relay,
          type: 'relay',
        });
        
        // Add link to relay
        links.push({
          source: peerId || 'self',
          target: relay.id,
          value: 2,
          color: colors.relayLink,
          type: 'relay',
        });
        
        // Add links from relay to peers that are connected through it
        relay.connectedPeers.forEach(connectedPeerId => {
          // Check if the peer exists in our peer list
          if (peers.some(p => p.id === connectedPeerId)) {
            links.push({
              source: relay.id,
              target: connectedPeerId,
              value: 1,
              color: colors.relayLink,
              type: 'relay',
            });
          }
        });
      });
      
      setGraphData({ nodes, links });
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching network data:', err);
      setError('Failed to fetch network data. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Fetch network data on component mount and when connection status changes
  useEffect(() => {
    if (isConnected) {
      fetchNetworkData();
    } else {
      setGraphData({ nodes: [], links: [] });
    }
  }, [isConnected, peerId, peers]);
  
  // Handle refresh button click
  const handleRefresh = () => {
    fetchNetworkData();
  };
  
  // Handle node click
  const handleNodeClick = (node: Node) => {
    // Center the view on the clicked node
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(2, 1000);
    }
    
    // Show node details
    console.log('Node clicked:', node);
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '400px',
          backgroundColor: colors.background,
        }}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2, color: colors.text }}>
          Loading network data...
        </Typography>
      </Paper>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '400px',
          backgroundColor: colors.background,
        }}
      >
        <Typography variant="body1" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
        >
          Retry
        </Button>
      </Paper>
    );
  }
  
  // Render not connected state
  if (!isConnected) {
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '400px',
          backgroundColor: colors.background,
        }}
      >
        <Typography variant="body1" sx={{ color: colors.text }}>
          Not connected to the P2P network.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, color: colors.text }}>
          Connect to the network to see the network visualization.
        </Typography>
      </Paper>
    );
  }
  
  // Render empty state
  if (graphData.nodes.length <= 1) {
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '400px',
          backgroundColor: colors.background,
        }}
      >
        <Typography variant="body1" sx={{ color: colors.text }}>
          No peers connected.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, color: colors.text }}>
          Wait for peers to connect or connect to a relay server.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          sx={{ mt: 2 }}
        >
          Refresh
        </Button>
      </Paper>
    );
  }
  
  // Render graph
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2, 
        display: 'flex', 
        flexDirection: 'column',
        height: '500px',
        backgroundColor: colors.background,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" sx={{ color: colors.text }}>
          P2P Network Visualization
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="This visualization shows your position in the P2P network, including direct peer connections and relay servers.">
            <InfoIcon sx={{ mr: 1, color: colors.text }} />
          </Tooltip>
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: colors.self, mr: 1 }} />
          <Typography variant="body2" sx={{ color: colors.text }}>You</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: colors.peer, mr: 1 }} />
          <Typography variant="body2" sx={{ color: colors.text }}>Peers</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: colors.relay, mr: 1 }} />
          <Typography variant="body2" sx={{ color: colors.text }}>Relays</Typography>
        </Box>
      </Box>
      
      <Box sx={{ flexGrow: 1, border: `1px solid ${isDarkMode ? '#333' : '#ddd'}`, borderRadius: 1, overflow: 'hidden' }}>
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeLabel="name"
          nodeColor="color"
          nodeVal="val"
          linkColor="color"
          linkWidth="value"
          backgroundColor={colors.background}
          onNodeClick={handleNodeClick}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 12/globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);
            
            // Draw node
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.color;
            ctx.fill();
            
            // Draw label for nodes with sufficient size
            if (node.val > 2) {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
              ctx.fillRect(
                node.x - bckgDimensions[0] / 2,
                node.y - bckgDimensions[1] / 2 - 15,
                bckgDimensions[0],
                bckgDimensions[1]
              );
              
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = '#000000';
              ctx.fillText(label, node.x, node.y - 15);
            }
          }}
          cooldownTicks={100}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleSpeed={0.005}
        />
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
        <Typography variant="body2" sx={{ color: colors.text }}>
          {graphData.nodes.length - 1} peers connected
        </Typography>
        <Typography variant="body2" sx={{ color: colors.text }}>
          {graphData.links.filter(link => link.type === 'relay').length} relay connections
        </Typography>
      </Box>
    </Paper>
  );
};

export default P2PNetworkVisualization;