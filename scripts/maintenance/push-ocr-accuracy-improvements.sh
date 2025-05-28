#!/bin/bash

# Script to commit and push OCR accuracy improvements

echo "Committing OCR accuracy improvements..."

# Add the new files
git add services/imagePreprocessingService.js
git add services/multiProviderOCRService.js
git add services/intelligentBetSlipParser.js
git add services/enhancedOCRService.js

# Add the updated memory-bank files
git add memory-bank/activeContext.md
git add memory-bank/progress.md
git add memory-bank/systemPatterns.md

# Commit with the message
git commit -F commit-message-ocr-accuracy-improvements.txt

# Push to the repository
git push origin main

echo "OCR accuracy improvements committed and pushed successfully!"