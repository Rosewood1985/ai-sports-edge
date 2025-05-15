# AI Sports Edge CLI Tools

This directory contains CLI tools and utilities for the AI Sports Edge project.

## Overview

The CLI tools provide a centralized way to manage operations in the AI Sports Edge project, including:

- Firebase migrations
- Memory bank management
- Deployment operations
- Status tracking

## Main CLI Tool: ops.ts

The main entry point is `ops.ts`, which provides a command-line interface for various operations.

### Installation

The CLI tools are already integrated into the project's package.json scripts. To use them, you need to have the required dependencies installed:

```bash
npm install
```

### Usage

You can use the CLI tools in several ways:

#### 1. Using npm scripts

```bash
# Run the ops CLI
npm run ops

# Firebase migration commands
npm run firebase:migrate
npm run firebase:status
npm run firebase:tag
npm run firebase:accelerate

# Memory bank commands
npm run memory:update
npm run memory:checkpoint

# CLI package commands
npm run build:cli
npm run publish:cli
```

#### 2. Using the Makefile

```bash
# Run the ops CLI
make ops

# Firebase migration commands
make firebase-migrate
make firebase-status
make firebase-tag
make firebase-accelerate

# Memory bank commands
make memory-update
make memory-checkpoint

# CLI package commands
make build-cli
make publish-cli
```

#### 3. Direct execution

```bash
# Run the ops CLI
npx ts-node tools/ops.ts

# Firebase migration commands
npx ts-node tools/ops.ts firebase:migrate
npx ts-node tools/ops.ts firebase:status
npx ts-node tools/ops.ts firebase:tag
npx ts-node tools/ops.ts firebase:accelerate

# Memory bank commands
npx ts-node tools/ops.ts memory:update
npx ts-node tools/ops.ts memory:checkpoint

# CLI package commands
npx ts-node tools/ops.ts build:cli
npx ts-node tools/ops.ts publish:cli
```

## Available Commands

### Firebase Migration Commands

- `firebase:migrate`: Run the complete Firebase migration process
  - Options:
    - `-f, --file <file>`: Specific file to migrate
    - `-b, --batch-size <size>`: Number of files to migrate in each batch (default: 5)
    - `-a, --auto-confirm`: Automatically confirm migrations without prompting

- `firebase:status`: Check the status of Firebase migration

- `firebase:tag`: Tag migrated Firebase files
  - Options:
    - `-r, --retro`: Retroactively tag all migrated files
    - `-f, --file <file>`: Specific file to tag

- `firebase:consolidate`: Consolidate multiple Firebase files into one
  - Options:
    - `-o, --output <file>`: Output file path (required)
    - `-i, --input <files...>`: Input files to consolidate (required)

- `firebase:accelerate`: Accelerate Firebase migration process
  - Options:
    - `-b, --batch-size <size>`: Number of files to migrate in each batch (default: 5)
    - `-a, --auto-confirm`: Automatically confirm migrations without prompting

### Memory Bank Commands

- `memory:update`: Update memory bank with current status

- `memory:checkpoint`: Create a memory bank checkpoint

### Script Management Commands

- `scripts:consolidate`: Consolidate scattered scripts into the scripts directory
  - Options:
    - `--dry-run`: Show what would be done without actually doing it
    - `--no-links`: Don't create symbolic links in original locations
    - `--comprehensive`: Perform comprehensive consolidation including reference updates

  This command can also be run with the comprehensive option directly:
  ```bash
  npm run scripts:consolidate:comprehensive
  ```

### Testing Commands

- `test:unit`: Run unit tests
  - Options:
    - `-w, --watch`: Run tests in watch mode
    - `-c, --coverage`: Generate coverage report

- `test:integration`: Run integration tests
  - Options:
    - `-w, --watch`: Run tests in watch mode
    - `-c, --coverage`: Generate coverage report

- `test:e2e`: Run end-to-end tests
  - Options:
    - `-h, --headless`: Run tests in headless mode (default: true)
    - `-b, --browser <browser>`: Browser to use for testing (default: chrome)

- `test:coverage`: Generate test coverage report

### Linting Commands

- `lint:js`: Lint JavaScript and TypeScript files
  - Options:
    - `-f, --fix`: Automatically fix problems

- `lint:css`: Lint CSS and style files
  - Options:
    - `-f, --fix`: Automatically fix problems

- `lint:fix`: Fix all auto-fixable lint issues

- `lint:staged`: Lint staged files

### Building Commands

- `build:dev`: Build the application for development

- `build:prod`: Build the application for production

- `build:analyze`: Build and analyze bundle size

- `build:watch`: Build and watch for changes

### Maintenance Commands

- `clean:orphans`: Clean orphaned files and dependencies

- `deduplicate:files`: Find and deduplicate files

- `migrate:firebase`: Migrate Firebase services to atomic architecture
  - Options:
    - `-f, --file <file>`: Specific file to migrate
    - `-a, --all`: Migrate all files

### Context Commands

- `context:status`: Show the current context status
  - Displays the current context data and tracked files

- `context:clear`: Clear the current context
  - Resets the context data and file tracking

### CLI Package Commands

- `build:cli`: Build the CLI package (dry run)
  - Builds the CLI package without publishing it
  - Useful for testing the package before publishing

- `publish:cli`: Build and publish the CLI package
  - Builds and publishes the CLI package to npm
  - Requires npm authentication

### Deployment Commands

- `deploy`: Deploy the application
  - Options:
    - `-t, --target <target>`: Deployment target (firebase, godaddy, all) (default: all)

## Utility Modules

The CLI tools use several utility modules:

- `utils/logger.ts`: Provides standardized logging functionality
- `utils/environment.ts`: Provides functions for validating and checking the environment
- `utils/status.ts`: Provides functions for updating and tracking status
- `utils/context.ts`: Provides context-aware operations that maintain state across executions

### Context-Aware Operations

The CLI tools implement context-aware operations that maintain state across executions. This allows for:

- Efficient file tracking: Only process files that have changed since the last execution
- Delta updates: Apply incremental updates to files
- Context-aware operations: Operations that are aware of the current state of the system

The context system tracks:

- Files that have changed
- Command history
- Operation state

This enables more efficient operations and better continuity between CLI invocations.

## Development

To add new commands to the CLI tool, modify the `ops.ts` file and add the appropriate command definitions.

For example, to add a new command:

```typescript
program
  .command('new-command')
  .description('Description of the new command')
  .option('-o, --option <value>', 'Description of the option')
  .action(async (options) => {
    // Command implementation
  });
```

## Documentation

For more information about the Firebase migration process, see:
- `scripts/firebase-atomic-migration-README.md`
- `AISPORTSEDGE-PROJECT.md`