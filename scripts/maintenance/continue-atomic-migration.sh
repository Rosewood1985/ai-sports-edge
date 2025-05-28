#!/bin/bash

# Script to continue the atomic architecture migration
# This script helps with migrating remaining components, monitoring deployment, and updating documentation

# Set up variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="continue-migration-$TIMESTAMP.log"

# Start logging
echo "Starting continued atomic architecture migration at $(date)" | tee -a $LOG_FILE
echo "----------------------------------------" | tee -a $LOG_FILE

# Function to display menu
display_menu() {
  clear
  echo "AI Sports Edge - Atomic Architecture Migration"
  echo "----------------------------------------"
  echo "1. Migrate Components"
  echo "2. Monitor Deployment"
  echo "3. Update Documentation"
  echo "4. Exit"
  echo "----------------------------------------"
  echo "Enter your choice [1-4]: "
}

# Function to migrate components
migrate_components() {
  echo "Migrating Components" | tee -a $LOG_FILE
  echo "----------------------------------------" | tee -a $LOG_FILE
  
  # List remaining components to migrate
  echo "Remaining components to migrate:" | tee -a $LOG_FILE
  echo "1. HomePage (screens/HomeScreen.tsx)" | tee -a $LOG_FILE
  echo "2. ProfilePage (screens/ProfileScreen.tsx)" | tee -a $LOG_FILE
  echo "3. BettingPage (screens/BettingScreen.tsx)" | tee -a $LOG_FILE
  echo "4. SettingsPage (screens/SettingsScreen.tsx)" | tee -a $LOG_FILE
  echo "5. Custom component" | tee -a $LOG_FILE
  echo "----------------------------------------" | tee -a $LOG_FILE
  
  # Ask for component to migrate
  read -p "Enter component number to migrate [1-5]: " component_number
  
  case $component_number in
    1)
      echo "Migrating HomePage..." | tee -a $LOG_FILE
      ./complete-atomic-migration.sh <<< $'HomePage,pages,screens/HomeScreen.tsx\ndone'
      ;;
    2)
      echo "Migrating ProfilePage..." | tee -a $LOG_FILE
      ./complete-atomic-migration.sh <<< $'ProfilePage,pages,screens/ProfileScreen.tsx\ndone'
      ;;
    3)
      echo "Migrating BettingPage..." | tee -a $LOG_FILE
      ./complete-atomic-migration.sh <<< $'BettingPage,pages,screens/BettingScreen.tsx\ndone'
      ;;
    4)
      echo "Migrating SettingsPage..." | tee -a $LOG_FILE
      ./complete-atomic-migration.sh <<< $'SettingsPage,pages,screens/SettingsScreen.tsx\ndone'
      ;;
    5)
      echo "Migrating custom component..." | tee -a $LOG_FILE
      read -p "Enter component name: " component_name
      read -p "Enter component type (atoms, molecules, organisms, templates, pages): " component_type
      read -p "Enter source file path: " source_file
      
      ./complete-atomic-migration.sh <<< $"$component_name,$component_type,$source_file\ndone"
      ;;
    *)
      echo "Invalid choice" | tee -a $LOG_FILE
      ;;
  esac
  
  # Run ESLint on migrated component
  echo "Running ESLint on migrated component..." | tee -a $LOG_FILE
  npx eslint --config .eslintrc.atomic.js atomic/**/*.js >> $LOG_FILE 2>&1
  
  # Run tests on migrated component
  echo "Running tests on migrated component..." | tee -a $LOG_FILE
  npx jest --config=jest.config.atomic.js __tests__/atomic/ >> $LOG_FILE 2>&1
  
  # Push changes to git
  echo "Pushing changes to git..." | tee -a $LOG_FILE
  read -p "Enter commit message: " commit_message
  
  git add atomic/
  git add __tests__/atomic/
  git commit -m "$commit_message"
  git push
  
  echo "Component migration completed" | tee -a $LOG_FILE
  read -p "Press Enter to continue..."
}

# Function to monitor deployment
monitor_deployment() {
  echo "Monitoring Deployment" | tee -a $LOG_FILE
  echo "----------------------------------------" | tee -a $LOG_FILE
  
  # Check Firebase deployment status
  echo "Checking Firebase deployment status..." | tee -a $LOG_FILE
  firebase deploy --only hosting:status >> $LOG_FILE 2>&1
  
  # Check Expo deployment status
  echo "Checking Expo deployment status..." | tee -a $LOG_FILE
  expo publish:history >> $LOG_FILE 2>&1
  
  # Check error logs
  echo "Checking error logs..." | tee -a $LOG_FILE
  tail -n 50 app-debug.log >> $LOG_FILE 2>&1
  
  # Check performance
  echo "Checking performance..." | tee -a $LOG_FILE
  echo "Performance monitoring is available at: https://console.firebase.google.com/project/ai-sports-edge/performance" | tee -a $LOG_FILE
  
  echo "Deployment monitoring completed" | tee -a $LOG_FILE
  read -p "Press Enter to continue..."
}

# Function to update documentation
update_documentation() {
  echo "Updating Documentation" | tee -a $LOG_FILE
  echo "----------------------------------------" | tee -a $LOG_FILE
  
  # List documentation files
  echo "Documentation files:" | tee -a $LOG_FILE
  echo "1. atomic-architecture-summary.md" | tee -a $LOG_FILE
  echo "2. atomic-migration-plan.md" | tee -a $LOG_FILE
  echo "3. atomic-next-steps.md" | tee -a $LOG_FILE
  echo "4. atomic-deployment-summary.md" | tee -a $LOG_FILE
  echo "5. memory-bank/atomic-architecture-memory.md" | tee -a $LOG_FILE
  echo "----------------------------------------" | tee -a $LOG_FILE
  
  # Ask for file to update
  read -p "Enter file number to update [1-5]: " file_number
  
  case $file_number in
    1)
      echo "Updating atomic-architecture-summary.md..." | tee -a $LOG_FILE
      ${EDITOR:-nano} atomic-architecture-summary.md
      ;;
    2)
      echo "Updating atomic-migration-plan.md..." | tee -a $LOG_FILE
      ${EDITOR:-nano} atomic-migration-plan.md
      ;;
    3)
      echo "Updating atomic-next-steps.md..." | tee -a $LOG_FILE
      ${EDITOR:-nano} atomic-next-steps.md
      ;;
    4)
      echo "Updating atomic-deployment-summary.md..." | tee -a $LOG_FILE
      ${EDITOR:-nano} atomic-deployment-summary.md
      ;;
    5)
      echo "Updating memory-bank/atomic-architecture-memory.md..." | tee -a $LOG_FILE
      ${EDITOR:-nano} memory-bank/atomic-architecture-memory.md
      ;;
    *)
      echo "Invalid choice" | tee -a $LOG_FILE
      ;;
  esac
  
  # Push changes to git
  echo "Pushing changes to git..." | tee -a $LOG_FILE
  read -p "Enter commit message: " commit_message
  
  git add .
  git commit -m "$commit_message"
  git push
  
  echo "Documentation update completed" | tee -a $LOG_FILE
  read -p "Press Enter to continue..."
}

# Main loop
while true; do
  display_menu
  read choice
  
  case $choice in
    1)
      migrate_components
      ;;
    2)
      monitor_deployment
      ;;
    3)
      update_documentation
      ;;
    4)
      echo "Exiting..." | tee -a $LOG_FILE
      echo "See $LOG_FILE for details" | tee -a $LOG_FILE
      exit 0
      ;;
    *)
      echo "Invalid choice" | tee -a $LOG_FILE
      read -p "Press Enter to continue..."
      ;;
  esac
done