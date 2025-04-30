import React, { useState, useEffect, useRef } from 'react';
import { useWebRtc } from '../contexts/WebRtcContext';

interface FileTransfer {
  id: string;
  peerId: string;
  peerName: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  progress: number;
  status: 'pending' | 'transferring' | 'completed' | 'failed' | 'canceled';
  direction: 'incoming' | 'outgoing';
  timestamp: string;
  file?: File;
  chunks?: ArrayBuffer[];
  chunkSize?: number;
  totalChunks?: number;
  receivedChunks?: number;
}

/**
 * WebRTC File Sharing component
 * Allows users to share files directly between browsers
 */
const WebRtcFileSharing: React.FC = () => {
  // WebRTC context
  const {
    isConnected,
    isConnecting,
    error,
    localPeerId,
    connectedPeers,
    sendString,
    sendBinary,
    onMessage,
    offMessage,
  } = useWebRtc();

  // State
  const [transfers, setTransfers] = useState<FileTransfer[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPeer, setSelectedPeer] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [peerName, setPeerName] = useState<string>(`User-${Math.floor(Math.random() * 10000)}`);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Constants
  const CHUNK_SIZE = 16384; // 16KB chunks

  // Handle incoming messages
  useEffect(() => {
    const handleMessage = (peerId: string, data: any) => {
      try {
        // Check if it's binary data (file chunk)
        if (data instanceof ArrayBuffer) {
          handleFileChunk(peerId, data);
          return;
        }
        
        // Parse the message
        const message = typeof data === 'string' ? JSON.parse(data) : data;
        
        // Handle different message types
        switch (message.type) {
          case 'file_request':
            handleFileRequest(peerId, message);
            break;
          case 'file_response':
            handleFileResponse(peerId, message);
            break;
          case 'file_chunk':
            // This is just metadata, actual chunk is sent as binary
            break;
          case 'file_complete':
            handleFileComplete(peerId, message);
            break;
          case 'file_cancel':
            handleFileCancel(peerId, message);
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
  }, [onMessage, offMessage, transfers]);

  // Handle file request
  const handleFileRequest = (peerId: string, message: any) => {
    const { transferId, fileName, fileSize, fileType, peerName } = message;
    
    // Check if we already have this transfer
    if (transfers.some((t) => t.id === transferId)) return;
    
    // Create a new transfer
    const newTransfer: FileTransfer = {
      id: transferId,
      peerId,
      peerName,
      fileName,
      fileSize,
      fileType,
      progress: 0,
      status: 'pending',
      direction: 'incoming',
      timestamp: new Date().toISOString(),
      chunks: [],
      chunkSize: CHUNK_SIZE,
      totalChunks: Math.ceil(fileSize / CHUNK_SIZE),
      receivedChunks: 0,
    };
    
    setTransfers((prev) => [...prev, newTransfer]);
    setStatusMessage(`Incoming file request: ${fileName} (${formatBytes(fileSize)}) from ${peerName}`);
  };

  // Handle file response
  const handleFileResponse = (peerId: string, message: any) => {
    const { transferId, accepted } = message;
    
    // Find the transfer
    const transferIndex = transfers.findIndex((t) => t.id === transferId);
    if (transferIndex === -1) return;
    
    const transfer = transfers[transferIndex];
    
    if (accepted) {
      // Start sending the file
      setStatusMessage(`${transfer.peerName} accepted the file transfer`);
      
      // Update the transfer status
      const updatedTransfers = [...transfers];
      updatedTransfers[transferIndex] = {
        ...transfer,
        status: 'transferring',
      };
      
      setTransfers(updatedTransfers);
      
      // Start sending chunks
      sendFileChunks(transfer);
    } else {
      // Update the transfer status
      const updatedTransfers = [...transfers];
      updatedTransfers[transferIndex] = {
        ...transfer,
        status: 'canceled',
      };
      
      setTransfers(updatedTransfers);
      setStatusMessage(`${transfer.peerName} rejected the file transfer`);
    }
  };

  // Handle file chunk
  const handleFileChunk = (peerId: string, data: ArrayBuffer) => {
    // Find the transfer
    const transferIndex = transfers.findIndex((t) => t.peerId === peerId && t.direction === 'incoming' && t.status === 'transferring');
    if (transferIndex === -1) return;
    
    const transfer = transfers[transferIndex];
    
    // Add the chunk
    const updatedTransfers = [...transfers];
    updatedTransfers[transferIndex].chunks?.push(data);
    updatedTransfers[transferIndex].receivedChunks = (transfer.receivedChunks || 0) + 1;
    updatedTransfers[transferIndex].progress = Math.round(((transfer.receivedChunks || 0) + 1) / (transfer.totalChunks || 1) * 100);
    
    setTransfers(updatedTransfers);
    
    // Check if the transfer is complete
    if ((transfer.receivedChunks || 0) + 1 >= (transfer.totalChunks || 0)) {
      // Combine the chunks
      const fileData = new Blob(updatedTransfers[transferIndex].chunks || [], { type: transfer.fileType });
      
      // Create a download link
      const url = URL.createObjectURL(fileData);
      const a = document.createElement('a');
      a.href = url;
      a.download = transfer.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Update the transfer status
      updatedTransfers[transferIndex].status = 'completed';
      setTransfers(updatedTransfers);
      
      // Send completion message
      const message = {
        type: 'file_complete',
        transferId: transfer.id,
      };
      
      sendString(peerId, JSON.stringify(message));
      setStatusMessage(`File transfer complete: ${transfer.fileName}`);
    }
  };

  // Handle file complete
  const handleFileComplete = (peerId: string, message: any) => {
    const { transferId } = message;
    
    // Find the transfer
    const transferIndex = transfers.findIndex((t) => t.id === transferId);
    if (transferIndex === -1) return;
    
    // Update the transfer status
    const updatedTransfers = [...transfers];
    updatedTransfers[transferIndex].status = 'completed';
    updatedTransfers[transferIndex].progress = 100;
    
    setTransfers(updatedTransfers);
    setStatusMessage(`File transfer complete: ${updatedTransfers[transferIndex].fileName}`);
  };

  // Handle file cancel
  const handleFileCancel = (peerId: string, message: any) => {
    const { transferId } = message;
    
    // Find the transfer
    const transferIndex = transfers.findIndex((t) => t.id === transferId);
    if (transferIndex === -1) return;
    
    // Update the transfer status
    const updatedTransfers = [...transfers];
    updatedTransfers[transferIndex].status = 'canceled';
    
    setTransfers(updatedTransfers);
    setStatusMessage(`File transfer canceled: ${updatedTransfers[transferIndex].fileName}`);
  };

  // Send file chunks
  const sendFileChunks = async (transfer: FileTransfer) => {
    if (!transfer.file) return;
    
    const fileReader = new FileReader();
    let offset = 0;
    
    fileReader.onload = (e) => {
      if (!e.target?.result || !(e.target.result instanceof ArrayBuffer)) return;
      
      // Send the chunk
      sendBinary(transfer.peerId, e.target.result);
      
      // Update progress
      const chunkIndex = Math.floor(offset / CHUNK_SIZE);
      const progress = Math.round((chunkIndex + 1) / (transfer.totalChunks || 1) * 100);
      
      setTransfers((prev) => 
        prev.map((t) => 
          t.id === transfer.id 
            ? { ...t, progress } 
            : t
        )
      );
      
      // Continue with the next chunk
      offset += CHUNK_SIZE;
      if (offset < transfer.fileSize) {
        readNextChunk();
      } else {
        // All chunks sent
        setStatusMessage(`All chunks sent for ${transfer.fileName}`);
      }
    };
    
    const readNextChunk = () => {
      const slice = transfer.file?.slice(offset, offset + CHUNK_SIZE);
      if (slice) {
        fileReader.readAsArrayBuffer(slice);
      }
    };
    
    // Start reading chunks
    readNextChunk();
  };

  // Send a file
  const sendFile = () => {
    if (!selectedFile || !selectedPeer) {
      setStatusMessage('Please select a file and a peer');
      return;
    }
    
    // Create a transfer ID
    const transferId = `transfer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Create a new transfer
    const newTransfer: FileTransfer = {
      id: transferId,
      peerId: selectedPeer,
      peerName: connectedPeers.includes(selectedPeer) ? selectedPeer : 'Unknown',
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      fileType: selectedFile.type,
      progress: 0,
      status: 'pending',
      direction: 'outgoing',
      timestamp: new Date().toISOString(),
      file: selectedFile,
      chunkSize: CHUNK_SIZE,
      totalChunks: Math.ceil(selectedFile.size / CHUNK_SIZE),
    };
    
    setTransfers((prev) => [...prev, newTransfer]);
    
    // Send file request
    const message = {
      type: 'file_request',
      transferId,
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      fileType: selectedFile.type,
      peerName,
    };
    
    sendString(selectedPeer, JSON.stringify(message));
    setStatusMessage(`File request sent: ${selectedFile.name} (${formatBytes(selectedFile.size)})`);
    
    // Reset the file input
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Accept a file transfer
  const acceptTransfer = (transferId: string) => {
    // Find the transfer
    const transferIndex = transfers.findIndex((t) => t.id === transferId);
    if (transferIndex === -1) return;
    
    const transfer = transfers[transferIndex];
    
    // Update the transfer status
    const updatedTransfers = [...transfers];
    updatedTransfers[transferIndex].status = 'transferring';
    
    setTransfers(updatedTransfers);
    
    // Send acceptance message
    const message = {
      type: 'file_response',
      transferId,
      accepted: true,
    };
    
    sendString(transfer.peerId, JSON.stringify(message));
    setStatusMessage(`Accepted file transfer: ${transfer.fileName}`);
  };

  // Reject a file transfer
  const rejectTransfer = (transferId: string) => {
    // Find the transfer
    const transferIndex = transfers.findIndex((t) => t.id === transferId);
    if (transferIndex === -1) return;
    
    const transfer = transfers[transferIndex];
    
    // Update the transfer status
    const updatedTransfers = [...transfers];
    updatedTransfers[transferIndex].status = 'canceled';
    
    setTransfers(updatedTransfers);
    
    // Send rejection message
    const message = {
      type: 'file_response',
      transferId,
      accepted: false,
    };
    
    sendString(transfer.peerId, JSON.stringify(message));
    setStatusMessage(`Rejected file transfer: ${transfer.fileName}`);
  };

  // Cancel a file transfer
  const cancelTransfer = (transferId: string) => {
    // Find the transfer
    const transferIndex = transfers.findIndex((t) => t.id === transferId);
    if (transferIndex === -1) return;
    
    const transfer = transfers[transferIndex];
    
    // Update the transfer status
    const updatedTransfers = [...transfers];
    updatedTransfers[transferIndex].status = 'canceled';
    
    setTransfers(updatedTransfers);
    
    // Send cancellation message
    const message = {
      type: 'file_cancel',
      transferId,
    };
    
    sendString(transfer.peerId, JSON.stringify(message));
    setStatusMessage(`Canceled file transfer: ${transfer.fileName}`);
  };

  // Format bytes to human-readable format
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return '#f9c74f';
      case 'transferring':
        return '#4cc9f0';
      case 'completed':
        return '#90be6d';
      case 'failed':
        return '#f94144';
      case 'canceled':
        return '#f8961e';
      default:
        return '#ccc';
    }
  };

  return (
    <div style={{
      backgroundColor: '#1a1a2e',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
    }}>
      <h2>File Sharing</h2>
      
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
      
      {/* Send file form */}
      <div style={{
        backgroundColor: '#16213e',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <h3>Send File</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Select File</label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
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
        
        <button
          onClick={sendFile}
          disabled={!selectedFile || !selectedPeer}
          style={{
            padding: '10px 20px',
            backgroundColor: selectedFile && selectedPeer ? '#4cc9f0' : '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedFile && selectedPeer ? 'pointer' : 'not-allowed',
            width: '100%',
          }}
        >
          Send File
        </button>
      </div>
      
      {/* File transfers */}
      <div>
        <h3>File Transfers</h3>
        {transfers.length === 0 ? (
          <p>No file transfers</p>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {transfers.map((transfer) => (
              <div
                key={transfer.id}
                style={{
                  backgroundColor: '#16213e',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{transfer.fileName}</div>
                    <div style={{ fontSize: '12px', color: '#ccc' }}>
                      {formatBytes(transfer.fileSize)} • {transfer.fileType || 'Unknown type'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#ccc' }}>
                      {transfer.direction === 'incoming' ? `From: ${transfer.peerName}` : `To: ${transfer.peerName}`}
                    </div>
                    <div style={{ fontSize: '12px', color: '#ccc' }}>
                      {formatTimestamp(transfer.timestamp)}
                    </div>
                  </div>
                  <div>
                    <div style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: getStatusColor(transfer.status),
                      color: 'white',
                      fontSize: '12px',
                    }}>
                      {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                    </div>
                  </div>
                </div>
                
                {/* Progress bar */}
                {transfer.status === 'transferring' && (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#333',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${transfer.progress}%`,
                        height: '100%',
                        backgroundColor: '#4cc9f0',
                      }}></div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#ccc', textAlign: 'center', marginTop: '5px' }}>
                      {transfer.progress}%
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  {transfer.direction === 'incoming' && transfer.status === 'pending' && (
                    <>
                      <button
                        onClick={() => acceptTransfer(transfer.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#90be6d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => rejectTransfer(transfer.id)}
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
                    </>
                  )}
                  
                  {transfer.status === 'transferring' && (
                    <button
                      onClick={() => cancelTransfer(transfer.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f8961e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebRtcFileSharing;