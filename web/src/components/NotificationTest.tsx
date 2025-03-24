import React from 'react';
import { useNotification } from '../contexts/NotificationContext';

const NotificationTest: React.FC = () => {
  const { addNotification } = useNotification();

  const handleSuccessClick = () => {
    addNotification('success', 'This is a success notification');
  };

  const handleErrorClick = () => {
    addNotification('error', 'This is an error notification');
  };

  const handleInfoClick = () => {
    addNotification('info', 'This is an info notification');
  };

  const handleWarningClick = () => {
    addNotification('warning', 'This is a warning notification');
  };

  return (
    <div className="card p-4">
      <h2 className="text-lg font-display font-medium mb-4">Notification Test</h2>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleSuccessClick}
          className="btn btn-sm bg-green-500 hover:bg-green-600"
        >
          Success
        </button>
        <button
          onClick={handleErrorClick}
          className="btn btn-sm bg-red-500 hover:bg-red-600"
        >
          Error
        </button>
        <button
          onClick={handleInfoClick}
          className="btn btn-sm bg-blue-500 hover:bg-blue-600"
        >
          Info
        </button>
        <button
          onClick={handleWarningClick}
          className="btn btn-sm bg-yellow-500 hover:bg-yellow-600"
        >
          Warning
        </button>
      </div>
    </div>
  );
};

export default NotificationTest;