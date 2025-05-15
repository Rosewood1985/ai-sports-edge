# Firebase Configuration Fix Plan

## Issue Overview

The AI Sports Edge project is currently experiencing issues with user signup functionality due to incorrect Firebase configuration credentials across multiple files. This document outlines the plan to fix these issues and restore proper authentication functionality.

## Current State Analysis

After examining the Firebase configuration files in the project, we've identified the following issues:

1. In all three Firebase configuration files, there's a discrepancy in the credentials:
   - The `messagingSenderId` is currently "67679896425"
   - The `appId` is currently "1:67679896425:web:82641620e8b8bedd6dd218"

2. According to the correct Firebase credentials, these should be:
   - `messagingSenderId`: "676798996425" (note the extra "9" in the middle)
   - `appId`: "1:676798996425:web:82641620e8b8bedd6dd218" (with the corrected messagingSenderId)

3. This discrepancy is causing the signup functionality to fail with "invalid API key" errors.

## Files Requiring Updates

The following files contain Firebase configuration that needs to be updated:

1. `src/firebase/config.js` - Main Firebase configuration file
2. `src/config/firebase.ts` - TypeScript Firebase configuration
3. `src/config/firebase.js` - JavaScript Firebase configuration

## Implementation Plan

```mermaid
graph TD
    A[Identify Firebase Config Files] --> B[Update src/firebase/config.js]
    B --> C[Update src/config/firebase.ts]
    C --> D[Update src/config/firebase.js]
    D --> E[Save All Files]
    E --> F[Git Operations]
    F --> G[Test Signup Functionality]
    
    subgraph "File Updates"
    B
    C
    D
    end
    
    subgraph "Git Operations"
    F1[git add .]
    F2[git commit]
    F3[git push]
    F1 --> F2 --> F3
    end
    
    F --> F1
```

### Step 1: Update `src/firebase/config.js`

Replace the existing firebaseConfig object with the correct credentials:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDNBnQsHukUdPfaF2HEnwi6B9-cN4aDiRc",
  authDomain: "ai-sports-edge-final.firebaseapp.com",
  projectId: "ai-sports-edge-final",
  storageBucket: "ai-sports-edge-final.appspot.com",
  messagingSenderId: "676798996425",
  appId: "1:676798996425:web:82641620e8b8bedd6dd218"
};
```

### Step 2: Update `src/config/firebase.ts`

Apply the same correction to the TypeScript configuration file, replacing the firebaseConfig object with the correct credentials.

### Step 3: Update `src/config/firebase.js`

Apply the same correction to the JavaScript configuration file, replacing the firebaseConfig object with the correct credentials.

### Step 4: Save All Files

Ensure all files are properly saved.

### Step 5: Git Operations

```bash
git add .
git commit -m "fix: Correct Firebase configuration to enable signup"
git push origin main
```

### Step 6: Test Signup Functionality

Verify that signup works correctly with no "invalid API key" errors.

## Expected Outcomes

- Signup functionality will work correctly
- Users will be created in Firebase Authentication Console
- No other parts of the app will break due to this update

## Why This Issue Occurred

This issue likely occurred due to one of the following reasons:

1. **Manual Transcription Error**: When copying the Firebase configuration from the Firebase Console to the codebase, a digit was accidentally omitted from the `messagingSenderId`.

2. **Project Migration**: The project might have been migrated from a development Firebase project (`ai-sports-edge`) to a production Firebase project (`ai-sports-edge-final`), but not all configuration files were properly updated.

3. **Multiple Environment Configurations**: The project might be using different Firebase projects for different environments (development, staging, production), and the credentials were mixed up during deployment or configuration.

4. **Partial Updates**: During a previous update to the Firebase configuration, only some files were updated while others were missed, leading to inconsistent credentials across the codebase.

## Preventative Measures for the Future

To prevent similar issues in the future, consider implementing the following:

1. **Centralized Configuration**: Store Firebase credentials in a single source of truth (e.g., environment variables or a dedicated config file) that is imported by all files that need it.

2. **Environment-Specific Configurations**: Clearly separate development, staging, and production configurations to avoid mixing credentials.

3. **Automated Validation**: Implement automated tests that validate the Firebase configuration before deployment.

4. **Documentation**: Maintain clear documentation about the Firebase projects used for different environments and the process for updating credentials.

5. **Code Review**: Ensure thorough code reviews when making changes to authentication or configuration files.

## Next Steps After Fix

After implementing this fix and confirming that signup functionality works correctly, consider:

1. Refactoring the Firebase configuration to use a centralized approach
2. Adding automated tests for authentication flows
3. Documenting the Firebase project structure and configuration for the team