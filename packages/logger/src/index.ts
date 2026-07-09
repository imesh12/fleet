import pino, { type LoggerOptions, type Logger as PinoLogger } from 'pino';

export type Logger = PinoLogger;

export function createLogger(options?: LoggerOptions): Logger {
  return pino({
    level: process.env.APP_LOG_LEVEL ?? 'info',
    base: null,
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [
        'req.headers.authorization',
        'request.headers.authorization',
        'password',
        'accessToken',
        'refreshToken',
        'token',
      ],
      censor: '[REDACTED]',
    },
    ...options,
  } as LoggerOptions);
}
