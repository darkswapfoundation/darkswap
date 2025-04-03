import React, { useState } from 'react';
import { useNotifications, NotificationType } from '../contexts/NotificationContext';

/**
 * Notification test component
 * @returns Notification test component
 */
export const NotificationTest: React.FC = () => {
  const { addNotification } = useNotifications();
  const [message, setMessage] = useState('This is a test notification');
  const [type, setType] = useState<NotificationType>('info');
  const [duration, setDuration] = useState(5000);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addNotification(type, message, duration);
  };

  return (
    <div className="notification-test">
      <h2>Test Notifications</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="message">Message:</label>
          <input
            id="message"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="type">Type:</label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as NotificationType)}
          >
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="duration">Duration (ms):</label>
          <input
            id="duration"
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            min="1000"
            step="1000"
          />
        </div>
        
        <button type="submit">Show Notification</button>
      </form>
      
      <div className="quick-buttons">
        <button onClick={() => addNotification('info', 'This is an info notification')}>
          Info
        </button>
        <button onClick={() => addNotification('success', 'This is a success notification')}>
          Success
        </button>
        <button onClick={() => addNotification('warning', 'This is a warning notification')}>
          Warning
        </button>
        <button onClick={() => addNotification('error', 'This is an error notification')}>
          Error
        </button>
      </div>
      
      <style>
        {`
          .notification-test {
            background-color: #fff;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            max-width: 500px;
            margin: 0 auto;
          }
          
          .notification-test h2 {
            margin-top: 0;
            margin-bottom: 20px;
            color: #333;
            font-size: 1.5rem;
          }
          
          .form-group {
            margin-bottom: 15px;
          }
          
          .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: #555;
          }
          
          .form-group input,
          .form-group select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
          }
          
          button {
            background-color: #007bff;
            color: #fff;
            border: none;
            border-radius: 4px;
            padding: 10px 15px;
            font-size: 1rem;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          
          button:hover {
            background-color: #0069d9;
          }
          
          .quick-buttons {
            margin-top: 20px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }
          
          .quick-buttons button {
            flex: 1;
          }
          
          .quick-buttons button:nth-child(1) {
            background-color: #17a2b8;
          }
          
          .quick-buttons button:nth-child(1):hover {
            background-color: #138496;
          }
          
          .quick-buttons button:nth-child(2) {
            background-color: #28a745;
          }
          
          .quick-buttons button:nth-child(2):hover {
            background-color: #218838;
          }
          
          .quick-buttons button:nth-child(3) {
            background-color: #ffc107;
            color: #212529;
          }
          
          .quick-buttons button:nth-child(3):hover {
            background-color: #e0a800;
          }
          
          .quick-buttons button:nth-child(4) {
            background-color: #dc3545;
          }
          
          .quick-buttons button:nth-child(4):hover {
            background-color: #c82333;
          }
        `}
      </style>
    </div>
  );
};

export default NotificationTest;