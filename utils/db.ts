/**
 * Database Utility
 * 
 * Provides a connection to the PostgreSQL database using the configuration
 * from config/database.json.
 */

import { Pool, PoolClient } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import logger from './logger';

// Load database configuration
const configPath = path.join(process.cwd(), 'config', 'database.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Determine environment
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

if (!dbConfig) {
  throw new Error(`Database configuration for environment "${env}" not found`);
}

// Create connection pool
const pool = new Pool({
  host: process.env.DB_HOST || dbConfig.host,
  port: parseInt(process.env.DB_PORT || dbConfig.port),
  database: process.env.DB_NAME || dbConfig.database,
  user: process.env.DB_USER || dbConfig.user,
  password: process.env.DB_PASSWORD || dbConfig.password,
  ssl: dbConfig.ssl ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection to become available
});

// Log connection status
pool.on('connect', () => {
  logger.debug('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('PostgreSQL pool error', { error: err.message });
});

/**
 * Execute a query with parameters
 * 
 * @param text - SQL query text
 * @param params - Query parameters
 * @returns Query result
 */
async function query(text: string, params: any[] = []) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug('Executed query', {
      query: text,
      duration,
      rows: result.rowCount,
    });
    
    return result;
  } catch (error) {
    logger.error('Query error', {
      query: text,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start,
    });
    throw error;
  }
}

/**
 * Get a client from the pool and execute a callback with it
 * 
 * @param callback - Function to execute with the client
 * @returns Result of the callback
 */
async function withClient<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    return await callback(client);
  } finally {
    client.release();
  }
}

/**
 * Execute a transaction with a callback
 * 
 * @param callback - Function to execute within the transaction
 * @returns Result of the callback
 */
async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  return withClient(async (client) => {
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
}

/**
 * Close the database connection pool
 */
async function close() {
  await pool.end();
  logger.info('Database connection pool closed');
}

export default {
  query,
  withClient,
  transaction,
  close,
  pool,
};