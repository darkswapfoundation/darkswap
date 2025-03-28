import React from 'react';
import { useNotification } from '../contexts/NotificationContext';

const NotificationTest: React.FC = () => {
  const { addNotification } = useNotification();

  const showSuccessNotification = () => {
    addNotification('success', 'This is a success notification');
  };

  const showErrorNotification = () => {
    addNotification('error', 'This is an error notification');
  };

  const showWarningNotification = () => {
    addNotification('warning', 'This is a warning notification');
  };

  const showInfoNotification = () => {
    addNotification('info', 'This is an info notification');
  };

  return (
    <div className="card p-4">
      <h3 className="text-lg font-medium mb-4">Notification Test</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={showSuccessNotification}
          className="btn btn-sm bg-ui-success text-white"
        >
          Success
        </button>
        <button
          onClick={showErrorNotification}
          className="btn btn-sm bg-ui-error text-white"
        >
          Error
        </button>
        <button
          onClick={showWarningNotification}
          className="btn btn-sm bg-ui-warning text-white"
        >
          Warning
        </button>
        <button
          onClick={showInfoNotification}
          className="btn btn-sm bg-ui-info text-white"
        >
          Info
        </button>
      </div>
    </div>
  );
};

export default NotificationTest;