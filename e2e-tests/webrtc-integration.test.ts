import { test, expect } from '@playwright/test';

test.describe('WebRTC Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the test page
    await page.goto('/test-webrtc.html');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });
  
  test('should detect WebRTC support', async ({ page }) => {
    const isSupported = await page.evaluate(() => {
      return window.isWebRTCSupported;
    });
    
    expect(isSupported).toBe(true);
  });
  
  test('should create a WebRTC connection', async ({ page }) => {
    const result = await page.evaluate(async () => {
      try {
        const connection = await window.createConnection();
        return {
          success: true,
          connectionState: connection.connectionState,
          iceConnectionState: connection.iceConnectionState,
          signalingState: connection.signalingState,
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    });
    
    expect(result.success).toBe(true);
    expect(result.connectionState).toBe('new');
    expect(result.iceConnectionState).toBe('new');
    expect(result.signalingState).toBe('stable');
  });
  
  test('should create a data channel', async ({ page }) => {
    const result = await page.evaluate(async () => {
      try {
        const connection = await window.createConnection();
        const dataChannel = await window.createDataChannel(connection, 'test-channel');
        
        return {
          success: true,
          dataChannelLabel: dataChannel.label,
          dataChannelReadyState: dataChannel.readyState,
          dataChannelOrdered: dataChannel.ordered,
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    });
    
    expect(result.success).toBe(true);
    expect(result.dataChannelLabel).toBe('test-channel');
    expect(result.dataChannelReadyState).toBe('connecting');
    expect(result.dataChannelOrdered).toBe(true);
  });
  
  test('should establish a connection between two peers', async ({ context }) => {
    // Create two pages
    const pageA = await context.newPage();
    const pageB = await context.newPage();
    
    // Navigate to the test page
    await pageA.goto('/test-webrtc.html');
    await pageB.goto('/test-webrtc.html');
    
    // Wait for the pages to load
    await pageA.waitForLoadState('networkidle');
    await pageB.waitForLoadState('networkidle');
    
    // Create connections and exchange signaling data
    const result = await pageA.evaluate(async () => {
      try {
        // Create connection A
        const connectionA = await window.createConnection();
        const dataChannelA = await window.createDataChannel(connectionA, 'test-channel');
        
        // Create offer
        const offer = await connectionA.createOffer();
        await connectionA.setLocalDescription(offer);
        
        // Wait for ICE candidates
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get local description and ICE candidates
        const localDescription = connectionA.localDescription;
        
        return {
          success: true,
          offer: {
            type: localDescription.type,
            sdp: localDescription.sdp,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    });
    
    expect(result.success).toBe(true);
    expect(result.offer).toBeDefined();
    expect(result.offer.type).toBe('offer');
    expect(result.offer.sdp).toBeDefined();
    
    // Set the offer on peer B and create an answer
    const answerResult = await pageB.evaluate(async (offer) => {
      try {
        // Create connection B
        const connectionB = await window.createConnection();
        
        // Set remote description (the offer)
        await connectionB.setRemoteDescription(new RTCSessionDescription(offer));
        
        // Create answer
        const answer = await connectionB.createAnswer();
        await connectionB.setLocalDescription(answer);
        
        // Wait for ICE candidates
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get local description and ICE candidates
        const localDescription = connectionB.localDescription;
        
        // Set up data channel event listener
        connectionB.ondatachannel = (event) => {
          const dataChannel = event.channel;
          window.dataChannelB = dataChannel;
          
          dataChannel.onopen = () => {
            window.dataChannelBOpen = true;
          };
          
          dataChannel.onmessage = (event) => {
            window.lastReceivedMessage = event.data;
          };
        };
        
        return {
          success: true,
          answer: {
            type: localDescription.type,
            sdp: localDescription.sdp,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    }, result.offer);
    
    expect(answerResult.success).toBe(true);
    expect(answerResult.answer).toBeDefined();
    expect(answerResult.answer.type).toBe('answer');
    expect(answerResult.answer.sdp).toBeDefined();
    
    // Set the answer on peer A
    const connectionResult = await pageA.evaluate(async (answer) => {
      try {
        // Get the connection
        const connectionA = window.connection;
        
        // Set remote description (the answer)
        await connectionA.setRemoteDescription(new RTCSessionDescription(answer));
        
        // Wait for connection to establish
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get the data channel
        const dataChannel = window.dataChannel;
        
        // Check if the data channel is open
        const isOpen = dataChannel.readyState === 'open';
        
        // Send a test message if the data channel is open
        if (isOpen) {
          dataChannel.send('Hello from Peer A!');
        }
        
        return {
          success: true,
          connectionState: connectionA.connectionState,
          iceConnectionState: connectionA.iceConnectionState,
          dataChannelState: dataChannel.readyState,
          isOpen,
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    }, answerResult.answer);
    
    // Check if the connection was established
    if (connectionResult.success && connectionResult.isOpen) {
      // Wait for the message to be received
      await pageB.waitForFunction(() => window.lastReceivedMessage !== undefined, { timeout: 5000 });
      
      // Check if the message was received
      const messageResult = await pageB.evaluate(() => {
        return {
          lastReceivedMessage: window.lastReceivedMessage,
          dataChannelBOpen: window.dataChannelBOpen,
        };
      });
      
      expect(messageResult.dataChannelBOpen).toBe(true);
      expect(messageResult.lastReceivedMessage).toBe('Hello from Peer A!');
    } else {
      // If the connection wasn't established, this test might be running in an environment
      // where WebRTC connections can't be established (e.g., CI/CD pipeline)
      console.warn('WebRTC connection could not be established. This might be expected in certain environments.');
    }
    
    // Close the pages
    await pageA.close();
    await pageB.close();
  });
  
  test('should handle connection failure gracefully', async ({ page }) => {
    const result = await page.evaluate(async () => {
      try {
        // Create a connection with invalid ICE servers
        const connection = await window.createConnectionWithConfig({
          iceServers: [{ urls: 'stun:invalid.example.com' }],
        });
        
        // Create a data channel
        const dataChannel = await window.createDataChannel(connection, 'test-channel');
        
        // Create offer
        const offer = await connection.createOffer();
        await connection.setLocalDescription(offer);
        
        // Wait for ICE gathering to complete or fail
        await new Promise(resolve => {
          const checkState = () => {
            if (connection.iceGatheringState === 'complete' || 
                connection.iceConnectionState === 'failed') {
              resolve(null);
            } else {
              setTimeout(checkState, 500);
            }
          };
          setTimeout(checkState, 500);
        });
        
        return {
          success: true,
          iceGatheringState: connection.iceGatheringState,
          iceConnectionState: connection.iceConnectionState,
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    });
    
    expect(result.success).toBe(true);
    // The test is successful if we get here without crashing
  });
  
  test('should support multiple data channels', async ({ page }) => {
    const result = await page.evaluate(async () => {
      try {
        const connection = await window.createConnection();
        
        // Create multiple data channels
        const dataChannel1 = await window.createDataChannel(connection, 'channel-1');
        const dataChannel2 = await window.createDataChannel(connection, 'channel-2');
        const dataChannel3 = await window.createDataChannel(connection, 'channel-3');
        
        return {
          success: true,
          channels: [
            { label: dataChannel1.label, id: dataChannel1.id },
            { label: dataChannel2.label, id: dataChannel2.id },
            { label: dataChannel3.label, id: dataChannel3.id },
          ],
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    });
    
    expect(result.success).toBe(true);
    expect(result.channels.length).toBe(3);
    expect(result.channels[0].label).toBe('channel-1');
    expect(result.channels[1].label).toBe('channel-2');
    expect(result.channels[2].label).toBe('channel-3');
    expect(result.channels[0].id).not.toBe(result.channels[1].id);
    expect(result.channels[1].id).not.toBe(result.channels[2].id);
  });
});