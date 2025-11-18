// Production-safe logger that prevents sensitive data leakage

type LogLevel = 'info' | 'warn' | 'error';

const isDevelopment = import.meta.env.DEV;

export const logger = {
  info: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, data);
    }
  },

  warn: (message: string, data?: any) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, data);
    }
  },

  error: (message: string, error?: any) => {
    // Always log errors, but sanitize in production
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, error);
    } else {
      console.error(`[ERROR] ${message}`);
    }
  }
};
