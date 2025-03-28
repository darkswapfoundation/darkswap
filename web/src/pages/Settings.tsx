import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ApiClient from '../utils/ApiClient';
import { useNotification } from '../contexts/NotificationContext';
import { useApi } from '../contexts/ApiContext';
import { useWebSocket } from '../contexts/WebSocketContext';

// Icons
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  ServerIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';

export interface SettingsProps {
  isWalletConnected: boolean;
  isSDKInitialized: boolean;
  apiClient?: ApiClient;
  isApiLoading: boolean;
}

const Settings: React.FC<SettingsProps> = ({
  isWalletConnected,
  isSDKInitialized,
  apiClient,
  isApiLoading,
}) => {
  const [apiUrl, setApiUrl] = useState<string>('http://localhost:3000');
  const [wsUrl, setWsUrl] = useState<string>('ws://localhost:3000/ws');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { addNotification } = useNotification();
  const { setBaseUrl } = useApi();
  const { disconnect, connect } = useWebSocket();

  // Initialize form values
  useEffect(() => {
    // Get API URL from localStorage or use default
    const savedApiUrl = localStorage.getItem('darkswap-api-url');
    if (savedApiUrl) {
      setApiUrl(savedApiUrl);
    }

    // Get WebSocket URL from localStorage or use default
    const savedWsUrl = localStorage.getItem('darkswap-ws-url');
    if (savedWsUrl) {
      setWsUrl(savedWsUrl);
    }
  }, []);

  // Save settings
  const saveSettings = () => {
    setIsSaving(true);

    try {
      // Save API URL to localStorage
      localStorage.setItem('darkswap-api-url', apiUrl);

      // Save WebSocket URL to localStorage
      localStorage.setItem('darkswap-ws-url', wsUrl);

      // Update API client base URL
      setBaseUrl(apiUrl);

      // Reconnect WebSocket
      disconnect();
      setTimeout(() => {
        connect();
      }, 1000);

      addNotification('success', 'Settings saved successfully');
    } catch (error) {
      addNotification('error', `Error saving settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset settings to defaults
  const resetSettings = () => {
    setApiUrl('http://localhost:3000');
    setWsUrl('ws://localhost:3000/ws');
    addNotification('info', 'Settings reset to defaults');
  };

  // Test API connection
  const testApiConnection = async () => {
    setIsSaving(true);

    try {
      if (apiClient) {
        const response = await apiClient.getHealth();

        if (response.error) {
          addNotification('error', `API connection failed: ${response.error}`);
        } else {
          addNotification('success', `API connection successful: v${response.data?.version}`);
        }
      } else {
        // Simulate API call for demo
        await new Promise(resolve => setTimeout(resolve, 1000));
        addNotification('success', 'API connection successful (simulated)');
      }
    } catch (error) {
      addNotification('error', `API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">
            <span className="text-white">Settings</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Configure your DarkSwap application
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
              Connect your wallet to access all settings
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

      {/* API Settings */}
      <div className="card">
        <div className="card-header flex items-center">
          <ServerIcon className="w-5 h-5 mr-2 text-twilight-neon-blue" />
          <h2 className="text-lg font-display font-medium">API Settings</h2>
        </div>
        <div className="card-body">
          <div className="mb-4">
            <label className="form-label">API URL</label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:3000"
              className="form-input"
            />
            <p className="text-sm text-gray-400 mt-1">
              The URL of the DarkSwap daemon API
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={testApiConnection}
              disabled={isSaving || !apiUrl}
              className="btn btn-secondary"
            >
              {isSaving ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
              ) : null}
              Test Connection
            </button>
          </div>
        </div>
      </div>

      {/* WebSocket Settings */}
      <div className="card">
        <div className="card-header flex items-center">
          <SignalIcon className="w-5 h-5 mr-2 text-twilight-neon-green" />
          <h2 className="text-lg font-display font-medium">WebSocket Settings</h2>
        </div>
        <div className="card-body">
          <div className="mb-4">
            <label className="form-label">WebSocket URL</label>
            <input
              type="text"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              placeholder="ws://localhost:3000/ws"
              className="form-input"
            />
            <p className="text-sm text-gray-400 mt-1">
              The URL of the DarkSwap daemon WebSocket endpoint
            </p>
          </div>
        </div>
      </div>

      {/* General Settings */}
      <div className="card">
        <div className="card-header flex items-center">
          <Cog6ToothIcon className="w-5 h-5 mr-2 text-twilight-neon-purple" />
          <h2 className="text-lg font-display font-medium">General Settings</h2>
        </div>
        <div className="card-body">
          <div className="mb-4">
            <label className="form-label">Theme</label>
            <select className="form-select">
              <option value="dark">Dark</option>
              <option value="light" disabled>Light (Coming Soon)</option>
              <option value="system" disabled>System (Coming Soon)</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="form-label">Notifications</label>
            <div className="flex items-center space-x-2">
              <input type="checkbox" className="form-checkbox" defaultChecked />
              <span>Enable notifications</span>
            </div>
          </div>
          <div className="mb-4">
            <label className="form-label">Auto-connect Wallet</label>
            <div className="flex items-center space-x-2">
              <input type="checkbox" className="form-checkbox" defaultChecked />
              <span>Automatically connect wallet on startup</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Settings */}
      <div className="flex justify-end space-x-2">
        <button
          onClick={resetSettings}
          className="btn btn-secondary"
        >
          Reset to Defaults
        </button>
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="btn btn-primary"
        >
          {isSaving ? (
            <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
          ) : null}
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;