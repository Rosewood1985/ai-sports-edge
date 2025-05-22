# Background Process Reorganization & Migration Plan

## Overview

This document outlines the comprehensive plan for reorganizing and migrating all 23 background processes in the AI Sports Edge codebase. The plan is divided into three priority phases to ensure critical processes remain functional while improving the overall architecture.

## Process Classification

Based on the strategic assessment, the 23 background processes have been categorized as follows:

### Category A: PRODUCTION ACTIVE (7 processes)

- Currently running and critical
- Monitor immediately in admin dashboard
- Keep in current location, migrate to atomic structure

### Category B: PRODUCTION READY (5 processes)

- Built but not deployed/configured
- Should be activated for production value
- High priority for reactivation and monitoring

### Category C: DEVELOPMENT/STAGING VALUE (6 processes)

- Useful for dev/testing environments
- Should be maintained and potentially activated
- Include in dashboard with environment toggles

### Category D: VALUABLE LOGIC - NEEDS MIGRATION (3 processes)

- Good functionality but legacy implementation
- Extract valuable logic, rebuild with modern architecture
- Include core functionality in unified dashboard

### Category E: DEPRECATED (2 processes)

- Truly outdated or replaced functionality
- Safe to move to legacy folder
- Document and archive

## Execution Plan

### Priority 1: Verification & Activation (Do Today)

#### 1A: Verify Category A Processes

Check these 7 critical processes are actually running:

1. **processScheduledNotifications** (functions/processScheduledNotifications.js)

   - Check Firebase Console: Functions → processScheduledNotifications
   - Verify last execution time (should be within last hour)
   - Test notification delivery functionality
   - Document: Status, last run, any errors

2. **markAIPickOfDay** (functions/src/markAIPickOfDay.ts)

   - Check Firebase Console: Functions → markAIPickOfDay
   - Verify last execution time (should be daily at 9:00 AM ET)
   - Check if AI Pick of Day is being marked correctly
   - Document: Status, last run, pick selection accuracy

3. **predictTodayGames** (functions/src/predictTodayGames.ts)

   - Check Firebase Console: Functions → predictTodayGames
   - Verify last execution time (should be daily at 10:00 AM ET)
   - Check if predictions are being generated
   - Document: Status, last run, prediction count

4. **scheduledFirestoreBackup** (functions/src/backups.ts)

   - Check Firebase Console: Functions → scheduledFirestoreBackup
   - Verify last execution time (should be daily at 3:00 AM UTC)
   - Check backup storage and file sizes
   - Document: Status, last run, backup size

5. **networkService** (services/networkService.ts)

   - Check mobile app logs for network service activity
   - Verify reconnection handling is working
   - Test with network interruption scenarios
   - Document: Status, reconnection success rate

6. **playerStatsService** (services/playerStatsService.ts)

   - Check mobile app for real-time stats updates
   - Verify updates during live games
   - Test stat accuracy and update frequency
   - Document: Status, update frequency, accuracy

7. **cleanupOldNotifications** (functions/processScheduledNotifications.js)
   - Check Firebase Console for cleanup function execution
   - Verify old notifications are being removed
   - Check database size trends
   - Document: Status, last cleanup, items removed

#### 1B: Activate Category B Processes

Activate these 5 high-value processes immediately:

1. **processRssFeedsAndNotify** (functions/rssFeedNotifications.js)

   - Deploy function if not active
   - Configure RSS feed sources
   - Test notification delivery
   - Activate with 30-minute schedule
   - Document: Deployment status, feed sources, test results

2. **scripts/update-model.sh** (setup-all-cron.command)

   - Verify script exists and is executable
   - Test manual execution
   - Configure daily cron job (2:30 AM)
   - Monitor model update success
   - Document: Script status, last update, model version

3. **crossPlatformSyncService** (services/crossPlatformSyncService.ts)

   - Initialize service in mobile app
   - Test sync between web and mobile
   - Configure sync intervals
   - Monitor sync success rates
   - Document: Service status, sync frequency, success rate

4. **offlineService** (services/offlineService.ts)

   - Initialize service in mobile app
   - Test offline data handling
   - Configure sync queue management
   - Test offline-to-online transitions
   - Document: Service status, queue size, sync success

5. **auto-archive-kickoff.command** (setup-all-cron.command)
   - Verify script exists and is executable
   - Test manual execution
   - Configure daily cron job (12:01 AM)
   - Monitor archiving success
   - Document: Script status, last archive, items processed

#### 1C: Document All Findings

Create immediate status report with findings from 1A and 1B.

### Priority 2: Admin Dashboard Foundation (This Week)

After completing Priority 1 verification and activation, immediately start building the admin dashboard monitoring:

#### 2A: Create Core Dashboard Components

```
/src/organisms/admin/
  /ProcessMonitor/           # Real-time status of all active processes
  /CriticalAlertsPanel/      # Failed processes and errors
  /SystemHealthOverview/     # Overall system status
  /QuickActionButtons/       # Manual process triggers

/src/molecules/admin/
  /ProcessStatusCard/        # Individual process status widget
  /PerformanceMetric/        # Success rates, execution times
  /AlertBadge/              # Visual status indicators
  /ManualTriggerButton/     # Process control buttons
```

#### 2B: Implement Basic Monitoring

- Create API endpoints for process status
- Set up WebSocket connections for real-time updates
- Implement process health checks
- Create manual trigger functionality

#### 2C: Dashboard Must Monitor

- All verified Category A processes (real-time status)
- All activated Category B processes (activation status)
- Process execution times and success rates
- Error notifications for any failures
- Manual trigger capabilities for critical processes

### Priority 3: File Reorganization (Next Week)

After the dashboard foundation is working, reorganize all files into this unified structure:

```
/src/background-processes/

  /firebase-functions/           # All Firebase Cloud Functions
    /core-ai/                   # AI prediction functions
      ├─ markAIPickOfDay.ts
      ├─ predictTodayGames.ts
      └─ updateStatsPage.ts

    /notifications/             # Notification functions
      ├─ processScheduledNotifications.ts
      └─ processRssFeedsAndNotify.ts

    /maintenance/               # System maintenance functions
      ├─ scheduledFirestoreBackup.ts
      └─ cleanupOldNotifications.ts

  /system-cron/                 # All system cron jobs
    /daily-workflow/
      ├─ start-my-day.command
      ├─ save-and-wrap-midday.command
      ├─ daily-wrap-evening.command
      └─ overnight-sync-late-night.command

    /maintenance/
      ├─ update-model.sh
      ├─ clean-database-weekly.command
      └─ auto-archive-kickoff.command

    /development/
      └─ friday-sprint-review.command

  /mobile-services/             # Background services for mobile app
    /connectivity/
      └─ networkService.ts

    /data-sync/
      ├─ crossPlatformSyncService.ts
      ├─ offlineService.ts
      └─ offlineQueueService.ts

    /real-time/
      └─ playerStatsService.ts

  /node-jobs/                   # Node.js cron jobs
    └─ rssFeedCronJob.js

  /legacy/                      # Deprecated processes
    ├─ pushNotificationService.ts
    └─ loggingService.ts

  /shared/                      # Shared utilities for all processes
    ├─ processLogger.ts
    ├─ errorHandler.ts
    └─ configManager.ts

  /docs/                        # Documentation
    ├─ README.md
    ├─ deployment-guide.md
    └─ monitoring-setup.md
```

#### 3A: Create Directory Structure

- Create all necessary directories in the new structure
- Set up index files for each directory
- Establish proper import/export patterns

#### 3B: Migrate Files

- Move all files to their new locations
- Update imports in existing files
- Run tests to ensure functionality

#### 3C: Create Shared Utilities

**Process Logger:**

```typescript
// /src/background-processes/shared/processLogger.ts
export class ProcessLogger {
  static log(processName: string, message: string, level: 'info' | 'warn' | 'error' = 'info') {
    // Centralized logging for all background processes
  }
}
```

**Error Handler:**

```typescript
// /src/background-processes/shared/errorHandler.ts
export class ProcessErrorHandler {
  static handleError(processName: string, error: Error) {
    // Centralized error handling for all background processes
  }
}
```

**Config Manager:**

```typescript
// /src/background-processes/shared/configManager.ts
export class ProcessConfig {
  static getConfig(processName: string) {
    // Centralized configuration for all background processes
  }
}
```

#### 3D: Update Configuration Files

- Update `firebase.json` and any deployment scripts
- Update or create new cron setup scripts
- Update build processes (webpack, typescript, etc.)

