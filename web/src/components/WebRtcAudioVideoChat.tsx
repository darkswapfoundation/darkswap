import React, { useState, useEffect, useRef } from 'react';
import { useWebRtc } from '../contexts/WebRtcContext';

interface MediaCall {
  id: string;
  peerId: string;
  peerName: string;
  status: 'ringing' | 'connected' | 'ended';
  direction: 'incoming' | 'outgoing';
  hasVideo: boolean;
  hasAudio: boolean;
  timestamp: string;
}

/**
 * WebRTC Audio/Video Chat component
 * Allows users to have voice and video calls directly between browsers
 */
const WebRtcAudioVideoChat: React.FC = () => {
  // WebRTC context
  const {
    isConnected,
    isConnecting,
    error,
    localPeerId,
    connectedPeers,
    sendString,
    onMessage,
    offMessage,
    webRtcManager,
  } = useWebRtc();

  // State
  const [calls, setCalls] = useState<MediaCall[]>([]);
  const [activeCall, setActiveCall] = useState<string | null>(null);
  const [selectedPeer, setSelectedPeer] = useState<string>('');
  const [enableVideo, setEnableVideo] = useState<boolean>(true);
  const [enableAudio, setEnableAudio] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [peerName, setPeerName] = useState<string>(`User-${Math.floor(Math.random() * 10000)}`);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Handle incoming messages
  useEffect(() => {
    const handleMessage = (peerId: string, data: any) => {
      try {
        // Parse the message
        const message = typeof data === 'string' ? JSON.parse(data) : data;
        
        // Handle different message types
        switch (message.type) {
          case 'call_request':
            handleCallRequest(peerId, message);
            break;
          case 'call_response':
            handleCallResponse(peerId, message);
            break;
          case 'call_end':
            handleCallEnd(peerId, message);
            break;
          case 'ice_candidate':
            handleIceCandidate(peerId, message);
            break;
          default:
            // Ignore other message types
            break;
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    };

    onMessage(handleMessage);

    return () => {
      offMessage(handleMessage);
    };
  }, [onMessage, offMessage, calls]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      // Stop all media streams
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      
      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [localStream]);

  // Update video elements when streams change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  // Handle call request
  const handleCallRequest = async (peerId: string, message: any) => {
    const { callId, hasVideo, hasAudio, peerName, offer } = message;
    
    // Check if we already have this call
    if (calls.some((c) => c.id === callId)) return;
    
    // Create a new call
    const newCall: MediaCall = {
      id: callId,
      peerId,
      peerName,
      status: 'ringing',
      direction: 'incoming',
      hasVideo,
      hasAudio,
      timestamp: new Date().toISOString(),
    };
    
    setCalls((prev) => [...prev, newCall]);
    setStatusMessage(`Incoming call from ${peerName}`);
    
    // Play ringtone
    playRingtone();
  };

  // Handle call response
  const handleCallResponse = async (peerId: string, message: any) => {
    const { callId, accepted, answer } = message;
    
    // Find the call
    const callIndex = calls.findIndex((c) => c.id === callId);
    if (callIndex === -1) return;
    
    const call = calls[callIndex];
    
    if (accepted) {
      // Update the call status
      const updatedCalls = [...calls];
      updatedCalls[callIndex].status = 'connected';
      setCalls(updatedCalls);
      
      // Set the active call
      setActiveCall(callId);
      
      // Set the remote description
      if (peerConnectionRef.current && answer) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
          console.error('Error setting remote description:', error);
        }
      }
      
      setStatusMessage(`Call connected with ${call.peerName}`);
    } else {
      // Update the call status
      const updatedCalls = [...calls];
      updatedCalls[callIndex].status = 'ended';
      setCalls(updatedCalls);
      
      // Clean up
      cleanupCall();
      
      setStatusMessage(`Call rejected by ${call.peerName}`);
    }
  };

  // Handle call end
  const handleCallEnd = (peerId: string, message: any) => {
    const { callId } = message;
    
    // Find the call
    const callIndex = calls.findIndex((c) => c.id === callId);
    if (callIndex === -1) return;
    
    const call = calls[callIndex];
    
    // Update the call status
    const updatedCalls = [...calls];
    updatedCalls[callIndex].status = 'ended';
    setCalls(updatedCalls);
    
    // Clean up if this is the active call
    if (activeCall === callId) {
      cleanupCall();
      setActiveCall(null);
    }
    
    setStatusMessage(`Call ended with ${call.peerName}`);
  };

  // Handle ICE candidate
  const handleIceCandidate = (peerId: string, message: any) => {
    const { candidate } = message;
    
    // Add the ICE candidate to the peer connection
    if (peerConnectionRef.current && candidate) {
      try {
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  };

  // Start a call
  const startCall = async () => {
    if (!selectedPeer) {
      setStatusMessage('Please select a peer to call');
      return;
    }
    
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: enableVideo,
        audio: enableAudio,
      });
      
      // Set local stream
      setLocalStream(stream);
      
      // Create a peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });
      
      // Add local stream to peer connection
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });
      
      // Set up event handlers
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // Send ICE candidate to peer
          const message = {
            type: 'ice_candidate',
            candidate: event.candidate,
          };
          
          sendString(selectedPeer, JSON.stringify(message));
        }
      };
      
      peerConnection.ontrack = (event) => {
        // Set remote stream
        setRemoteStream(event.streams[0]);
      };
      
      // Create an offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      // Create a call ID
      const callId = `call-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Create a new call
      const newCall: MediaCall = {
        id: callId,
        peerId: selectedPeer,
        peerName: selectedPeer,
        status: 'ringing',
        direction: 'outgoing',
        hasVideo: enableVideo,
        hasAudio: enableAudio,
        timestamp: new Date().toISOString(),
      };
      
      setCalls((prev) => [...prev, newCall]);
      
      // Set the active call
      setActiveCall(callId);
      
      // Store the peer connection
      peerConnectionRef.current = peerConnection;
      
      // Send call request
      const message = {
        type: 'call_request',
        callId,
        hasVideo: enableVideo,
        hasAudio: enableAudio,
        peerName,
        offer: peerConnection.localDescription,
      };
      
      sendString(selectedPeer, JSON.stringify(message));
      setStatusMessage(`Calling ${selectedPeer}...`);
    } catch (error) {
      console.error('Error starting call:', error);
      setStatusMessage(`Error starting call: ${error}`);
    }
  };

  // Answer a call
  const answerCall = async (callId: string) => {
    // Find the call
    const callIndex = calls.findIndex((c) => c.id === callId);
    if (callIndex === -1) return;
    
    const call = calls[callIndex];
    
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: call.hasVideo,
        audio: call.hasAudio,
      });
      
      // Set local stream
      setLocalStream(stream);
      
      // Create a peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });
      
      // Add local stream to peer connection
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });
      
      // Set up event handlers
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // Send ICE candidate to peer
          const message = {
            type: 'ice_candidate',
            candidate: event.candidate,
          };
          
          sendString(call.peerId, JSON.stringify(message));
        }
      };
      
      peerConnection.ontrack = (event) => {
        // Set remote stream
        setRemoteStream(event.streams[0]);
      };
      
      // Store the peer connection
      peerConnectionRef.current = peerConnection;
      
      // Set the active call
      setActiveCall(callId);
      
      // Update the call status
      const updatedCalls = [...calls];
      updatedCalls[callIndex].status = 'connected';
      setCalls(updatedCalls);
      
      // Send call response
      const message = {
        type: 'call_response',
        callId,
        accepted: true,
        answer: peerConnection.localDescription,
      };
      
      sendString(call.peerId, JSON.stringify(message));
      setStatusMessage(`Call connected with ${call.peerName}`);
    } catch (error) {
      console.error('Error answering call:', error);
      setStatusMessage(`Error answering call: ${error}`);
      
      // Reject the call
      rejectCall(callId);
    }
  };

  // Reject a call
  const rejectCall = (callId: string) => {
    // Find the call
    const callIndex = calls.findIndex((c) => c.id === callId);
    if (callIndex === -1) return;
    
    const call = calls[callIndex];
    
    // Update the call status
    const updatedCalls = [...calls];
    updatedCalls[callIndex].status = 'ended';
    setCalls(updatedCalls);
    
    // Send call response
    const message = {
      type: 'call_response',
      callId,
      accepted: false,
    };
    
    sendString(call.peerId, JSON.stringify(message));
    setStatusMessage(`Call rejected with ${call.peerName}`);
  };

  // End a call
  const endCall = (callId: string) => {
    // Find the call
    const callIndex = calls.findIndex((c) => c.id === callId);
    if (callIndex === -1) return;
    
    const call = calls[callIndex];
    
    // Update the call status
    const updatedCalls = [...calls];
    updatedCalls[callIndex].status = 'ended';
    setCalls(updatedCalls);
    
    // Send call end
    const message = {
      type: 'call_end',
      callId,
    };
    
    sendString(call.peerId, JSON.stringify(message));
    
    // Clean up
    cleanupCall();
    
    // Clear the active call
    setActiveCall(null);
    
    setStatusMessage(`Call ended with ${call.peerName}`);
  };

  // Clean up call resources
  const cleanupCall = () => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Clear remote stream
    setRemoteStream(null);
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // Play ringtone
  const playRingtone = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 440;
    gainNode.gain.value = 0.5;
    
    oscillator.start();
    
    // Beep pattern
    setTimeout(() => {
      oscillator.stop();
    }, 300);
    
    setTimeout(() => {
      const oscillator2 = audioContext.createOscillator();
      oscillator2.connect(gainNode);
      oscillator2.type = 'sine';
      oscillator2.frequency.value = 440;
      oscillator2.start();
      
      setTimeout(() => {
        oscillator2.stop();
      }, 300);
    }, 500);
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Get active call
  const getActiveCallData = () => {
    if (!activeCall) return null;
    return calls.find((call) => call.id === activeCall) || null;
  };

  return (
    <div style={{
      backgroundColor: '#1a1a2e',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
    }}>
      <h2>Audio/Video Chat</h2>
      
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
        <p>Connected Peers: {connectedPeers.length}</p>
      </div>
      
      {/* Active call */}
      {activeCall && (
        <div style={{
          backgroundColor: '#16213e',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <h3>Active Call with {getActiveCallData()?.peerName}</h3>
          
          {/* Video container */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            {/* Local video */}
            <div style={{ flex: 1 }}>
              <h4>You</h4>
              <div style={{
                backgroundColor: '#0f0f1e',
                borderRadius: '8px',
                overflow: 'hidden',
                position: 'relative',
                paddingTop: '75%', // 4:3 aspect ratio
              }}>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                {isVideoOff && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                  }}>
                    Video Off
                  </div>
                )}
              </div>
            </div>
            
            {/* Remote video */}
            <div style={{ flex: 1 }}>
              <h4>{getActiveCallData()?.peerName}</h4>
              <div style={{
                backgroundColor: '#0f0f1e',
                borderRadius: '8px',
                overflow: 'hidden',
                position: 'relative',
                paddingTop: '75%', // 4:3 aspect ratio
              }}>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Call controls */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
            <button
              onClick={toggleAudio}
              style={{
                padding: '10px',
                backgroundColor: isMuted ? '#f94144' : '#4cc9f0',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
            
            <button
              onClick={toggleVideo}
              style={{
                padding: '10px',
                backgroundColor: isVideoOff ? '#f94144' : '#4cc9f0',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isVideoOff ? 'Show' : 'Hide'}
            </button>
            
            <button
              onClick={() => endCall(activeCall)}
              style={{
                padding: '10px',
                backgroundColor: '#f72585',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              End
            </button>
          </div>
        </div>
      )}
      
      {/* Start call form */}
      {!activeCall && (
        <div style={{
          backgroundColor: '#16213e',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <h3>Start a Call</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Select Peer</label>
            <select
              value={selectedPeer}
              onChange={(e) => setSelectedPeer(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #333',
                backgroundColor: '#1a1a2e',
                color: 'white',
              }}
            >
              <option value="">Select a peer</option>
              {connectedPeers.map((peerId) => (
                <option key={peerId} value={peerId}>
                  {peerId}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ marginBottom: '15px', display: 'flex', gap: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={enableVideo}
                onChange={() => setEnableVideo(!enableVideo)}
                style={{ marginRight: '5px' }}
              />
              Enable Video
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={enableAudio}
                onChange={() => setEnableAudio(!enableAudio)}
                style={{ marginRight: '5px' }}
              />
              Enable Audio
            </label>
          </div>
          
          <button
            onClick={startCall}
            disabled={!selectedPeer || (!enableVideo && !enableAudio)}
            style={{
              padding: '10px 20px',
              backgroundColor: selectedPeer && (enableVideo || enableAudio) ? '#4cc9f0' : '#333',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedPeer && (enableVideo || enableAudio) ? 'pointer' : 'not-allowed',
              width: '100%',
            }}
          >
            Start Call
          </button>
        </div>
      )}
      
      {/* Incoming calls */}
      {calls.filter((call) => call.direction === 'incoming' && call.status === 'ringing').length > 0 && (
        <div style={{
          backgroundColor: '#16213e',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
          animation: 'pulse 1s infinite',
        }}>
          <h3>Incoming Calls</h3>
          
          {calls
            .filter((call) => call.direction === 'incoming' && call.status === 'ringing')
            .map((call) => (
              <div
                key={call.id}
                style={{
                  backgroundColor: '#0f0f1e',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '10px',
                }}
              >
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontWeight: 'bold' }}>{call.peerName}</div>
                  <div style={{ fontSize: '12px', color: '#ccc' }}>
                    {call.hasVideo ? 'Video Call' : 'Audio Call'} • {formatTimestamp(call.timestamp)}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => answerCall(call.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#90be6d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Answer
                  </button>
                  
                  <button
                    onClick={() => rejectCall(call.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#f94144',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
      
      {/* Call history */}
      <div>
        <h3>Call History</h3>
        {calls.filter((call) => call.status !== 'ringing').length === 0 ? (
          <p>No call history</p>
        ) : (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {calls
              .filter((call) => call.status !== 'ringing')
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((call) => (
                <div
                  key={call.id}
                  style={{
                    backgroundColor: '#16213e',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{call.peerName}</div>
                    <div style={{ fontSize: '12px', color: '#ccc' }}>
                      {call.direction === 'incoming' ? 'Incoming' : 'Outgoing'} •{' '}
                      {call.hasVideo ? 'Video' : 'Audio'} •{' '}
                      {formatTimestamp(call.timestamp)}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: call.status === 'connected' ? '#4cc9f0' : '#f72585',
                      color: 'white',
                      fontSize: '12px',
                    }}>
                      {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
      
      {/* CSS animations */}
      <style>
        {`
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(76, 201, 240, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(76, 201, 240, 0); }
            100% { box-shadow: 0 0 0 0 rgba(76, 201, 240, 0); }
          }
        `}
      </style>
    </div>
  );
};

export default WebRtcAudioVideoChat;