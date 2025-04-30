import React, { useState, useEffect } from 'react';
import { useWebRtc } from '../contexts/WebRtcContext';
import { WebRtcStorage, StoredSettings } from '../utils/WebRtcStorage';
import WebRtcIceServerConfig from './WebRtcIceServerConfig';
import WebRtcBandwidthConfig from './WebRtcBandwidthConfig';

/**
 * WebRTC Settings component
 * Allows users to configure WebRTC settings and manage stored data
 */
const WebRtcSettings: React.FC = () => {
  // WebRTC context
  const {
    isConnected,
    isConnecting,
    error,
    localPeerId,
  } = useWebRtc();

  // State
  const [settings, setSettings] = useState<StoredSettings>(WebRtcStorage.loadSettings());
  const [storageStats, setStorageStats] = useState<{ key: string; size: number; items: number }[]>([]);
  const [exportData, setExportData] = useState<string>('');
  const [importData, setImportData] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [activeAdvancedTab, setActiveAdvancedTab] = useState<'servers' | 'bandwidth'>('servers');

  // Load storage stats
  useEffect(() => {
    const stats = WebRtcStorage.getStorageStats();
    setStorageStats(stats);
  }, []);

  // Save settings
  const saveSettings = () => {
    WebRtcStorage.storeSettings(settings);
    setStatusMessage('Settings saved successfully');
    
    // Clear status message after 3 seconds
    setTimeout(() => {
      setStatusMessage('');
    }, 3000);
  };

  // Export data
  const handleExport = () => {
    const data = WebRtcStorage.exportData();
    setExportData(data);
    setStatusMessage('Data exported successfully');
  };

  // Import data
  const handleImport = () => {
    if (!importData) {
      setStatusMessage('Please enter data to import');
      return;
    }
    
    const success = WebRtcStorage.importData(importData);
    
    if (success) {
      setStatusMessage('Data imported successfully');
      
      // Reload settings
      setSettings(WebRtcStorage.loadSettings());
      
      // Reload storage stats
      setStorageStats(WebRtcStorage.getStorageStats());
      
      // Clear import data
      setImportData('');
    } else {
      setStatusMessage('Failed to import data');
    }
  };

  // Clear all data
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all stored data? This action cannot be undone.')) {
      WebRtcStorage.clearAll();
      setStatusMessage('All data cleared successfully');
      
      // Reload settings with defaults
      setSettings(WebRtcStorage.loadSettings());
      
      // Reload storage stats
      setStorageStats(WebRtcStorage.getStorageStats());
    }
  };

  // Format bytes to human-readable format
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div style={{
      backgroundColor: '#1a1a2e',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
    }}>
      <h2>WebRTC Settings</h2>
      
      {/* Status message */}
      {statusMessage && (
        <div style={{
          backgroundColor: '#16213e',
          borderRadius: '4px',
          padding: '10px',
          marginBottom: '20px',
          color: '#4cc9f0',
        }}>
          {statusMessage}
        </div>
      )}
      
      {/* Connection status */}
      <div style={{ marginBottom: '20px' }}>
        <p>
          Status: {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
        </p>
        {error && (
          <p style={{ color: '#ff6b6b' }}>
            Error: {error.message}
          </p>
        )}
        <p>Local Peer ID: {localPeerId}</p>
      </div>
      
      {/* Settings form */}
      <div style={{
        backgroundColor: '#16213e',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <h3>General Settings</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Peer Name</label>
          <input
            type="text"
            value={settings.peerName}
            onChange={(e) => setSettings({ ...settings, peerName: e.target.value })}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #333',
              backgroundColor: '#1a1a2e',
              color: 'white',
            }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Enable Peer Discovery</span>
            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
              <input
                type="checkbox"
                checked={settings.discoveryEnabled}
                onChange={() => setSettings({ ...settings, discoveryEnabled: !settings.discoveryEnabled })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: settings.discoveryEnabled ? '#4cc9f0' : '#ccc',
                transition: '.4s',
                borderRadius: '34px',
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: '26px',
                  width: '26px',
                  left: settings.discoveryEnabled ? '26px' : '4px',
                  bottom: '4px',
                  backgroundColor: 'white',
                  transition: '.4s',
                  borderRadius: '50%',
                }}></span>
              </span>
            </label>
          </div>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Auto-Connect to Known Peers</span>
            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
              <input
                type="checkbox"
                checked={settings.autoConnect}
                onChange={() => setSettings({ ...settings, autoConnect: !settings.autoConnect })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: settings.autoConnect ? '#4cc9f0' : '#ccc',
                transition: '.4s',
                borderRadius: '34px',
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: '26px',
                  width: '26px',
                  left: settings.autoConnect ? '26px' : '4px',
                  bottom: '4px',
                  backgroundColor: 'white',
                  transition: '.4s',
                  borderRadius: '50%',
                }}></span>
              </span>
            </label>
          </div>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Enable Notifications</span>
            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={() => setSettings({ ...settings, notifications: !settings.notifications })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: settings.notifications ? '#4cc9f0' : '#ccc',
                transition: '.4s',
                borderRadius: '34px',
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: '26px',
                  width: '26px',
                  left: settings.notifications ? '26px' : '4px',
                  bottom: '4px',
                  backgroundColor: 'white',
                  transition: '.4s',
                  borderRadius: '50%',
                }}></span>
              </span>
            </label>
          </div>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Theme</label>
          <select
            value={settings.theme}
            onChange={(e) => setSettings({ ...settings, theme: e.target.value as 'light' | 'dark' })}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #333',
              backgroundColor: '#1a1a2e',
              color: 'white',
            }}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
        
        <button
          onClick={saveSettings}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4cc9f0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Save Settings
        </button>
      </div>
      
      {/* Storage stats */}
      <div style={{
        backgroundColor: '#16213e',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <h3>Storage Statistics</h3>
        
        {storageStats.length === 0 ? (
          <p>No data stored</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>Data Type</th>
                <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>Items</th>
                <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>Size</th>
              </tr>
            </thead>
            <tbody>
              {storageStats.map((stat) => (
                <tr key={stat.key}>
                  <td style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #333' }}>
                    {stat.key.replace('darkswap_webrtc_', '')}
                  </td>
                  <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>
                    {stat.items}
                  </td>
                  <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #333' }}>
                    {formatBytes(stat.size)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Data management */}
      <div style={{
        backgroundColor: '#16213e',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <h3>Data Management</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={handleExport}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4cc9f0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '100%',
              marginBottom: '10px',
            }}
          >
            Export Data
          </button>
          
          {exportData && (
            <textarea
              value={exportData}
              readOnly
              style={{
                width: '100%',
                height: '100px',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #333',
                backgroundColor: '#1a1a2e',
                color: 'white',
                marginTop: '10px',
              }}
            />
          )}
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Import Data</label>
          <textarea
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            placeholder="Paste exported data here"
            style={{
              width: '100%',
              height: '100px',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #333',
              backgroundColor: '#1a1a2e',
              color: 'white',
              marginBottom: '10px',
            }}
          />
          
          <button
            onClick={handleImport}
            disabled={!importData}
            style={{
              padding: '10px 20px',
              backgroundColor: importData ? '#4cc9f0' : '#333',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: importData ? 'pointer' : 'not-allowed',
              width: '100%',
            }}
          >
            Import Data
          </button>
        </div>
        
        <div>
          <button
            onClick={handleClearAll}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f72585',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Clear All Data
          </button>
        </div>
      </div>
      
      {/* Advanced settings */}
      <div style={{
        backgroundColor: '#16213e',
        borderRadius: '8px',
        padding: '20px',
        marginTop: '20px',
      }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
          }}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <h3>Advanced Settings</h3>
          <div style={{ fontSize: '24px' }}>
            {showAdvanced ? '▼' : '▶'}
          </div>
        </div>
        
        {showAdvanced && (
          <div style={{ marginTop: '20px' }}>
            {/* Advanced settings tabs */}
            <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '1px solid #333' }}>
              <button
                onClick={() => setActiveAdvancedTab('servers')}
                style={{
                  padding: '10px 20px',
                  background: activeAdvancedTab === 'servers' ? '#4361ee' : 'transparent',
                  color: activeAdvancedTab === 'servers' ? 'white' : '#ccc',
                  border: 'none',
                  borderBottom: activeAdvancedTab === 'servers' ? '2px solid #4361ee' : 'none',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                ICE Servers
              </button>
              <button
                onClick={() => setActiveAdvancedTab('bandwidth')}
                style={{
                  padding: '10px 20px',
                  background: activeAdvancedTab === 'bandwidth' ? '#4361ee' : 'transparent',
                  color: activeAdvancedTab === 'bandwidth' ? 'white' : '#ccc',
                  border: 'none',
                  borderBottom: activeAdvancedTab === 'bandwidth' ? '2px solid #4361ee' : 'none',
                  cursor: 'pointer'
                }}
              >
                Bandwidth
              </button>
            </div>
            
            {/* Tab content */}
            {activeAdvancedTab === 'servers' ? (
              <WebRtcIceServerConfig />
            ) : (
              <WebRtcBandwidthConfig />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebRtcSettings;