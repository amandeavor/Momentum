type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDev = process.env.NODE_ENV !== 'production';

  private sanitize(data: any, seen = new WeakSet()): any {
    if (!data || typeof data !== 'object') return data;
    if (data instanceof Date) return data.toISOString();
    if (data instanceof Error) return this.isDev ? data : { name: data.name, message: data.message };
    if (seen.has(data)) return '[Circular]';

    seen.add(data);

    if (Array.isArray(data)) return data.map(i => this.sanitize(i, seen));

    const sanitized: Record<string, any> = {};
    for (const key in data) {
      if (/password|secret|token|key|auth/i.test(key)) sanitized[key] = '[REDACTED]';
      else sanitized[key] = this.sanitize(data[key], seen);
    }
    return sanitized;
  }

  private print(level: LogLevel, msg: string, ...args: any[]) {
    if (!this.isDev && level !== 'error') return;

    // In dev, we want the raw objects for better console inspection
    // In prod, we sanitize everything
    const finalArgs = this.isDev ? args : args.map(arg => this.sanitize(arg));
    const prefix = `[${level.toUpperCase()}]:`;

    switch (level) {
      case 'debug': console.debug(prefix, msg, ...finalArgs); break;
      case 'info': console.log(prefix, msg, ...finalArgs); break;
      case 'warn': console.warn(prefix, msg, ...finalArgs); break;
      case 'error': console.error(prefix, msg, ...finalArgs); break;
    }
  }

  debug = (msg: string, ...args: any[]) => this.print('debug', msg, ...args);
  info = (msg: string, ...args: any[]) => this.print('info', msg, ...args);
  warn = (msg: string, ...args: any[]) => this.print('warn', msg, ...args);
  error = (msg: string, error?: any, ...args: any[]) => this.print('error', msg, error, ...args);
}

export const logger = new Logger();
