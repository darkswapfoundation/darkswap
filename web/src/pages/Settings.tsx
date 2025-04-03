import React, { useState } from 'react';
import { useLocalPeerId } from '../hooks/useDarkSwap';

export const Settings: React.FC = () => {
  // Get the local peer ID
  const localPeerId = useLocalPeerId();
  
  // Network settings
  const [bootstrapPeers, setBootstrapPeers] = useState<string[]>([
    'peer1.darkswap.io',
    'peer2.darkswap.io',
    'peer3.darkswap.io',
  ]);
  const [newBootstrapPeer, setNewBootstrapPeer] = useState('');
  
  // Relay settings
  const [relayServers, setRelayServers] = useState<string[]>([
    'relay1.darkswap.io',
    'relay2.darkswap.io',
  ]);
  const [newRelayServer, setNewRelayServer] = useState('');
  
  // Wallet settings
  const [electrumServer, setElectrumServer] = useState('electrum.blockstream.info:50002');
  const [network, setNetwork] = useState<'mainnet' | 'testnet' | 'regtest'>('testnet');
  
  // Theme settings
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    tradeOffers: true,
    tradeAccepted: true,
    tradeCompleted: true,
    connectionStatus: true,
  });
  
  // Handle adding a bootstrap peer
  const handleAddBootstrapPeer = () => {
    if (newBootstrapPeer && !bootstrapPeers.includes(newBootstrapPeer)) {
      setBootstrapPeers([...bootstrapPeers, newBootstrapPeer]);
      setNewBootstrapPeer('');
    }
  };
  
  // Handle removing a bootstrap peer
  const handleRemoveBootstrapPeer = (peer: string) => {
    setBootstrapPeers(bootstrapPeers.filter(p => p !== peer));
  };
  
  // Handle adding a relay server
  const handleAddRelayServer = () => {
    if (newRelayServer && !relayServers.includes(newRelayServer)) {
      setRelayServers([...relayServers, newRelayServer]);
      setNewRelayServer('');
    }
  };
  
  // Handle removing a relay server
  const handleRemoveRelayServer = (server: string) => {
    setRelayServers(relayServers.filter(s => s !== server));
  };
  
  // Handle saving settings
  const handleSaveSettings = () => {
    // In a real implementation, we would save the settings to the DarkSwap instance
    alert('Settings saved!');
  };
  
  // Handle notification toggle
  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications({
      ...notifications,
      [key]: !notifications[key],
    });
  };
  
  return (
    <div className="settings-page">
      <h1>Settings</h1>
      
      <div className="settings-section">
        <h2>Network Settings</h2>
        
        <div className="setting-item">
          <div className="setting-label">Peer ID</div>
          <div className="setting-value">
            <div className="peer-id">{localPeerId}</div>
            <button
              className="copy-button"
              onClick={() => {
                navigator.clipboard.writeText(localPeerId);
                alert('Peer ID copied to clipboard!');
              }}
            >
              Copy
            </button>
          </div>
        </div>
        
        <div className="setting-item">
          <div className="setting-label">Bootstrap Peers</div>
          <div className="setting-value">
            <ul className="peer-list">
              {bootstrapPeers.map((peer, index) => (
                <li key={index} className="peer-item">
                  {peer}
                  <button
                    className="remove-button"
                    onClick={() => handleRemoveBootstrapPeer(peer)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="add-peer">
              <input
                type="text"
                value={newBootstrapPeer}
                onChange={(e) => setNewBootstrapPeer(e.target.value)}
                placeholder="Enter peer address"
              />
              <button onClick={handleAddBootstrapPeer}>Add</button>
            </div>
          </div>
        </div>
        
        <div className="setting-item">
          <div className="setting-label">Relay Servers</div>
          <div className="setting-value">
            <ul className="peer-list">
              {relayServers.map((server, index) => (
                <li key={index} className="peer-item">
                  {server}
                  <button
                    className="remove-button"
                    onClick={() => handleRemoveRelayServer(server)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="add-peer">
              <input
                type="text"
                value={newRelayServer}
                onChange={(e) => setNewRelayServer(e.target.value)}
                placeholder="Enter relay server address"
              />
              <button onClick={handleAddRelayServer}>Add</button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="settings-section">
        <h2>Wallet Settings</h2>
        
        <div className="setting-item">
          <div className="setting-label">Electrum Server</div>
          <div className="setting-value">
            <input
              type="text"
              value={electrumServer}
              onChange={(e) => setElectrumServer(e.target.value)}
              placeholder="Enter Electrum server address"
            />
          </div>
        </div>
        
        <div className="setting-item">
          <div className="setting-label">Network</div>
          <div className="setting-value">
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value as 'mainnet' | 'testnet' | 'regtest')}
            >
              <option value="mainnet">Mainnet</option>
              <option value="testnet">Testnet</option>
              <option value="regtest">Regtest</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="settings-section">
        <h2>Appearance</h2>
        
        <div className="setting-item">
          <div className="setting-label">Theme</div>
          <div className="setting-value">
            <div className="theme-selector">
              <button
                className={`theme-button ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
              >
                Light
              </button>
              <button
                className={`theme-button ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme('dark')}
              >
                Dark
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="settings-section">
        <h2>Notifications</h2>
        
        <div className="setting-item">
          <div className="setting-label">Trade Offers</div>
          <div className="setting-value">
            <label className="toggle">
              <input
                type="checkbox"
                checked={notifications.tradeOffers}
                onChange={() => handleNotificationToggle('tradeOffers')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
        
        <div className="setting-item">
          <div className="setting-label">Trade Accepted</div>
          <div className="setting-value">
            <label className="toggle">
              <input
                type="checkbox"
                checked={notifications.tradeAccepted}
                onChange={() => handleNotificationToggle('tradeAccepted')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
        
        <div className="setting-item">
          <div className="setting-label">Trade Completed</div>
          <div className="setting-value">
            <label className="toggle">
              <input
                type="checkbox"
                checked={notifications.tradeCompleted}
                onChange={() => handleNotificationToggle('tradeCompleted')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
        
        <div className="setting-item">
          <div className="setting-label">Connection Status</div>
          <div className="setting-value">
            <label className="toggle">
              <input
                type="checkbox"
                checked={notifications.connectionStatus}
                onChange={() => handleNotificationToggle('connectionStatus')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="settings-actions">
        <button className="save-button" onClick={handleSaveSettings}>
          Save Settings
        </button>
      </div>
      
      <style>
        {`
          .settings-page {
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          
          .settings-page h1 {
            margin-bottom: 20px;
            color: #333;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
          }
          
          .settings-section {
            margin-bottom: 30px;
            background-color: #fff;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }
          
          .settings-section h2 {
            margin-top: 0;
            margin-bottom: 20px;
            color: #333;
            font-size: 1.5rem;
          }
          
          .setting-item {
            display: flex;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
          }
          
          .setting-item:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
          }
          
          .setting-label {
            flex: 1;
            font-weight: 500;
            color: #555;
            padding-top: 8px;
          }
          
          .setting-value {
            flex: 2;
          }
          
          .peer-id {
            font-family: monospace;
            background-color: #f8f9fa;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #eee;
            margin-bottom: 10px;
            word-break: break-all;
          }
          
          .copy-button {
            background-color: #6c757d;
            color: #fff;
            border: none;
            border-radius: 4px;
            padding: 5px 10px;
            font-size: 0.9rem;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          
          .copy-button:hover {
            background-color: #5a6268;
          }
          
          .peer-list {
            list-style: none;
            padding: 0;
            margin: 0 0 15px 0;
          }
          
          .peer-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px;
            background-color: #f8f9fa;
            border-radius: 4px;
            margin-bottom: 5px;
            border: 1px solid #eee;
          }
          
          .remove-button {
            background-color: #dc3545;
            color: #fff;
            border: none;
            border-radius: 4px;
            padding: 3px 8px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          
          .remove-button:hover {
            background-color: #c82333;
          }
          
          .add-peer {
            display: flex;
            gap: 10px;
          }
          
          .add-peer input {
            flex: 1;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
          }
          
          .add-peer button {
            background-color: #28a745;
            color: #fff;
            border: none;
            border-radius: 4px;
            padding: 8px 16px;
            font-size: 0.9rem;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          
          .add-peer button:hover {
            background-color: #218838;
          }
          
          .setting-value input[type="text"],
          .setting-value select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
          }
          
          .theme-selector {
            display: flex;
            gap: 10px;
          }
          
          .theme-button {
            flex: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background-color: #f8f9fa;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .theme-button.active {
            background-color: #007bff;
            color: #fff;
            border-color: #007bff;
          }
          
          .toggle {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 34px;
          }
          
          .toggle input {
            opacity: 0;
            width: 0;
            height: 0;
          }
          
          .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 34px;
          }
          
          .toggle-slider:before {
            position: absolute;
            content: "";
            height: 26px;
            width: 26px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
          }
          
          input:checked + .toggle-slider {
            background-color: #28a745;
          }
          
          input:focus + .toggle-slider {
            box-shadow: 0 0 1px #28a745;
          }
          
          input:checked + .toggle-slider:before {
            transform: translateX(26px);
          }
          
          .settings-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
          }
          
          .save-button {
            background-color: #007bff;
            color: #fff;
            border: none;
            border-radius: 4px;
            padding: 10px 20px;
            font-size: 1rem;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          
          .save-button:hover {
            background-color: #0069d9;
          }
        `}
      </style>
    </div>
  );
};