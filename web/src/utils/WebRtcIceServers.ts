/**
 * WebRTC ICE Servers utility
 * 
 * This utility provides configuration for STUN and TURN servers
 * to improve NAT traversal for WebRTC connections.
 */

// Default ICE server configuration
const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];

// Storage key for ICE servers
const ICE_SERVERS_STORAGE_KEY = 'darkswap_webrtc_ice_servers';

/**
 * WebRTC ICE server configuration
 */
export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

/**
 * WebRTC ICE Servers utility
 */
export class WebRtcIceServers {
  /**
   * Get the default ICE servers
   * @returns Default ICE servers
   */
  static getDefaultIceServers(): RTCIceServer[] {
    return DEFAULT_ICE_SERVERS;
  }

  /**
   * Get the stored ICE servers
   * @returns Stored ICE servers or default if none are stored
   */
  static getIceServers(): RTCIceServer[] {
    try {
      const storedServers = localStorage.getItem(ICE_SERVERS_STORAGE_KEY);
      if (!storedServers) {
        return DEFAULT_ICE_SERVERS;
      }
      
      return JSON.parse(storedServers);
    } catch (error) {
      console.error('Failed to load ICE servers:', error);
      return DEFAULT_ICE_SERVERS;
    }
  }

  /**
   * Set the ICE servers
   * @param servers ICE servers to store
   */
  static setIceServers(servers: RTCIceServer[]): void {
    try {
      localStorage.setItem(ICE_SERVERS_STORAGE_KEY, JSON.stringify(servers));
    } catch (error) {
      console.error('Failed to store ICE servers:', error);
    }
  }

  /**
   * Add a STUN server
   * @param url STUN server URL
   */
  static addStunServer(url: string): void {
    const servers = WebRtcIceServers.getIceServers();
    
    // Check if the server already exists
    if (servers.some((server) => {
      if (typeof server.urls === 'string') {
        return server.urls === url;
      } else if (Array.isArray(server.urls)) {
        return server.urls.includes(url);
      }
      return false;
    })) {
      return;
    }
    
    // Add the server
    servers.push({ urls: url });
    
    // Save the servers
    WebRtcIceServers.setIceServers(servers);
  }

  /**
   * Add a TURN server
   * @param url TURN server URL
   * @param username TURN server username
   * @param credential TURN server credential
   */
  static addTurnServer(url: string, username: string, credential: string): void {
    const servers = WebRtcIceServers.getIceServers();
    
    // Check if the server already exists
    if (servers.some((server) => {
      if (typeof server.urls === 'string') {
        return server.urls === url;
      } else if (Array.isArray(server.urls)) {
        return server.urls.includes(url);
      }
      return false;
    })) {
      return;
    }
    
    // Add the server
    servers.push({
      urls: url,
      username,
      credential,
    });
    
    // Save the servers
    WebRtcIceServers.setIceServers(servers);
  }

  /**
   * Remove an ICE server
   * @param url ICE server URL to remove
   */
  static removeIceServer(url: string): void {
    const servers = WebRtcIceServers.getIceServers();
    
    // Filter out the server
    const filteredServers = servers.filter((server) => {
      if (typeof server.urls === 'string') {
        return server.urls !== url;
      } else if (Array.isArray(server.urls)) {
        return !server.urls.includes(url);
      }
      return true;
    });
    
    // Save the servers
    WebRtcIceServers.setIceServers(filteredServers);
  }

  /**
   * Reset ICE servers to default
   */
  static resetIceServers(): void {
    WebRtcIceServers.setIceServers(DEFAULT_ICE_SERVERS);
  }

  /**
   * Test ICE server connectivity
   * @param server ICE server to test
   * @returns Promise that resolves to true if the server is reachable, false otherwise
   */
  static async testIceServer(server: RTCIceServer): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // Create a peer connection with just this server
        const pc = new RTCPeerConnection({
          iceServers: [server],
        });
        
        // Set up event handlers
        let candidateFound = false;
        
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            // If we get a candidate, the server is reachable
            candidateFound = true;
            pc.close();
            resolve(true);
          }
        };
        
        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === 'complete' && !candidateFound) {
            // If gathering is complete and no candidates were found, the server is not reachable
            pc.close();
            resolve(false);
          }
        };
        
        // Create a data channel to trigger ICE gathering
        pc.createDataChannel('test');
        
        // Create an offer to trigger ICE gathering
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .catch(() => {
            pc.close();
            resolve(false);
          });
        
        // Set a timeout in case the ICE gathering takes too long
        setTimeout(() => {
          if (pc.iceGatheringState !== 'complete') {
            pc.close();
            resolve(false);
          }
        }, 5000);
      } catch (error) {
        console.error('Error testing ICE server:', error);
        resolve(false);
      }
    });
  }

  /**
   * Test all ICE servers
   * @returns Promise that resolves to an array of objects with server URL and reachable status
   */
  static async testAllIceServers(): Promise<{ url: string; reachable: boolean }[]> {
    const servers = WebRtcIceServers.getIceServers();
    const results: { url: string; reachable: boolean }[] = [];
    
    for (const server of servers) {
      const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
      
      for (const url of urls) {
        const reachable = await WebRtcIceServers.testIceServer({
          urls: url,
          username: server.username,
          credential: server.credential,
        });
        
        results.push({
          url,
          reachable,
        });
      }
    }
    
    return results;
  }

  /**
   * Get the RTCConfiguration with ICE servers
   * @returns RTCConfiguration with ICE servers
   */
  static getRtcConfiguration(): RTCConfiguration {
    return {
      iceServers: WebRtcIceServers.getIceServers(),
      iceCandidatePoolSize: 10,
    };
  }
}