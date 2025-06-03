/**
 * Logger Utility
 *
 * A simple logging utility for consistent logging across the application.
 */

export interface Logger {
  debug(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
}

class ConsoleLogger implements Logger {
  debug(message: string, meta?: Record<string, any>): void {
    console.debug(`[DEBUG] ${message}`, meta || '');
  }

  info(message: string, meta?: Record<string, any>): void {
    console.info(`[INFO] ${message}`, meta || '');
  }

  warn(message: string, meta?: Record<string, any>): void {
    console.warn(`[WARN] ${message}`, meta || '');
  }

  error(message: string, meta?: Record<string, any>): void {
    console.error(`[ERROR] ${message}`, meta || '');
  }
}

// Create a singleton instance
const logger: Logger = new ConsoleLogger();

export default logger;
