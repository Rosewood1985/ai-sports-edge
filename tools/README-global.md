# AI Sports Edge CLI

A comprehensive command-line interface for AI Sports Edge development and operations.

## Installation

### Global Installation

```bash
npm install -g @aisportsedge/cli
```

After installation, you can use the CLI with the `aisportsedge` command:

```bash
aisportsedge --help
```

### Local Installation

If you prefer not to install globally, you can use the CLI from the project directory:

```bash
# Install dependencies
npm install

# Run the CLI
npx ts-node tools/ops.ts
```

## Features

The AI Sports Edge CLI provides a comprehensive set of commands for development, testing, building, and deployment:

### Firebase Commands

- `firebase:migrate`: Migrate Firebase services to atomic architecture
- `firebase:status`: Show Firebase migration status
- `firebase:tag`: Tag files as migrated
- `firebase:accelerate`: Accelerate Firebase migration

### Memory Bank Commands

- `memory:update`: Update memory bank
- `memory:checkpoint`: Create memory bank checkpoint

### Script Management Commands

- `scripts:consolidate`: Consolidate scattered scripts into the scripts directory
- `scripts:consolidate:comprehensive`: Comprehensive consolidation with reference updates

### Testing Commands

- `test:unit`: Run unit tests
- `test:integration`: Run integration tests
- `test:e2e`: Run end-to-end tests
- `test:coverage`: Generate test coverage report

### Linting Commands

- `lint:js`: Lint JavaScript and TypeScript files
- `lint:css`: Lint CSS and style files
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

### Context Commands

- `context:status`: Show the current context status
- `context:clear`: Clear the current context

### Deployment Commands

- `deploy`: Deploy the application

## Context-Aware Operations

The CLI implements context-aware operations that maintain state across executions. This allows for:

- Efficient file tracking
- Delta updates
- Context-aware operations

The context system tracks:

- Files that have changed
- Command history
- Operation state

This enables more efficient operations and better continuity between CLI invocations.

## Contributing

To contribute to the CLI, follow these steps:

1. Clone the repository
2. Install dependencies: `npm install`
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

This project is proprietary and confidential. All rights reserved.