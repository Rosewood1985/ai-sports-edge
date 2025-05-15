# AI Sports Edge Project Cleanup Plan

## Overview

This document outlines a comprehensive plan for cleaning up the AI Sports Edge project structure and improving code quality. The plan is based on the findings from the project structure analysis and codebase quality analysis.

## 1. Immediate Actions (No Code Changes)

### 1.1 Create Archive Structure

```bash
# Create archive directory structure
mkdir -p archive/backup-files
mkdir -p archive/deprecated-code
mkdir -p archive/old-configs
mkdir -p archive/logs
```

### 1.2 Document Current State

- Create a snapshot of the current project structure
- Document known issues and technical debt
- Create a list of critical files that should not be modified without careful review

### 1.3 Create Git Backup Branch

```bash
# Create a backup branch before making any changes
git checkout -b backup-before-cleanup-$(date +%Y%m%d)
git push origin backup-before-cleanup-$(date +%Y%m%d)
```

## 2. Phase 1: File Organization

### 2.1 Move Backup Files to Archive

```bash
# Move .bak files to archive
find . -name "*.bak" -exec mv {} archive/backup-files/ \;

# Move files with timestamp suffixes to archive
find . -name "*_20*.log" -exec mv {} archive/logs/ \;
```

### 2.2 Consolidate Deployment Logs

```bash
# Move deployment logs to archive
find . -name "*deploy*.log" -exec mv {} archive/logs/ \;
```

### 2.3 Update .gitignore

Add the following patterns to .gitignore:

```
# Build directories
/dist/
/build/
/web-build/
/.expo/
/coverage/

# Logs
*.log

# Backup files
*.bak
*.backup
*-old*
*-copy*
*-final*
*_20*

# Environment files
.env
.env.*
!.env.example
!.env.template

# Firebase
.firebase/
firebase-debug.log
firebase-debug.*.log
.runtimeconfig.json

# Archive directory
/archive/
```

## 3. Phase 2: Firebase Configuration Consolidation

### 3.1 Select Primary Firebase Implementation

After reviewing all Firebase implementations, we recommend standardizing on the `/config/firebase.ts` implementation because it:

- Uses environment variables for configuration
- Has comprehensive error handling
- Creates placeholder objects to prevent null references
- Follows TypeScript best practices

### 3.2 Move Deprecated Implementations to Archive

```bash
# Move deprecated Firebase implementations to archive
mkdir -p archive/deprecated-code/firebase
cp firebase.js archive/deprecated-code/firebase/
cp src/config/firebase.js archive/deprecated-code/firebase/
cp config/firebase.js archive/deprecated-code/firebase/
```

### 3.3 Update Firebase References

Create a plan to update all imports to use the consolidated Firebase implementation:

1. Identify all files importing Firebase
2. Create a migration script to update imports
3. Test each component after migration

## 4. Phase 3: Component Organization

### 4.1 Complete Atomic Design Migration

The project is partially migrated to atomic design. To complete the migration:

1. Identify components that haven't been migrated
2. Categorize each component as atom, molecule, organism, or template
3. Create migration plan for each component

### 4.2 Component Migration Priority

| Priority | Component Type | Reason |
|----------|---------------|--------|
| High | Authentication | Multiple implementations with inconsistencies |
| High | Firebase Services | Core infrastructure with duplication |
| Medium | UI Components | Visible to users but less critical for functionality |
| Low | Utility Functions | Can be migrated gradually |

### 4.3 Component Migration Process

For each component:

1. Create new file in appropriate atomic directory
2. Refactor component to follow atomic design principles
3. Update imports in dependent files
4. Test functionality
5. Remove old component file

## 5. Phase 4: Code Quality Improvements

### 5.1 Standardize Error Handling

Create a consistent error handling pattern:

