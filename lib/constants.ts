/**
 * Application Configuration Constants
 * Central place to manage app-wide settings
 */

// App name - easily configurable from .env
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Forex Royal';

// App variations for different contexts
export const APP_DISPLAY_NAMES = {
  full: APP_NAME, // 'Forex Royal'
  short: APP_NAME.split(' ')[0], // 'Forex'
  adminPortal: 'Admin Portal',
};

// App descriptions and messages
export const APP_MESSAGES = {
  signupCommunity: `Join the ${APP_NAME} Community`,
  loginTerminal: `Access the ${APP_NAME} Terminal`,
  liveRoom: `${APP_NAME} Live Room`,
  copyright: `© 2025 ${APP_NAME}. All rights reserved. Trading involves substantial risk.`,
};

// Admin contact details
export const ADMIN_WHATSAPP = '12089695688';   // +1 (208) 969-5688
export const ADMIN_TELEGRAM_URL = 'https://t.me/SIRLEONARD1';
export const ADMIN_TELEGRAM_USERNAME = 'SIRLEONARD1';
