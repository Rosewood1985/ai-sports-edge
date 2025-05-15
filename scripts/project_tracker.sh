#!/bin/bash
# project_tracker.sh - Ensures RooCode always works on the same project

set -e

PROJECT_ID_FILE=".roocode/project_id"
PROJECT_ROOT_FILE=".roocode/project_root"
LAST_ACCESS_FILE=".roocode/last_access.log"
INTEGRATION_STATUS_FILE=".roocode/integration_status.json"

# Generate a unique project ID if it doesn't exist
ensure_project_id() {
  mkdir -p "$(dirname "$PROJECT_ID_FILE")"
  
  if [ ! -f "$PROJECT_ID_FILE" ]; then
    # Generate unique ID based on directory and git remote
    project_name=$(basename "$(pwd)")
    remote_url=$(git config --get remote.origin.url 2>/dev/null || echo "local")
    timestamp=$(date +%s)
    unique_id="${project_name}-${timestamp}"
    echo "$unique_id" > "$PROJECT_ID_FILE"
    echo "Project ID created: $unique_id"
  fi
  
  # Store the project root path
  echo "$(pwd)" > "$PROJECT_ROOT_FILE"
}

# Log project access
log_access() {
  mkdir -p "$(dirname "$LAST_ACCESS_FILE")"
  
  # Get project ID
  project_id=$(cat "$PROJECT_ID_FILE" 2>/dev/null || echo "unknown")
  
  # Log access with timestamp
  echo "$(date "+%Y-%m-%d %H:%M:%S") - Project $project_id accessed from $(pwd)" >> "$LAST_ACCESS_FILE"
  
  # Keep only the last 50 entries
  tail -n 50 "$LAST_ACCESS_FILE" > "$LAST_ACCESS_FILE.tmp"
  mv "$LAST_ACCESS_FILE.tmp" "$LAST_ACCESS_FILE"
}

# Verify project integration with the web app
verify_integration() {
  # Default to unknown
  status="unknown"
  deployed_version="unknown"
  latest_commit=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
  deployment_time="unknown"
  
  # Check for Firebase integration
  if [ -f "firebase.json" ]; then
    # Get deployed version if Firebase CLI is available
    if command -v firebase > /dev/null; then
      # Try to get the latest deployment info
      firebase_project=$(grep -o '"site": *"[^"]*"' firebase.json 2>/dev/null | head -n 1 | cut -d'"' -f4)
      if [ -n "$firebase_project" ]; then
        # Check if currently deployed version matches latest commit
        deployed_info=$(firebase hosting:channel:list --project "$firebase_project" --json 2>/dev/null || echo '{"error": "failed"}')
        if ! echo "$deployed_info" | grep -q "error"; then
          # Parse the deployment info (simplified - in reality would need proper JSON parsing)
          deployment_time=$(echo "$deployed_info" | grep -o '"createTime": *"[^"]*"' | head -n 1 | cut -d'"' -f4)
          deployed_version=$(echo "$deployed_info" | grep -o '"versionName": *"[^"]*"' | head -n 1 | cut -d'"' -f4)
          
          if [ "$deployed_version" = "$latest_commit" ]; then
            status="up-to-date"
          else
            status="needs-deployment"
          fi
        fi
      fi
    fi
  elif [ -f "package.json" ] && grep -q "build" "package.json"; then
    # Get build status
    if [ -d "dist" ] || [ -d "build" ]; then
      build_time=$(find dist build -type f -name "*.js" 2>/dev/null | xargs ls -t | head -n 1 | xargs stat -c %y 2>/dev/null || echo "unknown")
      commit_time=$(git log -1 --format=%cd --date=iso 2>/dev/null || echo "unknown")
      
      if [ "$build_time" != "unknown" ] && [ "$commit_time" != "unknown" ]; then
        # Compare times (simplified)
        if [ "$build_time" \> "$commit_time" ]; then
          status="up-to-date"
        else
          status="needs-build"
        fi
      fi
    else
      status="not-built"
    fi
  fi
  
  # Save status to file
  cat > "$INTEGRATION_STATUS_FILE" << END
{
  "projectId": "$(cat "$PROJECT_ID_FILE" 2>/dev/null || echo "unknown")",
  "status": "$status",
  "latestCommit": "$latest_commit",
  "deployedVersion": "$deployed_version",
  "deploymentTime": "$deployment_time",
  "lastChecked": "$(date "+%Y-%m-%d %H:%M:%S")"
}
END
  
  echo "Integration status: $status"
}

