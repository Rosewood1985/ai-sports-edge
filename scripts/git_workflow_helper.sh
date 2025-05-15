#!/bin/bash
# git_workflow_helper.sh
# Automates common Git workflow tasks

# Set up Git hooks for automatic actions
setup_git_hooks() {
  mkdir -p .git/hooks
  
  # Pre-commit hook for linting
  cat > .git/hooks/pre-commit << 'HOOK'
#!/bin/bash
echo "Running pre-commit checks..."
# Add linting or formatting checks here
exit 0
HOOK
  chmod +x .git/hooks/pre-commit
  
  # Post-commit hook to remind about pushing
  cat > .git/hooks/post-commit << 'HOOK'
#!/bin/bash
echo "================================================================="
echo "Commit successful! Remember to push your changes with:"
echo "git push origin $(git rev-parse --abbrev-ref HEAD)"
echo "================================================================="
HOOK
  chmod +x .git/hooks/post-commit
  
  # Pre-push hook to run tests
  cat > .git/hooks/pre-push << 'HOOK'
#!/bin/bash
echo "Running pre-push checks..."
# Add test commands here
exit 0
HOOK
  chmod +x .git/hooks/pre-push
  
  echo "Git hooks installed successfully!"
}

# Git status with enhanced output
enhanced_git_status() {
  echo "========== Git Status =========="
  git status
  
  echo -e "\n========== Unpushed Commits =========="
  git log @{u}..HEAD --oneline 2>/dev/null || echo "No unpushed commits or remote branch not set up"
  
  echo -e "\n========== Recent Commits =========="
  git log -n 5 --oneline
}

# Sync with remote
sync_git() {
  current_branch=$(git rev-parse --abbrev-ref HEAD)
  echo "Syncing branch: $current_branch"
  
  git fetch
  
  if git rev-parse --verify origin/$current_branch >/dev/null 2>&1; then
    git pull origin $current_branch
    echo "Pull successful!"
  else
    echo "Remote branch doesn't exist yet. Will push when changes are committed."
  fi
}

# Smart commit - stages all changes and commits
smart_commit() {
  message="$1"
  if [ -z "$message" ]; then
    echo "Please provide a commit message:"
    read -r message
  fi
  
  git add .
  git commit -m "$message"
  
  echo "Commit successful! Push now? [Y/n]"
  read -r response
  if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]] || [ -z "$response" ]; then
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    git push origin $current_branch
    echo "Changes pushed to $current_branch"
  fi
}

# Auto-deploy to Firebase
deploy_firebase() {
  environment="$1"
  
  if [ "$environment" == "prod" ]; then
    echo "Deploying to PRODUCTION..."
    firebase deploy --project ai-sports-edge
  else
    channel="${environment:-preview}"
    echo "Deploying to preview channel: $channel..."
    firebase hosting:channel:deploy $channel --project ai-sports-edge
    echo "Preview URL: https://$channel--aisportsedge-app.web.app"
  fi
}

# Main menu
show_menu() {
  echo "========== Git & Deployment Helper =========="
  echo "1. Show enhanced Git status"
  echo "2. Sync with remote (fetch & pull)"
  echo "3. Smart commit & push"
  echo "4. Deploy to preview channel"
  echo "5. Deploy to production"
  echo "6. Setup Git hooks"
  echo "7. Run Firebase consolidation"
  echo "8. Access memory bank"
  echo "9. Create new file with checks"
  echo "10. Run duplication detector"
  echo "11. Exit"
  echo ""
  echo "Enter choice [1-11]: "
  read -r choice
  
  case $choice in
    1) enhanced_git_status ;;
    2) sync_git ;;
    3) smart_commit ;;
    4) deploy_firebase "preview" ;;
    5) deploy_firebase "prod" ;;
    6) setup_git_hooks ;;
    7) ./scripts/firebase_consolidation.sh ;;
    8) ./scripts/memory_bank.sh show ;;
    9) ./scripts/new_file.sh ;;
    10) ./scripts/detect_duplicates.sh ;;
    11) exit 0 ;;
    *) echo "Invalid choice" ;;
  esac
  
  echo ""
  show_menu
}

# Parse command line arguments
if [ $# -eq 0 ]; then
  show_menu
else
  command="$1"
  shift
  
  case $command in
    status) enhanced_git_status ;;
    sync) sync_git ;;
    commit) smart_commit "$1" ;;
    deploy) deploy_firebase "$1" ;;
    hooks) setup_git_hooks ;;
    consolidate) ./scripts/firebase_consolidation.sh ;;
    memory) ./scripts/memory_bank.sh "$@" ;;
    newfile) ./scripts/new_file.sh "$@" ;;
    duplicates) ./scripts/detect_duplicates.sh ;;
    *) echo "Unknown command: $command" ;;
  esac
fi