import React from 'react';

// Custom lightweight Toast helper replacing shadcn toast
export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

export const toast = (options: ToastOptions | string) => {
  const message = typeof options === 'string' 
    ? options 
    : `${options.title ? options.title + ': ' : ''}${options.description || ''}`;
  
  if (typeof options === 'object' && options.variant === 'destructive') {
    console.error('[Toast Error]', message);
    alert(`❌ ${message}`);
  } else {
    console.log('[Toast]', message);
    alert(`ℹ️ ${message}`);
  }
};
