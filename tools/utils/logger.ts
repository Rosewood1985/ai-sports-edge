/**
 * Logger Utility
 * 
 * Provides standardized logging functionality for the CLI tools.
 */

import chalk from 'chalk';

/**
 * Logger class for standardized console output
 */
class Logger {
  /**
   * Log an informational message
   * @param message The message to log
   */
  info(message: string): void {
    console.log(chalk.blue('ℹ️ INFO:'), message);
  }

  /**
   * Log a success message
   * @param message The message to log
   */
  success(message: string): void {
    console.log(chalk.green('✅ SUCCESS:'), message);
  }

  /**
   * Log a warning message
   * @param message The message to log
   */
  warn(message: string): void {
    console.log(chalk.yellow('⚠️ WARNING:'), message);
  }

  /**
   * Log an error message
   * @param message The message to log
   * @param error Optional error object
   */
  error(message: string, error?: unknown): void {
    console.error(chalk.red('❌ ERROR:'), message);
    
    if (error) {
      if (error instanceof Error) {
        console.error(chalk.red('  Details:'), error.message);
        if (error.stack) {
          console.error(chalk.red('  Stack:'), error.stack);
        }
      } else {
        console.error(chalk.red('  Details:'), error);
      }
    }
  }

  /**
   * Log a debug message (only in development)
   * @param message The message to log
   * @param data Optional data to log
   */
  debug(message: string, data?: unknown): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(chalk.magenta('🔍 DEBUG:'), message);
      if (data) {
        console.log(data);
      }
    }
  }

  /**
   * Log a section header
   * @param title The section title
   */
  section(title: string): void {
    console.log('\n' + chalk.cyan.bold('▶️ ' + title.toUpperCase()));
    console.log(chalk.cyan('━'.repeat(title.length + 4)));
  }

  /**
   * Log a table of data
   * @param data Array of objects to display in table format
   */
  table(data: Record<string, any>[]): void {
    console.table(data);
  }
}

// Export a singleton instance
export const logger = new Logger();