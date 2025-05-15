#!/usr/bin/env node

/**
 * Memory Bank Consolidation System
 *
 * This script implements a persistent rule system for managing the memory bank.
 * It automatically consolidates memory bank files when:
 * - 2+ files have ≥75% topic overlap (similar keywords)
 * - OR share system-level tags like #infra, #firebase, #security, #deployment
 *
 * Usage:
 *   node scripts/memory-bank-consolidation.js [--force] [--verbose]
 *
 * Options:
 *   --force      Force consolidation even if threshold not met
 *   --verbose    Show detailed logs
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Primary paths
  memoryBankDir: path.join(__dirname, '..', 'memory-bank'),
  roocodeMemoryBank: path.join(__dirname, '..', '.roocode', 'memory_bank.md'),
  archiveDir: path.join(__dirname, '..', 'archive', 'memory-bank'),
  contextDir: path.join(__dirname, '..', 'context'),
  statusDir: path.join(__dirname, '..', 'status'),

  // Log files
  logFile: path.join(__dirname, '..', 'logs', 'memory-bank-consolidation.log'),
  checkpointFile: path.join(__dirname, '..', 'context', 'latest-checkpoint.md'),
  statusLogFile: path.join(__dirname, '..', 'status', 'status-log.md'),

  // Thresholds and settings
  overlapThreshold: 0.75, // 75% topic overlap threshold
  systemTags: [
    '#infra',
    '#firebase',
    '#security',
    '#deployment',
    '#auth',
    '#api',
    '#headers',
    '#csp',
  ],

  // Files to exclude from consolidation
  excludeFiles: [
    '.last-update',
    '.migration-status.json',
    '.consolidation-status.json',
    'README.md',
    'todo.json',
  ],
  excludePatterns: [/\.bak$/, /\.deprecated\.md$/, /checkpoints\//],
};

// Command line arguments
const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const VERBOSE = args.includes('--verbose');

// Utility functions
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;

  // Always log to file
  ensureDirectoryExists(path.dirname(CONFIG.logFile));
  fs.appendFileSync(CONFIG.logFile, logMessage + '\n');

  // Log to console based on level and verbosity
  if (level === 'ERROR' || level === 'WARNING' || VERBOSE) {
    console.log(logMessage);
  }
}

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created directory: ${dir}`);
  }
}

function ensureAllDirectories() {
  // Ensure all required directories exist
  ensureDirectoryExists(CONFIG.memoryBankDir);
  ensureDirectoryExists(CONFIG.archiveDir);
  ensureDirectoryExists(CONFIG.contextDir);
  ensureDirectoryExists(CONFIG.statusDir);
  ensureDirectoryExists(path.dirname(CONFIG.logFile));

  // Ensure .roocode directory exists if needed
  const roocodeDir = path.dirname(CONFIG.roocodeMemoryBank);
  ensureDirectoryExists(roocodeDir);
}

// Get all memory bank files
function getMemoryBankFiles() {
  const files = [];

  // Get files from memory-bank directory
  if (fs.existsSync(CONFIG.memoryBankDir)) {
    const dirFiles = fs
      .readdirSync(CONFIG.memoryBankDir)
      .filter(file => {
        // Filter out excluded files and patterns
        if (CONFIG.excludeFiles.includes(file)) return false;
        for (const pattern of CONFIG.excludePatterns) {
          if (pattern.test(file)) return false;
        }
        return file.endsWith('.md');
      })
      .map(file => path.join(CONFIG.memoryBankDir, file));

    files.push(...dirFiles);
  }

  // Add .roocode/memory_bank.md if it exists
  if (fs.existsSync(CONFIG.roocodeMemoryBank)) {
    files.push(CONFIG.roocodeMemoryBank);
  }

  log(`Found ${files.length} memory bank files for analysis`);
  return files;
}

// Check if a file contains system tags
function checkFileForSystemTags(filePath) {
  try {
    // Get file stats
    const stats = fs.statSync(filePath);

    // If file is too large (> 100MB), use a different approach
    if (stats.size > 100 * 1024 * 1024) {
      log(
        `File ${filePath} is too large (${(stats.size / (1024 * 1024)).toFixed(
          2
        )} MB), checking for system tags only`,
        'WARNING'
      );

      // Use grep-like approach to check for system tags
      const systemTags = [];
      for (const tag of CONFIG.systemTags) {
        try {
          // Use child_process.execSync to run grep
          const result = require('child_process').execSync(`grep -l "${tag}" "${filePath}"`, {
            stdio: ['pipe', 'pipe', 'ignore'],
          });
          if (result.toString().trim() === filePath) {
            systemTags.push(tag);
          }
        } catch (error) {
          // grep returns non-zero exit code if pattern not found, which throws an error
          // We can ignore this error
        }
      }

      const fileName = path.basename(filePath, '.md');

      return {
        path: filePath,
        name: fileName,
        systemTags,
        keywords: fileName.split(/[-_\s]+/).filter(word => word.length > 3), // Just use filename keywords
        lastModified: stats.mtime.getTime(),
        isLargeFile: true,
      };
    }

    // For normal-sized files, proceed with full content analysis
    return null;
  } catch (error) {
    log(`Error checking file ${filePath}: ${error.message}`, 'ERROR');
    return null;
  }
}

// Extract keywords and tags from a file
function extractKeywordsAndTags(filePath) {
  try {
    // First check if this is a large file
    const largeFileCheck = checkFileForSystemTags(filePath);
    if (largeFileCheck) {
      return largeFileCheck;
    }

    // For normal-sized files, read the content
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath, '.md');

    // Extract system tags
    const systemTags = [];
    for (const tag of CONFIG.systemTags) {
      if (content.includes(tag)) {
        systemTags.push(tag);
      }
    }

    // Extract keywords from title and content
    const titleWords = fileName.split(/[-_\s]+/).filter(word => word.length > 3);

    // Extract significant words from content (excluding common words)
    const contentWords = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4)
      .filter(
        word =>
          ![
            'about',
            'after',
            'again',
            'below',
            'could',
            'every',
            'first',
            'found',
            'great',
            'house',
            'large',
            'learn',
            'never',
            'other',
            'place',
            'small',
            'study',
            'their',
            'there',
            'these',
            'thing',
            'think',
            'three',
            'water',
            'where',
            'which',
            'world',
            'would',
            'write',
          ].includes(word)
      );

    // Count word frequencies
    const wordFreq = {};
    for (const word of contentWords) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }

    // Get top keywords (most frequent words)
    const keywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(entry => entry[0]);

    // Add title words to keywords
    for (const word of titleWords) {
      if (!keywords.includes(word)) {
        keywords.push(word);
      }
    }

    return {
      path: filePath,
      name: fileName,
      systemTags,
      keywords,
      lastModified: fs.statSync(filePath).mtime.getTime(),
      content,
    };
  } catch (error) {
    log(`Error extracting keywords from ${filePath}: ${error.message}`, 'ERROR');

    // Return a minimal object with just the file path and name
    return {
      path: filePath,
      name: path.basename(filePath, '.md'),
      systemTags: [],
      keywords: [],
      lastModified: 0,
      error: error.message,
    };
  }
}

// Calculate overlap between two files
function calculateOverlap(file1, file2) {
  // Check system tag overlap
  const sharedSystemTags = file1.systemTags.filter(tag => file2.systemTags.includes(tag));
  if (sharedSystemTags.length > 0) {
    return {
      overlap: 1.0, // 100% overlap if they share system tags
      reason: `Shared system tags: ${sharedSystemTags.join(', ')}`,
    };
  }

  // If either file is a large file with limited keyword extraction,
  // we should be more conservative about overlap
  if (file1.isLargeFile || file2.isLargeFile) {
    // For large files, we only consider system tags (already checked above)
    // or exact filename matches
    if (file1.name === file2.name) {
      return {
        overlap: 1.0,
        reason: `Identical filenames: ${file1.name}`,
      };
    }

    // Otherwise, consider it a low overlap
    return {
      overlap: 0.0,
      reason: `Limited analysis due to large file size`,
    };
  }

  // Calculate keyword overlap for normal files
  const sharedKeywords = file1.keywords.filter(keyword => file2.keywords.includes(keyword));
  const totalUniqueKeywords = new Set([...file1.keywords, ...file2.keywords]).size;
  const overlapScore =
    sharedKeywords.length / Math.min(file1.keywords.length, file2.keywords.length);

  return {
    overlap: overlapScore,
    reason: `Shared keywords (${overlapScore.toFixed(2)}): ${sharedKeywords.join(', ')}`,
  };
}

// Cluster related files
function clusterRelatedFiles(files) {
  const fileData = files.map(file => extractKeywordsAndTags(file));
  const clusters = [];
  const processedFiles = new Set();

  for (let i = 0; i < fileData.length; i++) {
    if (processedFiles.has(fileData[i].path)) continue;

    const cluster = {
      base: fileData[i],
      related: [],
      reasons: [],
    };

    processedFiles.add(fileData[i].path);

    for (let j = 0; j < fileData.length; j++) {
      if (i === j || processedFiles.has(fileData[j].path)) continue;

      const { overlap, reason } = calculateOverlap(fileData[i], fileData[j]);

      if (overlap >= CONFIG.overlapThreshold || FORCE) {
        cluster.related.push(fileData[j]);
        cluster.reasons.push(`${path.basename(fileData[j].path)}: ${reason}`);
        processedFiles.add(fileData[j].path);
      }
    }

    if (cluster.related.length > 0) {
      clusters.push(cluster);
    }
  }

  log(`Found ${clusters.length} clusters of related files`);
  return clusters;
}

// Select the best base file from a cluster
function selectBaseFile(cluster) {
  // Start with the current base
  let bestBase = cluster.base;
  let allFiles = [cluster.base, ...cluster.related];

  // Check if any files are large files
  const hasLargeFiles = allFiles.some(file => file.isLargeFile);
  
  if (hasLargeFiles) {
    log(`Cluster contains large files, using simplified base file selection`, 'WARNING');
    
    // For clusters with large files, use a simpler selection method
    // Prefer non-large files if available
    const nonLargeFiles = allFiles.filter(file => !file.isLargeFile);
    
    if (nonLargeFiles.length > 0) {
      // If we have non-large files, select the most recent one
      nonLargeFiles.sort((a, b) => b.lastModified - a.lastModified);
      log(`Selected ${path.basename(nonLargeFiles[0].path)} as base file (most recent non-large file)`, 'INFO');
      return nonLargeFiles[0];
    } else {
      // If all files are large, select the most recent one
      allFiles.sort((a, b) => b.lastModified - a.lastModified);
      log(`Selected ${path.basename(allFiles[0].path)} as base file (most recent large file)`, 'INFO');
      return allFiles[0];
    }
  }
  
  // Score each file based on multiple factors
  const scores = allFiles.map(file => {
    // Skip files with errors or missing content
    if (!file.content) {
      return {
        file,
        score: 0,
        metrics: {
          recency: 0,
          length: 0,
          structure: 0,
          keywordDensity: 0,
        },
      };
    }
    
    // Factor 1: Recency (more recent is better)
    const recencyScore = file.lastModified / Date.now();

    // Factor 2: Comprehensiveness (longer files might be more complete)
    const lengthScore = file.content.length / 10000; // Normalize to 0-1 range

    // Factor 3: Structure quality (more headings and lists indicate better structure)
    const headingCount = (file.content.match(/^#+\s+/gm) || []).length;
    const listItemCount = (file.content.match(/^[\s-]*[-*]\s+/gm) || []).length;
    const structureScore = (headingCount + listItemCount) / 50; // Normalize

    // Factor 4: Keyword density (more keywords might indicate more focused content)
    const keywordDensity = file.keywords.length / (file.content.length / 100);

    // Combine scores (weighted)
    const totalScore =
      recencyScore * 0.4 + lengthScore * 0.3 + structureScore * 0.2 + keywordDensity * 0.1;

    return {
      file,
      score: totalScore,
      metrics: {
        recency: recencyScore,
        length: lengthScore,
        structure: structureScore,
        keywordDensity,
      },
    };
  });

  // Sort by score (descending)
  scores.sort((a, b) => b.score - a.score);

  // Log the selection process
  log(`Base file selection for cluster with ${allFiles.length} files:`);
  scores.forEach(item => {
    log(
      `  ${path.basename(item.file.path)}: Score ${item.score.toFixed(
        3
      )} (recency: ${item.metrics.recency.toFixed(2)}, length: ${item.metrics.length.toFixed(
        2
      )}, structure: ${item.metrics.structure.toFixed(2)})`,
      'DEBUG'
    );
  });

  // Return the highest scoring file
  return scores[0].file;
}

// Generate a canonical filename based on content
function generateCanonicalFilename(baseFile, relatedFiles) {
  // Extract main topics from all files
  const allFiles = [baseFile, ...relatedFiles];
  const allKeywords = new Set();

  // Collect all system tags
  const systemTags = new Set();
  allFiles.forEach(file => {
    file.systemTags.forEach(tag => systemTags.add(tag.replace('#', '')));
  });

  // Get the most common keywords across all files
  const keywordCounts = {};
  allFiles.forEach(file => {
    file.keywords.forEach(keyword => {
      keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
    });
  });

  // Sort keywords by frequency
  const sortedKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);

  // Determine the primary topic
  let primaryTopic = '';
  if (systemTags.size > 0) {
    primaryTopic = Array.from(systemTags)[0]; // Use the first system tag
  } else if (sortedKeywords.length > 0) {
    primaryTopic = sortedKeywords[0]; // Use the most common keyword
  } else {
    primaryTopic = baseFile.name.split('-')[0]; // Fallback to first part of base filename
  }

  // Determine the secondary topic
  let secondaryTopic = '';
  if (sortedKeywords.length > 1) {
    // Find the first keyword that's not already part of the primary topic
    for (const keyword of sortedKeywords) {
      if (!primaryTopic.includes(keyword) && !keyword.includes(primaryTopic)) {
        secondaryTopic = keyword;
        break;
      }
    }
  }

  // Determine the document type
  let docType = 'overview';
  
  // Check if this is a large file
  if (baseFile.isLargeFile) {
    // For large files, only check the filename
    if (baseFile.name.toLowerCase().includes('guide')) {
      docType = 'guide';
    } else if (baseFile.name.toLowerCase().includes('implementation')) {
      docType = 'implementation';
    } else if (baseFile.name.toLowerCase().includes('summary')) {
      docType = 'summary';
    } else if (baseFile.name.toLowerCase().includes('large')) {
      docType = 'large-file';
    }
  } else {
    // For normal files, check both content and filename
    if (
      (baseFile.content && baseFile.content.toLowerCase().includes('guide')) ||
      baseFile.name.toLowerCase().includes('guide')
    ) {
      docType = 'guide';
    } else if (
      (baseFile.content && baseFile.content.toLowerCase().includes('implementation')) ||
      baseFile.name.toLowerCase().includes('implementation')
    ) {
      docType = 'implementation';
    } else if (
      (baseFile.content && baseFile.content.toLowerCase().includes('summary')) ||
      baseFile.name.toLowerCase().includes('summary')
    ) {
      docType = 'summary';
    }
  }

  // Build the filename
  let filename = primaryTopic.toLowerCase();
  if (secondaryTopic) {
    filename += `-${secondaryTopic.toLowerCase()}`;
  }
  filename += `-${docType}.md`;

  // Ensure the filename is valid
  filename = filename.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');

  log(`Generated canonical filename: ${filename}`);
  return filename;
}

// Extract sections from markdown content
function extractSections(content) {
  const sections = new Map();
  
  // Handle undefined or empty content
  if (!content) {
    return sections;
  }
  
  const lines = content.split('\n');

  let currentHeading = '## Content';
  let currentContent = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is a heading
    if (line.startsWith('#')) {
      // Save the previous section
      if (currentContent.trim()) {
        sections.set(currentHeading, currentContent.trim());
      }

      // Start a new section
      currentHeading = line;
      currentContent = '';
    } else {
      // Add to current section
      currentContent += line + '\n';
    }
  }

  // Save the last section
  if (currentContent.trim()) {
    sections.set(currentHeading, currentContent.trim());
  }

  return sections;
}

// Extract citations and source comments from content
function extractCitations(content) {
  // Handle undefined or empty content
  if (!content) {
    return '';
  }
  
  // Look for citation sections
  const citationSectionRegexes = [
    /## Sources[\s\S]*?(?=^#|\Z)/m,
    /## References[\s\S]*?(?=^#|\Z)/m,
    /## Citations[\s\S]*?(?=^#|\Z)/m,
  ];

  for (const regex of citationSectionRegexes) {
    const match = content.match(regex);
    if (match) {
      return match[0];
    }
  }

  // Look for inline citations
  const inlineCitations = [];
  const inlineCitationRegex = /\[(\d+)\]:\s*(.*?)$/gm;
  let match;

  while ((match = inlineCitationRegex.exec(content)) !== null) {
    inlineCitations.push(match[0]);
  }

  if (inlineCitations.length > 0) {
    return '## Sources\n\n' + inlineCitations.join('\n');
  }

  return '';
}

// Calculate similarity between two text blocks
function calculateTextSimilarity(text1, text2) {
  // Handle undefined or empty content
  if (!text1 || !text2) {
    return 0;
  }
  
  // Simple Jaccard similarity on word sets
  const words1 = new Set(
    text1
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3)
  );
  const words2 = new Set(
    text2
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3)
  );

  // If either set is empty, return 0
  if (words1.size === 0 || words2.size === 0) {
    return 0;
  }

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

// Merge content from related files into base file
function mergeContent(baseFile, relatedFiles, canonicalFilename) {
  // Handle large files differently
  if (baseFile.isLargeFile) {
    log(`Base file ${baseFile.path} is a large file, using simplified merging`, 'WARNING');

    // For large files, we'll create a new file with just metadata and references
    const consolidationHeader = `# ${
      baseFile.name
    } (Consolidated - Large File)\n\n_This file was automatically consolidated from multiple related files on ${
      new Date().toISOString().split('T')[0]
    }._\n\n`;

    // Add a section listing the source files
    let sourcesSection = `## Source Files\n\nThis file consolidates content from:\n\n`;
    sourcesSection += `- **${path.basename(baseFile.path)}** (base file - large file)\n`;
    relatedFiles.forEach(file => {
      sourcesSection += `- ${path.basename(file.path)}${file.isLargeFile ? ' (large file)' : ''}\n`;
    });

    // Add a note about large files
    let largeFileNote = `\n## Large File Handling\n\nOne or more of the source files are very large (>100MB). `;
    largeFileNote += `These files have been consolidated based on system tags and filenames only. `;
    largeFileNote += `The original content has not been merged to avoid memory issues.\n\n`;
    largeFileNote += `To access the original content, please refer to the source files directly.\n\n`;

    // Add system tags section
    let tagsSection = `## System Tags\n\n`;
    const allTags = new Set([...baseFile.systemTags]);
    relatedFiles.forEach(file => {
      file.systemTags.forEach(tag => allTags.add(tag));
    });

    if (allTags.size > 0) {
      tagsSection += `The following system tags were found in the source files:\n\n`;
      allTags.forEach(tag => {
        tagsSection += `- \`${tag}\`\n`;
      });
    } else {
      tagsSection += `No system tags were found in the source files.\n`;
    }

    // Combine all sections
    const mergedContent = consolidationHeader + sourcesSection + largeFileNote + tagsSection;

    return {
      content: mergedContent,
      conflicts: [],
      isLargeFile: true,
    };
  }

  // For normal files, proceed with full content merging
  let baseContent = baseFile.content || '';
  const conflicts = [];

  // Add a header indicating this is a consolidated file
  const consolidationHeader = `# ${
    baseFile.name
  } (Consolidated)\n\n_This file was automatically consolidated from multiple related files on ${
    new Date().toISOString().split('T')[0]
  }._\n\n`;

  // Add a section listing the source files
  let sourcesSection = `## Source Files\n\nThis file consolidates content from:\n\n`;
  sourcesSection += `- **${path.basename(baseFile.path)}** (base file)\n`;
  relatedFiles.forEach(file => {
    sourcesSection += `- ${path.basename(file.path)}${file.isLargeFile ? ' (large file)' : ''}\n`;
  });
  sourcesSection += `\n`;

  // Process each related file
  const mergedSections = new Map();

  // First, extract sections from the base file
  const baseFileSections = extractSections(baseContent);
  for (const [heading, content] of baseFileSections) {
    mergedSections.set(heading, {
      content,
      source: path.basename(baseFile.path),
      isConflict: false,
    });
  }

  // Then process each related file
  for (const relatedFile of relatedFiles) {
    // Skip large files in detailed merging
    if (relatedFile.isLargeFile) {
      log(`Skipping detailed merge for large file ${relatedFile.path}`, 'WARNING');
      conflicts.push({
        heading: 'Large File',
        sources: [path.basename(relatedFile.path)],
        resolution: 'skipped detailed merge due to file size',
      });
      continue;
    }

    // Skip files with errors
    if (!relatedFile.content) {
      log(`Skipping file ${relatedFile.path} due to missing content`, 'WARNING');
      conflicts.push({
        heading: 'Error',
        sources: [path.basename(relatedFile.path)],
        resolution: 'skipped due to error: ' + (relatedFile.error || 'unknown error'),
      });
      continue;
    }

    const relatedSections = extractSections(relatedFile.content);

    for (const [heading, content] of relatedSections) {
      if (mergedSections.has(heading)) {
        // This section already exists, check for conflicts
        const existingSection = mergedSections.get(heading);
        const similarity = calculateTextSimilarity(existingSection.content, content);

        if (similarity < 0.7) {
          // If content is significantly different
          conflicts.push({
            heading,
            sources: [existingSection.source, path.basename(relatedFile.path)],
            resolution: 'kept both versions',
          });

          // Append the conflicting content with a note
          const conflictNote = `\n\n---\n\n**Note:** Alternative content from ${path.basename(
            relatedFile.path
          )}:\n\n`;
          mergedSections.set(heading, {
            content: existingSection.content + conflictNote + content,
            source: existingSection.source + ', ' + path.basename(relatedFile.path),
            isConflict: true,
          });
        }
        // If very similar, keep the existing content
      } else {
        // This is a new section, add it
        mergedSections.set(heading, {
          content,
          source: path.basename(relatedFile.path),
          isConflict: false,
        });
      }
    }
  }

  // Collect all citations
  const citations = [];
  citations.push(extractCitations(baseFile.content));
  relatedFiles.forEach(file => {
    citations.push(extractCitations(file.content));
  });
  const uniqueCitations = [...new Set(citations.filter(c => c))];

  // Build the final content
  let finalContent = consolidationHeader + sourcesSection;

  // Add a conflicts section if there are any
  if (conflicts.length > 0) {
    finalContent += `## Conflicts Detected\n\n`;
    finalContent += `The following sections had conflicting content:\n\n`;
    conflicts.forEach(conflict => {
      finalContent += `- **${conflict.heading}**: Conflict between ${conflict.sources.join(
        ' and '
      )}. Resolution: ${conflict.resolution}\n`;
    });
    finalContent += `\n`;
  }

  // Add all the merged sections
  const sortedHeadings = Array.from(mergedSections.keys()).sort();
  for (const heading of sortedHeadings) {
    const section = mergedSections.get(heading);
    finalContent += `${heading}\n\n${section.content}\n\n`;
  }

  // Add citations at the end
  if (uniqueCitations.length > 0) {
    finalContent += `\n## Sources and Citations\n\n`;
    uniqueCitations.forEach(citation => {
      finalContent += citation + '\n\n';
    });
  }

  return {
    content: finalContent,
    conflicts,
  };
}

// Archive deprecated files
function archiveDeprecatedFiles(files, canonicalFilename) {
  for (const file of files) {
    const fileName = path.basename(file.path);
    const deprecatedName = fileName.replace('.md', '.deprecated.md');
    const archivePath = path.join(CONFIG.archiveDir, deprecatedName);

    // Add a deprecation notice at the top of the file
    const content = `# ❌ Deprecated – merged into [${canonicalFilename}]\n\n_This file was deprecated on ${
      new Date().toISOString().split('T')[0]
    } after being consolidated into another file._\n\n${file.content}`;

    // Ensure archive directory exists
    ensureDirectoryExists(CONFIG.archiveDir);

    // Write the deprecated file to the archive
    fs.writeFileSync(archivePath, content);
    log(`Archived deprecated file: ${fileName} → ${deprecatedName}`);
  }
}

// Log the merge to the checkpoint and status log
function logMerge(cluster, baseFile, canonicalFilename, conflicts) {
  const timestamp = new Date().toISOString();
  const relatedFiles = cluster.related.map(file => path.basename(file.path)).join(', ');

  // Create checkpoint log entry
  let checkpointEntry = `# Memory Bank Consolidation: ${canonicalFilename}\n\n`;
  checkpointEntry += `- **Date:** ${timestamp.split('T')[0]}\n`;
  checkpointEntry += `- **Time:** ${timestamp.split('T')[1].split('.')[0]}\n`;
  checkpointEntry += `- **Base File:** ${path.basename(baseFile.path)}\n`;
  checkpointEntry += `- **Canonical File:** ${canonicalFilename}\n`;
  checkpointEntry += `- **Related Files:** ${relatedFiles}\n`;
  checkpointEntry += `- **Reasons for Consolidation:**\n`;

  cluster.reasons.forEach(reason => {
    checkpointEntry += `  - ${reason}\n`;
  });

  if (conflicts.length > 0) {
    checkpointEntry += `\n## Conflicts\n\n`;
    conflicts.forEach(conflict => {
      checkpointEntry += `- **${conflict.heading}**: Conflict between ${conflict.sources.join(
        ' and '
      )}. Resolution: ${conflict.resolution}\n`;
    });
  }

  checkpointEntry += `\n---\n\n`;

  // Ensure checkpoint file exists
  ensureDirectoryExists(path.dirname(CONFIG.checkpointFile));
  if (!fs.existsSync(CONFIG.checkpointFile)) {
    fs.writeFileSync(CONFIG.checkpointFile, `# Memory Bank Consolidation Checkpoint\n\n`);
  }

  // Append to the checkpoint file
  const currentCheckpoint = fs.readFileSync(CONFIG.checkpointFile, 'utf8');
  fs.writeFileSync(CONFIG.checkpointFile, currentCheckpoint + checkpointEntry);

  // Create status log entry
  let statusEntry = `## Memory Bank Consolidation: ${canonicalFilename}\n\n`;
  statusEntry += `- **Date:** ${timestamp.split('T')[0]}\n`;
  statusEntry += `- **Files Consolidated:** ${cluster.related.length + 1}\n`;
  statusEntry += `- **Base File:** ${path.basename(baseFile.path)}\n`;
  statusEntry += `- **Related Files:** ${relatedFiles}\n`;

  if (conflicts.length > 0) {
    statusEntry += `- **Conflicts:** ${conflicts.length} (see checkpoint for details)\n`;
  } else {
    statusEntry += `- **Conflicts:** None\n`;
  }

  statusEntry += `\n`;

  // Ensure status log file exists
  ensureDirectoryExists(path.dirname(CONFIG.statusLogFile));
  if (!fs.existsSync(CONFIG.statusLogFile)) {
    fs.writeFileSync(CONFIG.statusLogFile, `# Status Log\n\n`);
  }

  // Append to the status log file
  const currentStatus = fs.readFileSync(CONFIG.statusLogFile, 'utf8');
  fs.writeFileSync(CONFIG.statusLogFile, currentStatus + statusEntry);

  log(`Added entries to checkpoint and status log files`);
}

// Main function
async function main() {
  console.log('Memory Bank Consolidation System');
  console.log('===============================');

  ensureAllDirectories();

  // Get all memory bank files
  const files = getMemoryBankFiles();

  if (files.length < 2) {
    log('Not enough files for consolidation (minimum 2 required)', 'WARNING');
    return;
  }

  // Cluster related files
  const clusters = clusterRelatedFiles(files);

  if (clusters.length === 0) {
    log('No clusters found for consolidation', 'INFO');
    return;
  }

  // Process each cluster
  for (const cluster of clusters) {
    // Select the best base file
    const bestBase = selectBaseFile(cluster);

    // If the best base is different from the original base, update the cluster
    if (bestBase.path !== cluster.base.path) {
      log(
        `Selected a different base file: ${path.basename(bestBase.path)} (was: ${path.basename(
          cluster.base.path
        )})`
      );

      // Move the original base to related files
      cluster.related.push(cluster.base);

      // Remove the new base from related files if it's there
      cluster.related = cluster.related.filter(file => file.path !== bestBase.path);

      // Set the new base
      cluster.base = bestBase;
    }

    // Generate a canonical filename
    const canonicalFilename = generateCanonicalFilename(cluster.base, cluster.related);
    const canonicalPath = path.join(CONFIG.memoryBankDir, canonicalFilename);

    // Merge content
    const { content, conflicts } = mergeContent(cluster.base, cluster.related, canonicalFilename);

    // Write the consolidated file
    fs.writeFileSync(canonicalPath, content);
    log(`Wrote consolidated content to ${canonicalFilename}`);

    // Archive deprecated files
    archiveDeprecatedFiles(cluster.related, canonicalFilename);

    // Log the merge
    logMerge(cluster, cluster.base, canonicalFilename, conflicts);

    // Delete the original files (except the base if it's the same as canonical)
    if (path.basename(cluster.base.path) !== canonicalFilename) {
      fs.unlinkSync(cluster.base.path);
      log(`Deleted original base file: ${path.basename(cluster.base.path)}`);
    }

    for (const file of cluster.related) {
      fs.unlinkSync(file.path);
      log(`Deleted original related file: ${path.basename(file.path)}`);
    }
  }

  log(
    `Consolidation complete: processed ${clusters.length} clusters, consolidated ${clusters.reduce(
      (count, cluster) => count + cluster.related.length + 1,
      0
    )} files`
  );
  console.log('\nConsolidation complete!');
}

// Run the script
main().catch(error => {
  log(`Error: ${error.message}`, 'ERROR');
  console.error(error);
});
