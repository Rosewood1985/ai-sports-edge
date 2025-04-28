#!/bin/bash

# Script to set up and run the RSS feed integration

# Install dependencies
echo "Installing dependencies..."
npm install

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p api/rssFeeds
mkdir -p jobs
mkdir -p web/components
mkdir -p web/styles

# Check if files exist
if [ -f "api/rssFeeds/contentFiltering.js" ] && \
   [ -f "api/rssFeeds/fetchRssFeeds.js" ] && \
   [ -f "api/rssFeeds/index.js" ] && \
   [ -f "jobs/rssFeedCronJob.js" ] && \
   [ -f "web/components/NewsTicker.js" ] && \
   [ -f "web/components/UserPreferences.js" ] && \
   [ -f "web/styles/news-ticker.css" ] && \
   [ -f "web/styles/user-preferences.css" ]; then
  echo "All RSS feed files are in place."
else
  echo "Some RSS feed files are missing. Please make sure all files are in place."
  exit 1
fi

# Start the server
echo "Starting the server..."
npm run serve