```javascript
// Example error handling pattern
try {
  // Operation
} catch (error) {
  // Log error with context
  logError(LogCategory.OPERATION_NAME, 'Operation failed', error);
  
  // Safe error capture for monitoring
  safeErrorCapture(error);
  
  // Return appropriate fallback or rethrow
  return fallbackValue; // or throw error;
}
```

### 5.2 Update Deprecated Patterns

1. Convert class components to functional components with hooks
2. Update Firebase code to use modular v9 API
3. Replace callbacks with Promises or async/await
4. Remove direct DOM manipulation in favor of React's declarative approach

### 5.3 Improve Documentation

Add or improve documentation for:

1. Core Firebase services
2. Authentication flow
3. API endpoints
4. Component props and behavior

## 6. Phase 5: Testing and Validation

### 6.1 Create Test Plan

1. Identify critical paths that must be tested
2. Create test cases for each critical path
3. Automate tests where possible

### 6.2 Manual Testing Checklist

- Authentication (login, signup, password reset)
- Core betting functionality
- User preferences
- Subscription management
- Multilingual support

### 6.3 Performance Testing

- Measure load times before and after cleanup
- Identify and address performance bottlenecks
- Test on multiple devices and browsers

## 7. Implementation Timeline

### 7.1 Week 1: Preparation and File Organization

- Create archive structure
- Document current state
- Create Git backup branch
- Move backup files to archive
- Update .gitignore

### 7.2 Week 2: Firebase Configuration Consolidation

- Select primary Firebase implementation
- Move deprecated implementations to archive
- Update Firebase references
- Test Firebase functionality

### 7.3 Weeks 3-4: Component Organization

- Complete atomic design migration for high-priority components
- Update imports in dependent files
- Test functionality
- Remove old component files

### 7.4 Weeks 5-6: Code Quality Improvements

- Standardize error handling
- Update deprecated patterns
- Improve documentation
- Address performance bottlenecks

### 7.5 Week 7: Testing and Validation

- Execute test plan
- Fix issues identified during testing
- Perform final validation

## 8. Cleanup Script

The following script can be used to automate parts of the cleanup process:

