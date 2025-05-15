/**
 * Simple logger module for JavaScript
 */

const logger = {
  info: (message) => {
    console.log(`[INFO] ${message}`);
  },
  success: (message) => {
    console.log(`[SUCCESS] ${message}`);
  },
  warn: (message) => {
    console.warn(`[WARNING] ${message}`);
  },
  error: (message, error) => {
    console.error(`[ERROR] ${message}`, error || '');
  },
  debug: (message) => {
    console.log(`[DEBUG] ${message}`);
  },
  section: (title) => {
    console.log(`\n=== ${title} ===\n`);
  },
  table: (data) => {
    console.table(data);
  }
};

module.exports = { logger };