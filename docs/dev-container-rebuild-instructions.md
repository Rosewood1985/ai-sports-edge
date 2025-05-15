# Dev Container Rebuild Instructions

The dev container has been configured to automatically install `make` and ensure it's available every time the container runs. This is done through the `.devcontainer/Dockerfile` which includes the necessary installation commands. Additionally, the container now includes dotfiles integration for consistent environment setup.

## Configuration Files

1. `.devcontainer/Dockerfile`:
   ```dockerfile
   FROM mcr.microsoft.com/devcontainers/base:ubuntu

   # Install make and clean up to reduce image size
   RUN apt-get update && apt-get install -y make && \
       apt-get clean && rm -rf /var/lib/apt/lists/*
   ```

2. `.devcontainer/devcontainer.json`:
   ```json
   {
     "name": "AI Sports Edge Minimal",
     "dockerFile": "Dockerfile",
     "forwardPorts": [19000, 19001, 19002],
     "customizations": {
       "vscode": {
         "extensions": [
           "dbaeumer.vscode-eslint",
           "esbenp.prettier-vscode"
         ]
       }
     },
     "dotfiles": {
       "repository": "${localWorkspaceFolder}/.dotfiles",
       "installCommand": "bash ${localWorkspaceFolder}/.dotfiles/install.sh",
       "targetPath": "~/dotfiles"
     },
     "postCreateCommand": "bash ${localWorkspaceFolder}/.dotfiles/install.sh && roo help"
   }
   ```

## Dotfiles Integration

The dev container includes dotfiles integration that:

1. Links configuration files (`.bashrc`, `.bash_aliases`, `.bash_functions`, `.gitconfig`, `.vimrc`)
2. Sets up environment variables and aliases
3. Makes project scripts executable
4. Provides useful commands like `roo`, `save`, and `migrate`

These dotfiles ensure a consistent development environment across container rebuilds.

## Rebuilding the Dev Container

To rebuild the container with all configurations:

### Option 1: Using the Rebuild Script

1. Close VS Code completely
2. Run the rebuild script:
   ```bash
   ./scripts/rebuild-devcontainer.sh
   ```
3. Reopen VS Code in the project directory
4. After rebuild, verify dotfiles installation:
   ```bash
   .dotfiles/install.sh && source ~/.bashrc
   ```
5. Confirm environment setup:
   ```bash
   roo help
   ```

### Option 2: Using VS Code Command Palette

1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS) to open the Command Palette
2. Type "Dev Containers: Rebuild Container" and select it
3. Wait for the container to rebuild (this may take a few minutes)
4. After rebuild, verify dotfiles installation:
   ```bash
   .dotfiles/install.sh && source ~/.bashrc
   ```
5. Confirm environment setup:
   ```bash
   roo help
   ```

### Option 3: Using VS Code UI

1. Click on the Remote Indicator in the bottom-left corner of VS Code (looks like "><")
2. Select "Rebuild Container" from the menu
3. Wait for the container to rebuild
4. After rebuild, verify dotfiles installation:
   ```bash
   .dotfiles/install.sh && source ~/.bashrc
   ```
5. Confirm environment setup:
   ```bash
   roo help
   ```

### Verifying Installation

After rebuilding, verify that both `make` and dotfiles are properly installed:

```bash
# Verify make installation
make --version

# Verify dotfiles installation
echo $AISPORTSEDGE_ROOT
roo help
```

## Troubleshooting Dotfiles

If you encounter issues with dotfiles after rebuilding:

1. Check if symlinks are correctly set up:
   ```bash
   ls -la ~ | grep -e "\.bash" -e "\.vim" -e "\.git"
   ```

2. Manually run the dotfiles installer:
   ```bash
   chmod +x .dotfiles/install.sh
   .dotfiles/install.sh
   source ~/.bashrc
   ```

3. Verify environment variables:
   ```bash
   echo $AISPORTSEDGE_ROOT
   ```

## Using Make with the CLI Tools

Now that `make` is available, you can use the Makefile targets for the CLI tools:

```bash
# Run the comprehensive script consolidation
make scripts-consolidate-comprehensive

# Build the CLI package (dry run)
make build-cli

# Publish the CLI package
make publish-cli
```

These commands provide a convenient way to interact with the CLI tools without having to remember the full npm commands.