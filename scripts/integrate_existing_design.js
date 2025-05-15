/**
 * AI Sports Edge - Integrate Existing Design with Firebase Hosting
 * 
 * This script searches through project directories to find and consolidate
 * all existing HTML, CSS, JavaScript, and image assets into the dist directory
 * for Firebase hosting deployment.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const cheerio = require('cheerio');

// Configuration
const sourceDirectories = [
  'backups/deployment-folders/ai-sports-edge-deploy-v2',
  'backups/deployment-folders/aisportsedge-deploy',
  'public',
  'web-build',
  'dist'
];

const targetDirectory = 'dist';
const assetExtensions = ['.html', '.css', '.js', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.webp', '.woff', '.woff2', '.ttf', '.otf'];

// Ensure target directory exists
if (!fs.existsSync(targetDirectory)) {
  fs.mkdirSync(targetDirectory, { recursive: true });
  console.log(`Created target directory: ${targetDirectory}`);
}

// Track processed files to avoid duplicates
const processedFiles = new Set();
const fileHashes = {};

/**
 * Calculate a simple hash for file content
 * @param {Buffer} content - File content
 * @returns {string} - Hash string
 */
function calculateHash(content) {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) - hash) + content[i];
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString(16);
}

/**
 * Copy file with content-based deduplication
 * @param {string} sourcePath - Source file path
 * @param {string} targetPath - Target file path
 * @returns {boolean} - Whether file was copied
 */
function copyFileWithDeduplication(sourcePath, targetPath) {
  try {
    // Read source file
    const content = fs.readFileSync(sourcePath);
    const hash = calculateHash(content);
    
    // Check if we've already processed an identical file
    if (fileHashes[hash]) {
      console.log(`Skipping duplicate file: ${sourcePath} (identical to ${fileHashes[hash]})`);
      return false;
    }
    
    // Create target directory if it doesn't exist
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Copy file
    fs.writeFileSync(targetPath, content);
    fileHashes[hash] = targetPath;
    console.log(`Copied: ${sourcePath} -> ${targetPath}`);
    return true;
  } catch (error) {
    console.error(`Error copying file ${sourcePath}: ${error.message}`);
    return false;
  }
}

/**
 * Fix relative paths in HTML files
 * @param {string} filePath - HTML file path
 */
function fixHtmlPaths(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const $ = cheerio.load(content);
    let modified = false;
    
    // Fix CSS links
    $('link[rel="stylesheet"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.startsWith('./')) {
        $(el).attr('href', href.substring(2));
        modified = true;
      }
    });
    
    // Fix script sources
    $('script').each((i, el) => {
      const src = $(el).attr('src');
      if (src && src.startsWith('./')) {
        $(el).attr('src', src.substring(2));
        modified = true;
      }
    });
    
    // Fix image sources
    $('img').each((i, el) => {
      const src = $(el).attr('src');
      if (src && src.startsWith('./')) {
        $(el).attr('src', src.substring(2));
        modified = true;
      }
    });
    
    // Save changes if modified
    if (modified) {
      fs.writeFileSync(filePath, $.html());
      console.log(`Fixed paths in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error fixing paths in ${filePath}: ${error.message}`);
  }
}

/**
 * Fix relative paths in CSS files
 * @param {string} filePath - CSS file path
 */
function fixCssPaths(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Fix url() paths
    const updatedContent = content.replace(/url\(['"]?\.\/(.*?)['"]?\)/g, 'url($1)');
    
    // Save changes if modified
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`Fixed paths in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error fixing paths in ${filePath}: ${error.message}`);
  }
}

/**
 * Process all source directories
 */
function processSourceDirectories() {
  let totalFilesCopied = 0;
  
  // Process each source directory
  sourceDirectories.forEach(sourceDir => {
    if (!fs.existsSync(sourceDir)) {
      console.log(`Source directory not found: ${sourceDir}`);
      return;
    }
    
    console.log(`Processing directory: ${sourceDir}`);
    
    // Find all files with matching extensions
    assetExtensions.forEach(ext => {
      const files = glob.sync(`${sourceDir}/**/*${ext}`);
      
      files.forEach(file => {
        // Skip if already processed
        if (processedFiles.has(file)) {
          return;
        }
        
        // Determine target path
        const relativePath = path.relative(sourceDir, file);
        const targetPath = path.join(targetDirectory, relativePath);
        
        // Copy file
        const copied = copyFileWithDeduplication(file, targetPath);
        if (copied) {
          totalFilesCopied++;
          processedFiles.add(file);
          
          // Fix paths in HTML and CSS files
          if (file.endsWith('.html')) {
            fixHtmlPaths(targetPath);
          } else if (file.endsWith('.css')) {
            fixCssPaths(targetPath);
          }
        }
      });
    });
  });
  
  return totalFilesCopied;
}

/**
 * Ensure index.html exists in the dist directory
 */
function ensureIndexHtml() {
  const indexPath = path.join(targetDirectory, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    // Look for any HTML file to use as index
    const htmlFiles = glob.sync(`${targetDirectory}/**/*.html`);
    
    if (htmlFiles.length > 0) {
      // Use the first HTML file as index
      const content = fs.readFileSync(htmlFiles[0]);
      fs.writeFileSync(indexPath, content);
      console.log(`Created index.html from: ${htmlFiles[0]}`);
    } else {
      // Create a minimal index.html
      const minimalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Sports Edge</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>AI Sports Edge</h1>
  <p>Welcome to AI Sports Edge!</p>
  <script src="main.js"></script>
</body>
</html>`;
      
      fs.writeFileSync(indexPath, minimalHtml);
      console.log('Created minimal index.html');
    }
  }
}

/**
 * Main execution
 */
function main() {
  console.log('Starting integration of existing design with Firebase hosting...');
  
  // Process all source directories
  const totalFilesCopied = processSourceDirectories();
  console.log(`Total files copied: ${totalFilesCopied}`);
  
  // Ensure index.html exists
  ensureIndexHtml();
  
  console.log(`Integration complete! Files are ready in the ${targetDirectory} directory.`);
  console.log('You can now deploy to Firebase hosting using: firebase deploy --only hosting');
}

// Run the script
main();