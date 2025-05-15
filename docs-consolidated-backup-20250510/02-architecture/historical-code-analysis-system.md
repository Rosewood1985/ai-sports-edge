# Historical Code Analysis System

## Overview

The Historical Code Analysis System is designed to extract valuable insights from your Git repository history, tracking feature development, implementation changes, contributor patterns, and project evolution over time. It integrates with the Progress Backfilling System to provide resumable operations for long-running analyses.

## Features

### 🔍 Comprehensive Git Analysis
- Extract and classify commits by type (features, bugs, refactors)
- Track feature evolution across versions
- Analyze contributor activity and impact
- Identify development milestones and releases

### 📊 Visual Reports
- Interactive HTML reports with charts
- Developer timeline visualization
- Feature development tracking
- Contributor impact analysis

### 🔎 Deep Insights
- File evolution patterns
- Merge and branching strategies
- Implementation lifecycle tracking
- Development velocity analysis

### 🔄 Progress Tracking Integration
- Automatic checkpointing during analysis
- Resumable operations if interrupted
- Detailed progress logging
- Operation management and cleanup

## Quick Start

```bash
# Analyze your repository history
./scripts/roo-history-analyze.js analyze

# Resume an interrupted analysis
./scripts/roo-history-analyze.js resume <operation-id>

# List all analysis operations
./scripts/roo-history-analyze.js list

# Clean up old analysis operations
./scripts/roo-history-analyze.js clean --older-than 30
```

## Commands

### `analyze`
Performs comprehensive historical analysis of your repository.

```bash
./scripts/roo-history-analyze.js analyze [options]

Options:
  --timeframe <period>    Analyze commits from this time period (default: "1 year ago")
  --branches <names>      Comma-separated list of branches to analyze (default: "main,master,develop")
  --output-dir <path>     Directory for analysis reports (default: "reports/historical-analysis")
  --file-patterns <patterns>  Comma-separated file patterns to analyze (default: "*.js,*.jsx,*.ts,*.tsx,*.css,*.html")
  --no-progress           Disable progress tracking
  --checkpoint-interval <number>  Checkpoint interval for progress tracking (default: "100")
```

Example:
```bash
./scripts/roo-history-analyze.js analyze --timeframe "2 years ago" --branches "main,develop,staging"
```

### `resume`
Resumes an interrupted analysis operation.

```bash
./scripts/roo-history-analyze.js resume <operation-id> [options]

Options:
  --output-dir <path>     Directory for analysis reports (default: "reports/historical-analysis")
```

Example:
```bash
./scripts/roo-history-analyze.js resume history-analysis-1234567890
```

### `list`
Lists all analysis operations.

```bash
./scripts/roo-history-analyze.js list [options]

Options:
  --active-only           Show only active operations
  --limit <number>        Limit number of operations (default: "10")
```

Example:
```bash
./scripts/roo-history-analyze.js list --active-only
```

### `clean`
Cleans up old analysis operations.

```bash
./scripts/roo-history-analyze.js clean [options]

Options:
  --older-than <days>     Clean operations older than days (default: "30")
  --dry-run               Dry run (don't actually delete)
```

Example:
```bash
./scripts/roo-history-analyze.js clean --older-than 60 --dry-run
```

## Analysis Process

The Historical Code Analysis System performs the following steps:

1. **Extract Commit History**
   - Retrieves commits from the Git repository
   - Classifies commits by type (feature, bugfix, refactor)
   - Tracks contributor activity

2. **Analyze Features**
   - Groups commits by feature scope
   - Tracks feature evolution over time
   - Calculates feature complexity metrics

3. **Analyze Merge Patterns**
   - Identifies branch patterns (feature, bugfix, release)
   - Tracks merge frequency and patterns
   - Analyzes development workflow

4. **Track File Evolution**
   - Monitors file changes over time
   - Identifies frequently modified files
   - Tracks file lifecycle events

5. **Identify Milestones**
   - Detects version tags and releases
   - Identifies major feature implementations
   - Creates development timeline

6. **Generate Reports**
   - Creates interactive HTML reports
   - Generates JSON data exports
   - Produces markdown summaries

## Progress Tracking Integration

The Historical Code Analysis System integrates with the Progress Backfilling System to provide:

- **Automatic Checkpointing**: Saves progress at configurable intervals
- **Resumable Operations**: Continues analysis from where it left off if interrupted
- **Detailed Logging**: Tracks each stage of the analysis process
- **Operation Management**: Lists, resumes, and cleans up analysis operations

## Report Types

### HTML Report
Interactive web-based report with:
- Executive summary dashboard
- Interactive charts and graphs
- Detailed feature evolution
- Contributor activity timeline
- File change patterns

### Markdown Summary
Text-based summary including:
- Feature development overview
- Top contributors
- Recent milestones
- Development patterns

### JSON Data Dump
Complete data export containing:
- All commits analyzed
- Feature classification
- Contributor statistics
- Timeline events
- File evolution data

## Understanding the Output

