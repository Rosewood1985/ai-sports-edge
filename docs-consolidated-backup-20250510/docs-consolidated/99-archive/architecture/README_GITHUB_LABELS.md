# GitHub Labels Setup

This document explains how to use the GitHub labels automation script to standardize issue and PR tracking.

## Available Labels

| Label | Color | Purpose |
|:--|:--|:--|
| documentation | #0075ca | Issues or PRs related to updating or creating documentation |
| bug | #d73a4a | Something isn't working as expected |
| feature | #a2eeef | New functionality requests or additions |
| enhancement | #84b6eb | Improvements to existing features |
| urgent | #b60205 | Time-sensitive issues that need immediate attention |
| technical debt | #e4e669 | Fixes needed for code quality, organization, or refactoring |
| question | #d876e3 | General questions or clarifications needed |
| internal ops | #c2e0c6 | Scripts, automation, DevOps, cron jobs, internal tools |
| priority: low | #ededed | Tasks that can be addressed later |
| priority: high | #fbca04 | Tasks that are critical to roadmap success |

## Automated Setup

The repository includes a script to automatically set up all standard labels:

```bash
# First, set your GitHub personal access token
export GITHUB_TOKEN=your_personal_access_token

# Then run the script
python3 scripts/setup_github_labels.py
```

### GitHub Token Requirements

The GitHub token needs the following permissions:
- `repo` scope for private repositories
- `public_repo` scope for public repositories

You can create a token at: https://github.com/settings/tokens

## Manual Setup

If you prefer to set up labels manually:

1. Go to your GitHub repository
2. Click on Issues → Labels
3. Click "New Label"
4. Enter the label name, color, and description based on the table above
5. Save each label

## Best Practices

- Apply at least one label to every issue and PR
- Use multiple labels when appropriate (e.g., "bug" + "priority: high")
- For complex issues, start with broad labels and refine as understanding improves
- Use labels consistently to enable effective filtering and reporting

## Last Updated

**Version:** v1.0  
**Date:** April 27, 2025