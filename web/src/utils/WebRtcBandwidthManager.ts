/**
 * WebRTC Bandwidth Manager utility
 * 
 * This utility provides functionality for controlling bandwidth usage
 * in WebRTC connections, particularly important when using TURN relay servers.
 */

// Default bandwidth constraints
const DEFAULT_BANDWIDTH_CONSTRAINTS = {
  audio: {
    min: 6, // kbps
    max: 50, // kbps
    ideal: 20, // kbps
  },
  video: {
    min: 100, // kbps
    max: 2500, // kbps
    ideal: 1000, // kbps
  },
  data: {
    max: 30000, // kbps (30 Mbps)
  },
};

// Storage key for bandwidth settings
const BANDWIDTH_SETTINGS_STORAGE_KEY = 'darkswap_webrtc_bandwidth_settings';

/**
 * Bandwidth settings interface
 */
export interface BandwidthSettings {
  audio: {
    min: number;
    max: number;
    ideal: number;
  };
  video: {
    min: number;
    max: number;
    ideal: number;
  };
  data: {
    max: number;
  };
  adaptiveBitrate: boolean;
  prioritizeAudio: boolean;
  saveNetworkData: boolean;
  turnRelayOnly: boolean;
}

/**
 * WebRTC Bandwidth Manager utility
 */
export class WebRtcBandwidthManager {
  /**
   * Get the default bandwidth settings
   * @returns Default bandwidth settings
   */
  static getDefaultBandwidthSettings(): BandwidthSettings {
    return {
      ...DEFAULT_BANDWIDTH_CONSTRAINTS,
      adaptiveBitrate: true,
      prioritizeAudio: true,
      saveNetworkData: false,
      turnRelayOnly: false,
    };
  }

  /**
   * Get the stored bandwidth settings
   * @returns Stored bandwidth settings or default if none are stored
   */
  static getBandwidthSettings(): BandwidthSettings {
    try {
      const storedSettings = localStorage.getItem(BANDWIDTH_SETTINGS_STORAGE_KEY);
      if (!storedSettings) {
        return WebRtcBandwidthManager.getDefaultBandwidthSettings();
      }
      
      return JSON.parse(storedSettings);
    } catch (error) {
      console.error('Failed to load bandwidth settings:', error);
      return WebRtcBandwidthManager.getDefaultBandwidthSettings();
    }
  }

