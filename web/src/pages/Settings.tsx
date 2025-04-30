import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useApi } from '../contexts/ApiContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useNotification } from '../contexts/NotificationContext';
import WebSocketManager from '../components/WebSocketManager';
import '../styles/Settings.css';

const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { api, setBaseUrl, setUseWebSocket } = useApi();
  const { connected } = useWebSocket();
  const { addNotification } = useNotification();
  
  const [settings, setSettings] = useState<any>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState<string>('');
  const [wsUrl, setWsUrl] = useState<string>('');
  const [useWs, setUseWs] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await api.getSettings();
      setSettings(data);
      
      // Set form values
      setApiUrl(data.apiUrl || '/api');
      setWsUrl(data.wsUrl || 'ws://localhost:8080/ws');
      setUseWs(data.useWebSocket || false);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setError('Failed to fetch settings. Please try again later.');
      setIsLoading(false);
    }
  }, [api]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      
      // Update settings
      const updatedSettings = {
        ...settings,
        apiUrl,
        wsUrl,
        useWebSocket: useWs,
      };
      
      const success = await api.updateSettings(updatedSettings);
      
      if (success) {
        // Update API client
        setBaseUrl(apiUrl);
        setUseWebSocket(useWs);
        
        addNotification({
          type: 'success',
          title: 'Settings Saved',
          message: 'Your settings have been saved successfully.',
        });
      } else {
        setError('Failed to save settings. Please try again later.');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setError('Failed to save settings. Please try again later.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle theme change
  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value as 'light' | 'dark');
  };
  
  // Handle API URL change
  const handleApiUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiUrl(e.target.value);
  };
  
  // Handle WebSocket URL change
  const handleWsUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWsUrl(e.target.value);
  };
  
  // Handle use WebSocket change
  const handleUseWsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUseWs(e.target.checked);
  };
  
  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);
  
  return (
    <div className={`settings settings-${theme}`}>
      <div className="settings-header">
        <h1>Settings</h1>
        <p className="settings-subtitle">
          Configure your DarkSwap experience
        </p>
      </div>
      
      {isLoading ? (
        <div className="settings-loading">
          <div className="spinner"></div>
          <p>Loading settings...</p>
        </div>
      ) : error ? (
        <div className="settings-error">
          <p>{error}</p>
          <button onClick={fetchSettings}>Retry</button>
        </div>
      ) : (
        <div className="settings-content">
          <div className="settings-section">
            <h2>Appearance</h2>
            <div className="settings-form-group">
              <label htmlFor="theme">Theme:</label>
              <select
                id="theme"
                value={theme}
                onChange={handleThemeChange}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
          
          <div className="settings-section">
            <h2>Connection</h2>
            <form onSubmit={handleSubmit}>
              <div className="settings-form-group">
                <label htmlFor="apiUrl">API URL:</label>
                <input
                  id="apiUrl"
                  type="text"
                  value={apiUrl}
                  onChange={handleApiUrlChange}
                  placeholder="e.g., /api"
                />
              </div>
              
              <div className="settings-form-group">
                <label htmlFor="wsUrl">WebSocket URL:</label>
                <input
                  id="wsUrl"
                  type="text"
                  value={wsUrl}
                  onChange={handleWsUrlChange}
                  placeholder="e.g., ws://localhost:8080/ws"
                />
              </div>
              
              <div className="settings-form-group settings-checkbox-group">
                <input
                  id="useWs"
                  type="checkbox"
                  checked={useWs}
                  onChange={handleUseWsChange}
                />
                <label htmlFor="useWs">Use WebSocket for real-time updates</label>
              </div>
              
              <div className="settings-form-actions">
                <button
                  type="submit"
                  className="settings-save-button"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
          
          <div className="settings-section">
            <h2>WebSocket Status</h2>
            <div className="settings-websocket-status">
              <p className={`settings-connection-status ${connected ? 'connected' : 'disconnected'}`}>
                {connected ? 'Connected to WebSocket server' : 'Not connected to WebSocket server'}
              </p>
              <WebSocketManager />
            </div>
          </div>
          
          <div className="settings-section">
            <h2>About</h2>
            <div className="settings-about">
              <p>DarkSwap v0.1.0</p>
              <p>A decentralized trading platform for Bitcoin, Runes, and Alkanes</p>
              <p>
                <a href="https://github.com/darkswap" target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
                {' | '}
                <a href="https://docs.darkswap.io" target="_blank" rel="noopener noreferrer">
                  Documentation
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
