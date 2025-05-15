# Project Consistency System

This document describes the Project Consistency System for AI Sports Edge, which ensures that RooCode always works on the same project and provides clear visibility into whether changes are being sent to the actual web app.

## Overview

The Project Consistency System includes:

1. **Project Tracking**: Ensures RooCode always works on the same project
2. **Integration Verification**: Checks if your local code matches the deployed web app
3. **Deployment Scripts**: Provides tools to push changes to the web app
4. **VSCode Integration**: Ensures consistent project loading in VSCode
5. **Shell Aliases**: Makes it easy to run common commands from anywhere

## Components

### Project Tracking

The system creates and maintains:

- A unique project ID stored in `.roocode/project_id`
- The project root directory path stored in `.roocode/project_root`
- A log of project access with timestamps in `.roocode/last_access.log`

### Integration Verification

The system checks:

- If your local code matches the deployed web app
- If your local code needs to be built or deployed
- The status of the deployment (up-to-date, needs-build, needs-deployment)

### Deployment Scripts

The system provides:

- A script to build and deploy the project to the web app
- Logging of deployment history in the memory bank

### VSCode Integration

The system includes:

- A VSCode workspace file for consistent project loading
- VSCode tasks for common operations
- VSCode startup script to ensure proper initialization

### Shell Aliases

The system sets up aliases for common commands:

- `edge-init`: Initialize the project and check status
- `edge-start`: Start the development server with consistency checks
- `edge-status`: Check the status of the project

## Usage

### Getting Started

1. Initialize the project:

```bash
./scripts/initialize_project.sh
```

2. Start the development server:

```bash
./scripts/start.sh
```

3. Set up shell aliases (optional):

```bash
./scripts/setup_aliases.sh
```

### Directory Structure

The system creates and maintains the following directory structure:

```
.roocode/
  project_id           # Unique project ID
  project_root         # Project root directory path
  last_access.log      # Log of project access
  current_session.txt  # Current session information
  memory_bank.md       # Memory bank with project knowledge
```

## Benefits

- **Consistency**: Ensures RooCode always works on the same project
- **Visibility**: Provides clear visibility into whether changes are being sent to the actual web app
- **Efficiency**: Makes it easy to run common commands from anywhere
- **Knowledge Preservation**: Centralizes project knowledge in the memory bank