import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, TextField, List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, IconButton, Divider, Chip, CircularProgress, Alert, Grid } from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import { useWebRtc } from '../contexts/WebRtcContext';
import { useNotification } from '../contexts/NotificationContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import SignalCellularConnectedNoInternet0BarIcon from '@mui/icons-material/SignalCellularConnectedNoInternet0Bar';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';

/**
 * WebRTC Connection Manager Component
 * 
 * This component allows users to manage WebRTC connections with other peers.
 * It provides functionality to:
 * - View current WebRTC connections
 * - Establish new WebRTC connections
 * - Monitor connection status
 * - Disconnect from peers
 */
const WebRtcConnectionManager: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { connections, connect, disconnect, isConnecting, connectionErrors, localId, signalingState } = useWebRtc();
  const { isConnected: isWsConnected, peers } = useWebSocket();
  const { addNotification } = useNotification();
  
  // State for the peer ID input
  const [peerId, setPeerId] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Copy local ID to clipboard
  const copyLocalId = () => {
    if (localId) {
      navigator.clipboard.writeText(localId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addNotification('success', 'Peer ID copied to clipboard');
    }
  };
  
  // Connect to a peer
  const handleConnect = async () => {
    if (!peerId) {
      addNotification('error', 'Please enter a peer ID');
      return;
    }
    
    try {
      await connect(peerId);
      setPeerId('');
      addNotification('success', `Connection request sent to ${peerId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addNotification('error', `Failed to connect: ${errorMessage}`);
    }
  };
  
  // Disconnect from a peer
  const handleDisconnect = async (peerId: string) => {
    try {
      await disconnect(peerId);
      addNotification('info', `Disconnected from ${peerId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addNotification('error', `Failed to disconnect: ${errorMessage}`);
    }
  };
  
  // Get connection status icon
  const getConnectionStatusIcon = (connection: any) => {
    if (!connection) return <SignalCellularConnectedNoInternet0BarIcon color="error" />;
    
    switch (connection.state) {
      case 'connected':
        return <SignalCellularAltIcon color="success" />;
      case 'connecting':
        return <CircularProgress size={20} />;
      case 'disconnected':
        return <LinkOffIcon color="error" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return <WarningIcon color="warning" />;
    }
  };
  
  // Get connection status text
  const getConnectionStatusText = (connection: any) => {
    if (!connection) return 'Unknown';
    
    switch (connection.state) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'failed':
        return 'Failed';
      default:
        return connection.state;
    }
  };
  
  // Get connection status color
  const getConnectionStatusColor = (connection: any) => {
    if (!connection) return 'error';
    
    switch (connection.state) {
      case 'connected':
        return 'success';
      case 'connecting':
        return 'info';
      case 'disconnected':
        return 'error';
      case 'failed':
        return 'error';
      default:
        return 'warning';
    }
  };
  
  // Get signaling state text
  const getSignalingStateText = () => {
    switch (signalingState) {
      case 'connected':
        return 'Connected to signaling server';
      case 'connecting':
        return 'Connecting to signaling server...';
      case 'disconnected':
        return 'Disconnected from signaling server';
      case 'failed':
        return 'Failed to connect to signaling server';
      default:
        return 'Unknown signaling state';
    }
  };
  
  // Get signaling state color
  const getSignalingStateColor = () => {
    switch (signalingState) {
      case 'connected':
        return 'success';
      case 'connecting':
        return 'info';
      case 'disconnected':
        return 'error';
      case 'failed':
        return 'error';
      default:
        return 'warning';
    }
  };
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3,
        backgroundColor: isDarkMode ? '#1e1e2f' : '#ffffff',
      }}
    >
      <Typography variant="h5" gutterBottom>
        WebRTC Connection Manager
      </Typography>
      
      <Typography variant="body2" color="textSecondary" paragraph>
        Manage your WebRTC connections with other peers. WebRTC enables direct browser-to-browser connections for faster and more secure communication.
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Alert severity={isWsConnected ? 'success' : 'warning'} sx={{ mb: 2 }}>
          {isWsConnected 
            ? 'Connected to WebSocket server. You can establish WebRTC connections.' 
            : 'Not connected to WebSocket server. WebRTC connections require WebSocket for signaling.'}
        </Alert>
        
        <Alert severity={getSignalingStateColor() as 'success' | 'info' | 'warning' | 'error'} sx={{ mb: 2 }}>
          {getSignalingStateText()}
        </Alert>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Your Peer ID
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                value={localId || 'Not available'}
                InputProps={{
                  readOnly: true,
                }}
                sx={{ mr: 1 }}
              />
              <Button
                variant="outlined"
                onClick={copyLocalId}
                disabled={!localId}
                startIcon={copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </Box>
            
            <Typography variant="body2" color="textSecondary">
              Share this ID with others so they can connect to you via WebRTC.
            </Typography>
          </Box>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Connect to Peer
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                label="Peer ID"
                value={peerId}
                onChange={(e) => setPeerId(e.target.value)}
                placeholder="Enter peer ID to connect"
                sx={{ mr: 1 }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleConnect}
                disabled={!peerId || isConnecting || !isWsConnected}
                startIcon={isConnecting ? <CircularProgress size={20} /> : <LinkIcon />}
              >
                {isConnecting ? 'Connecting...' : 'Connect'}
              </Button>
            </Box>
            
            <Typography variant="body2" color="textSecondary">
              Enter the peer ID of the person you want to connect with.
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Available Peers
          </Typography>
          
          {peers.length === 0 ? (
            <Alert severity="info">
              No peers available. Wait for peers to connect to the network or share your peer ID with others.
            </Alert>
          ) : (
            <List>
              {peers.map((peer) => {
                const isConnected = connections.some(conn => conn.peerId === peer.id);
                
                return (
                  <ListItem key={peer.id}>
                    <ListItemIcon>
                      {isConnected ? <SignalCellularAltIcon color="success" /> : <InfoIcon />}
                    </ListItemIcon>
                    <ListItemText
                      primary={peer.id.substring(0, 8) + '...' + peer.id.substring(peer.id.length - 8)}
                      secondary={`Connected: ${peer.connected ? 'Yes' : 'No'}`}
                    />
                    <ListItemSecondaryAction>
                      {isConnected ? (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleDisconnect(peer.id)}
                          startIcon={<LinkOffIcon />}
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          onClick={() => {
                            setPeerId(peer.id);
                            handleConnect();
                          }}
                          startIcon={<LinkIcon />}
                        >
                          Connect
                        </Button>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 4 }} />
      
      <Typography variant="h6" gutterBottom>
        Active WebRTC Connections
      </Typography>
      
      {connections.length === 0 ? (
        <Alert severity="info">
          No active WebRTC connections. Connect to peers to establish WebRTC connections.
        </Alert>
      ) : (
        <List>
          {connections.map((connection) => (
            <ListItem key={connection.peerId}>
              <ListItemIcon>
                {getConnectionStatusIcon(connection)}
              </ListItemIcon>
              <ListItemText
                primary={connection.peerId.substring(0, 8) + '...' + connection.peerId.substring(connection.peerId.length - 8)}
                secondary={`Status: ${getConnectionStatusText(connection)} | Latency: ${connection.latency || 'N/A'} ms`}
              />
              <ListItemSecondaryAction>
                <Chip 
                  label={getConnectionStatusText(connection)} 
                  color={getConnectionStatusColor(connection) as 'success' | 'info' | 'warning' | 'error' | 'default'} 
                  size="small" 
                  sx={{ mr: 1 }}
                />
                <IconButton 
                  edge="end" 
                  aria-label="disconnect" 
                  onClick={() => handleDisconnect(connection.peerId)}
                  disabled={connection.state === 'disconnected' || connection.state === 'failed'}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
      
      {connectionErrors.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Connection Errors
          </Typography>
          
          <List>
            {connectionErrors.map((error, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <ErrorIcon color="error" />
                </ListItemIcon>
                <ListItemText
                  primary={error.peerId}
                  secondary={error.message}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Paper>
  );
};

export default WebRtcConnectionManager;