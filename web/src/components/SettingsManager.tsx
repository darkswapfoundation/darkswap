import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, TextField, Select, MenuItem, FormControl, InputLabel, Grid, Divider, Switch, FormControlLabel, Slider, Accordion, AccordionSummary, AccordionDetails, Alert } from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import { useApi } from '../contexts/ApiContext';
import { useNotification } from '../contexts/NotificationContext';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';

/**
 * Settings Manager Component
 * 
 * This component allows users to configure various aspects of the application.
 */
const SettingsManager: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { client } = useApi();
  const { addNotification } = useNotification();
  
  // State for settings
  const [generalSettings, setGeneralSettings] = useState({
    language: 'en',
    theme: isDarkMode ? 'dark' : 'light',
    autoLockTimeout: 15,
    showBalances: true,
    showAdvancedOptions: false,
    confirmBeforeSending: true,
  });
  
  const [networkSettings, setNetworkSettings] = useState({
    relayServers: ['https://relay1.darkswap.io', 'https://relay2.darkswap.io'],
    maxPeers: 10,
    enableCircuitRelay: true,
    enableWebRTC: true,
    enableEncryption: true,
    connectionTimeout: 30,
  });
  
  const [walletSettings, setWalletSettings] = useState({
    defaultFee: 'medium',
    enableRBF: true,
    confirmations: 1,
    addressType: 'bech32',
    enableTestnet: false,
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    sound: true,
    desktop: true,
    categories: {
      system: true,
      trade: true,
      wallet: true,
      p2p: true,
      other: true,
    },
  });
  
  // State for UI
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);
  
  // Load settings from local storage or API
  const loadSettings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would load from the API or local storage
      // For now, we'll just use the default settings
      
      // Check if settings exist in local storage
      const storedGeneralSettings = localStorage.getItem('darkswap-general-settings');
      const storedNetworkSettings = localStorage.getItem('darkswap-network-settings');
      const storedWalletSettings = localStorage.getItem('darkswap-wallet-settings');
      const storedNotificationSettings = localStorage.getItem('darkswap-notification-settings');
      
      if (storedGeneralSettings) {
        setGeneralSettings(JSON.parse(storedGeneralSettings));
      }
      
      if (storedNetworkSettings) {
        setNetworkSettings(JSON.parse(storedNetworkSettings));
      }
      
      if (storedWalletSettings) {
        setWalletSettings(JSON.parse(storedWalletSettings));
      }
      
      if (storedNotificationSettings) {
        setNotificationSettings(JSON.parse(storedNotificationSettings));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load settings: ${errorMessage}`);
      addNotification('error', `Failed to load settings: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save settings to local storage or API
  const saveSettings = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // In a real implementation, this would save to the API or local storage
      // For now, we'll just save to local storage
      localStorage.setItem('darkswap-general-settings', JSON.stringify(generalSettings));
      localStorage.setItem('darkswap-network-settings', JSON.stringify(networkSettings));
      localStorage.setItem('darkswap-wallet-settings', JSON.stringify(walletSettings));
      localStorage.setItem('darkswap-notification-settings', JSON.stringify(notificationSettings));
      
      // Apply theme setting
      if (generalSettings.theme === 'dark' && !isDarkMode) {
        toggleTheme();
      } else if (generalSettings.theme === 'light' && isDarkMode) {
        toggleTheme();
      }
      
      setSuccess('Settings saved successfully');
      addNotification('success', 'Settings saved successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to save settings: ${errorMessage}`);
      addNotification('error', `Failed to save settings: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset settings to defaults
  const resetSettings = () => {
    setGeneralSettings({
      language: 'en',
      theme: 'dark',
      autoLockTimeout: 15,
      showBalances: true,
      showAdvancedOptions: false,
      confirmBeforeSending: true,
    });
    
    setNetworkSettings({
      relayServers: ['https://relay1.darkswap.io', 'https://relay2.darkswap.io'],
      maxPeers: 10,
      enableCircuitRelay: true,
      enableWebRTC: true,
      enableEncryption: true,
      connectionTimeout: 30,
    });
    
    setWalletSettings({
      defaultFee: 'medium',
      enableRBF: true,
      confirmations: 1,
      addressType: 'bech32',
      enableTestnet: false,
    });
    
    setNotificationSettings({
      enabled: true,
      sound: true,
      desktop: true,
      categories: {
        system: true,
        trade: true,
        wallet: true,
        p2p: true,
        other: true,
      },
    });
    
    addNotification('info', 'Settings reset to defaults');
  };
  
  // Handle general settings change
  const handleGeneralSettingsChange = (key: keyof typeof generalSettings, value: any) => {
    setGeneralSettings({
      ...generalSettings,
      [key]: value,
    });
  };
  
  // Handle network settings change
  const handleNetworkSettingsChange = (key: keyof typeof networkSettings, value: any) => {
    setNetworkSettings({
      ...networkSettings,
      [key]: value,
    });
  };
  
  // Handle wallet settings change
  const handleWalletSettingsChange = (key: keyof typeof walletSettings, value: any) => {
    setWalletSettings({
      ...walletSettings,
      [key]: value,
    });
  };
  
  // Handle notification settings change
  const handleNotificationSettingsChange = (key: keyof typeof notificationSettings, value: any) => {
    setNotificationSettings({
      ...notificationSettings,
      [key]: value,
    });
  };
  
  // Handle notification category change
  const handleNotificationCategoryChange = (category: keyof typeof notificationSettings.categories, value: boolean) => {
    setNotificationSettings({
      ...notificationSettings,
      categories: {
        ...notificationSettings.categories,
        [category]: value,
      },
    });
  };
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3,
        backgroundColor: isDarkMode ? '#1e1e2f' : '#ffffff',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Settings
        </Typography>
        
        <Box>
          <Button
            variant="outlined"
            startIcon={<RestoreIcon />}
            onClick={resetSettings}
            sx={{ mr: 1 }}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={saveSettings}
            disabled={isLoading}
          >
            Save
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Accordion defaultExpanded>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="general-settings-content"
          id="general-settings-header"
        >
          <Typography variant="h6">General Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="language-label">Language</InputLabel>
                <Select
                  labelId="language-label"
                  value={generalSettings.language}
                  onChange={(e) => handleGeneralSettingsChange('language', e.target.value)}
                  label="Language"
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="fr">Français</MenuItem>
                  <MenuItem value="de">Deutsch</MenuItem>
                  <MenuItem value="ja">日本語</MenuItem>
                  <MenuItem value="zh">中文</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="theme-label">Theme</InputLabel>
                <Select
                  labelId="theme-label"
                  value={generalSettings.theme}
                  onChange={(e) => handleGeneralSettingsChange('theme', e.target.value)}
                  label="Theme"
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="system">System</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Typography id="auto-lock-timeout-label" gutterBottom>
                  Auto Lock Timeout (minutes)
                </Typography>
                <Slider
                  value={generalSettings.autoLockTimeout}
                  onChange={(e, value) => handleGeneralSettingsChange('autoLockTimeout', value)}
                  aria-labelledby="auto-lock-timeout-label"
                  valueLabelDisplay="auto"
                  step={5}
                  marks
                  min={0}
                  max={60}
                />
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={generalSettings.showBalances}
                    onChange={(e) => handleGeneralSettingsChange('showBalances', e.target.checked)}
                  />
                }
                label="Show Balances"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={generalSettings.showAdvancedOptions}
                    onChange={(e) => handleGeneralSettingsChange('showAdvancedOptions', e.target.checked)}
                  />
                }
                label="Show Advanced Options"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={generalSettings.confirmBeforeSending}
                    onChange={(e) => handleGeneralSettingsChange('confirmBeforeSending', e.target.checked)}
                  />
                }
                label="Confirm Before Sending"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="network-settings-content"
          id="network-settings-header"
        >
          <Typography variant="h6">Network Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Typography id="max-peers-label" gutterBottom>
                  Maximum Peers
                </Typography>
                <Slider
                  value={networkSettings.maxPeers}
                  onChange={(e, value) => handleNetworkSettingsChange('maxPeers', value)}
                  aria-labelledby="max-peers-label"
                  valueLabelDisplay="auto"
                  step={1}
                  marks
                  min={1}
                  max={50}
                />
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Typography id="connection-timeout-label" gutterBottom>
                  Connection Timeout (seconds)
                </Typography>
                <Slider
                  value={networkSettings.connectionTimeout}
                  onChange={(e, value) => handleNetworkSettingsChange('connectionTimeout', value)}
                  aria-labelledby="connection-timeout-label"
                  valueLabelDisplay="auto"
                  step={5}
                  marks
                  min={5}
                  max={120}
                />
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={networkSettings.enableCircuitRelay}
                    onChange={(e) => handleNetworkSettingsChange('enableCircuitRelay', e.target.checked)}
                  />
                }
                label="Enable Circuit Relay"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={networkSettings.enableWebRTC}
                    onChange={(e) => handleNetworkSettingsChange('enableWebRTC', e.target.checked)}
                  />
                }
                label="Enable WebRTC"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={networkSettings.enableEncryption}
                    onChange={(e) => handleNetworkSettingsChange('enableEncryption', e.target.checked)}
                  />
                }
                label="Enable Encryption"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="wallet-settings-content"
          id="wallet-settings-header"
        >
          <Typography variant="h6">Wallet Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="default-fee-label">Default Fee</InputLabel>
                <Select
                  labelId="default-fee-label"
                  value={walletSettings.defaultFee}
                  onChange={(e) => handleWalletSettingsChange('defaultFee', e.target.value)}
                  label="Default Fee"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="address-type-label">Address Type</InputLabel>
                <Select
                  labelId="address-type-label"
                  value={walletSettings.addressType}
                  onChange={(e) => handleWalletSettingsChange('addressType', e.target.value)}
                  label="Address Type"
                >
                  <MenuItem value="legacy">Legacy (P2PKH)</MenuItem>
                  <MenuItem value="segwit">SegWit (P2SH-P2WPKH)</MenuItem>
                  <MenuItem value="bech32">Native SegWit (P2WPKH)</MenuItem>
                  <MenuItem value="taproot">Taproot (P2TR)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <Typography id="confirmations-label" gutterBottom>
                  Required Confirmations
                </Typography>
                <Slider
                  value={walletSettings.confirmations}
                  onChange={(e, value) => handleWalletSettingsChange('confirmations', value)}
                  aria-labelledby="confirmations-label"
                  valueLabelDisplay="auto"
                  step={1}
                  marks
                  min={0}
                  max={6}
                />
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={walletSettings.enableRBF}
                    onChange={(e) => handleWalletSettingsChange('enableRBF', e.target.checked)}
                  />
                }
                label="Enable Replace-By-Fee (RBF)"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={walletSettings.enableTestnet}
                    onChange={(e) => handleWalletSettingsChange('enableTestnet', e.target.checked)}
                  />
                }
                label="Enable Testnet"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="notification-settings-content"
          id="notification-settings-header"
        >
          <Typography variant="h6">Notification Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.enabled}
                    onChange={(e) => handleNotificationSettingsChange('enabled', e.target.checked)}
                  />
                }
                label="Enable Notifications"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.sound}
                    onChange={(e) => handleNotificationSettingsChange('sound', e.target.checked)}
                  />
                }
                label="Sound"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.desktop}
                    onChange={(e) => handleNotificationSettingsChange('desktop', e.target.checked)}
                  />
                }
                label="Desktop Notifications"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Notification Categories
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.categories.system}
                        onChange={(e) => handleNotificationCategoryChange('system', e.target.checked)}
                      />
                    }
                    label="System"
                  />
                </Grid>
                
                <Grid item xs={6} sm={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.categories.trade}
                        onChange={(e) => handleNotificationCategoryChange('trade', e.target.checked)}
                      />
                    }
                    label="Trade"
                  />
                </Grid>
                
                <Grid item xs={6} sm={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.categories.wallet}
                        onChange={(e) => handleNotificationCategoryChange('wallet', e.target.checked)}
                      />
                    }
                    label="Wallet"
                  />
                </Grid>
                
                <Grid item xs={6} sm={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.categories.p2p}
                        onChange={(e) => handleNotificationCategoryChange('p2p', e.target.checked)}
                      />
                    }
                    label="P2P"
                  />
                </Grid>
                
                <Grid item xs={6} sm={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.categories.other}
                        onChange={(e) => handleNotificationCategoryChange('other', e.target.checked)}
                      />
                    }
                    label="Other"
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default SettingsManager;