# Create deployment script to push changes to the web app
create_deployment_script() {
  cat > scripts/deploy_to_web.sh << 'END'
#!/bin/bash
# deploy_to_web.sh - Deploy current code to the web app

set -e

INTEGRATION_STATUS_FILE=".roocode/integration_status.json"
MEMORY_BANK=".roocode/memory_bank.md"

# Function to get current status
get_status() {
  if [ -f "$INTEGRATION_STATUS_FILE" ]; then
    grep -o '"status": *"[^"]*"' "$INTEGRATION_STATUS_FILE" | cut -d'"' -f4
  else
    echo "unknown"
  fi
}

# Build the app
build_app() {
  echo "Building the application..."
  
  if [ -f "package.json" ]; then
    npm run build
  else
    echo "No package.json found. Unable to build."
    return 1
  fi
  
  return 0
}

# Deploy to Firebase
deploy_to_firebase() {
  echo "Deploying to Firebase..."
  
  if [ -f "firebase.json" ]; then
    if command -v firebase > /dev/null; then
      firebase deploy --only hosting
    else
      echo "Firebase CLI not found. Please install it with 'npm install -g firebase-tools'"
      return 1
    fi
  else
    echo "No firebase.json found. Unable to deploy to Firebase."
    return 1
  fi
  
  return 0
}

# Update memory bank with deployment info
update_memory_bank() {
  if [ -f "$MEMORY_BANK" ]; then
    echo -e "\n## Last Deployment\n" >> "$MEMORY_BANK"
    echo "- **Date**: $(date)" >> "$MEMORY_BANK"
    echo "- **Commit**: $(git rev-parse HEAD)" >> "$MEMORY_BANK"
    echo "- **Changes**: $(git diff --name-only HEAD^ HEAD | wc -l) files changed" >> "$MEMORY_BANK"
  fi
}

# Main deployment function
main() {
  echo "Starting web deployment process..."
  
  # Get current status
  status=$(get_status)
  
  # Check if deployment is needed
  if [ "$status" = "up-to-date" ]; then
    read -p "Project appears to be already deployed. Deploy again anyway? [y/N] " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
      echo "Deployment cancelled."
      return 0
    fi
  fi
  
  # Build the app
  build_app || {
    echo "Build failed. Deployment aborted."
    return 1
  }
  
  # Deploy to Firebase
  deploy_to_firebase || {
    echo "Deployment failed."
    return 1
  }
  
  # Update memory bank
  update_memory_bank
  
  # Update integration status
  cd "$(dirname "$0")/.." && ./scripts/project_tracker.sh verify
  
  echo "Deployment completed successfully!"
  return 0
}

# Run main function
main "$@"
END
  
  chmod +x scripts/deploy_to_web.sh
  
  echo "Deployment script created at scripts/deploy_to_web.sh"
}

# Add VSCode integration
create_vscode_integration() {
  # Create or update VSCode settings
  mkdir -p .vscode
  
  cat > .vscode/settings.json << END
{
  "terminal.integrated.shellArgs.linux": ["-c", "cd \$(cat .roocode/project_root 2>/dev/null || echo \$(pwd)) && bash"],
  "terminal.integrated.shellArgs.osx": ["-c", "cd \$(cat .roocode/project_root 2>/dev/null || echo \$(pwd)) && bash"],
  "terminal.integrated.shellArgs.windows": ["/c", "cd /d %cd% && bash -c \"cd \$(cat .roocode/project_root 2>/dev/null || echo \$(pwd)) && bash\""]
}
END
  
  cat > .vscode/extensions.json << END
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "msjsdiag.debugger-for-chrome",
    "ms-vsliveshare.vsliveshare",
    "formulahendry.auto-rename-tag",
    "mikestead.dotenv",
    "eamodio.gitlens",
    "thibaudcolas.bundled-formatter",
    "EditorConfig.EditorConfig"
  ]
}
END
  
  # Create launch configuration for debugging
  cat > .vscode/launch.json << END
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome against localhost",
      "url": "http://localhost:3000",
      "webRoot": "\${workspaceFolder}"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "program": "\${file}",
      "skipFiles": [
        "<node_internals>/**"
      ]
    }
  ]
}
END
  
  # Create workspace file at project root
  project_name=$(basename "$(pwd)")
  cat > "${project_name}.code-workspace" << END
{
  "folders": [
    {
      "path": "."
    }
  ],
  "settings": {
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    },
    "javascript.updateImportsOnFileMove.enabled": "always",
    "typescript.updateImportsOnFileMove.enabled": "always"
  }
}
END
  
  echo "VSCode integration created. Open the ${project_name}.code-workspace file to ensure consistent project loading."
}

