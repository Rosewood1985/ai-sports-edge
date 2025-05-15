# Memory Bank System

The Memory Bank System is a comprehensive solution for maintaining code quality, reducing duplication, and enforcing consistent practices across the AI Sports Edge project.

## Overview

The Memory Bank System consists of several components:

1. **Central Memory Bank** (.roocode/memory_bank.md) - A central repository of knowledge, patterns, and best practices
2. **Memory Bank CLI** (scripts/memory_bank.sh) - A command-line tool for accessing and updating the memory bank
3. **File Creation Tool** (scripts/new_file.sh) - A tool for creating new files with duplication checks
4. **Code Duplication Detector** (scripts/detect_duplicates.sh) - A tool for finding and reporting code duplication
5. **Git Hooks Integration** - Pre-commit and post-commit hooks to enforce memory bank principles

## Usage

### Memory Bank CLI

```bash
# Show the entire memory bank
./scripts/memory_bank.sh show

# Search the memory bank
./scripts/memory_bank.sh search Firebase

# Add a new entry to the memory bank
./scripts/memory_bank.sh add "Best Practices" "State Management" "Use Redux for global state and React Context for component state"

# Check for similar content in the codebase
./scripts/memory_bank.sh check component Button

# Set up Git hooks for memory bank enforcement
./scripts/memory_bank.sh setup-checks

# Show project progress and recent activity
./scripts/memory_bank.sh progress
```

### File Creation Tool

```bash
# Create a new React component (atom, molecule, organism, template)
./scripts/new_file.sh component Button atom

# Create a new React hook
./scripts/new_file.sh hook useAuth

# Create a new utility file
./scripts/new_file.sh util dateFormatter

# Create a new service file
./scripts/new_file.sh service api

# Create a new documentation file
./scripts/new_file.sh doc firebase-integration
```

### Code Duplication Detector

```bash
# Run the code duplication detector
./scripts/detect_duplicates.sh
```

The detector will generate a report in the `reports` directory with findings and recommendations.

### Git Workflow Integration

The Memory Bank System is integrated with the Git workflow helper:

```bash
# Access memory bank from Git workflow helper
./scripts/git_workflow_helper.sh memory show

# Create new file with checks from Git workflow helper
./scripts/git_workflow_helper.sh newfile component Button atom

# Run duplication detector from Git workflow helper
./scripts/git_workflow_helper.sh duplicates
```

## Git Hooks

### Pre-commit Hook

The pre-commit hook enforces memory bank principles by:

1. Checking for multiple Firebase imports outside of the consolidated implementation
2. Reminding to check for similar components when creating or modifying components

### Post-commit Hook

The post-commit hook automatically updates the memory bank when commits are related to memory bank principles (contains keywords like "memory", "bank", "duplicate", "consolidate", "merge", "component", "firebase", "utility").

## Activity Logs

The Memory Bank System maintains activity logs in the `.roocode/activity_logs` directory:

- **Development Log** - Daily development activities
- **Progress Summary** - Bird's-eye view of project progress
- **Implementations** - Detailed implementation tracking

## Benefits

- **Reduced Duplication** - Prevents creating duplicate components, utilities, and services
- **Consistent Practices** - Enforces project-wide best practices
- **Knowledge Preservation** - Centralizes project knowledge and patterns
- **Code Quality** - Improves overall code quality through standardization
- **Onboarding** - Makes it easier for new developers to understand the codebase

## Maintenance

The Memory Bank System is designed to be self-maintaining through Git hooks, but it's recommended to:

1. Periodically run the code duplication detector to find new duplications
2. Update the memory bank with new patterns and best practices
3. Review and act on the recommendations in duplication reports