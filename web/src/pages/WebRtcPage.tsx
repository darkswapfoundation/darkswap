import React, { useState } from 'react';
import { motion } from 'framer-motion';
import WebRtcStatus from '../components/WebRtcStatus';
import { useWebRtc } from '../contexts/WebRtcContext';
import { useNotification } from '../contexts/NotificationContext';

// Icons
import {
  GlobeAltIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const WebRtcPage: React.FC = () => {
  // Contexts
  const {
    isInitialized,
    peers,
    createConnection,
    createDataChannel,
    sendMessage,
  } = useWebRtc();
  const { addNotification } = useNotification();
  
  // State
  const [selectedPeer, setSelectedPeer] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<{ peer: string; message: string; sent: boolean; timestamp: Date }[]>([]);
  const [channelName, setChannelName] = useState<string>('darkswap');
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!selectedPeer || !message) {
      return;
    }
    
    try {
      const success = await sendMessage(selectedPeer, channelName, message);
      
      if (success) {
        // Add message to the list
        setMessages([
          ...messages,
          {
            peer: selectedPeer,
            message,
            sent: true,
            timestamp: new Date(),
          },
        ]);
        
        // Clear the message input
        setMessage('');
        
        addNotification('success', 'Message sent');
      } else {
        addNotification('error', 'Failed to send message');
      }
    } catch (error) {
      addNotification('error', `Error sending message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Handle creating a data channel
  const handleCreateDataChannel = async () => {
    if (!selectedPeer || !channelName) {
      return;
    }
    
    try {
      const dataChannel = await createDataChannel(selectedPeer, channelName);
      
      if (dataChannel) {
        addNotification('success', `Data channel "${channelName}" created`);
      } else {
        addNotification('error', 'Failed to create data channel');
      }
    } catch (error) {
      addNotification('error', `Error creating data channel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Format timestamp
  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">
            <span className="text-white">WebRTC</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Test WebRTC peer-to-peer communication
          </p>
        </div>
      </div>
      
      {/* WebRTC Status */}
      <WebRtcStatus className="mb-6" />
      
      {/* Peer Communication */}
      {isInitialized && peers.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Peer Selection */}
          <div className="card lg:col-span-1">
            <div className="card-header">
              <h2 className="text-lg font-display font-medium flex items-center">
                <UserGroupIcon className="w-5 h-5 mr-2" />
                Connected Peers
              </h2>
            </div>
            <div className="card-body">
              <div className="space-y-2">
                {peers.map((peer) => (
                  <div
                    key={peer.connectionId}
                    className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                      selectedPeer === peer.connectionId
                        ? 'bg-twilight-primary'
                        : 'bg-twilight-darker hover:bg-twilight-dark'
                    }`}
                    onClick={() => setSelectedPeer(peer.connectionId)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium">{peer.id}</div>
                      <div className={`text-xs px-2 py-0.5 rounded-full ${
                        peer.state === 'connected' ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'
                      }`}>
                        {peer.state}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      {peer.dataChannels.length > 0
                        ? `Channels: ${peer.dataChannels.join(', ')}`
                        : 'No data channels'}
                    </div>
                  </div>
                ))}
              </div>
              
              {peers.length === 0 && (
                <div className="text-center text-gray-400 py-4">
                  No peers connected
                </div>
              )}
            </div>
          </div>
          
          {/* Data Channel */}
          <div className="card lg:col-span-2">
            <div className="card-header">
              <h2 className="text-lg font-display font-medium flex items-center">
                <GlobeAltIcon className="w-5 h-5 mr-2" />
                Data Channel
              </h2>
            </div>
            <div className="card-body">
              {selectedPeer ? (
                <>
                  {/* Channel Name */}
                  <div className="mb-4">
                    <label className="form-label">Channel Name</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={channelName}
                        onChange={(e) => setChannelName(e.target.value)}
                        placeholder="Enter channel name"
                        className="form-input flex-1"
                      />
                      <button
                        onClick={handleCreateDataChannel}
                        className="btn btn-primary"
                        disabled={!channelName}
                      >
                        Create
                      </button>
                    </div>
                  </div>
                  
                  {/* Messages */}
                  <div className="mb-4">
                    <label className="form-label">Messages</label>
                    <div className="bg-twilight-darker p-3 rounded-lg h-64 overflow-y-auto">
                      {messages.filter(m => m.peer === selectedPeer).length > 0 ? (
                        <div className="space-y-2">
                          {messages
                            .filter(m => m.peer === selectedPeer)
                            .map((msg, index) => (
                              <div
                                key={index}
                                className={`p-2 rounded-lg ${
                                  msg.sent
                                    ? 'bg-twilight-primary ml-8'
                                    : 'bg-twilight-dark mr-8'
                                }`}
                              >
                                <div className="text-sm">{msg.message}</div>
                                <div className="text-xs text-gray-400 text-right">
                                  {formatTimestamp(msg.timestamp)}
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 py-4">
                          No messages yet
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Send Message */}
                  <div>
                    <label className="form-label">Send Message</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Enter message"
                        className="form-input flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSendMessage();
                          }
                        }}
                      />
                      <button
                        onClick={handleSendMessage}
                        className="btn btn-primary"
                        disabled={!message}
                      >
                        <PaperAirplaneIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-400 py-4">
                  Select a peer to start communication
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Not Initialized Warning */}
      {!isInitialized && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-glass p-4 border border-ui-warning border-opacity-50 mb-6"
        >
          <div className="flex items-center">
            <ArrowPathIcon className="w-5 h-5 text-ui-warning mr-2" />
            <span className="text-ui-warning">
              Initialize WebRTC to start peer-to-peer communication
            </span>
          </div>
        </motion.div>
      )}
      
      {/* No Peers Warning */}
      {isInitialized && peers.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-glass p-4 border border-ui-warning border-opacity-50 mb-6"
        >
          <div className="flex items-center">
            <UserGroupIcon className="w-5 h-5 text-ui-warning mr-2" />
            <span className="text-ui-warning">
              Connect to peers to start communication
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default WebRtcPage;