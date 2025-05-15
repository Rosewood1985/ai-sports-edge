# Git Hooks Documentation

## Overview

This document describes the Git hooks configured for the AI Sports Edge project. Git hooks are scripts that run automatically when certain Git events occur, such as committing, pushing, or merging.

## Post-Commit Hook

The post-commit hook runs after a commit is successfully created. In our project, it performs the following actions:

1. Extracts information from the commit:
   - Commit message
   - Files changed
   - Author

2. Determines the topic based on the files changed:
   - If any file contains "firebase" in its path, the topic is "Firebase"
   - If any file contains "component" in its path, the topic is "Components"
   - Otherwise, the topic is "Development"

3. Logs the activity using the smart_logger.sh script:
   - Logs the topic, commit message, and affected files
   - Tags the activity with "git,commit"

4. Updates the last active session timestamp in `.roocode/last_active.txt`

### Implementation

```bash
#!/bin/bash
# Extract meaningful information from commit
commit_msg=$(git log -1 --pretty=%B)
files_changed=$(git show --name-only --format='' HEAD | tr '\n' ', ')
author=$(git log -1 --pretty=%an)

# Determine topic from files
if [[ "$files_changed" == *firebase* ]]; then
  topic="Firebase"
elif [[ "$files_changed" == *component* ]]; then
  topic="Components"
else
  topic="Development"
fi

# Log the activity automatically without requiring manual intervention
./scripts/smart_logger.sh log_activity "$topic" "$commit_msg" "Commit by $author affecting: $files_changed" "git,commit"

# Update memory bank with last active session
echo "Last active: $(date)" > .roocode/last_active.txt
```

### Benefits

- **Automatic Activity Logging**: Commits are automatically logged without requiring manual intervention
- **Topic Classification**: Commits are automatically classified based on the files changed
- **Activity Tracking**: The system keeps track of when the last activity occurred
- **Improved Collaboration**: Team members can see what changes were made and when

## Adding More Hooks

To add more Git hooks, create executable scripts in the `.git/hooks` directory with the appropriate names:

- `pre-commit`: Runs before a commit is created
- `prepare-commit-msg`: Runs before the commit message editor is launched
- `commit-msg`: Runs after the commit message is entered
- `post-commit`: Runs after a commit is created
- `pre-push`: Runs before a push is executed
- `post-checkout`: Runs after a checkout is executed
- `post-merge`: Runs after a merge is executed

## Troubleshooting

If a Git hook is not running:

1. Ensure the hook script is executable: `chmod +x .git/hooks/<hook-name>`
2. Check the script for syntax errors
3. Verify that the script has the correct name (e.g., `post-commit`, not `post-commit.sh`)
4. Make sure the script has a proper shebang line (e.g., `#!/bin/bash`)

## References

- [Git Hooks Documentation](https://git-scm.com/docs/githooks)
- [Customizing Git - Git Hooks](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)