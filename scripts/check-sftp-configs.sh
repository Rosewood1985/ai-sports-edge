#!/bin/bash

# Script to detect multiple sftp.json files and warn the user
# Created as part of SFTP config standardization

echo "Checking for multiple sftp.json configurations..."

# Find all sftp.json files in the project
SFTP_FILES=$(find . -name "sftp.json" | grep -v "vscode-sftp-deploy/.vscode/sftp.json")

if [ -n "$SFTP_FILES" ]; then
  echo "⚠️  WARNING: Multiple sftp.json files detected!"
  echo "The following files should be removed to maintain a single source of truth:"
  echo "$SFTP_FILES"
  echo ""
  echo "The only valid sftp.json should be at: vscode-sftp-deploy/.vscode/sftp.json"
  
  # Optional: Ask for confirmation to delete
  read -p "Would you like to delete these extra configuration files? (y/n): " CONFIRM
  if [ "$CONFIRM" = "y" ]; then
    echo "$SFTP_FILES" | xargs rm
    echo "✅ Extra sftp.json files removed."
  else
    echo "No files were deleted. Please manually ensure only one sftp.json exists."
  fi
  
  exit 1
else
  echo "✅ SFTP configuration is clean - using single source of truth."
  exit 0
fi