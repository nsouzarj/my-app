import { toast as hotToast, Toaster } from 'react-hot-toast';

export const toast = {
  success: (message: string) => hotToast.success(message, {
    style: {
      background: 'var(--card-color)',
      color: 'var(--primary-color)',
      border: '1px solid var(--border-color)',
      borderRadius: '16px',
      fontSize: '14px',
      fontWeight: '600',
    },
    iconTheme: {
      primary: '#10b981',
      secondary: '#fff',
    },
  }),
  error: (message: string) => hotToast.error(message, {
    style: {
      background: 'var(--card-color)',
      color: 'var(--primary-color)',
      border: '1px solid var(--border-color)',
      borderRadius: '16px',
      fontSize: '14px',
      fontWeight: '600',
    },
  }),
  info: (message: string) => hotToast(message, {
    style: {
      background: 'var(--card-color)',
      color: 'var(--primary-color)',
      border: '1px solid var(--border-color)',
      borderRadius: '16px',
      fontSize: '14px',
      fontWeight: '600',
    },
  }),
};

export { Toaster };
