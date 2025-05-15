/**
 * File Type Detector for AI Sports Edge
 * 
 * Detects file types based on file extensions and content patterns.
 * Used by the Content Analyzer to determine appropriate analysis strategies.
 */

const path = require('path');
const fs = require('fs');

// File type definitions with extensions and detection patterns
const FILE_TYPES = {
  // JavaScript and TypeScript
  js: {
    extensions: ['.js'],
    patterns: [
      /^(import|export|const|let|var|function|class)\s/m,
      /module\.exports\s*=/m
    ]
  },
  jsx: {
    extensions: ['.jsx'],
    patterns: [
      /import\s+React/m,
      /<[A-Z][A-Za-z0-9]*(\s+[^>]*)?>/m,
      /React\.createElement/m
    ]
  },
  ts: {
    extensions: ['.ts'],
    patterns: [
      /^(import|export|const|let|var|function|class|interface|type|enum)\s/m,
      /:\s*(string|number|boolean|any|void|never|unknown)/m
    ]
  },
  tsx: {
    extensions: ['.tsx'],
    patterns: [
      /import\s+React/m,
      /<[A-Z][A-Za-z0-9]*(\s+[^>]*)?>/m,
      /:\s*(React\.FC|FunctionComponent|ComponentType)/m
    ]
  },
  
  // Stylesheets
  css: {
    extensions: ['.css'],
    patterns: [
      /^[.#]?[a-zA-Z][\w-]*\s*{/m,
      /@media\s+/m,
      /@import\s+/m
    ]
  },
  scss: {
    extensions: ['.scss'],
    patterns: [
      /\$[a-zA-Z][\w-]*\s*:/m,
      /@mixin\s+/m,
      /@include\s+/m
    ]
  },
  less: {
    extensions: ['.less'],
    patterns: [
      /@[a-zA-Z][\w-]*\s*:/m,
      /\.[a-zA-Z][\w-]*\s*\(\)/m
    ]
  },
  
  // Markup
  html: {
    extensions: ['.html', '.htm'],
    patterns: [
      /<!DOCTYPE\s+html>/i,
      /<html[\s>]/i,
      /<head[\s>]/i,
      /<body[\s>]/i
    ]
  },
  xml: {
    extensions: ['.xml'],
    patterns: [
      /<?xml\s+version/i,
      /<[a-zA-Z0-9]+:?[a-zA-Z0-9]+\s+xmlns/i
    ]
  },
  svg: {
    extensions: ['.svg'],
    patterns: [
      /<svg[\s>]/i,
      /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/i
    ]
  },
  
  // Data formats
  json: {
    extensions: ['.json'],
    patterns: [
      /^\s*[{\[]/m,
      /"\s*:\s*[{\["0-9]/m
    ]
  },
  yaml: {
    extensions: ['.yml', '.yaml'],
    patterns: [
      /^[a-zA-Z][\w-]*:\s+/m,
      /^-\s+[a-zA-Z][\w-]*:\s+/m
    ]
  },
  
  // Configuration
  config: {
    extensions: ['.config', '.conf', '.ini'],
    patterns: [
      /^\s*\[[a-zA-Z0-9_]+\]\s*$/m,
      /^\s*[a-zA-Z0-9_]+=.+$/m
    ]
  },
  
  // Documentation
  markdown: {
    extensions: ['.md', '.markdown'],
    patterns: [
      /^#\s+/m,
      /\*\*[^*]+\*\*/m,
      /\[.+\]\(.+\)/m
    ]
  },
  
  // Images
  image: {
    extensions: ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'],
    binary: true
  },
  
  // Fonts
  font: {
    extensions: ['.ttf', '.otf', '.woff', '.woff2', '.eot'],
    binary: true
  },
  
  // Other
  binary: {
    extensions: ['.pdf', '.zip', '.exe', '.dll', '.so', '.dylib'],
    binary: true
  },
  text: {
    extensions: ['.txt', '.log'],
    patterns: [/.+/m]
  }
};

/**
 * Get file type based on file extension and content
 * @param {string} filePath Path to the file
 * @param {string} [content] Optional file content (to avoid reading the file again)
 * @returns {string} Detected file type
 */
function getFileType(filePath, content) {
  const extension = path.extname(filePath).toLowerCase();
  
  // First, try to match by extension
  for (const [type, definition] of Object.entries(FILE_TYPES)) {
    if (definition.extensions && definition.extensions.includes(extension)) {
      // If it's a binary file, return the type immediately
      if (definition.binary) {
        return type;
      }
      
      // For text files, verify with content patterns if content is provided
      if (content && definition.patterns) {
        for (const pattern of definition.patterns) {
          if (pattern.test(content)) {
            return type;
          }
        }
      } else {
        // If no content is provided, return the type based on extension
        return type;
      }
    }
  }
  
  // If no match by extension, try to read the file and match by content patterns
  if (!content) {
    try {
      // Read the first 4KB of the file to check patterns
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(4096);
      fs.readSync(fd, buffer, 0, 4096, 0);
      fs.closeSync(fd);
      
      content = buffer.toString('utf8');
    } catch (error) {
      // If we can't read the file, assume it's binary
      return 'binary';
    }
  }
  
  // Try to match by content patterns
  for (const [type, definition] of Object.entries(FILE_TYPES)) {
    if (definition.patterns) {
      for (const pattern of definition.patterns) {
        if (pattern.test(content)) {
          return type;
        }
      }
    }
  }
  
  // If no match, check if it's a text file
  try {
    // Check if the content contains only printable ASCII characters
    const isPrintable = /^[\x20-\x7E\r\n\t]*$/.test(content.slice(0, 100));
    if (isPrintable) {
      return 'text';
    }
  } catch (error) {
    // Ignore errors
  }
  
  // Default to binary if no match
  return 'binary';
}

/**
 * Check if a file is a text file
 * @param {string} filePath Path to the file
 * @returns {boolean} Whether the file is a text file
 */
function isTextFile(filePath) {
  const type = getFileType(filePath);
  return !FILE_TYPES[type]?.binary;
}

/**
 * Check if a file is a binary file
 * @param {string} filePath Path to the file
 * @returns {boolean} Whether the file is a binary file
 */
function isBinaryFile(filePath) {
  const type = getFileType(filePath);
  return !!FILE_TYPES[type]?.binary;
}

/**
 * Get all supported file extensions
 * @returns {string[]} Array of supported file extensions
 */
function getSupportedExtensions() {
  const extensions = new Set();
  
  for (const definition of Object.values(FILE_TYPES)) {
    if (definition.extensions) {
      for (const ext of definition.extensions) {
        extensions.add(ext);
      }
    }
  }
  
  return Array.from(extensions);
}

module.exports = {
  getFileType,
  isTextFile,
  isBinaryFile,
  getSupportedExtensions,
  FILE_TYPES
};