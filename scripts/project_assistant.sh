#!/bin/bash
# project_assistant.sh
# Reminds about pending tasks and provides project status

# Configuration
REMINDER_FILE=".project_reminders"
LAST_DEPLOY_FILE=".last_deploy"
TODO_FILE="TODO.md"

# Initialize reminders if they don't exist
if [ ! -f "$REMINDER_FILE" ]; then
  cat > "$REMINDER_FILE" << END
- Complete Firebase consolidation
- Test authentication with new Firebase config
- Update GitHub Actions workflows
- Clean up project structure
- Run performance optimizations
END
fi

# Initialize TODO if it doesn't exist
if [ ! -f "$TODO_FILE" ]; then
  cat > "$TODO_FILE" << END
# AI Sports Edge TODO List

## High Priority
- [ ] Consolidate Firebase implementations
- [ ] Fix GitHub Actions workflows
- [ ] Clean up project files and remove duplicates

## Medium Priority
- [ ] Improve error handling
- [ ] Add loading states
- [ ] Enhance mobile responsiveness

## Low Priority
- [ ] Add unit tests
- [ ] Optimize images
- [ ] Improve documentation
END
fi

# Check for uncommitted changes
check_uncommitted() {
  if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes!"
    echo "Run './scripts/git_workflow_helper.sh commit' to commit and push"
    return 1
  else
    echo "✅ No uncommitted changes"
    return 0
  fi
}

# Check for unpushed commits
check_unpushed() {
  if [ -n "$(git log @{u}..HEAD 2>/dev/null)" ]; then
    echo "⚠️  You have unpushed commits!"
    echo "Run 'git push origin $(git rev-parse --abbrev-ref HEAD)' to push"
    return 1
  else
    echo "✅ No unpushed commits"
    return 0
  fi
}

# Check deployment status
check_deploy() {
  if [ -f "$LAST_DEPLOY_FILE" ]; then
    last_deploy=$(cat "$LAST_DEPLOY_FILE")
    last_commit=$(git log -1 --format=%cd --date=iso)
    
    if [[ "$last_deploy" < "$last_commit" ]]; then
      echo "⚠️  Your deployment is out of date!"
      echo "Run './scripts/git_workflow_helper.sh deploy preview' to update"
      return 1
    else
      echo "✅ Deployment is up to date"
      return 0
    fi
  else
    echo "⚠️  No deployment information found"
    echo "Run './scripts/git_workflow_helper.sh deploy preview' to deploy"
    return 1
  fi
}

# Show reminders
show_reminders() {
  echo "========== Reminders =========="
  cat "$REMINDER_FILE"
}

# Show project status
show_status() {
  echo "========== AI Sports Edge Project Status =========="
  echo "Branch: $(git rev-parse --abbrev-ref HEAD)"
  echo "Last commit: $(git log -1 --format='%h %s')"
  
  echo ""
  check_uncommitted
  check_unpushed
  check_deploy
  
  echo ""
  echo "========== Current Phase =========="
  echo "Firebase Consolidation (Phase 2 of 5)"
  
  echo ""
  show_reminders
}

# Run automated assistant
show_status
echo ""
echo "Would you like to:"
echo "1. Run Git workflow helper"
echo "2. Run Firebase consolidation"
echo "3. Edit reminders"
echo "4. Update TODO list"
echo "5. Exit"
read -r choice

case $choice in
  1) ./scripts/git_workflow_helper.sh ;;
  2) ./scripts/firebase_consolidation.sh ;;
  3) ${EDITOR:-nano} "$REMINDER_FILE" ;;
  4) ${EDITOR:-nano} "$TODO_FILE" ;;
  5) exit 0 ;;
  *) echo "Invalid choice" ;;
esac