# Automation Architecture: AI Sports Edge Project Tools

This document outlines the planned automation architecture for the AI Sports Edge project, including file duplication prevention, QA heatmap generation, deployment validation, and file cleanup utilities.

## 1. File Duplication Prevention System (Roo Code Automation Rule)

### Architecture Overview
```
┌─────────────────────┐      ┌─────────────────────┐     ┌─────────────────────┐
│  Pre-Commit Hook    │──────▶  Content Analysis   │────▶│ Duplication Report  │
└─────────────────────┘      └─────────────────────┘     └─────────────────────┘
          │                            │                            │
          │                            │                            │
          ▼                            ▼                            ▼
┌─────────────────────┐      ┌─────────────────────┐     ┌─────────────────────┐
│ Similar File Finder │      │  Similarity Score   │     │  Decision Logger    │
└─────────────────────┘      └─────────────────────┘     └─────────────────────┘
```

### Components
1. **Pre-Commit Hook Script** (`scripts/prevent-duplicates.js`)
   - Triggered before every commit
   - Scans staged files to be committed
   - Calls similar file finder for each staged file

2. **Similar File Finder** (`scripts/libs/file-similarity.js`)
   - Searches codebase for files with similar:
     - Names (using fuzzy matching)
     - Content (using content similarity algorithms)
     - Purpose (based on imports/exports)
   - Returns list of potential duplicates

3. **Content Analysis Engine** (`scripts/libs/content-analyzer.js`)
   - Compares file content using tokenization
   - Uses TF-IDF (Term Frequency-Inverse Document Frequency) to determine similarity
   - Gives higher weight to imports, component names, and function declarations

4. **Duplication Report Generator** (`scripts/libs/duplication-reporter.js`)
   - Creates clear report of duplicates with similarity scores
   - Suggests which file to keep and which to merge/remove
   - Provides commands for merging/resolving duplications

5. **Decision Logger** (`scripts/libs/decision-logger.js`)
   - Logs decisions to `/status/status-log.md`
   - Records rationale for keeping/removing files
   - Maintains history of file deduplication decisions

### Implementation Path
1. Start with basic Git hook integration
2. Implement file name similarity detection
3. Add content similarity detection
4. Build reporting and logging components

## 2. QA Heatmap Generator for Firebase Migration

### Architecture Overview
```
┌─────────────────────┐      ┌─────────────────────┐     ┌─────────────────────┐
│  Coverage Analyzer  │──────▶  Firebase Scanner   │────▶│   Testing Metrics   │
└─────────────────────┘      └─────────────────────┘     └─────────────────────┘
          │                            │                            │
          │                            │                            │
          ▼                            ▼                            ▼
┌─────────────────────┐      ┌─────────────────────┐     ┌─────────────────────┐
│   Heatmap Creator   │      │   Report Generator  │     │  Priority Advisor   │
└─────────────────────┘      └─────────────────────┘     └─────────────────────┘
```

### Components
1. **Coverage Analyzer** (`scripts/qa-coverage-analyzer.js`)
   - Scans project for test files
   - Maps tests to implementation files
   - Calculates test coverage metrics
   - Identifies untested components

2. **Firebase Scanner** (`scripts/libs/firebase-scanner.js`)
   - Detects Firebase usage across codebase
   - Identifies components requiring migration
   - Maps Firebase dependencies and usage patterns
   - Integrates with firebase-migration-tracker.sh

3. **Testing Metrics Collector** (`scripts/libs/testing-metrics.js`)
   - Gathers test execution data
   - Tracks test success/failure rates
   - Records test coverage percentages
   - Analyzes test complexity and thoroughness

4. **Heatmap Creator** (`scripts/libs/heatmap-generator.js`)
   - Generates visual SVG heatmap
   - Colors components based on test coverage
   - Highlights Firebase components needing migration
   - Shows risk levels for each component

5. **Report Generator** (`scripts/libs/coverage-reporter.js`)
   - Creates comprehensive coverage report
   - Lists components by risk level
   - Provides test coverage statistics
   - Identifies critical gaps in testing

6. **Priority Advisor** (`scripts/libs/priority-advisor.js`)
   - Recommends testing priorities
   - Suggests which components to test first
   - Provides sample test structures
   - Estimates testing effort required

### Implementation Path
1. Build basic coverage scanner
2. Add Firebase usage detection
3. Implement metrics collection
4. Create visual heatmap generator
5. Develop reporting and prioritization system

## 3. Deployment Validation System

### Architecture Overview
```
┌─────────────────────┐      ┌─────────────────────┐     ┌─────────────────────┐
│  Deployment Hook    │──────▶  Local File Indexer │────▶│  Remote File Fetch  │
└─────────────────────┘      └─────────────────────┘     └─────────────────────┘
          │                            │                            │
          │                            │                            │
          ▼                            ▼                            ▼
┌─────────────────────┐      ┌─────────────────────┐     ┌─────────────────────┐
│  Diff Generator     │      │  Validation Report  │     │   Cache Purger      │
└─────────────────────┘      └─────────────────────┘     └─────────────────────┘
```

### Components
1. **Deployment Hook** (`scripts/post-deploy-validate.js`)
   - Triggers after Firebase deployment
   - Initiates validation process
   - Tracks deployment timestamps
   - Integrates with GitHub Actions workflow

