# Minimal DevContainer Setup Guide

## Overview

This guide explains the minimal DevContainer setup for AI Sports Edge development. The minimal setup provides a lightweight development environment with only essential tools and configurations.

## Files

- `.devcontainer/Dockerfile`: Defines the container image and installed tools
- `.devcontainer/devcontainer.json`: Configures VS Code integration and container settings
- `scripts/rebuild-devcontainer.sh`: Helper script for rebuilding the container

## Features

The minimal setup includes:

- Node.js 18 (Debian Bullseye base)
- Git and curl for basic operations
- TypeScript for type checking
- ESLint and Prettier VS Code extensions
- Expo ports forwarded (19000, 19001, 19002)

## Benefits

- **Faster startup**: Container builds in seconds instead of minutes
- **Lower resource usage**: Minimal memory and CPU footprint
- **Simplified maintenance**: Fewer dependencies to manage and update
- **Focused environment**: Only the tools you need for core development

## Usage

### First-time Setup

1. Ensure Docker Desktop is installed and running
2. Open the project in VS Code
3. When prompted, click "Reopen in Container"
4. VS Code will build the container and open the project inside it

### Rebuilding the Container

If you modify the Dockerfile or devcontainer.json:

1. Close VS Code
2. Run the rebuild script:
   ```bash
   ./scripts/rebuild-devcontainer.sh
   ```
3. Reopen VS Code and the project

Alternatively, you can use VS Code's "Dev Containers: Rebuild Container" command.

### Adding Tools as Needed

If you need additional tools for specific tasks:

1. Edit `.devcontainer/Dockerfile` to add required packages
2. Add any necessary VS Code extensions in `.devcontainer/devcontainer.json`
3. Rebuild the container using the steps above

## Troubleshooting

- **Container fails to build**: Check Docker logs and ensure Docker has sufficient resources
- **Missing tools**: Add only what you need to the Dockerfile and rebuild
- **Port conflicts**: Modify the forwarded ports in devcontainer.json if needed

## Performance Tips

- Keep the container minimal - only add what you absolutely need
- Use volume mounts for node_modules to improve performance
- Consider using a .dockerignore file to exclude unnecessary files