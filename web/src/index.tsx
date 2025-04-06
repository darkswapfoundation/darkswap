/**
 * DarkSwap Web Application Entry Point
 * 
 * This file is the entry point for the DarkSwap web application.
 * It renders the App component into the root DOM element.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

// Create root and render app
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);