  /**
   * Set the bandwidth settings
   * @param settings Bandwidth settings to store
   */
  static setBandwidthSettings(settings: BandwidthSettings): void {
    try {
      localStorage.setItem(BANDWIDTH_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to store bandwidth settings:', error);
    }
  }

  /**
   * Reset bandwidth settings to default
   */
  static resetBandwidthSettings(): void {
    WebRtcBandwidthManager.setBandwidthSettings(
      WebRtcBandwidthManager.getDefaultBandwidthSettings()
    );
  }

  /**
   * Apply bandwidth constraints to an RTCPeerConnection
   * @param peerConnection RTCPeerConnection to apply constraints to
   * @param settings Bandwidth settings to apply
   */
  static applyBandwidthConstraints(
    peerConnection: RTCPeerConnection,
    settings: BandwidthSettings = WebRtcBandwidthManager.getBandwidthSettings()
  ): void {
    try {
      // Get all senders
      const senders = peerConnection.getSenders();
      
      // Apply constraints to each sender
      senders.forEach((sender) => {
        const track = sender.track;
        if (!track) return;
        
        // Get parameters
        const parameters = sender.getParameters();
        
        // Check if parameters have encodings
        if (!parameters.encodings) {
          parameters.encodings = [{}];
        }
        
        // Apply constraints based on track type
        if (track.kind === 'audio') {
          // Apply audio constraints
          parameters.encodings.forEach((encoding) => {
            encoding.maxBitrate = settings.audio.max * 1000; // Convert to bps
            
            if (settings.prioritizeAudio) {
              encoding.priority = 'high';
              encoding.networkPriority = 'high';
            }
          });
        } else if (track.kind === 'video') {
          // Apply video constraints
          parameters.encodings.forEach((encoding) => {
            encoding.maxBitrate = settings.video.max * 1000; // Convert to bps
            if (settings.adaptiveBitrate) {
              // adaptivePtime is not standard, but some implementations support it
              (encoding as any).adaptivePtime = true;
              encoding.scaleResolutionDownBy = 1.0; // Start at full resolution
              encoding.scaleResolutionDownBy = 1.0; // Start at full resolution
            }
            
            if (settings.prioritizeAudio) {
              encoding.priority = 'medium';
              encoding.networkPriority = 'low';
            }
          });
        }
        
        // Set the parameters
        sender.setParameters(parameters).catch((error) => {
          console.error('Error setting parameters:', error);
        });
      });
      
      // Apply data channel constraints
      if (settings.data.max > 0) {
        // Create a data channel with bandwidth constraints
        const dataChannel = peerConnection.createDataChannel('bandwidth-test', {
          ordered: true,
          maxRetransmits: 0,
        });
        
        // Set priority (not standard, but some implementations support it)
        (dataChannel as any).priority = settings.prioritizeAudio ? 'low' : 'medium';
        
        // Close the data channel after setting priority
        dataChannel.close();
      }
      
      // Apply ICE candidate filter if TURN relay only is enabled
      if (settings.turnRelayOnly) {
        const originalAddIceCandidate = peerConnection.addIceCandidate.bind(peerConnection);
        
        peerConnection.addIceCandidate = async (candidate: RTCIceCandidate) => {
          // Only allow relay candidates
          if (candidate && candidate.candidate && candidate.candidate.includes('relay')) {
            return originalAddIceCandidate(candidate);
          }
          
          // Silently ignore non-relay candidates
          return Promise.resolve();
        };
      }
    } catch (error) {
      console.error('Error applying bandwidth constraints:', error);
    }
  }

  /**
   * Apply bandwidth constraints to a MediaStream
   * @param stream MediaStream to apply constraints to
   * @param settings Bandwidth settings to apply
   */
  static async applyMediaStreamConstraints(
    stream: MediaStream,
    settings: BandwidthSettings = WebRtcBandwidthManager.getBandwidthSettings()
  ): Promise<MediaStream> {
    try {
      // Get all tracks
      const tracks = stream.getTracks();
      
      // Process each track
      for (const track of tracks) {
        if (track.kind === 'audio') {
          // Apply audio constraints
          const constraints = {
            channelCount: 1, // Mono for bandwidth saving
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: true,
          };
          
          await track.applyConstraints(constraints);
        } else if (track.kind === 'video') {
          // Apply video constraints
          const constraints: MediaTrackConstraints = {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { max: 30, ideal: 24 },
          };
          
          // If saving network data, reduce quality
          if (settings.saveNetworkData) {
            constraints.width = { ideal: 320 };
            constraints.height = { ideal: 240 };
            constraints.frameRate = { max: 15, ideal: 15 };
          }
          
          await track.applyConstraints(constraints);
        }
      }
      
      return stream;
    } catch (error) {
      console.error('Error applying media stream constraints:', error);
      return stream;
    }
  }

  /**
   * Monitor bandwidth usage of an RTCPeerConnection
   * @param peerConnection RTCPeerConnection to monitor
   * @param callback Callback function to receive bandwidth usage updates
   * @param interval Interval in milliseconds between updates
   * @returns Function to stop monitoring
   */
  static monitorBandwidthUsage(
    peerConnection: RTCPeerConnection,
    callback: (stats: {
      timestamp: number;
      bytesReceived: number;
      bytesSent: number;
      bitsPerSecondReceived: number;
      bitsPerSecondSent: number;
      packetsReceived: number;
      packetsSent: number;
      packetsLost: number;
      roundTripTime: number;
    }) => void,
    interval: number = 1000
  ): () => void {
    let previousStats: {
      timestamp: number;
      bytesReceived: number;
      bytesSent: number;
      packetsReceived: number;
      packetsSent: number;
    } | null = null;
    
    // Start monitoring
    const intervalId = setInterval(async () => {
      try {
        // Get stats
        const stats = await peerConnection.getStats();
        
        // Initialize counters
        let bytesReceived = 0;
        let bytesSent = 0;
        let packetsReceived = 0;
        let packetsSent = 0;
        let packetsLost = 0;
        let roundTripTime = 0;
        let roundTripTimeCount = 0;
        
        // Process stats
        stats.forEach((report) => {
          if (report.type === 'inbound-rtp') {
            bytesReceived += report.bytesReceived || 0;
            packetsReceived += report.packetsReceived || 0;
            packetsLost += report.packetsLost || 0;
          } else if (report.type === 'outbound-rtp') {
            bytesSent += report.bytesSent || 0;
            packetsSent += report.packetsSent || 0;
          } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            roundTripTime += report.currentRoundTripTime || 0;
            roundTripTimeCount++;
          }
        });
        
        // Calculate average round trip time
        const avgRoundTripTime = roundTripTimeCount > 0 ? roundTripTime / roundTripTimeCount : 0;
        
        // Calculate bitrates
        let bitsPerSecondReceived = 0;
        let bitsPerSecondSent = 0;
        
        if (previousStats) {
          const timeDiff = (Date.now() - previousStats.timestamp) / 1000;
          
          if (timeDiff > 0) {
            bitsPerSecondReceived = ((bytesReceived - previousStats.bytesReceived) * 8) / timeDiff;
            bitsPerSecondSent = ((bytesSent - previousStats.bytesSent) * 8) / timeDiff;
          }
        }
        
        // Update previous stats
        previousStats = {
          timestamp: Date.now(),
          bytesReceived,
          bytesSent,
          packetsReceived,
          packetsSent,
        };
        
        // Call callback with stats
        callback({
          timestamp: Date.now(),
          bytesReceived,
          bytesSent,
          bitsPerSecondReceived,
          bitsPerSecondSent,
          packetsReceived,
          packetsSent,
          packetsLost,
          roundTripTime: avgRoundTripTime * 1000, // Convert to ms
        });
      } catch (error) {
        console.error('Error monitoring bandwidth usage:', error);
      }
    }, interval);
    
    // Return function to stop monitoring
    return () => {
      clearInterval(intervalId);
    };
  }

