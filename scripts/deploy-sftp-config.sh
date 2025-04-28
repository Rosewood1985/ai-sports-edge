#!/bin/bash

# Script to deploy SFTP configuration changes to the server

# Set script to exit on error
set -e

# Display what's being deployed
echo "Deploying SFTP configuration changes..."

# Export the web app
echo "Building the web app..."
npx expo export --platform web

# Use the SFTP extension to upload the build folder
echo "Uploading build folder to server..."
echo "Please use VS Code Command Palette (Cmd+Shift+P) and run:"
echo "  > SFTP: Upload Folder"
echo "Then select the 'build' directory when prompted."

echo "After upload completes, verify the site at https://aisportsedge.app"
echo "Remember to restart VS Code for the SFTP configuration changes to take effect."