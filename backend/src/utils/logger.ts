type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'password_hash',
  'token',
  'authorization',
  'jwt',
  'secret',
  'apikey',
  'api_key',
  'mistral_api_key'
]);

function sanitize(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      cleaned[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      cleaned[key] = sanitize(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

class StructuredLogger {
  private formatLog(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...(context ? { context: sanitize(context) } : {})
    };
    return JSON.stringify(entry);
  }

  info(message: string, context?: Record<string, any>) {
    console.log(this.formatLog('info', message, context));
  }

  warn(message: string, context?: Record<string, any>) {
    console.warn(this.formatLog('warn', message, context));
  }

  error(message: string, context?: Record<string, any>) {
    console.error(this.formatLog('error', message, context));
  }

  debug(message: string, context?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatLog('debug', message, context));
    }
  }

  logAIEvaluation(details: {
    sessionId: string;
    userId: string;
    model: string;
    latencyMs: number;
    intent: string;
    readyToBook: boolean;
    extractedFields: Record<string, any>;
    success: boolean;
    error?: string;
  }) {
    this.info('AI Interaction Processed', {
      event: 'AI_EVALUATION',
      ...details
    });
  }
}

export const logger = new StructuredLogger();
export default logger;
