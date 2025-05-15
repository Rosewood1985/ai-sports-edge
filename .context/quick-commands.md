# AI Sports Edge - Quick Commands Reference

## Core Commands
- `roo` - Initialize the system and load context into the current session
- `roo help` - Show all available commands with examples
- `save "message"` - Create a checkpoint of the current context with optional message

## Context Management
- `update` - Update the master context with current session information
- `load-context.sh` - Load the master context into the current session
- `snapshot-context.sh` - Create a timestamped snapshot of the current context
- `detect-new-session.sh` - Check if this is a new session and load context if needed
- `end-task.sh` - Save context and create summary of completed work

## Firebase Migration
- `migrate --file=<filepath>` - Migrate a specific file to atomic architecture and update context
- `migrate --batch=10` - Migrate a batch of 10 files and update context
- `migrate --directory=services --limit=4 --skip=9` - Migrate files with specific parameters
- `node scripts/check-migration-status.js` - Check the current migration status

## Deployment
- `./deploy-atomic-to-production.sh` - Deploy the atomic architecture to production
- `./deploy-to-godaddy.sh` - Deploy to GoDaddy hosting
- `./deploy-to-firebase.sh` - Deploy Firebase functions and configuration

## Development
- `npm run start` - Start the Expo development server
- `npm run test` - Run the test suite
- `npm run lint` - Run linting checks
- `npm run build` - Build the production version

## Git Commands
- `git add .` - Stage all changes
- `git commit -m "commit message"` - Commit staged changes
- `git push origin main` - Push commits to main branch
- `git checkout -b feature/branch-name` - Create and switch to a new feature branch

## Utility Commands
- `find-candidates <category> "<search_pattern>"` - Find files for potential consolidation
  - Example: `find-candidates auth "login|signup|user"` - Find auth-related files
  - Example: `find-candidates firebase "firestore|database|auth"` - Find Firebase-related files
- `find . -name "*.ts" | grep -v "node_modules" | xargs grep "TODO"` - Find all TODOs in TypeScript files
- `find . -name "*.ts" | grep -v "node_modules" | wc -l` - Count all TypeScript files
- `du -sh ./node_modules` - Check size of node_modules directory

## Command Examples

### Core Commands
```bash
# Initialize the system at the start of a session
roo

# Save current context with a descriptive message
save "Completed Firebase auth migration"

# Show all available commands
roo help
```

### Migration Commands
```bash
# Migrate a specific file and update context
migrate --file=services/authService.ts

# Migrate a batch of files with specific parameters
migrate --directory=components --limit=5 --skip=10
```

### Analysis Commands
```bash
# Find consolidation candidates for authentication-related files
find-candidates auth "login|signup|authentication|user"

# Find consolidation candidates for notification-related files
find-candidates notifications "alert|message|notification|toast"
```