#### 3E: Create Documentation

- Create README files for each directory
- Document the new structure
- Create deployment and monitoring guides

## Execution Commands

### Priority 1 Commands (Execute Today):

**Command 1A: Verify Category A Processes**

```bash
# Check Firebase Functions status
firebase functions:list

# Check recent function executions
firebase functions:log --only processScheduledNotifications,markAIPickOfDay,predictTodayGames,scheduledFirestoreBackup

# Check system processes
ps aux | grep node
crontab -l

# Document findings in immediate status report
```

**Command 1B: Activate Category B Processes**

```bash
# Deploy RSS feed function if needed
firebase deploy --only functions:processRssFeedsAndNotify

# Activate model update cron
chmod +x scripts/update-model.sh
# Add to crontab: 30 2 * * * /path/to/scripts/update-model.sh

# Test and activate mobile services
# (Check mobile app initialization)

# Test and activate archive cron
chmod +x auto-archive-kickoff.command
# Add to crontab: 1 0 * * * /path/to/auto-archive-kickoff.command
```

### Priority 2 Commands (This Week):

**Command 2A: Create Dashboard Foundation**

```typescript
// Create essential monitoring components
// Focus on real-time status for verified processes
// Implement manual triggers for critical processes
// Set up basic alerting for failures
```

**Command 2B: Implement Basic Monitoring**

```typescript
// Create API endpoints for process status
// Set up WebSocket connections for real-time updates
// Implement process health checks
// Create manual trigger functionality
```

### Priority 3 Commands (Next Week):

**Command 3A: Execute File Reorganization**

```bash
# Create directory structure
mkdir -p src/background-processes/{firebase-functions/{core-ai,notifications,maintenance},system-cron/{daily-workflow,maintenance,development},mobile-services/{connectivity,data-sync,real-time},node-jobs,legacy,shared,docs}

# Move files to new locations
# Example:
mv functions/src/markAIPickOfDay.ts src/background-processes/firebase-functions/core-ai/
mv functions/src/predictTodayGames.ts src/background-processes/firebase-functions/core-ai/
# etc.

# Update imports and test functionality
```

## Testing Requirements

After completing the migration, verify:

### Functionality Tests

- [ ] All Firebase functions deploy successfully from new locations
- [ ] All cron jobs execute from new command locations
- [ ] All mobile services load and function correctly
- [ ] All import paths resolve properly throughout the codebase

### Integration Tests

- [ ] Admin dashboard can discover all processes in new locations
- [ ] Process monitoring works with new structure
- [ ] Manual process triggers function correctly
- [ ] Error handling and logging work from new locations

### Deployment Tests

- [ ] Firebase functions deployment succeeds
- [ ] Cron job installation script works
- [ ] Mobile app builds and runs with new service locations
- [ ] All environment configurations work (dev/staging/prod)

## Success Criteria

✅ **Centralized Management** - All 23 background processes in one organized location  
✅ **Clear Categories** - Easy to find and manage specific types of processes  
✅ **Better Monitoring** - Admin dashboard can easily scan organized structure  
✅ **Easier Deployment** - Clear deployment paths for each category  
✅ **Self-Documenting** - Directory structure clearly shows process organization  
✅ **Maintenance Ready** - Easy to add new processes in correct locations

## Phase Completion Criteria

### PRIORITY 1 COMPLETION (End of Day 1):

✅ **Status Report** - Complete verification of all 7 Category A processes  
✅ **Activation Report** - All 5 Category B processes activated and tested
✅ **Issue Log** - Documented list of any problems found and fixes needed
✅ **Process Inventory** - Clear list of what's working vs what needs attention

### PRIORITY 2 COMPLETION (End of Week 1):

✅ **Dashboard Foundation** - Basic admin dashboard monitoring all active processes
✅ **Real-time Monitoring** - Live status indicators for all verified processes  
✅ **Manual Controls** - Trigger buttons for critical processes
✅ **Basic Alerting** - Notifications for process failures

### PRIORITY 3 COMPLETION (End of Week 2):

✅ **File Reorganization** - All 23 processes moved to unified structure
✅ **Updated Configurations** - All deployment and build configs updated for new paths
✅ **Complete Documentation** - READMEs and guides for new structure
✅ **Advanced Dashboard** - Environment toggles and migration tools
