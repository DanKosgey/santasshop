/**
 * Application Configuration Constants
 * Central place to manage app-wide settings
 */

// App name - easily configurable from .env
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Maichez Trades';

// App variations for different contexts
export const APP_DISPLAY_NAMES = {
  full: APP_NAME, // 'Maichez Trades'
  short: APP_NAME.split(' ')[0], // 'Maichez'
  adminPortal: 'Admin Portal',
};

// App descriptions and messages
export const APP_MESSAGES = {
  signupCommunity: `Join the ${APP_NAME} Community`,
  loginTerminal: `Access the ${APP_NAME} Terminal`,
  liveRoom: `${APP_NAME} Live Room`,
  copyright: `© 2025 ${APP_NAME}. All rights reserved. Trading involves substantial risk.`,
};
