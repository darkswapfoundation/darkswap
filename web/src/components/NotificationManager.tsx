import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, IconButton, Divider, Chip, Badge, Menu, MenuItem, Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, Switch, FormControlLabel, Grid, Alert } from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import MoreVertIcon from '@mui/icons-material/MoreVert';

// Define notification types
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  category: 'system' | 'trade' | 'wallet' | 'p2p' | 'other';
  actionable: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

interface NotificationSettings {
  enabled: boolean;
  categories: {
    system: boolean;
    trade: boolean;
    wallet: boolean;
    p2p: boolean;
    other: boolean;
  };
  sound: boolean;
  desktop: boolean;
  autoHide: boolean;
  autoHideDelay: number;
}

/**
 * Notification Manager Component
 * 
 * This component displays and manages notifications for the application.
 */
const NotificationManager: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { notifications, addNotification, markAsRead, markAllAsRead, removeNotification, removeAllNotifications } = useNotification();
  
  // State for notification settings
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    categories: {
      system: true,
      trade: true,
      wallet: true,
      p2p: true,
      other: true,
    },
    sound: true,
    desktop: true,
    autoHide: true,
    autoHideDelay: 5000,
  });
  
  // State for notification menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  
  // State for settings dialog
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  
  // State for filter
  const [filter, setFilter] = useState<string>('all');
  
  // Handle notification menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, notification: Notification) => {
    setAnchorEl(event.currentTarget);
    setSelectedNotification(notification);
  };
  
  // Handle notification menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedNotification(null);
  };
  
  // Handle mark as read
  const handleMarkAsRead = () => {
    if (selectedNotification) {
      markAsRead(selectedNotification.id);
      handleMenuClose();
    }
  };
  
  // Handle remove notification
  const handleRemoveNotification = () => {
    if (selectedNotification) {
      removeNotification(selectedNotification.id);
      handleMenuClose();
    }
  };
  
  // Handle settings dialog open
  const handleSettingsOpen = () => {
    setIsSettingsOpen(true);
  };
  
  // Handle settings dialog close
  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
  };
  
  // Handle settings change
  const handleSettingsChange = (key: keyof NotificationSettings, value: any) => {
    setSettings({
      ...settings,
      [key]: value,
    });
  };
  
  // Handle category change
  const handleCategoryChange = (category: keyof NotificationSettings['categories'], value: boolean) => {
    setSettings({
      ...settings,
      categories: {
        ...settings.categories,
        [category]: value,
      },
    });
  };
  
  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
      default:
        return <InfoIcon color="info" />;
    }
  };
  
  // Get notification category label
  const getNotificationCategoryLabel = (category: string) => {
    switch (category) {
      case 'system':
        return 'System';
      case 'trade':
        return 'Trade';
      case 'wallet':
        return 'Wallet';
      case 'p2p':
        return 'P2P';
      case 'other':
      default:
        return 'Other';
    }
  };
  
  // Get notification category color
  const getNotificationCategoryColor = (category: string) => {
    switch (category) {
      case 'system':
        return 'primary';
      case 'trade':
        return 'secondary';
      case 'wallet':
        return 'success';
      case 'p2p':
        return 'info';
      case 'other':
      default:
        return 'default';
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) {
      return 'Just now';
    } else if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return new Date(timestamp).toLocaleDateString();
    }
  };
  
  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') {
      return true;
    } else if (filter === 'unread') {
      return !notification.read;
    } else {
      return notification.category === filter;
    }
  });
  
  // Get unread count
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  // Render notification settings dialog
  const renderSettingsDialog = () => {
    return (
      <Dialog open={isSettingsOpen} onClose={handleSettingsClose} maxWidth="sm" fullWidth>
        <DialogTitle>Notification Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enabled}
                  onChange={(e) => handleSettingsChange('enabled', e.target.checked)}
                />
              }
              label="Enable Notifications"
            />
            
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Notification Categories
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.categories.system}
                      onChange={(e) => handleCategoryChange('system', e.target.checked)}
                    />
                  }
                  label="System"
                />
              </Grid>
              
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.categories.trade}
                      onChange={(e) => handleCategoryChange('trade', e.target.checked)}
                    />
                  }
                  label="Trade"
                />
              </Grid>
              
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.categories.wallet}
                      onChange={(e) => handleCategoryChange('wallet', e.target.checked)}
                    />
                  }
                  label="Wallet"
                />
              </Grid>
              
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.categories.p2p}
                      onChange={(e) => handleCategoryChange('p2p', e.target.checked)}
                    />
                  }
                  label="P2P"
                />
              </Grid>
              
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.categories.other}
                      onChange={(e) => handleCategoryChange('other', e.target.checked)}
                    />
                  }
                  label="Other"
                />
              </Grid>
            </Grid>
            
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Notification Options
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.sound}
                      onChange={(e) => handleSettingsChange('sound', e.target.checked)}
                    />
                  }
                  label="Sound"
                />
              </Grid>
              
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.desktop}
                      onChange={(e) => handleSettingsChange('desktop', e.target.checked)}
                    />
                  }
                  label="Desktop Notifications"
                />
              </Grid>
              
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoHide}
                      onChange={(e) => handleSettingsChange('autoHide', e.target.checked)}
                    />
                  }
                  label="Auto Hide"
                />
              </Grid>
              
              <Grid item xs={6}>
                <FormControl fullWidth disabled={!settings.autoHide}>
                  <InputLabel id="auto-hide-delay-label">Auto Hide Delay</InputLabel>
                  <Select
                    labelId="auto-hide-delay-label"
                    value={settings.autoHideDelay}
                    onChange={(e) => handleSettingsChange('autoHideDelay', e.target.value)}
                    label="Auto Hide Delay"
                  >
                    <MenuItem value={3000}>3 seconds</MenuItem>
                    <MenuItem value={5000}>5 seconds</MenuItem>
                    <MenuItem value={10000}>10 seconds</MenuItem>
                    <MenuItem value={30000}>30 seconds</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSettingsClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  // Generate mock notifications for testing
  useEffect(() => {
    if (notifications.length === 0) {
      // Add some mock notifications
      addNotification('success', 'Trade executed successfully', 'Your trade for 100 RUNE1 has been executed successfully.', 'trade');
      addNotification('error', 'Connection failed', 'Failed to connect to peer. Please try again.', 'p2p');
      addNotification('warning', 'Low balance', 'Your wallet balance is low. Please deposit more funds.', 'wallet');
      addNotification('info', 'System update', 'The system will be updated in 1 hour. Please save your work.', 'system');
    }
  }, []);
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3,
        backgroundColor: isDarkMode ? '#1e1e2f' : '#ffffff',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Badge badgeContent={unreadCount} color="error" sx={{ mr: 1 }}>
            {settings.enabled ? (
              unreadCount > 0 ? (
                <NotificationsActiveIcon color="primary" />
              ) : (
                <NotificationsIcon color="primary" />
              )
            ) : (
              <NotificationsOffIcon color="disabled" />
            )}
          </Badge>
          <Typography variant="h5">
            Notifications
          </Typography>
        </Box>
        
        <Box>
          <IconButton onClick={handleSettingsOpen}>
            <SettingsIcon />
          </IconButton>
          <IconButton onClick={() => removeAllNotifications()} disabled={notifications.length === 0}>
            <DeleteSweepIcon />
          </IconButton>
        </Box>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={1}>
          <Grid item>
            <Chip 
              label="All" 
              color={filter === 'all' ? 'primary' : 'default'} 
              onClick={() => setFilter('all')} 
              variant={filter === 'all' ? 'filled' : 'outlined'} 
            />
          </Grid>
          <Grid item>
            <Chip 
              label="Unread" 
              color={filter === 'unread' ? 'primary' : 'default'} 
              onClick={() => setFilter('unread')} 
              variant={filter === 'unread' ? 'filled' : 'outlined'} 
            />
          </Grid>
          <Grid item>
            <Chip 
              label="System" 
              color={filter === 'system' ? 'primary' : 'default'} 
              onClick={() => setFilter('system')} 
              variant={filter === 'system' ? 'filled' : 'outlined'} 
            />
          </Grid>
          <Grid item>
            <Chip 
              label="Trade" 
              color={filter === 'trade' ? 'primary' : 'default'} 
              onClick={() => setFilter('trade')} 
              variant={filter === 'trade' ? 'filled' : 'outlined'} 
            />
          </Grid>
          <Grid item>
            <Chip 
              label="Wallet" 
              color={filter === 'wallet' ? 'primary' : 'default'} 
              onClick={() => setFilter('wallet')} 
              variant={filter === 'wallet' ? 'filled' : 'outlined'} 
            />
          </Grid>
          <Grid item>
            <Chip 
              label="P2P" 
              color={filter === 'p2p' ? 'primary' : 'default'} 
              onClick={() => setFilter('p2p')} 
              variant={filter === 'p2p' ? 'filled' : 'outlined'} 
            />
          </Grid>
          <Grid item>
            <Chip 
              label="Other" 
              color={filter === 'other' ? 'primary' : 'default'} 
              onClick={() => setFilter('other')} 
              variant={filter === 'other' ? 'filled' : 'outlined'} 
            />
          </Grid>
        </Grid>
      </Box>
      
      {filteredNotifications.length === 0 ? (
        <Alert severity="info">
          No notifications found. {filter !== 'all' && 'Try changing the filter.'}
        </Alert>
      ) : (
        <List>
          {filteredNotifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              {index > 0 && <Divider />}
              <ListItem 
                sx={{ 
                  backgroundColor: notification.read ? 'transparent' : (isDarkMode ? 'rgba(25, 118, 210, 0.1)' : 'rgba(25, 118, 210, 0.05)'),
                  '&:hover': {
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  },
                }}
              >
                <ListItemIcon>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}>
                        {notification.title}
                      </Typography>
                      <Chip 
                        label={getNotificationCategoryLabel(notification.category)} 
                        color={getNotificationCategoryColor(notification.category) as 'primary' | 'secondary' | 'success' | 'info' | 'default'} 
                        size="small" 
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatTimestamp(notification.timestamp)}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={(e) => handleMenuOpen(e, notification)}>
                    <MoreVertIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMarkAsRead} disabled={selectedNotification?.read}>
          Mark as {selectedNotification?.read ? 'unread' : 'read'}
        </MenuItem>
        <MenuItem onClick={handleRemoveNotification}>
          Remove
        </MenuItem>
      </Menu>
      
      {renderSettingsDialog()}
    </Paper>
  );
};

export default NotificationManager;