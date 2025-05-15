# Content-Based Duplicate Detection Architecture

This document outlines the detailed architecture for implementing the Content-Based Duplicate Detection system for the AI Sports Edge project.

## System Overview
```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Content Analyzer  │────▶│ Similarity Detector │────▶│   Decision Engine   │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
          │                          │                           │
          ▼                          ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│ File Fingerprinting │     │   Code Structure    │     │    Safe Actions     │
│      Engine         │     │     Analyzer        │     │     Manager         │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
          │                          │                           │
          └──────────────────────────┼───────────────────────────┘
                                     ▼
                         ┌─────────────────────┐
                         │  Visualization &    │
                         │     Reporting       │
                         └─────────────────────┘
```

## Core Components

### 1. Content Analyzer Module

The Content Analyzer is responsible for analyzing file content and generating various fingerprints and hashes that can be used to detect duplicates.

**Key Features:**
- Full content hashing for exact matches
- Chunk-based hashing for partial matches
- Token fingerprinting for code similarity
- Import/dependency signature extraction
- Code structure analysis
- Binary file handling

**Implementation Path:**
1. Create basic file content analyzer with SHA-256 hashing
2. Add chunk-based hashing for partial similarity detection
3. Implement language-specific token fingerprinting
4. Add import/dependency signature extraction
5. Implement code structure analysis

### 2. Similarity Detector Module

The Similarity Detector uses the output from the Content Analyzer to find similar files based on various metrics.

**Key Features:**
- Exact match detection using full content hashes
- Chunk similarity calculation for partial matches
- Token similarity using Jaccard index
- Import signature similarity
- Structure similarity for code files
- Combined similarity scoring with weighted metrics

**Implementation Path:**
1. Implement exact match detection using full hashes
2. Add chunk similarity calculation
3. Implement token similarity using Jaccard index
4. Add import and structure similarity metrics
5. Create combined similarity scoring system

### 3. Decision Engine Module

The Decision Engine makes safe decisions about which files to keep and which to remove based on the similarity analysis.

**Key Features:**
- File scoring based on multiple criteria
- Safety thresholds for automatic decisions
- Backup creation before file removal
- Detailed logging of all actions
- Dry-run mode for testing

**Implementation Path:**
1. Implement file scoring system
2. Add safety thresholds for automatic decisions
3. Create backup system for file removal
4. Implement detailed logging
5. Add dry-run mode

### 4. Visualization & Reporting Module

The Visualization & Reporting module generates comprehensive reports of duplicate files and recommendations.

**Key Features:**
- Interactive HTML reports
- Command-line summaries
- Visual diff views
- File content comparison
- Detailed statistics and metrics

**Implementation Path:**
1. Create basic HTML report generator
2. Add command-line summary generation
3. Implement file content comparison views
4. Add interactive elements to HTML reports
5. Create detailed statistics and metrics

## Key Files

```
scripts/
  file-content-duplicates.js (main script)
  libs/
    content/
      content-analyzer.js
      file-type-detector.js
    similarity/
      similarity-detector.js
    decision/
      decision-engine.js
    visualization/
      duplicate-visualizer.js
reports/
  duplicates/ (for reports)
.roocode/
  backups/duplicates/ (for backups)
  logs/ (for logs)
```

## Integration with Existing File Cleanup Utilities

The Content-Based Duplicate Detection system will integrate with the existing File Cleanup Utilities to provide a comprehensive solution for detecting and removing duplicate files.

**Integration Points:**
1. Add content-based duplicate detection to `scripts/file-cleanup.js`
2. Create VSCode tasks for easy access
3. Add CLI interface with multiple options
4. Provide module exports for programmatic use

## Error Proofing and Automation Features

### Safety Checks
- Multiple similarity metrics to avoid false positives
- Backup of all files before removal
- Dry-run mode by default
- Ignores critical directories automatically
- File size thresholds to avoid trivial matches

### Autonomous Decision Making
- Smart scoring system to decide which file to keep
- Automatic vs. manual decision thresholds
- Safety level indicators for each recommendation

### Comprehensive Reporting
- Interactive HTML report for visual analysis
- Command-line summary for quick review
- Detailed logs of all actions

### Integration Points
- VSCode tasks for easy access
- CLI interface with multiple options
- Module export for programmatic use
- Integration with existing cleanup utilities

## Implementation Plan

### Phase 1: Core Components
1. Implement Content Analyzer with basic hashing
2. Create Similarity Detector with exact match detection
3. Build Decision Engine with basic file scoring
4. Develop simple HTML report generator

### Phase 2: Enhanced Features
1. Add chunk-based and token-based similarity detection
2. Implement code structure analysis
3. Enhance decision engine with safety thresholds
4. Improve visualization with interactive elements

### Phase 3: Integration & Polish
1. Integrate with existing File Cleanup Utilities
2. Add VSCode tasks and CLI interface
3. Implement backup and logging systems
4. Create comprehensive documentation

### Phase 4: Automation & CI/CD
1. Add automated scheduling for regular scans
2. Implement notification system for large duplicates
3. Create GitHub Actions integration
4. Add historical tracking of duplicate metrics