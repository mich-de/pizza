import { createLogger, format, transports } from 'winston';
import { NODE_ENV } from '../config.js';

export const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: NODE_ENV === 'production'
        ? format.combine(format.timestamp(), format.json())
        : format.combine(format.colorize(), format.simple()),
    }),
  ],
});
