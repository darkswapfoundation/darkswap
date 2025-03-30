import React, { useState, useEffect } from 'react';
import { useWebRtc } from '../contexts/WebRtcContext';
import { WebRtcBandwidthManager, BandwidthSettings } from '../utils/WebRtcBandwidthManager';

/**
 * WebRTC Bandwidth Configuration component
 * Allows users to configure bandwidth settings for WebRTC connections
 */
const WebRtcBandwidthConfig: React.FC = () => {
  // WebRTC context
  const {
    isConnected,
    isConnecting,
    error,
    localPeerId,
    connectedPeers,
    webRtcManager,
  } = useWebRtc();

  // State
  const [settings, setSettings] = useState<BandwidthSettings>(WebRtcBandwidthManager.getBandwidthSettings());
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [networkInfo, setNetworkInfo] = useState<{
    type: string;
    effectiveType: string;
    downlinkMbps: number;
    rtt: number;
  }>({
    type: 'unknown',
    effectiveType: 'unknown',
    downlinkMbps: 0,
    rtt: 0,
  });
  const [isEstimating, setIsEstimating] = useState<boolean>(false);
  const [bandwidthStats, setBandwidthStats] = useState<{
    timestamp: number;
    bytesReceived: number;
    bytesSent: number;
    bitsPerSecondReceived: number;
    bitsPerSecondSent: number;
    packetsReceived: number;
    packetsSent: number;
    packetsLost: number;
    roundTripTime: number;
  } | null>(null);
  const [stopMonitoring, setStopMonitoring] = useState<(() => void) | null>(null);

  // Load network info
  useEffect(() => {
    const loadNetworkInfo = async () => {
      const info = await WebRtcBandwidthManager.getNetworkType();
      setNetworkInfo(info);
    };
    
    loadNetworkInfo();
    
    // Set up interval to refresh network info
    const interval = setInterval(loadNetworkInfo, 10000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Save settings
  const saveSettings = () => {
    WebRtcBandwidthManager.setBandwidthSettings(settings);
    setStatusMessage('Bandwidth settings saved successfully');
    
    // Clear status message after 3 seconds
    setTimeout(() => {
      setStatusMessage('');
    }, 3000);
  };

  // Reset settings to default
  const resetSettings = () => {
    const defaultSettings = WebRtcBandwidthManager.getDefaultBandwidthSettings();
    setSettings(defaultSettings);
    WebRtcBandwidthManager.setBandwidthSettings(defaultSettings);
    setStatusMessage('Bandwidth settings reset to default');
  };

  // Apply recommended settings based on network type
  const applyRecommendedSettings = async () => {
    const recommendedSettings = await WebRtcBandwidthManager.getRecommendedBandwidthSettings();
    setSettings(recommendedSettings);
    WebRtcBandwidthManager.setBandwidthSettings(recommendedSettings);
    setStatusMessage('Recommended bandwidth settings applied');
  };

  // Estimate optimal settings
  const estimateOptimalSettings = async () => {
    if (!webRtcManager || connectedPeers.length === 0) {
      setStatusMessage('You need to be connected to at least one peer to estimate optimal settings');
      return;
    }
    
    setIsEstimating(true);
    setStatusMessage('Estimating optimal bandwidth settings...');
    
    try {
      // Get the first connected peer
      const peerId = connectedPeers[0];
      const connection = webRtcManager.getConnection(peerId);
      
      if (!connection) {
        throw new Error('No connection found');
      }
      
      const peerConnection = connection.getPeerConnection();
      
      if (!peerConnection) {
        throw new Error('No peer connection found');
      }
      
      // Estimate optimal settings
      const optimalSettings = await WebRtcBandwidthManager.estimateOptimalBandwidthSettings(peerConnection);
      
      // Update settings
      setSettings(optimalSettings);
      WebRtcBandwidthManager.setBandwidthSettings(optimalSettings);
      
      setStatusMessage('Optimal bandwidth settings estimated and applied');
    } catch (error) {
      console.error('Error estimating optimal settings:', error);
      setStatusMessage(`Error estimating optimal settings: ${error}`);
    } finally {
      setIsEstimating(false);
    }
  };

  // Start monitoring bandwidth usage
  const startMonitoring = () => {
    if (!webRtcManager || connectedPeers.length === 0) {
      setStatusMessage('You need to be connected to at least one peer to monitor bandwidth usage');
      return;
    }
    
    // Stop any existing monitoring
    if (stopMonitoring) {
      stopMonitoring();
    }
    
    try {
      // Get the first connected peer
      const peerId = connectedPeers[0];
      const connection = webRtcManager.getConnection(peerId);
      
      if (!connection) {
        throw new Error('No connection found');
      }
      
      const peerConnection = connection.getPeerConnection();
      
      if (!peerConnection) {
        throw new Error('No peer connection found');
      }
      
      // Start monitoring
      const stop = WebRtcBandwidthManager.monitorBandwidthUsage(
        peerConnection,
        (stats) => {
          setBandwidthStats(stats);
        },
        1000
      );
      
      setStopMonitoring(() => stop);
      setStatusMessage('Bandwidth monitoring started');
    } catch (error) {
      console.error('Error starting bandwidth monitoring:', error);
      setStatusMessage(`Error starting bandwidth monitoring: ${error}`);
    }
  };

  // Stop monitoring bandwidth usage
  const stopMonitoringBandwidth = () => {
    if (stopMonitoring) {
      stopMonitoring();
      setStopMonitoring(null);
      setBandwidthStats(null);
      setStatusMessage('Bandwidth monitoring stopped');
    }
  };

  // Format bits per second to human-readable format
  const formatBitrate = (bps: number): string => {
    if (bps < 1000) {
      return `${bps.toFixed(0)} bps`;
    } else if (bps < 1000000) {
      return `${(bps / 1000).toFixed(1)} kbps`;
    } else {
      return `${(bps / 1000000).toFixed(2)} Mbps`;
    }
  };

  return (
    <div style={{
      backgroundColor: '#1a1a2e',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
    }}>
      <h2>Bandwidth Configuration</h2>
      
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
      
      {/* Network information */}
      <div style={{
        backgroundColor: '#16213e',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <h3>Network Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '14px', color: '#ccc' }}>Connection Type</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{networkInfo.type}</div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#ccc' }}>Effective Type</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{networkInfo.effectiveType}</div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#ccc' }}>Downlink Speed</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {networkInfo.downlinkMbps > 0 ? `${networkInfo.downlinkMbps} Mbps` : 'Unknown'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#ccc' }}>Round Trip Time</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {networkInfo.rtt > 0 ? `${networkInfo.rtt} ms` : 'Unknown'}
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button
            onClick={applyRecommendedSettings}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4cc9f0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Apply Recommended Settings
          </button>
          
          <button
            onClick={estimateOptimalSettings}
            disabled={isEstimating || connectedPeers.length === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: isEstimating || connectedPeers.length === 0 ? '#333' : '#4cc9f0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isEstimating || connectedPeers.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {isEstimating ? 'Estimating...' : 'Estimate Optimal Settings'}
          </button>
        </div>
      </div>
      
      {/* Bandwidth settings */}
      <div style={{
        backgroundColor: '#16213e',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <h3>Bandwidth Settings</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <h4>Audio Bandwidth</h4>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Maximum Audio Bitrate: {settings.audio.max} kbps
            </label>
            <input
              type="range"
              min="8"
              max="128"
              value={settings.audio.max}
              onChange={(e) => setSettings({
                ...settings,
                audio: {
                  ...settings.audio,
                  max: parseInt(e.target.value),
                  ideal: Math.min(settings.audio.ideal, parseInt(e.target.value)),
                },
              })}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Target Audio Bitrate: {settings.audio.ideal} kbps
            </label>
            <input
              type="range"
              min="6"
              max={settings.audio.max}
              value={settings.audio.ideal}
              onChange={(e) => setSettings({
                ...settings,
                audio: {
                  ...settings.audio,
                  ideal: parseInt(e.target.value),
                },
              })}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <h4>Video Bandwidth</h4>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Maximum Video Bitrate: {settings.video.max} kbps
            </label>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={settings.video.max}
              onChange={(e) => setSettings({
                ...settings,
                video: {
                  ...settings.video,
                  max: parseInt(e.target.value),
                  ideal: Math.min(settings.video.ideal, parseInt(e.target.value)),
                },
              })}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Target Video Bitrate: {settings.video.ideal} kbps
            </label>
            <input
              type="range"
              min="100"
              max={settings.video.max}
              step="100"
              value={settings.video.ideal}
              onChange={(e) => setSettings({
                ...settings,
                video: {
                  ...settings.video,
                  ideal: parseInt(e.target.value),
                },
              })}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <h4>Data Channel Bandwidth</h4>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Maximum Data Bitrate: {settings.data.max} kbps
            </label>
            <input
              type="range"
              min="1000"
              max="100000"
              step="1000"
              value={settings.data.max}
              onChange={(e) => setSettings({
                ...settings,
                data: {
                  max: parseInt(e.target.value),
                },
              })}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <h4>Bandwidth Optimization</h4>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={settings.adaptiveBitrate}
                onChange={() => setSettings({
                  ...settings,
                  adaptiveBitrate: !settings.adaptiveBitrate,
                })}
                style={{ marginRight: '10px' }}
              />
              Adaptive Bitrate (automatically adjust quality based on network conditions)
            </label>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={settings.prioritizeAudio}
                onChange={() => setSettings({
                  ...settings,
                  prioritizeAudio: !settings.prioritizeAudio,
                })}
                style={{ marginRight: '10px' }}
              />
              Prioritize Audio (ensure audio quality even when network is congested)
            </label>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={settings.saveNetworkData}
                onChange={() => setSettings({
                  ...settings,
                  saveNetworkData: !settings.saveNetworkData,
                })}
                style={{ marginRight: '10px' }}
              />
              Save Network Data (reduce quality to minimize data usage)
            </label>
          </div>
          
          <div>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={settings.turnRelayOnly}
                onChange={() => setSettings({
                  ...settings,
                  turnRelayOnly: !settings.turnRelayOnly,
                })}
                style={{ marginRight: '10px' }}
              />
              TURN Relay Only (force connections through TURN servers, useful for testing)
            </label>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={saveSettings}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4cc9f0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              flex: 1,
            }}
          >
            Save Settings
          </button>
          
          <button
            onClick={resetSettings}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f72585',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>
      </div>
      
      {/* Bandwidth monitoring */}
      <div style={{
        backgroundColor: '#16213e',
        borderRadius: '8px',
        padding: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3>Bandwidth Monitoring</h3>
          <div>
            {stopMonitoring ? (
              <button
                onClick={stopMonitoringBandwidth}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#f72585',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Stop Monitoring
              </button>
            ) : (
              <button
                onClick={startMonitoring}
                disabled={connectedPeers.length === 0}
                style={{
                  padding: '6px 12px',
                  backgroundColor: connectedPeers.length === 0 ? '#333' : '#4cc9f0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: connectedPeers.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                Start Monitoring
              </button>
            )}
          </div>
        </div>
        
        {bandwidthStats ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{
              backgroundColor: '#0f0f1e',
              borderRadius: '8px',
              padding: '15px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '14px', color: '#ccc' }}>Download</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4cc9f0' }}>
                {formatBitrate(bandwidthStats.bitsPerSecondReceived)}
              </div>
              <div style={{ fontSize: '12px', color: '#ccc' }}>
                {(bandwidthStats.bytesReceived / (1024 * 1024)).toFixed(2)} MB total
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#0f0f1e',
              borderRadius: '8px',
              padding: '15px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '14px', color: '#ccc' }}>Upload</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f72585' }}>
                {formatBitrate(bandwidthStats.bitsPerSecondSent)}
              </div>
              <div style={{ fontSize: '12px', color: '#ccc' }}>
                {(bandwidthStats.bytesSent / (1024 * 1024)).toFixed(2)} MB total
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#0f0f1e',
              borderRadius: '8px',
              padding: '15px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '14px', color: '#ccc' }}>Round Trip Time</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#90be6d' }}>
                {bandwidthStats.roundTripTime.toFixed(2)} ms
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#0f0f1e',
              borderRadius: '8px',
              padding: '15px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '14px', color: '#ccc' }}>Packet Loss</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f8961e' }}>
                {bandwidthStats.packetsReceived > 0
                  ? `${((bandwidthStats.packetsLost / (bandwidthStats.packetsReceived + bandwidthStats.packetsLost)) * 100).toFixed(1)}%`
                  : '0%'
                }
              </div>
              <div style={{ fontSize: '12px', color: '#ccc' }}>
                {bandwidthStats.packetsLost} / {bandwidthStats.packetsReceived + bandwidthStats.packetsLost} packets
              </div>
            </div>
          </div>
        ) : (
          <p>Start monitoring to see bandwidth statistics</p>
        )}
      </div>
    </div>
  );
};

export default WebRtcBandwidthConfig;