# Add VSCode start script to ensure proper initialization
create_vscode_startup() {
  # Create VSCode startup script
  cat > .vscode/startup.sh << END
#!/bin/bash
# This script runs when VSCode opens the project
# It ensures we're working on the same project and logs the access

# Run project tracker
source "\$(dirname "\$0")/../scripts/project_tracker.sh"
ensure_project_id
log_access
verify_integration

# Show project status
echo "VSCode opened project: \$(cat "\$(dirname "\$0")/../.roocode/project_id" 2>/dev/null || echo "unknown")"
echo "Project root: \$(cat "\$(dirname "\$0")/../.roocode/project_root" 2>/dev/null || echo "\$(pwd)")"
echo "Integration status: \$(grep -o '"status": *"[^"]*"' "\$(dirname "\$0")/../.roocode/integration_status.json" 2>/dev/null | cut -d'"' -f4 || echo "unknown")"

# Initialize memory bank with VSCode session info
if [ -f "\$(dirname "\$0")/../.roocode/memory_bank.md" ]; then
  echo "====== New VSCode Session: \$(date) ======" >> "\$(dirname "\$0")/../.roocode/sessions.log"
fi
END
  
  chmod +x .vscode/startup.sh
  
  # Create VSCode tasks to run the startup script
  cat > .vscode/tasks.json << END
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Initialize Project",
      "type": "shell",
      "command": "bash \${workspaceFolder}/.vscode/startup.sh",
      "problemMatcher": [],
      "presentation": {
        "reveal": "silent",
        "revealProblems": "onProblem",
        "close": true
      },
      "runOptions": {
        "runOn": "folderOpen"
      }
    },
    {
      "label": "Deploy to Web",
      "type": "shell",
      "command": "bash \${workspaceFolder}/scripts/deploy_to_web.sh",
      "group": "build",
      "problemMatcher": []
    },
    {
      "label": "Log Progress",
      "type": "shell",
      "command": "bash \${workspaceFolder}/scripts/smart_logger.sh log_activity",
      "problemMatcher": []
    },
    {
      "label": "Check Integration Status",
      "type": "shell",
      "command": "bash \${workspaceFolder}/scripts/project_tracker.sh verify",
      "problemMatcher": []
    }
  ]
}
END
  
  echo "VSCode startup script created. Project will be tracked consistently on each VSCode session."
}

# Update memory bank with additional VSCode sections
update_vscode_memory_bank() {
  if [ -f ".roocode/memory_bank.md" ]; then
    cat >> ".roocode/memory_bank.md" << 'END'

## VSCode Integration

### Project Consistency

RooCode is configured to always work on the same project across VSCode sessions. Key components:

- **Project ID**: A unique identifier stored in `.roocode/project_id`
- **Project Root**: The root directory path stored in `.roocode/project_root`
- **VSCode Workspace**: Always open the `.code-workspace` file to ensure consistency

### Integration with Web App

To ensure changes are sent to the actual web app:

```bash
# Verify integration status
./scripts/project_tracker.sh verify

# Deploy changes to web app
./scripts/deploy_to_web.sh
```

The current integration status is tracked in `.roocode/integration_status.json` and displayed on VSCode startup.

### VSCode Memory Bank Additions

Additional items to keep in the memory bank:

1. **Deployment History**
   - Last deployment date, commit, and changed files
   - Status of each deployment (successful/failed)

2. **VSCode Session Info**
   - Track when VSCode sessions start
   - Record which files were modified in each session

3. **Project-specific VSCode Settings**
   - Formatter preferences
   - Linter configurations
   - Language server settings

4. **Debugging Configurations**
   - Chrome debugging setup
   - Node.js debugging setup
   - Test runner configurations

### VSCode Command Shortcuts

Add these to your VSCode keybindings.json:

```json
[
  {
    "key": "ctrl+shift+d",
    "command": "workbench.action.tasks.runTask",
    "args": "Deploy to Web"
  },
  {
    "key": "ctrl+shift+l",
    "command": "workbench.action.tasks.runTask",
    "args": "Log Progress"
  },
  {
    "key": "ctrl+shift+i",
    "command": "workbench.action.tasks.runTask",
    "args": "Check Integration Status"
  }
]
END
  
  echo "Memory bank updated with VSCode integration information."
}

# Show help message
show_help() {
  echo "Project Tracker - Ensure RooCode always works on the same project"
  echo "Usage: $0 [command]"
  echo ""
  echo "Commands:"
  echo "  ensure              Ensure project ID exists (default)"
  echo "  verify              Verify integration with web app"
  echo "  setup_vscode        Set up VSCode integration"
  echo "  help                Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 ensure           # Ensure project ID exists"
  echo "  $0 verify           # Verify integration with web app"
}

# Main command handler
case "${1:-ensure}" in
  ensure)
    ensure_project_id
    log_access
    ;;
  verify)
    ensure_project_id
    verify_integration
    ;;
  setup_vscode)
    ensure_project_id
    create_deployment_script
    create_vscode_integration
    create_vscode_startup
    update_vscode_memory_bank
    ;;
  help|*)
    show_help
    ;;
esac