  /**
   * Estimate optimal bandwidth settings based on network conditions
   * @param peerConnection RTCPeerConnection to use for estimation
   * @returns Promise that resolves to estimated bandwidth settings
   */
  static async estimateOptimalBandwidthSettings(
    peerConnection: RTCPeerConnection
  ): Promise<BandwidthSettings> {
    return new Promise((resolve) => {
      // Get current settings
      const currentSettings = WebRtcBandwidthManager.getBandwidthSettings();
      
      // Initialize result with current settings
      const result: BandwidthSettings = { ...currentSettings };
      
      // Track the highest observed bitrates
      let maxBitrateReceived = 0;
      let maxBitrateSent = 0;
      let samples = 0;
      let totalRtt = 0;
      
      // Monitor bandwidth for 5 seconds
      const stopMonitoring = WebRtcBandwidthManager.monitorBandwidthUsage(
        peerConnection,
        (stats) => {
          // Update max bitrates
          maxBitrateReceived = Math.max(maxBitrateReceived, stats.bitsPerSecondReceived);
          maxBitrateSent = Math.max(maxBitrateSent, stats.bitsPerSecondSent);
          
          // Track RTT
          totalRtt += stats.roundTripTime;
          samples++;
        },
        500
      );
      
      // After 5 seconds, calculate optimal settings
      setTimeout(() => {
        // Stop monitoring
        stopMonitoring();
        
        // Calculate average RTT
        const avgRtt = samples > 0 ? totalRtt / samples : 0;
        
        // Adjust settings based on observed network conditions
        if (maxBitrateSent > 0) {
          // Set video max to 80% of observed max bitrate
          result.video.max = Math.min(
            Math.max(Math.floor(maxBitrateSent / 1000 * 0.8), 100),
            2500
          );
          
          // Set video ideal to 60% of max
          result.video.ideal = Math.floor(result.video.max * 0.6);
        }
        
        // Adjust based on RTT
        if (avgRtt > 200) {
          // High latency, reduce video bitrate
          result.video.max = Math.floor(result.video.max * 0.7);
          result.video.ideal = Math.floor(result.video.ideal * 0.7);
          
          // Prioritize audio
          result.prioritizeAudio = true;
        }
        
        // Enable adaptive bitrate for variable network conditions
        result.adaptiveBitrate = true;
        
        // Resolve with estimated settings
        resolve(result);
      }, 5000);
    });
  }

