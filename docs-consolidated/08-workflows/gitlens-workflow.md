# GitLens Workflow for AI Sports Edge

This document outlines recommended GitLens usage patterns for the AI Sports Edge project, particularly useful when working with Firebase and the atomic architecture.

## Tracking Firebase Changes

1. **Track Recent Firebase Changes**
   - Open the GitLens sidebar (click the GitLens icon on the left)
   - Look at the Commits section to see recent changes to Firebase files
   - Helps understand what Firebase configurations were recently added or modified

2. **Understand Branch Differences**
   - In GitLens sidebar, click on Branches
   - Compare your current branch with main to see what's different
   - Use GitLens: Compare References from Command Palette to see side-by-side changes

3. **Debug Dependency Issues**
   - Right-click on package.json → "Open in GitLens View"
   - Look for when dependencies were last added/removed
   - Check the blame annotations to see who made dependency changes

## Understanding Codebase Structure

For new team members or when debugging:

1. **File History**
   - Use GitLens: Show File History on key files like:
     - `src/atomic/molecules/firebaseFirestore.ts`
     - `src/atomic/organisms/firebaseService.ts`
     - Analysis tool scripts
   - Shows the evolution of these files over time

## Specific Workflow Recommendations

### Before Making Changes
1. Enable inline blame (Ctrl+Shift+B) to see who last touched the code
2. Use GitLens: Show Graph to visualize recent branch activity
3. Check Contributors panel to see active developers

### While Debugging
1. Hover over problematic lines to see commit messages
2. Use "Show Line History" for specific error lines
3. Compare with working versions using branch comparison

### Before Committing
1. Review your changes using GitLens: Review Changes
2. Compare with main branch to ensure you're not overwriting recent updates
3. Check if your changes conflict with teammate's recent commits

## Quick Wins for Firebase Integration

1. **Check Firebase Config History**
   - Right-click on Firebase config files
   - Select "GitLens: Show File History"
   - See when and why Firebase was configured a certain way

2. **Track Dependency Changes**
   - Open package.json with inline blame enabled
   - See who added/removed packages and when
   - Helps resolve dependency conflicts

3. **Understand Analysis Tools**
   - Use GitLens to see when analysis tools were added
   - Check commit messages for implementation details
   - Compare with other branches to see if features exist elsewhere

## Integration with Atomic Architecture

When working with the atomic architecture:

1. **Track Component Evolution**
   - Use GitLens to see how atoms, molecules, and organisms have evolved
   - Understand the reasoning behind architectural decisions

2. **Identify Component Ownership**
   - Use blame annotations to see who is responsible for which components
   - Helps with coordination when making changes

3. **Monitor Integration Points**
   - Track changes to index files and service interfaces
   - Ensures backward compatibility is maintained