### Feature Classification
Features are automatically detected and classified based on commit messages:
- **Feature commits**: Keywords like "feat", "feature", "add", "implement", "create"
- **Bug fixes**: Keywords like "fix", "bug", "resolve", "patch"
- **Refactors**: Keywords like "refactor", "optimize", "improve", "update"

### Feature Status
- **Active**: Recently updated features
- **Inactive**: No updates in the last 90 days
- **Removed**: Features where majority of files have been deleted

### Contributor Metrics
- **Commits**: Total commit count
- **Features**: Number of feature-related commits
- **Bug Fixes**: Number of bug fix commits
- **Impact**: Calculated as features × commits
- **Files Modified**: Unique files changed by contributor

### Timeline Events
- **Releases**: Version tags and release merges
- **Major Features**: High-impact feature implementations
- **Release Merges**: Merges into main branches

## Integration with CI/CD

You can integrate historical analysis into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
name: Historical Analysis
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Full history
      
      - name: Run Historical Analysis
        run: |
          npm install
          node scripts/roo-history-analyze.js analyze
      
      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: historical-analysis
          path: reports/historical-analysis/
```

## Advanced Usage

### Custom Feature Detection
You can customize feature detection by modifying the analyzer options:

```javascript
const analyzer = new HistoricalAnalyzer({
  featureKeywords: ['feat', 'feature', 'add', 'implement', 'create', 'new'],
  bugKeywords: ['fix', 'bug', 'resolve', 'patch', 'hotfix'],
  refactorKeywords: ['refactor', 'optimize', 'improve', 'update', 'enhance']
});
```

### Custom File Patterns
Analyze specific file types:

```javascript
const analyzer = new HistoricalAnalyzer({
  filePatterns: ['*.js', '*.jsx', '*.ts', '*.tsx', '*.vue', '*.svelte']
});
```

### Programmatic API
Use the analyzer programmatically:

```javascript
const HistoricalAnalyzer = require('./libs/analysis/historical-analyzer');
const ProgressTracker = require('./libs/core/progress-tracker');

async function analyzeRepo() {
  // Initialize progress tracker
  const progressTracker = new ProgressTracker('history-analysis');
  await progressTracker.initialize();
  
  // Initialize analyzer with progress callback
  const analyzer = new HistoricalAnalyzer({
    timeframe: '2 years ago',
    outputDir: './analysis-output',
    onProgress: (stage, details) => handleProgressUpdate(progressTracker, stage, details)
  });
  
  // Run analysis
  const result = await analyzer.analyze();
  
  // Complete progress tracking
  await progressTracker.complete();
  
  console.log(`Analyzed ${result.commits} commits`);
  console.log(`Found ${result.features} features`);
  console.log(`Report: ${result.reportPath}`);
}

// Handle progress updates
async function handleProgressUpdate(progressTracker, stage, details) {
  await progressTracker.recordFileOperation(stage, 'progress', details);
}

analyzeRepo();
```

## Troubleshooting

### Common Issues

#### Slow Performance
- Reduce timeframe: `--timeframe "6 months ago"`
- Limit branch analysis: `--branches "main"`
- Filter file patterns: `--file-patterns "*.js,*.ts"`

#### Missing Features
- Check commit message format
- Review feature keywords
- Verify branch inclusion

#### Incomplete Timeline
- Ensure all tags are fetched: `git fetch --tags`
- Check branch coverage
- Verify merge commit detection

#### Interrupted Analysis
- Use the resume command: `./scripts/roo-history-analyze.js resume <operation-id>`
- Check operation status: `./scripts/roo-history-analyze.js list`
- Verify checkpoint files: `.roocode/checkpoints/`

## Performance Considerations

### Large Repositories
For large repositories (>10k commits):
- Use shorter timeframes
- Analyze specific branches
- Limit file patterns
- Run during off-hours

### Memory Usage
The analyzer loads commit data into memory:
- Expect ~100MB per 10k commits
- Use timeframe limits for large repos
- Consider incremental analysis

## Best Practices

1. **Regular Analysis**
   - Run monthly for active projects
   - Weekly for rapid development
   - After major releases

2. **Commit Message Conventions**
   - Use conventional commits
   - Include feature scopes
   - Be consistent with keywords

3. **Branch Strategy**
   - Include development branches
   - Analyze release branches
   - Track feature branches

4. **Report Review**
   - Share with stakeholders
   - Track development velocity
   - Identify bottlenecks

## Integration with Progress Backfilling System

The Historical Code Analysis System integrates with the Progress Backfilling System to provide:

1. **Checkpoint Management**
   - Automatic checkpointing during analysis
   - Checkpoint verification and recovery
   - Checkpoint cleanup and maintenance

2. **Progress Tracking**
   - Real-time progress monitoring
   - Detailed operation logging
   - Progress visualization

3. **Resume Capability**
   - Seamless operation resumption
   - State recovery from checkpoints
   - Backfilling of missing log entries

4. **Operation Management**
   - List active and completed operations
   - Clean up old operations
   - Monitor operation status

For more information on the Progress Backfilling System, see [Progress Backfilling System](progress-backfilling-system.md).