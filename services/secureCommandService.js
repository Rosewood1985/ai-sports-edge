/**
 * Secure Command Execution Service
 * 
 * Provides secure command execution for OCR processing with comprehensive
 * protection against command injection attacks. Uses parameterized execution
 * and strict validation.
 */

const { spawn } = require('child_process');
const path = require('path');
const { promisify } = require('util');
const fs = require('fs').promises;

/**
 * Security configuration for command execution
 */
const COMMAND_SECURITY_CONFIG = {
  // Allowed commands (whitelist approach)
  ALLOWED_COMMANDS: {
    'tesseract': {
      path: '/usr/bin/tesseract',
      maxArgs: 20,
      allowedArgs: [
        'stdout', 'stdin', '-l', '--oem', '--psm', '-c', '--user-words',
        '--user-patterns', '--tessdata-dir'
      ],
      timeout: 30000, // 30 seconds
      maxOutputSize: 50 * 1024 * 1024 // 50MB
    },
    'convert': {
      path: '/usr/bin/convert',
      maxArgs: 30,
      allowedArgs: [
        '-resize', '-quality', '-compress', '-colorspace', '-format',
        '-density', '-blur', '-sharpen', '-contrast', '-normalize'
      ],
      timeout: 60000, // 60 seconds
      maxOutputSize: 100 * 1024 * 1024 // 100MB
    },
    'identify': {
      path: '/usr/bin/identify',
      maxArgs: 10,
      allowedArgs: [
        '-format', '-verbose', '-ping'
      ],
      timeout: 10000, // 10 seconds
      maxOutputSize: 1024 * 1024 // 1MB
    }
  },
  
  // Environment variables whitelist
  SAFE_ENV_VARS: [
    'PATH', 'HOME', 'USER', 'TESSDATA_PREFIX', 'LC_ALL', 'LANG'
  ],
  
  // Working directory restrictions
  ALLOWED_WORK_DIRS: [
    '/tmp/secure_uploads',
    '/tmp/ocr_processing'
  ]
};

/**
 * Custom command security error class
 */
class CommandSecurityError extends Error {
  constructor(message, code = 'COMMAND_SECURITY_VIOLATION') {
    super(message);
    this.name = 'CommandSecurityError';
    this.code = code;
  }
}

/**
 * Secure Command Execution Service
 */
class SecureCommandService {
  constructor() {
    this.activeProcesses = new Map();
    this.processCounter = 0;
  }

  /**
   * Executes a command securely with validation and sandboxing
   * @param {string} command - Command name (must be whitelisted)
   * @param {Array<string>} args - Command arguments
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Execution result
   */
  async executeSecureCommand(command, args = [], options = {}) {
    const processId = ++this.processCounter;
    
    try {
      // Step 1: Validate command
      const commandConfig = this.validateCommand(command);
      
      // Step 2: Validate and sanitize arguments
      const sanitizedArgs = this.validateAndSanitizeArgs(args, commandConfig);
      
      // Step 3: Prepare secure execution environment
      const execOptions = this.prepareSecureEnvironment(options, commandConfig);
      
      // Step 4: Execute command with monitoring
      const result = await this.executeWithMonitoring(
        commandConfig.path,
        sanitizedArgs,
        execOptions,
        processId
      );
      
      return {
        success: true,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        executionTime: result.executionTime,
        processId
      };
      
    } catch (error) {
      throw new CommandSecurityError(
        `Secure command execution failed: ${error.message}`,
        'EXECUTION_FAILED'
      );
    } finally {
      // Clean up process tracking
      this.activeProcesses.delete(processId);
    }
  }

  /**
   * Validates command against whitelist
   * @param {string} command - Command name
   * @returns {Object} Command configuration
   */
  validateCommand(command) {
    if (!command || typeof command !== 'string') {
      throw new CommandSecurityError('Invalid command name', 'INVALID_COMMAND');
    }
    
    const commandConfig = COMMAND_SECURITY_CONFIG.ALLOWED_COMMANDS[command];
    if (!commandConfig) {
      throw new CommandSecurityError(
        `Command not allowed: ${command}. Allowed commands: ${Object.keys(COMMAND_SECURITY_CONFIG.ALLOWED_COMMANDS).join(', ')}`,
        'COMMAND_NOT_ALLOWED'
      );
    }
    
    return commandConfig;
  }

