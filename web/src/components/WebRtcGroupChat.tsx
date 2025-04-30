import React, { useState, useEffect, useRef } from 'react';
import { useWebRtc } from '../contexts/WebRtcContext';
import { WebRtcStorage } from '../utils/WebRtcStorage';

interface GroupChatMessage {
  id: string;
  peerId: string;
  peerName: string;
  content: string;
  timestamp: string;
}

interface GroupChat {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  members: string[];
  messages: GroupChatMessage[];
}

/**
 * WebRTC Group Chat component
 * Allows users to create and join group chats
 */
const WebRtcGroupChat: React.FC = () => {
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
  } = useWebRtc();

  // State
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newGroupDescription, setNewGroupDescription] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [peerName, setPeerName] = useState<string>(WebRtcStorage.loadSettings().peerName);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load groups from storage
  useEffect(() => {
    const storedGroups = localStorage.getItem('darkswap_webrtc_groups');
    if (storedGroups) {
      try {
        setGroups(JSON.parse(storedGroups));
      } catch (error) {
        console.error('Failed to parse stored groups:', error);
      }
    } else {
      // Create a default group if none exist
      const defaultGroup: GroupChat = {
        id: 'default',
        name: 'DarkSwap Community',
        description: 'General discussion about DarkSwap',
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        members: [],
        messages: [],
      };
      
      setGroups([defaultGroup]);
      localStorage.setItem('darkswap_webrtc_groups', JSON.stringify([defaultGroup]));
    }
  }, []);

  // Set active group if none is selected
  useEffect(() => {
    if (groups.length > 0 && !activeGroup) {
      setActiveGroup(groups[0].id);
    }
  }, [groups, activeGroup]);

  // Save groups to storage when they change
  useEffect(() => {
    if (groups.length > 0) {
      localStorage.setItem('darkswap_webrtc_groups', JSON.stringify(groups));
    }
  }, [groups]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeGroup, groups]);

  // Handle incoming messages
  useEffect(() => {
    const handleMessage = (peerId: string, data: any) => {
      try {
        // Parse the message
        const message = typeof data === 'string' ? JSON.parse(data) : data;
        
        // Handle different message types
        switch (message.type) {
          case 'group_message':
            handleGroupMessage(peerId, message);
            break;
          case 'group_join':
            handleGroupJoin(peerId, message);
            break;
          case 'group_leave':
            handleGroupLeave(peerId, message);
            break;
          case 'group_create':
            handleGroupCreate(peerId, message);
            break;
          case 'group_sync_request':
            handleGroupSyncRequest(peerId);
            break;
          case 'group_sync_response':
            handleGroupSyncResponse(peerId, message);
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
  }, [onMessage, offMessage, groups]);

  // Request group sync when connecting to new peers
  useEffect(() => {
    if (connectedPeers.length > 0) {
      // Request group sync from all connected peers
      connectedPeers.forEach((peerId) => {
        requestGroupSync(peerId);
      });
    }
  }, [connectedPeers]);

  // Handle group message
  const handleGroupMessage = (peerId: string, message: any) => {
    const { groupId, messageId, peerName, content, timestamp } = message;
    
    // Find the group
    const groupIndex = groups.findIndex((group) => group.id === groupId);
    if (groupIndex === -1) return;
    
    // Check if the message already exists
    if (groups[groupIndex].messages.some((msg) => msg.id === messageId)) return;
    
    // Add the message to the group
    const updatedGroups = [...groups];
    updatedGroups[groupIndex].messages.push({
      id: messageId,
      peerId,
      peerName,
      content,
      timestamp,
    });
    
    setGroups(updatedGroups);
  };

  // Handle group join
  const handleGroupJoin = (peerId: string, message: any) => {
    const { groupId, peerName } = message;
    
    // Find the group
    const groupIndex = groups.findIndex((group) => group.id === groupId);
    if (groupIndex === -1) return;
    
    // Check if the peer is already a member
    if (groups[groupIndex].members.includes(peerId)) return;
    
    // Add the peer to the group
    const updatedGroups = [...groups];
    updatedGroups[groupIndex].members.push(peerId);
    
    // Add a system message
    updatedGroups[groupIndex].messages.push({
      id: `system-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      peerId: 'system',
      peerName: 'System',
      content: `${peerName} (${peerId}) has joined the group`,
      timestamp: new Date().toISOString(),
    });
    
    setGroups(updatedGroups);
  };

  // Handle group leave
  const handleGroupLeave = (peerId: string, message: any) => {
    const { groupId, peerName } = message;
    
    // Find the group
    const groupIndex = groups.findIndex((group) => group.id === groupId);
    if (groupIndex === -1) return;
    
    // Check if the peer is a member
    if (!groups[groupIndex].members.includes(peerId)) return;
    
    // Remove the peer from the group
    const updatedGroups = [...groups];
    updatedGroups[groupIndex].members = updatedGroups[groupIndex].members.filter((id) => id !== peerId);
    
    // Add a system message
    updatedGroups[groupIndex].messages.push({
      id: `system-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      peerId: 'system',
      peerName: 'System',
      content: `${peerName} (${peerId}) has left the group`,
      timestamp: new Date().toISOString(),
    });
    
    setGroups(updatedGroups);
  };

  // Handle group create
  const handleGroupCreate = (peerId: string, message: any) => {
    const { group } = message;
    
    // Check if the group already exists
    if (groups.some((g) => g.id === group.id)) return;
    
    // Add the group
    setGroups((prev) => [...prev, group]);
  };

  // Handle group sync request
  const handleGroupSyncRequest = (peerId: string) => {
    // Send all groups to the peer
    const message = {
      type: 'group_sync_response',
      groups,
    };
    
    sendString(peerId, JSON.stringify(message));
  };

  // Handle group sync response
  const handleGroupSyncResponse = (peerId: string, message: any) => {
    const { groups: receivedGroups } = message;
    
    // Merge received groups with local groups
    const mergedGroups = [...groups];
    
    receivedGroups.forEach((receivedGroup: GroupChat) => {
      // Check if the group already exists
      const groupIndex = mergedGroups.findIndex((g) => g.id === receivedGroup.id);
      
      if (groupIndex === -1) {
        // Add the new group
        mergedGroups.push(receivedGroup);
      } else {
        // Merge members
        const localGroup = mergedGroups[groupIndex];
        const mergedMembers = [...new Set([...localGroup.members, ...receivedGroup.members])];
        
        // Merge messages
        const mergedMessages = [...localGroup.messages];
        receivedGroup.messages.forEach((receivedMessage: GroupChatMessage) => {
          if (!mergedMessages.some((msg) => msg.id === receivedMessage.id)) {
            mergedMessages.push(receivedMessage);
          }
        });
        
        // Sort messages by timestamp
        mergedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        // Update the group
        mergedGroups[groupIndex] = {
          ...localGroup,
          members: mergedMembers,
          messages: mergedMessages,
        };
      }
    });
    
    setGroups(mergedGroups);
    setStatusMessage(`Synced groups with ${peerId}`);
  };

  // Request group sync
  const requestGroupSync = (peerId: string) => {
    const message = {
      type: 'group_sync_request',
    };
    
    sendString(peerId, JSON.stringify(message));
  };

  // Create a new group
  const createGroup = () => {
    if (!newGroupName) {
      setStatusMessage('Please enter a group name');
      return;
    }
    
    // Create a group ID
    const groupId = `group-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Create the group
    const newGroup: GroupChat = {
      id: groupId,
      name: newGroupName,
      description: newGroupDescription,
      createdBy: localPeerId || 'unknown',
      createdAt: new Date().toISOString(),
      members: [localPeerId || 'unknown'],
      messages: [],
    };
    
    // Add the group
    setGroups((prev) => [...prev, newGroup]);
    
    // Set the active group
    setActiveGroup(groupId);
    
    // Reset the form
    setNewGroupName('');
    setNewGroupDescription('');
    
    // Broadcast the group to all connected peers
    const message = {
      type: 'group_create',
      group: newGroup,
    };
    
    connectedPeers.forEach((peerId) => {
      sendString(peerId, JSON.stringify(message));
    });
    
    setStatusMessage(`Created new group: ${newGroupName}`);
  };

  // Join a group
  const joinGroup = (groupId: string) => {
    // Find the group
    const groupIndex = groups.findIndex((group) => group.id === groupId);
    if (groupIndex === -1) return;
    
    // Check if already a member
    if (groups[groupIndex].members.includes(localPeerId || 'unknown')) {
      setActiveGroup(groupId);
      return;
    }
    
    // Add to the group
    const updatedGroups = [...groups];
    updatedGroups[groupIndex].members.push(localPeerId || 'unknown');
    
    // Add a system message
    updatedGroups[groupIndex].messages.push({
      id: `system-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      peerId: 'system',
      peerName: 'System',
      content: `${peerName} (${localPeerId}) has joined the group`,
      timestamp: new Date().toISOString(),
    });
    
    setGroups(updatedGroups);
    
    // Set the active group
    setActiveGroup(groupId);
    
    // Broadcast the join to all connected peers
    const message = {
      type: 'group_join',
      groupId,
      peerName,
    };
    
    connectedPeers.forEach((peerId) => {
      sendString(peerId, JSON.stringify(message));
    });
    
    setStatusMessage(`Joined group: ${groups[groupIndex].name}`);
  };

  // Leave a group
  const leaveGroup = (groupId: string) => {
    // Find the group
    const groupIndex = groups.findIndex((group) => group.id === groupId);
    if (groupIndex === -1) return;
    
    // Check if a member
    if (!groups[groupIndex].members.includes(localPeerId || 'unknown')) return;
    
    // Remove from the group
    const updatedGroups = [...groups];
    updatedGroups[groupIndex].members = updatedGroups[groupIndex].members.filter((id) => id !== localPeerId);
    
    // Add a system message
    updatedGroups[groupIndex].messages.push({
      id: `system-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      peerId: 'system',
      peerName: 'System',
      content: `${peerName} (${localPeerId}) has left the group`,
      timestamp: new Date().toISOString(),
    });
    
    setGroups(updatedGroups);
    
    // Set the active group to the first group
    if (activeGroup === groupId && groups.length > 0) {
      setActiveGroup(groups[0].id);
    }
    
    // Broadcast the leave to all connected peers
    const message = {
      type: 'group_leave',
      groupId,
      peerName,
    };
    
    connectedPeers.forEach((peerId) => {
      sendString(peerId, JSON.stringify(message));
    });
    
    setStatusMessage(`Left group: ${groups[groupIndex].name}`);
  };

  // Send a message to the active group
  const sendMessage = () => {
    if (!activeGroup || !message) return;
    
    // Find the group
    const groupIndex = groups.findIndex((group) => group.id === activeGroup);
    if (groupIndex === -1) return;
    
    // Create a message ID
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Add the message to the group
    const updatedGroups = [...groups];
    updatedGroups[groupIndex].messages.push({
      id: messageId,
      peerId: localPeerId || 'unknown',
      peerName,
      content: message,
      timestamp: new Date().toISOString(),
    });
    
    setGroups(updatedGroups);
    
    // Broadcast the message to all connected peers
    const broadcastMessage = {
      type: 'group_message',
      groupId: activeGroup,
      messageId,
      peerName,
      content: message,
      timestamp: new Date().toISOString(),
    };
    
    connectedPeers.forEach((peerId) => {
      sendString(peerId, JSON.stringify(broadcastMessage));
    });
    
    // Clear the message input
    setMessage('');
  };

  // Get the active group
  const getActiveGroup = () => {
    if (!activeGroup) return null;
    return groups.find((group) => group.id === activeGroup) || null;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Check if the user is a member of a group
  const isMember = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    return group ? group.members.includes(localPeerId || 'unknown') : false;
  };

  return (
    <div style={{
      backgroundColor: '#1a1a2e',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
    }}>
      <h2>Group Chat</h2>
      
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
      
      {/* Create group form */}
      <div style={{
        backgroundColor: '#16213e',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <h3>Create New Group</h3>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Group Name</label>
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Enter group name"
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
          <label style={{ display: 'block', marginBottom: '5px' }}>Description</label>
          <textarea
            value={newGroupDescription}
            onChange={(e) => setNewGroupDescription(e.target.value)}
            placeholder="Enter group description"
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #333',
              backgroundColor: '#1a1a2e',
              color: 'white',
              height: '80px',
            }}
          />
        </div>
        
        <button
          onClick={createGroup}
          disabled={!newGroupName}
          style={{
            padding: '10px 20px',
            backgroundColor: newGroupName ? '#4cc9f0' : '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: newGroupName ? 'pointer' : 'not-allowed',
            width: '100%',
          }}
        >
          Create Group
        </button>
      </div>
      
      {/* Group list and chat */}
      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '20px' }}>
        {/* Group list */}
        <div>
          <h3>Groups</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {groups.map((group) => (
              <div
                key={group.id}
                style={{
                  backgroundColor: activeGroup === group.id ? '#2a3f5f' : '#16213e',
                  borderRadius: '8px',
                  padding: '10px',
                  marginBottom: '10px',
                  cursor: 'pointer',
                }}
                onClick={() => setActiveGroup(group.id)}
              >
                <div style={{ fontWeight: 'bold' }}>{group.name}</div>
                <div style={{ fontSize: '12px', color: '#ccc' }}>{group.description}</div>
                <div style={{ fontSize: '12px', color: '#ccc', marginTop: '5px' }}>
                  {group.members.length} members
                </div>
                <div style={{ marginTop: '10px' }}>
                  {isMember(group.id) ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        leaveGroup(group.id);
                      }}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#f72585',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Leave
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        joinGroup(group.id);
                      }}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#4cc9f0',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Join
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Chat */}
        <div>
          {getActiveGroup() ? (
            <>
              <h3>{getActiveGroup()?.name}</h3>
              <div style={{ fontSize: '14px', color: '#ccc', marginBottom: '10px' }}>
                {getActiveGroup()?.description}
              </div>
              
              {/* Messages */}
              <div
                style={{
                  height: '300px',
                  overflowY: 'auto',
                  backgroundColor: '#16213e',
                  borderRadius: '8px',
                  padding: '10px',
                  marginBottom: '10px',
                }}
              >
                {getActiveGroup()?.messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      marginBottom: '10px',
                      textAlign: msg.peerId === localPeerId ? 'right' : 'left',
                    }}
                  >
                    {msg.peerId === 'system' ? (
                      <div
                        style={{
                          backgroundColor: '#333',
                          color: '#ccc',
                          borderRadius: '8px',
                          padding: '5px 10px',
                          display: 'inline-block',
                          maxWidth: '80%',
                          textAlign: 'center',
                          fontSize: '12px',
                        }}
                      >
                        {msg.content}
                      </div>
                    ) : (
                      <>
                        <div
                          style={{
                            backgroundColor: msg.peerId === localPeerId ? '#4cc9f0' : '#2a3f5f',
                            color: 'white',
                            borderRadius: '8px',
                            padding: '10px',
                            display: 'inline-block',
                            maxWidth: '80%',
                            textAlign: 'left',
                          }}
                        >
                          {msg.content}
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#ccc',
                            marginTop: '5px',
                          }}
                        >
                          {msg.peerName} • {formatTimestamp(msg.timestamp)}
                        </div>
                      </>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message input */}
              {activeGroup && isMember(activeGroup) && (
                <div style={{ display: 'flex' }}>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    style={{
                      flexGrow: 1,
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #333',
                      backgroundColor: '#16213e',
                      color: 'white',
                      marginRight: '10px',
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!message}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: message ? '#4cc9f0' : '#333',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: message ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Send
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>Select a group to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebRtcGroupChat;