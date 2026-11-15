/**
 * Security Logger Utility
 * Sanitizes errors to remove sensitive info like secrets or PII in production.
 */

const isDev = process.env.NODE_ENV === 'development' || __DEV__;

function sanitizeError(error: any): any {
  if (!error || typeof error === 'string') return error;

  // Supabase/Postgres errors
  if (error.code && error.message) {
    return {
      message: error.message,
      code: error.code,
      details: isDev ? error.details : undefined, // Potential schema leak
    };
  }

  // Generic errors
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: isDev ? error.stack : undefined, // Stack trace leak
    };
  }

  // Strip common sensitive keys from objects
  try {
    const sanitized = { ...error };
    ['password', 'token', 'secret', 'key', 'Authorization'].forEach(k => delete sanitized[k]);
    return sanitized;
  } catch {
    return 'Unknown error';
  }
}

export const logger = {
  error: (msg: string, err?: any) => {
    console.error(msg, isDev ? err : sanitizeError(err));
  },
  warn: (msg: string, data?: any) => {
    console.warn(msg, isDev ? data : (data ? '(data hidden)' : ''));
  },
  info: (msg: string, data?: any) => {
    if (isDev) console.log(msg, data);
  }
};
