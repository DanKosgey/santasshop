import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Set document title from environment variable
const appName = import.meta.env.VITE_APP_NAME || 'Maichez Trades';
document.title = appName;
document.getElementById('appTitle')?.setAttribute('content', appName);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);