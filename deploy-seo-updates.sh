#!/bin/bash

# Deploy SEO Updates Script
#
# This script automates the process of updating the SEO base URL and generating sitemaps.
# It can be used to deploy SEO changes to different environments.
#
# Usage:
# ./deploy-seo-updates.sh [base_url] [output_dir]
#
# Example:
# ./deploy-seo-updates.sh https://aisportsedge.app ./public

# Make script exit on error
set -e

# Default values
BASE_URL=${1:-"https://aisportsedge.app"}
OUTPUT_DIR=${2:-"./public"}

# Print script header
echo "====================================="
echo "  Deploying SEO Updates"
echo "====================================="
echo "Base URL: $BASE_URL"
echo "Output Directory: $OUTPUT_DIR"
echo "====================================="

# Create output directory if it doesn't exist
if [ ! -d "$OUTPUT_DIR" ]; then
  echo "Creating output directory: $OUTPUT_DIR"
  mkdir -p "$OUTPUT_DIR"
fi

# Update SEO base URL
echo "Updating SEO base URL to: $BASE_URL"
node scripts/update-seo-base-url.js "$BASE_URL"

# Generate sitemaps
echo "Generating sitemaps in: $OUTPUT_DIR"
SITEMAP_OUTPUT_DIR="$OUTPUT_DIR" node scripts/generateSitemap.js

# Test sitemap generation
echo "Testing sitemap generation"
node scripts/test-sitemap-generation.js

# Verify sitemaps
echo "Verifying sitemaps"
if [ -f "$OUTPUT_DIR/sitemap.xml" ]; then
  echo "✅ Sitemap index file exists"
else
  echo "❌ Sitemap index file does not exist"
  exit 1
fi

# Count language-specific sitemaps
SITEMAP_COUNT=$(find "$OUTPUT_DIR" -name "sitemap-*.xml" | wc -l)
echo "Found $SITEMAP_COUNT language-specific sitemaps"

if [ "$SITEMAP_COUNT" -gt 0 ]; then
  echo "✅ Language-specific sitemaps exist"
else
  echo "❌ No language-specific sitemaps found"
  exit 1
fi

# Print success message
echo "====================================="
echo "  SEO Updates Deployed Successfully"
echo "====================================="
echo "Base URL: $BASE_URL"
echo "Output Directory: $OUTPUT_DIR"
echo "Sitemap Index: $OUTPUT_DIR/sitemap.xml"
echo "Language Sitemaps: $SITEMAP_COUNT"
echo "====================================="

# Make the script executable
chmod +x deploy-seo-updates.sh

echo "Done!"