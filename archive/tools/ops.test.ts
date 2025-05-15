/**
 * Tests for the ops.ts CLI tool
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Mock the execSync function
jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

// Mock the fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  statSync: jest.fn(),
  chmodSync: jest.fn(),
}));

// Mock the logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    success: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    section: jest.fn(),
    table: jest.fn(),
  },
}));

// Mock the environment utility
jest.mock('../utils/environment', () => ({
  validateEnvironment: jest.fn(),
  getProjectRoot: jest.fn().mockReturnValue('/workspaces/ai-sports-edge'),
  isProjectRoot: jest.fn().mockReturnValue(true),
  getEnvironmentInfo: jest.fn().mockReturnValue({
    nodeVersion: 'v14.17.0',
    platform: 'linux',
    cwd: '/workspaces/ai-sports-edge',
    isProjectRoot: true,
    gitBranch: 'main',
    gitCommit: '1234567890abcdef',
  }),
}));

// Mock the status utility
jest.mock('../utils/status', () => ({
  updateStatus: jest.fn(),
  updateFirebaseMigrationProgress: jest.fn(),
  getFirebaseMigrationProgress: jest.fn().mockReturnValue({
    completed: 5,
    total: 10,
    percentage: 50,
  }),
}));

// Import the mocked modules
import { logger } from '../utils/logger';
import { validateEnvironment } from '../utils/environment';
import { updateStatus } from '../utils/status';

// Helper function to run a command
const runCommand = (command: string, args: string[] = []): void => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Save the original process.argv
  const originalArgv = process.argv;
  
  try {
    // Set process.argv to the command and args
    process.argv = ['node', 'ops.ts', command, ...args];
    
    // Run the command
    jest.isolateModules(() => {
      require('../ops');
    });
  } finally {
    // Restore the original process.argv
    process.argv = originalArgv;
  }
};

describe('ops CLI', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });
  
  describe('firebase:migrate command', () => {
    it('should run the complete migration process when no file is specified', () => {
      // Mock the execSync function
      (execSync as jest.Mock).mockImplementation(() => {});
      
      // Run the command
      runCommand('firebase:migrate');
      
      // Verify that validateEnvironment was called
      expect(validateEnvironment).toHaveBeenCalled();
      
      // Verify that execSync was called with the correct command
      expect(execSync).toHaveBeenCalledWith(
        'bash scripts/run-complete-migration.sh  ',
        { stdio: 'inherit' }
      );
      
      // Verify that updateStatus was called with the correct arguments
      expect(updateStatus).toHaveBeenCalledWith(
        'firebase-migration',
        'success',
        'Firebase migration completed successfully'
      );
      
      // Verify that logger.success was called with the correct message
      expect(logger.success).toHaveBeenCalledWith(
        'Firebase migration completed successfully'
      );
    });
    
    it('should migrate a single file when specified', () => {
      // Mock the execSync function
      (execSync as jest.Mock).mockImplementation(() => {});
      
      // Run the command
      runCommand('firebase:migrate', ['--file', 'services/firebaseService.ts']);
      
      // Verify that validateEnvironment was called
      expect(validateEnvironment).toHaveBeenCalled();
      
      // Verify that execSync was called with the correct command
      expect(execSync).toHaveBeenCalledWith(
        'bash scripts/migrate-and-update.sh services/firebaseService.ts',
        { stdio: 'inherit' }
      );
      
      // Verify that updateStatus was called with the correct arguments
      expect(updateStatus).toHaveBeenCalledWith(
        'firebase-migration',
        'success',
        'Firebase migration completed successfully'
      );
      
      // Verify that logger.success was called with the correct message
      expect(logger.success).toHaveBeenCalledWith(
        'Firebase migration completed successfully'
      );
    });
    
    it('should handle errors during migration', () => {
      // Mock the execSync function to throw an error
      (execSync as jest.Mock).mockImplementation(() => {
        throw new Error('Migration failed');
      });
      
      // Mock the process.exit function
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
        throw new Error(`Process exited with code ${code}`);
      });
      
      // Run the command and expect it to throw an error
      expect(() => {
        runCommand('firebase:migrate');
      }).toThrow('Process exited with code 1');
      
      // Verify that validateEnvironment was called
      expect(validateEnvironment).toHaveBeenCalled();
      
      // Verify that execSync was called with the correct command
      expect(execSync).toHaveBeenCalledWith(
        'bash scripts/run-complete-migration.sh  ',
        { stdio: 'inherit' }
      );
      
      // Verify that updateStatus was called with the correct arguments
      expect(updateStatus).toHaveBeenCalledWith(
        'firebase-migration',
        'error',
        'Firebase migration failed: Migration failed'
      );
      
      // Verify that logger.error was called with the correct message
      expect(logger.error).toHaveBeenCalledWith(
        'Firebase migration failed',
        expect.any(Error)
      );
      
      // Verify that process.exit was called with the correct code
      expect(mockExit).toHaveBeenCalledWith(1);
      
      // Restore the process.exit function
      mockExit.mockRestore();
    });
  });
  
  describe('scripts:consolidate command', () => {
    it('should run the basic consolidation process', () => {
      // Mock the execSync function
      (execSync as jest.Mock).mockImplementation(() => {});
      
      // Run the command
      runCommand('scripts:consolidate');
      
      // Verify that execSync was called with the correct command
      expect(execSync).toHaveBeenCalledWith(
        'bash scripts/consolidate-scripts.sh  ',
        { stdio: 'inherit' }
      );
      
      // Verify that logger.success was called with the correct message
      expect(logger.success).toHaveBeenCalledWith(
        'Basic script consolidation completed'
      );
    });
    
    it('should run the comprehensive consolidation process when specified', () => {
      // Mock the execSync function
      (execSync as jest.Mock).mockImplementation(() => {});
      
      // Run the command
      runCommand('scripts:consolidate', ['--comprehensive']);
      
      // Verify that execSync was called with the correct command
      expect(execSync).toHaveBeenCalledWith(
        'bash scripts/consolidate-scripts.sh  --comprehensive',
        { stdio: 'inherit' }
      );
      
      // Verify that logger.success was called with the correct message
      expect(logger.success).toHaveBeenCalledWith(
        'Comprehensive script consolidation completed'
      );
    });
  });
  
  // Add more tests for other commands as needed
});