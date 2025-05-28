#!/bin/bash

# Script to commit the privacy implementation changes

# Add the new files
git add atomic/atoms/privacy/dataCategories.ts
git add atomic/atoms/privacy/gdprConfig.ts
git add atomic/atoms/privacy/privacyTypes.ts
git add atomic/atoms/privacy/storageUtils.ts

git add atomic/molecules/privacy/DataAccessManager.ts
git add atomic/molecules/privacy/DataDeletionManager.ts
git add atomic/molecules/privacy/PrivacyManager.ts
git add atomic/molecules/privacy/index.js

git add atomic/organisms/privacy/PrivacySettingsScreen.tsx
git add atomic/organisms/privacy/index.js

git add docs/implementation-guides/privacy-compliance.md
git add scripts/test-privacy-implementation.js
git add memory-bank/privacy-implementation.md

# Commit with the message
git commit -F commit-message-privacy-implementation.txt

echo "Privacy implementation changes committed successfully!"