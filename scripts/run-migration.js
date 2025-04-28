#!/usr/bin/env node

/**
 * Database Migration Runner
 * 
 * This script runs SQL migration files against the database.
 * 
 * Usage:
 *   node run-migration.js path/to/migration.sql
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { execSync } = require('child_process');

// Load database configuration
const configPath = path.join(process.cwd(), 'config', 'database.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Determine environment
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

if (!dbConfig) {
  console.error(`Database configuration for environment "${env}" not found`);
  process.exit(1);
}

// Get migration file path from command line arguments
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Migration file path is required');
  console.error('Usage: node run-migration.js path/to/migration.sql');
  process.exit(1);
}

const migrationPath = path.resolve(process.cwd(), migrationFile);

if (!fs.existsSync(migrationPath)) {
  console.error(`Migration file not found: ${migrationPath}`);
  process.exit(1);
}

// Read migration file
const migration = fs.readFileSync(migrationPath, 'utf8');

// Create database connection
const pool = new Pool({
  host: process.env.DB_HOST || dbConfig.host,
  port: parseInt(process.env.DB_PORT || dbConfig.port),
  database: process.env.DB_NAME || dbConfig.database,
  user: process.env.DB_USER || dbConfig.user,
  password: process.env.DB_PASSWORD || dbConfig.password,
  ssl: dbConfig.ssl ? { rejectUnauthorized: false } : false,
});

// Run migration
async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log(`Running migration: ${migrationPath}`);
    
    // Start transaction
    await client.query('BEGIN');
    
    // Run migration
    await client.query(migration);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Migration completed successfully');
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    // Release client
    client.release();
    
    // Close pool
    await pool.end();
  }
}

// Alternative: Use psql command line tool if available
function runMigrationWithPsql() {
  try {
    console.log(`Running migration with psql: ${migrationPath}`);
    
    // Build psql command
    const command = `PGPASSWORD=${dbConfig.password} psql -h ${dbConfig.host} -p ${dbConfig.port} -d ${dbConfig.database} -U ${dbConfig.user} -f ${migrationPath}`;
    
    // Execute command
    execSync(command, { stdio: 'inherit' });
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

// Check if psql is available
function isPsqlAvailable() {
  try {
    execSync('which psql', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Run migration
if (isPsqlAvailable()) {
  runMigrationWithPsql();
} else {
  runMigration().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}