  /**
   * Validates and sanitizes command arguments
   * @param {Array<string>} args - Command arguments
   * @param {Object} commandConfig - Command configuration
   * @returns {Array<string>} Sanitized arguments
   */
  validateAndSanitizeArgs(args, commandConfig) {
    if (!Array.isArray(args)) {
      throw new CommandSecurityError('Arguments must be an array', 'INVALID_ARGS_TYPE');
    }
    
    if (args.length > commandConfig.maxArgs) {
      throw new CommandSecurityError(
        `Too many arguments: ${args.length}. Maximum allowed: ${commandConfig.maxArgs}`,
        'TOO_MANY_ARGS'
      );
    }
    
    const sanitizedArgs = [];
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (typeof arg !== 'string') {
        throw new CommandSecurityError(`Argument ${i} must be a string`, 'INVALID_ARG_TYPE');
      }
      
      // Check for command injection attempts
      if (this.containsDangerousChars(arg)) {
        throw new CommandSecurityError(
          `Argument ${i} contains dangerous characters: ${arg}`,
          'DANGEROUS_ARG_CHARS'
        );
      }
      
      // Validate file paths
      if (this.isFilePath(arg)) {
        const sanitizedPath = this.validateAndSanitizeFilePath(arg);
        sanitizedArgs.push(sanitizedPath);
      } else if (this.isAllowedArg(arg, commandConfig.allowedArgs)) {
        sanitizedArgs.push(arg);
      } else {
        throw new CommandSecurityError(
          `Argument not allowed: ${arg}`,
          'ARG_NOT_ALLOWED'
        );
      }
    }
    
