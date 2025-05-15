#!/usr/bin/env python3
"""
GitHub Label Setup Script

This script automatically creates standardized labels in the GitHub repository
for consistent issue and PR tracking.
"""

import os
import sys
import requests
import json

# GitHub repository information
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
REPO_OWNER = "Rosewood1985"  # Update with your GitHub username
REPO_NAME = "ai-sports-edge"  # Update with your repository name

# Define labels with their colors and descriptions
LABELS = [
    {
        "name": "documentation",
        "color": "0075ca",
        "description": "Issues or PRs related to updating or creating documentation"
    },
    {
        "name": "bug",
        "color": "d73a4a",
        "description": "Something isn't working as expected"
    },
    {
        "name": "feature",
        "color": "a2eeef",
        "description": "New functionality requests or additions"
    },
    {
        "name": "enhancement",
        "color": "84b6eb",
        "description": "Improvements to existing features"
    },
    {
        "name": "urgent",
        "color": "b60205",
        "description": "Time-sensitive issues that need immediate attention"
    },
    {
        "name": "technical debt",
        "color": "e4e669",
        "description": "Fixes needed for code quality, organization, or refactoring"
    },
    {
        "name": "question",
        "color": "d876e3",
        "description": "General questions or clarifications needed"
    },
    {
        "name": "internal ops",
        "color": "c2e0c6",
        "description": "Scripts, automation, DevOps, cron jobs, internal tools"
    },
    {
        "name": "priority: low",
        "color": "ededed",
        "description": "Tasks that can be addressed later"
    },
    {
        "name": "priority: high",
        "color": "fbca04",
        "description": "Tasks that are critical to roadmap success"
    }
]

def create_or_update_label(label):
    """Create or update a GitHub label"""
    url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/labels"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    # Check if label exists
    response = requests.get(url, headers=headers)
    existing_labels = {label['name']: label for label in response.json()} if response.status_code == 200 else {}
    
    if label['name'] in existing_labels:
        # Update existing label
        update_url = f"{url}/{label['name']}"
        response = requests.patch(update_url, headers=headers, json=label)
        if response.status_code == 200:
            print(f"✅ Updated label: {label['name']}")
        else:
            print(f"❌ Failed to update label {label['name']}: {response.status_code} - {response.text}")
    else:
        # Create new label
        response = requests.post(url, headers=headers, json=label)
        if response.status_code == 201:
            print(f"✅ Created label: {label['name']}")
        else:
            print(f"❌ Failed to create label {label['name']}: {response.status_code} - {response.text}")

def main():
    """Main function to create or update all labels"""
    if not GITHUB_TOKEN:
        print("❌ Error: GITHUB_TOKEN environment variable is not set.")
        print("Please set it with: export GITHUB_TOKEN=your_github_personal_access_token")
        sys.exit(1)
    
    print(f"🏷️ Setting up labels for {REPO_OWNER}/{REPO_NAME}...")
    
    for label in LABELS:
        create_or_update_label(label)
    
    print("✅ Label setup complete!")

if __name__ == "__main__":
    main()