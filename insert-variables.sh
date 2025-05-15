#!/bin/bash

# Roo Code Memory Bank - Variable Insertion Script
# This script inserts environment variables into memory bank files

# Check if memory-bank directory exists
if [ ! -d "memory-bank" ]; then
  echo "Error: memory-bank directory not found. Please initialize the memory bank first."
  exit 1
fi

# Define variables to insert
PROJECT_NAME="AI Sports Edge"
PROJECT_DESCRIPTION="A sports analytics and betting insights application with advanced features"
TEAM_MEMBERS="Lisa Dario (Lead Developer)"
REPOSITORY_URL="https://github.com/lisadario/ai-sports-edge"
CURRENT_VERSION=$(grep -o '"version": "[^"]*"' package.json | cut -d'"' -f4)
CURRENT_DATE=$(date +"%Y-%m-%d")

# Insert variables into activeContext.md
if [ -f "memory-bank/activeContext.md" ]; then
  sed -i '' "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" memory-bank/activeContext.md
  sed -i '' "s/{{PROJECT_DESCRIPTION}}/$PROJECT_DESCRIPTION/g" memory-bank/activeContext.md
  sed -i '' "s/{{CURRENT_VERSION}}/$CURRENT_VERSION/g" memory-bank/activeContext.md
  sed -i '' "s/{{CURRENT_DATE}}/$CURRENT_DATE/g" memory-bank/activeContext.md
  echo "Variables inserted into activeContext.md"
fi

# Insert variables into productContext.md
if [ -f "memory-bank/productContext.md" ]; then
  sed -i '' "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" memory-bank/productContext.md
  sed -i '' "s/{{PROJECT_DESCRIPTION}}/$PROJECT_DESCRIPTION/g" memory-bank/productContext.md
  sed -i '' "s/{{TEAM_MEMBERS}}/$TEAM_MEMBERS/g" memory-bank/productContext.md
  sed -i '' "s/{{REPOSITORY_URL}}/$REPOSITORY_URL/g" memory-bank/productContext.md
  echo "Variables inserted into productContext.md"
fi

# Insert variables into systemPatterns.md
if [ -f "memory-bank/systemPatterns.md" ]; then
  sed -i '' "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" memory-bank/systemPatterns.md
  sed -i '' "s/{{CURRENT_VERSION}}/$CURRENT_VERSION/g" memory-bank/systemPatterns.md
  echo "Variables inserted into systemPatterns.md"
fi

# Insert variables into progress.md
if [ -f "memory-bank/progress.md" ]; then
  sed -i '' "s/{{CURRENT_DATE}}/$CURRENT_DATE/g" memory-bank/progress.md
  echo "Variables inserted into progress.md"
fi

# Insert variables into decisionLog.md
if [ -f "memory-bank/decisionLog.md" ]; then
  sed -i '' "s/{{CURRENT_DATE}}/$CURRENT_DATE/g" memory-bank/decisionLog.md
  echo "Variables inserted into decisionLog.md"
fi

echo "All variables have been inserted successfully!"