2. **Local File Indexer** (`scripts/libs/local-file-indexer.js`)
   - Creates index of critical local files
   - Computes checksums of build artifacts
   - Records file metadata (size, modified date)
   - Focuses on key files: bundle.js, index.html, critical CSS

3. **Remote File Fetcher** (`scripts/libs/remote-file-fetcher.js`)
   - Retrieves deployed files from production site
   - Handles authentication if needed
   - Downloads key files for comparison
   - Respects rate limits and caching

4. **Diff Generator** (`scripts/libs/deployment-diff.js`)
   - Compares local and remote files
   - Identifies discrepancies in content
   - Detects missing or extra files
   - Analyzes timestamp differences

5. **Validation Report Generator** (`scripts/libs/validation-reporter.js`)
   - Creates detailed validation report
   - Lists successful and failed validations
   - Provides error details and troubleshooting steps
   - Sends notifications for critical issues

6. **CDN Cache Purger** (`scripts/libs/cache-purger.js`)
   - Detects when cache purging is needed
   - Sends cache invalidation requests
   - Verifies cache status
   - Handles retries if needed

### Implementation Path
1. Create basic post-deployment script
2. Implement local file indexing
3. Add remote file fetching
4. Build diff generation and reporting
5. Add CDN cache purging capabilities

## 4. File Cleanup Utilities

### Architecture Overview
```
┌─────────────────────┐      ┌─────────────────────┐     ┌─────────────────────┐
│ Asset Usage Scanner │──────▶  Orphan Detector    │────▶│  Cleanup Planner    │
└─────────────────────┘      └─────────────────────┘     └─────────────────────┘
          │                            │                            │
          │                            │                            │
          ▼                            ▼                            ▼
┌─────────────────────┐      ┌─────────────────────┐     ┌─────────────────────┐
│ Artifact Cleaner    │      │  Backup Manager     │     │   Cleanup Report    │
└─────────────────────┘      └─────────────────────┘     └─────────────────────┘
```

### Components
1. **Asset Usage Scanner** (`scripts/file-cleanup.js`)
   - Scans codebase for asset references
   - Maps assets to their usage locations
   - Creates dependency graph
   - Identifies files referenced in code

2. **Orphan Detector** (`scripts/libs/orphan-detector.js`)
   - Finds unlinked/unused assets in `/assets/`
   - Detects build artifacts without commits
   - Identifies duplicate assets with different names
   - Flags abandoned feature branches

3. **Cleanup Planner** (`scripts/libs/cleanup-planner.js`)
   - Creates cleanup action plan
   - Prioritizes cleanup tasks
   - Estimates disk space savings
   - Generates cleanup commands

4. **Artifact Cleaner** (`scripts/libs/artifact-cleaner.js`)
   - Safely removes build artifacts
   - Cleans up temporary files
   - Organizes assets into proper directories
   - Performs file deduplication

5. **Backup Manager** (`scripts/libs/backup-manager.js`)
   - Creates backups before cleanup
   - Archives removed files
   - Maintains cleanup history
   - Enables file restoration if needed

6. **Cleanup Report Generator** (`scripts/libs/cleanup-reporter.js`)
   - Produces cleanup summary
   - Lists removed and preserved files
   - Reports space saved
   - Provides restoration instructions

### Implementation Path
1. Build basic asset scanner
2. Implement orphan detection
3. Create backup system
4. Add cleanup planning and execution
5. Develop reporting system

## Integration Plan

1. **Week 1: Core Development**
   - Implement File Duplication Prevention System
   - Set up basic QA Heatmap infrastructure
   - Create scaffolding for all systems

2. **Week 2: Functionality Expansion**
   - Complete QA Heatmap Generator
   - Implement Deployment Validation
   - Add preliminary File Cleanup Utilities

3. **Week 3: Integration & Refinement**
   - Integrate all systems with existing workflow
   - Add automated scheduling
   - Refine reporting and visualization

4. **Week 4: Documentation & Training**
   - Create comprehensive documentation
   - Add system monitoring
   - Implement usage telemetry

## Immediate Next Steps

1. Create pre-commit hook framework
2. Implement basic file similarity detection
3. Set up test coverage analysis infrastructure
4. Develop deployment validation prototype

Each system is designed to be modular, allowing for incremental implementation and independent operation while maintaining coordination through shared libraries and reporting tools.

## Relationship to Existing Tools

This automation architecture builds upon and complements the existing tools:

1. **Firebase Integration & Migration Tools**
   - The QA Heatmap Generator will enhance the Firebase migration process
   - The Deployment Validation System will ensure successful Firebase deployments

2. **Project Analysis Tools**
   - The File Duplication Prevention System will improve code quality
   - The File Cleanup Utilities will maintain a clean project structure

3. **Workflow Tools**
   - All new automation systems will integrate with the existing workflow tools
   - The session management scripts will be enhanced with automation status reports

4. **Team Velocity Tracking**
   - Automation metrics will be incorporated into velocity tracking
   - The QA Heatmap will provide insights for velocity improvement

This comprehensive automation architecture will significantly enhance the development workflow, code quality, and deployment reliability of the AI Sports Edge project.