  /**
   * Get network type information
   * @returns Promise that resolves to network type information
   */
  static async getNetworkType(): Promise<{
    type: 'ethernet' | 'wifi' | 'cellular' | 'unknown';
    effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
    downlinkMbps: number;
    rtt: number;
  }> {
    try {
      // Check if Network Information API is available
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        
        return {
          type: connection.type || 'unknown',
          effectiveType: connection.effectiveType || 'unknown',
          downlinkMbps: connection.downlink || 0,
          rtt: connection.rtt || 0,
        };
      }
      
      // Fallback to generic detection
      return {
        type: 'unknown',
        effectiveType: 'unknown',
        downlinkMbps: 0,
        rtt: 0,
      };
    } catch (error) {
      console.error('Error getting network type:', error);
      
      return {
        type: 'unknown',
        effectiveType: 'unknown',
        downlinkMbps: 0,
        rtt: 0,
      };
    }
  }

  /**
   * Get recommended bandwidth settings based on network type
   * @returns Promise that resolves to recommended bandwidth settings
   */
  static async getRecommendedBandwidthSettings(): Promise<BandwidthSettings> {
    // Get current settings
    const currentSettings = WebRtcBandwidthManager.getBandwidthSettings();
    
    // Get network type
    const networkInfo = await WebRtcBandwidthManager.getNetworkType();
    
    // Initialize result with current settings
    const result: BandwidthSettings = { ...currentSettings };
    
    // Adjust settings based on network type
    switch (networkInfo.effectiveType) {
      case 'slow-2g':
      case '2g':
        // Very limited bandwidth
        result.video.max = 100;
        result.video.ideal = 80;
        result.audio.max = 24;
        result.audio.ideal = 16;
        result.saveNetworkData = true;
        result.prioritizeAudio = true;
        break;
        
      case '3g':
        // Limited bandwidth
        result.video.max = 500;
        result.video.ideal = 350;
        result.audio.max = 32;
        result.audio.ideal = 24;
        result.saveNetworkData = true;
        result.prioritizeAudio = true;
        break;
        
      case '4g':
        // Good bandwidth
        result.video.max = 1500;
        result.video.ideal = 1000;
        result.audio.max = 48;
        result.audio.ideal = 32;
        result.saveNetworkData = false;
        result.prioritizeAudio = false;
        break;
        
      default:
        // Unknown, use defaults
        if (networkInfo.downlinkMbps > 0) {
          // If we have downlink information, use it
          const maxVideoBitrate = Math.min(networkInfo.downlinkMbps * 500, 2500);
          result.video.max = maxVideoBitrate;
          result.video.ideal = maxVideoBitrate * 0.7;
        }
        break;
    }
    
    return result;
  }
}