```bash
#!/bin/bash
# project-cleanup.sh
#
# Automates the cleanup of the AI Sports Edge project
# This script should be run from the project root directory

set -e  # Exit on error

# Create timestamp for backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_DIR="./archive"
BACKUP_DIR="$ARCHIVE_DIR/backup-files"
LOG_DIR="$ARCHIVE_DIR/logs"
DEPRECATED_DIR="$ARCHIVE_DIR/deprecated-code"
OLD_CONFIGS_DIR="$ARCHIVE_DIR/old-configs"

# Create archive directory structure
echo "Creating archive directory structure..."
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"
mkdir -p "$DEPRECATED_DIR"
mkdir -p "$OLD_CONFIGS_DIR"

# Create a log file for this cleanup operation
CLEANUP_LOG="$LOG_DIR/cleanup_$TIMESTAMP.log"
touch "$CLEANUP_LOG"

# Function to log messages
log() {
  echo "[$(date +%H:%M:%S)] $1" | tee -a "$CLEANUP_LOG"
}

log "Starting project cleanup..."

# Create Git backup branch
log "Creating Git backup branch..."
git checkout -b backup-before-cleanup-$TIMESTAMP
git push origin backup-before-cleanup-$TIMESTAMP

# Move backup files to archive
log "Moving backup files to archive..."
find . -name "*.bak" -exec mv {} "$BACKUP_DIR/" \;
find . -name "*.backup" -exec mv {} "$BACKUP_DIR/" \;

# Move log files to archive
log "Moving log files to archive..."
find . -name "*.log" -exec mv {} "$LOG_DIR/" \;

# Move files with timestamp suffixes to archive
log "Moving timestamped files to archive..."
find . -name "*_20*.log" -exec mv {} "$LOG_DIR/" \;

# Move deprecated Firebase implementations to archive
log "Moving deprecated Firebase implementations to archive..."
mkdir -p "$DEPRECATED_DIR/firebase"
[ -f "firebase.js" ] && cp firebase.js "$DEPRECATED_DIR/firebase/"
[ -f "src/config/firebase.js" ] && cp src/config/firebase.js "$DEPRECATED_DIR/firebase/"
[ -f "config/firebase.js" ] && cp config/firebase.js "$DEPRECATED_DIR/firebase/"

# Move old webpack configs to archive
log "Moving old webpack configs to archive..."
mkdir -p "$OLD_CONFIGS_DIR/webpack"
find . -name "webpack*.js" -not -name "webpack.config.js" -exec cp {} "$OLD_CONFIGS_DIR/webpack/" \;

# Update .gitignore
log "Updating .gitignore..."
cat > .gitignore.new << EOF
# Learn more https://docs.github.com/en/get-started/getting-started-with-git/ignoring-files

# dependencies
node_modules/

# Expo
.expo/
dist/
web-build/

# Native
*.orig.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision

# Metro
.metro-health-check*

# debug
npm-debug.*
yarn-debug.*
yarn-error.*

# macOS
.DS_Store
*.pem

# local env files
.env
.env.*
!.env.example
!.env.template

# typescript
*.tsbuildinfo

# Build directories
/build/
/coverage/
/.cache/

# Logs
*.log

# Backup files
*.bak
*.backup
*-old*
*-copy*
*-final*
*_20*

# Firebase
.firebase/
firebase-debug.log
firebase-debug.*.log
.runtimeconfig.json

# Archive directory
/archive/
EOF

# Only replace .gitignore if there are differences
if ! cmp -s .gitignore .gitignore.new; then
  mv .gitignore.new .gitignore
  log "Updated .gitignore with new exclusions"
else
  rm .gitignore.new
  log ".gitignore already up to date"
fi

# Summary
log "Cleanup completed successfully!"
log "Summary:"
log "- Archive directory created at: $ARCHIVE_DIR"
log "- Backup files moved to: $BACKUP_DIR"
log "- Log files moved to: $LOG_DIR"
log "- Deprecated code moved to: $DEPRECATED_DIR"
log "- Old configs moved to: $OLD_CONFIGS_DIR"
log "- .gitignore updated"
log ""
log "Next steps:"
log "1. Review the changes with 'git status'"
log "2. Commit the changes with 'git commit -m \"Project cleanup phase 1\"'"
log "3. Continue with Firebase configuration consolidation"
log ""
log "For a detailed cleanup log, see: $CLEANUP_LOG"
```

## 9. Risk Assessment and Mitigation

### 9.1 Potential Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking critical functionality | Medium | High | Create comprehensive test plan, backup before changes |
| Incomplete migration | High | Medium | Prioritize critical components, phase implementation |
| Resistance to change | Medium | Medium | Document benefits, involve team in planning |
| Performance regression | Low | High | Benchmark before and after, performance testing |

### 9.2 Rollback Plan

If issues are encountered:

1. Revert to backup branch
2. Document issues encountered
3. Create more focused, smaller changes
4. Test thoroughly before attempting again

## 10. Success Criteria

The cleanup will be considered successful when:

1. All backup and duplicate files are moved to the archive
2. Firebase configuration is consolidated to a single implementation
3. Components follow atomic design principles consistently
4. Error handling is standardized across the codebase
5. No regression in functionality or performance
6. Documentation is updated to reflect the new structure

## 11. Conclusion

This cleanup plan provides a structured approach to improving the AI Sports Edge project. By following this plan, the project will become more maintainable, easier to understand, and more resilient to bugs. The phased approach ensures that critical functionality is preserved while gradually improving the codebase.

The most important aspects of this plan are:

1. Creating proper backups before making changes
2. Consolidating Firebase configuration
3. Completing the migration to atomic design
4. Standardizing error handling

By addressing these key areas, the project will be well-positioned for future development and maintenance.