    return sanitizedArgs;
  }

  /**
   * Checks if string contains dangerous characters for command injection
   * @param {string} str - String to check
   * @returns {boolean} True if dangerous characters found
   */
  containsDangerousChars(str) {
    // Characters that could be used for command injection
    const dangerousPatterns = [
      /[;&|`$(){}[\]<>]/,  // Shell metacharacters
      /\$\(/,              // Command substitution
      /`[^`]*`/,           // Backtick command substitution  
      /\|\s*\w+/,          // Pipe to command
      /;\s*\w+/,           // Command separator
      /&&\s*\w+/,          // Command chaining
      /\|\|\s*\w+/,        // Command chaining
      />\s*\/\w+/,         // Redirect to system paths
      /<\s*\/\w+/,         // Redirect from system paths
      /\.\.\//,            // Path traversal
      /\/etc\//,           // System directory access
      /\/proc\//,          // Process directory access
      /\/sys\//,           // System directory access
    ];
    
    return dangerousPatterns.some(pattern => pattern.test(str));
  }

  /**
   * Checks if argument is a file path
   * @param {string} arg - Argument to check
   * @returns {boolean} True if appears to be a file path
   */
  isFilePath(arg) {
    return arg.includes('/') || arg.includes('\\') || 
           arg.includes('.') || path.isAbsolute(arg);
  }

  /**
   * Validates and sanitizes file path
   * @param {string} filePath - File path to validate
   * @returns {string} Sanitized file path
   */
  validateAndSanitizeFilePath(filePath) {
    // Resolve to absolute path
    const resolvedPath = path.resolve(filePath);
    
    // Check if path is within allowed directories
    const isAllowed = COMMAND_SECURITY_CONFIG.ALLOWED_WORK_DIRS.some(allowedDir => {
      return resolvedPath.startsWith(path.resolve(allowedDir));
    });
    
    if (!isAllowed) {
      throw new CommandSecurityError(
        `File path not in allowed directories: ${resolvedPath}`,
        'PATH_NOT_ALLOWED'
      );
    }
    
    // Additional path validation
    if (resolvedPath.includes('..')) {
      throw new CommandSecurityError('Path traversal detected', 'PATH_TRAVERSAL');
    }
    
    return resolvedPath;
  }

  /**
   * Checks if argument is in allowed list
   * @param {string} arg - Argument to check
   * @param {Array<string>} allowedArgs - List of allowed arguments
   * @returns {boolean} True if argument is allowed
   */
  isAllowedArg(arg, allowedArgs) {
    // Check exact matches
    if (allowedArgs.includes(arg)) {
      return true;
    }
    
    // Check if it's a value for a flag (e.g., language code for -l)
    if (/^[a-zA-Z0-9_-]+$/.test(arg) && arg.length <= 20) {
      return true;
    }
    
    // Check if it's a numeric value
    if (/^\d+(\.\d+)?$/.test(arg)) {
      return true;
    }
    
    return false;
  }

  /**
   * Prepares secure execution environment
   * @param {Object} options - User options
   * @param {Object} commandConfig - Command configuration
   * @returns {Object} Secure execution options
   */
  prepareSecureEnvironment(options, commandConfig) {
    // Create minimal environment
    const secureEnv = {};
    COMMAND_SECURITY_CONFIG.SAFE_ENV_VARS.forEach(envVar => {
      if (process.env[envVar]) {
        secureEnv[envVar] = process.env[envVar];
      }
    });
    
    return {
      cwd: options.cwd || COMMAND_SECURITY_CONFIG.ALLOWED_WORK_DIRS[0],
      env: secureEnv,
      timeout: commandConfig.timeout,
      maxBuffer: commandConfig.maxOutputSize,
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false,
      shell: false // Critical: never use shell
    };
  }

  /**
   * Executes command with monitoring and security controls
   * @param {string} commandPath - Full path to command
   * @param {Array<string>} args - Sanitized arguments
   * @param {Object} execOptions - Execution options
   * @param {number} processId - Process ID for tracking
   * @returns {Promise<Object>} Execution result
   */
  async executeWithMonitoring(commandPath, args, execOptions, processId) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let stdout = '';
      let stderr = '';
      let outputSize = 0;
      
      // Spawn process
      const childProcess = spawn(commandPath, args, execOptions);
      
      // Track active process
      this.activeProcesses.set(processId, {
        process: childProcess,
        startTime,
        command: commandPath,
        args: args.slice(0, 3) // Only log first 3 args for security
      });
      
      // Set up timeout
      const timeoutId = setTimeout(() => {
        childProcess.kill('SIGTERM');
        
        // Force kill after 5 seconds if still running
        setTimeout(() => {
          if (!childProcess.killed) {
            childProcess.kill('SIGKILL');
          }
        }, 5000);
        
        reject(new CommandSecurityError(
          `Command timed out after ${execOptions.timeout}ms`,
          'COMMAND_TIMEOUT'
        ));
      }, execOptions.timeout);
      
      // Handle stdout
      childProcess.stdout.on('data', (data) => {
        outputSize += data.length;
        if (outputSize > execOptions.maxBuffer) {
          childProcess.kill('SIGTERM');
          reject(new CommandSecurityError(
            'Command output exceeded maximum size',
            'OUTPUT_TOO_LARGE'
          ));
          return;
        }
        stdout += data.toString();
      });
      
      // Handle stderr
      childProcess.stderr.on('data', (data) => {
        outputSize += data.length;
        if (outputSize > execOptions.maxBuffer) {
          childProcess.kill('SIGTERM');
          reject(new CommandSecurityError(
            'Command output exceeded maximum size',
            'OUTPUT_TOO_LARGE'
          ));
          return;
        }
        stderr += data.toString();
      });
      
      // Handle process completion
      childProcess.on('close', (code, signal) => {
        clearTimeout(timeoutId);
        
        const executionTime = Date.now() - startTime;
        
        if (signal) {
          reject(new CommandSecurityError(
            `Command terminated by signal: ${signal}`,
            'COMMAND_TERMINATED'
          ));
          return;
        }
        
        resolve({
          stdout,
          stderr,
          exitCode: code,
          executionTime,
          outputSize
        });
      });
      
      // Handle process errors
      childProcess.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(new CommandSecurityError(
          `Command execution error: ${error.message}`,
          'EXECUTION_ERROR'
        ));
      });
    });
  }

  /**
   * Gets information about active processes
   * @returns {Array<Object>} Active process information
   */
  getActiveProcesses() {
    const processes = [];
    this.activeProcesses.forEach((info, processId) => {
      processes.push({
        processId,
        command: info.command,
        args: info.args,
        startTime: info.startTime,
        duration: Date.now() - info.startTime,
        pid: info.process.pid
      });
    });
    return processes;
  }

  /**
   * Terminates a specific process
   * @param {number} processId - Process ID to terminate
   * @returns {boolean} True if process was found and terminated
   */
  terminateProcess(processId) {
    const processInfo = this.activeProcesses.get(processId);
    if (processInfo) {
      processInfo.process.kill('SIGTERM');
      this.activeProcesses.delete(processId);
      return true;
    }
    return false;
  }

  /**
   * Terminates all active processes
   */
  terminateAllProcesses() {
    this.activeProcesses.forEach((processInfo, processId) => {
      processInfo.process.kill('SIGTERM');
    });
    this.activeProcesses.clear();
  }

  /**
   * Gets security configuration
   * @returns {Object} Security configuration
   */
  getSecurityConfig() {
    return { ...COMMAND_SECURITY_CONFIG };
  }
}

// Export singleton instance
const secureCommandService = new SecureCommandService();

module.exports = {
  SecureCommandService,
  secureCommandService,
  CommandSecurityError,
  COMMAND_SECURITY_CONFIG
};