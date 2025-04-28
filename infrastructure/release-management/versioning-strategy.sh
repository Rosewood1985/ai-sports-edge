#!/bin/bash

# Versioning Strategy Implementation Script
# This script implements proper app versioning for AI Sports Edge

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}AI Sports Edge - Versioning Strategy Implementation${NC}"
echo "=================================================="

# Function to check if a command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed. Please install it first.${NC}"
        return 1
    fi
    return 0
}

# Check for required tools
check_command "git" || exit 1
check_command "jq" || exit 1

# Configuration variables
APP_NAME="ai-sports-edge"
VERSION_FILE="package.json"
CHANGELOG_FILE="CHANGELOG.md"

# Function to validate semantic version
validate_version() {
    local version=$1
    if [[ ! $version =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9\.]+)?(\+[a-zA-Z0-9\.]+)?$ ]]; then
        echo -e "${RED}Error: Invalid semantic version format. Expected format: X.Y.Z[-prerelease][+build]${NC}"
        return 1
    fi
    return 0
}

# Function to get current version from package.json
get_current_version() {
    if [ -f "$VERSION_FILE" ]; then
        local version=$(jq -r '.version' "$VERSION_FILE")
        echo "$version"
    else
        echo -e "${RED}Error: $VERSION_FILE not found.${NC}"
        exit 1
    fi
}

# Function to update version in package.json
update_version() {
    local new_version=$1
    if [ -f "$VERSION_FILE" ]; then
        # Create a backup
        cp "$VERSION_FILE" "${VERSION_FILE}.bak"
        
        # Update version
        jq ".version = \"$new_version\"" "$VERSION_FILE" > "${VERSION_FILE}.tmp"
        mv "${VERSION_FILE}.tmp" "$VERSION_FILE"
        
        echo -e "${GREEN}Updated version in $VERSION_FILE to $new_version${NC}"
    else
        echo -e "${RED}Error: $VERSION_FILE not found.${NC}"
        exit 1
    fi
}

# Function to update version in app.json for Expo/React Native
update_expo_version() {
    local new_version=$1
    if [ -f "app.json" ]; then
        # Create a backup
        cp "app.json" "app.json.bak"
        
        # Update version
        jq ".expo.version = \"$new_version\" | .expo.ios.buildNumber = ((.expo.ios.buildNumber | tonumber) + 1 | tostring) | .expo.android.versionCode = ((.expo.android.versionCode | tonumber) + 1)" "app.json" > "app.json.tmp"
        mv "app.json.tmp" "app.json"
        
        echo -e "${GREEN}Updated version in app.json to $new_version${NC}"
    else
        echo -e "${YELLOW}Warning: app.json not found. Skipping Expo version update.${NC}"
    fi
}

# Function to create or update changelog
update_changelog() {
    local new_version=$1
    local changes=$2
    local date=$(date +"%Y-%m-%d")
    
    if [ ! -f "$CHANGELOG_FILE" ]; then
        # Create new changelog file
        cat > "$CHANGELOG_FILE" << EOF
# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [$new_version] - $date
$changes

EOF
    else
        # Update existing changelog
        local temp_file=$(mktemp)
        
        # Extract header (everything up to the first version entry)
        awk '/^## \[[0-9]+\.[0-9]+\.[0-9]+/ { exit } { print }' "$CHANGELOG_FILE" > "$temp_file"
        
        # Add new version entry
        echo -e "## [$new_version] - $date\n$changes\n" >> "$temp_file"
        
        # Add the rest of the file
        awk 'BEGIN { found=0 } /^## \[[0-9]+\.[0-9]+\.[0-9]+/ { found=1 } found { print }' "$CHANGELOG_FILE" >> "$temp_file"
        
        # Replace original file
        mv "$temp_file" "$CHANGELOG_FILE"
    fi
    
    echo -e "${GREEN}Updated $CHANGELOG_FILE with version $new_version${NC}"
}

# Function to create git tag for version
create_git_tag() {
    local version=$1
    
    # Check if we're in a git repository
    if [ -d ".git" ]; then
        # Check if tag already exists
        if git rev-parse "v$version" >/dev/null 2>&1; then
            echo -e "${YELLOW}Warning: Git tag v$version already exists.${NC}"
        else
            # Create and push tag
            git tag -a "v$version" -m "Release version $version"
            echo -e "${GREEN}Created git tag v$version${NC}"
            
            # Ask if user wants to push the tag
            read -p "Do you want to push the tag to remote repository? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                git push origin "v$version"
                echo -e "${GREEN}Pushed tag v$version to remote repository${NC}"
            fi
        fi
    else
        echo -e "${YELLOW}Warning: Not a git repository. Skipping git tag creation.${NC}"
    fi
}

# Function to bump version
bump_version() {
    local current_version=$(get_current_version)
    local version_parts=(${current_version//./ })
    local major=${version_parts[0]}
    local minor=${version_parts[1]}
    local patch=${version_parts[2]}
    
    # Remove any pre-release or build metadata from patch
    patch=$(echo $patch | sed -E 's/(-[a-zA-Z0-9\.]+)?(\+[a-zA-Z0-9\.]+)?$//')
    
    case $1 in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
        *)
            echo -e "${RED}Error: Invalid version bump type. Use 'major', 'minor', or 'patch'.${NC}"
            exit 1
            ;;
    esac
    
    echo "$major.$minor.$patch"
}

# Function to create a pre-release version
create_prerelease() {
    local current_version=$(get_current_version)
    local prerelease_type=$1
    
    # Remove any existing pre-release or build metadata
    local base_version=$(echo $current_version | sed -E 's/(-[a-zA-Z0-9\.]+)?(\+[a-zA-Z0-9\.]+)?$//')
    
    echo "${base_version}-${prerelease_type}.1"
}

# Function to increment pre-release version
increment_prerelease() {
    local current_version=$(get_current_version)
    
    # Check if current version is a pre-release
    if [[ ! $current_version =~ -([a-zA-Z]+)\.([0-9]+) ]]; then
        echo -e "${RED}Error: Current version is not a pre-release version.${NC}"
        exit 1
    fi
    
    local prerelease_type=${BASH_REMATCH[1]}
    local prerelease_num=${BASH_REMATCH[2]}
    
    # Increment pre-release number
    local new_prerelease_num=$((prerelease_num + 1))
    
    # Replace pre-release part with incremented version
    local new_version=$(echo $current_version | sed -E "s/-${prerelease_type}\.${prerelease_num}/-${prerelease_type}.${new_prerelease_num}/")
    
    echo "$new_version"
}

# Function to finalize a pre-release version
finalize_prerelease() {
    local current_version=$(get_current_version)
    
    # Check if current version is a pre-release
    if [[ ! $current_version =~ -([a-zA-Z]+)\.([0-9]+) ]]; then
        echo -e "${RED}Error: Current version is not a pre-release version.${NC}"
        exit 1
    fi
    
    # Remove pre-release part
    local new_version=$(echo $current_version | sed -E 's/(-[a-zA-Z0-9\.]+)?(\+[a-zA-Z0-9\.]+)?$//')
    
    echo "$new_version"
}

# Function to display help
show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --current                 Display current version"
    echo "  --bump <major|minor|patch> Bump version (major, minor, or patch)"
    echo "  --set <version>           Set specific version"
    echo "  --prerelease <type>       Create pre-release version (e.g., alpha, beta, rc)"
    echo "  --increment-prerelease    Increment pre-release version number"
    echo "  --finalize                Finalize pre-release version"
    echo "  --help                    Display this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --current              # Display current version"
    echo "  $0 --bump minor           # Bump minor version"
    echo "  $0 --set 2.1.0            # Set version to 2.1.0"
    echo "  $0 --prerelease beta      # Create beta pre-release"
    echo "  $0 --increment-prerelease # Increment pre-release number"
    echo "  $0 --finalize             # Finalize pre-release to stable version"
}

# Main function
main() {
    # Parse command line arguments
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    while [ $# -gt 0 ]; do
        case $1 in
            --current)
                echo "Current version: $(get_current_version)"
                exit 0
                ;;
            --bump)
                if [ -z "$2" ]; then
                    echo -e "${RED}Error: Missing bump type.${NC}"
                    exit 1
                fi
                
                new_version=$(bump_version $2)
                echo "Bumping $2 version from $(get_current_version) to $new_version"
                
                read -p "Enter changelog entries (press Ctrl+D when done):" -e -d $'\04' changes
                
                update_version "$new_version"
                update_expo_version "$new_version"
                update_changelog "$new_version" "$changes"
                create_git_tag "$new_version"
                
                shift
                ;;
            --set)
                if [ -z "$2" ]; then
                    echo -e "${RED}Error: Missing version.${NC}"
                    exit 1
                fi
                
                validate_version "$2" || exit 1
                
                echo "Setting version from $(get_current_version) to $2"
                
                read -p "Enter changelog entries (press Ctrl+D when done):" -e -d $'\04' changes
                
                update_version "$2"
                update_expo_version "$2"
                update_changelog "$2" "$changes"
                create_git_tag "$2"
                
                shift
                ;;
            --prerelease)
                if [ -z "$2" ]; then
                    echo -e "${RED}Error: Missing pre-release type.${NC}"
                    exit 1
                fi
                
                new_version=$(create_prerelease $2)
                echo "Creating pre-release version from $(get_current_version) to $new_version"
                
                read -p "Enter changelog entries (press Ctrl+D when done):" -e -d $'\04' changes
                
                update_version "$new_version"
                update_expo_version "$new_version"
                update_changelog "$new_version" "$changes"
                create_git_tag "$new_version"
                
                shift
                ;;
            --increment-prerelease)
                new_version=$(increment_prerelease)
                echo "Incrementing pre-release version from $(get_current_version) to $new_version"
                
                read -p "Enter changelog entries (press Ctrl+D when done):" -e -d $'\04' changes
                
                update_version "$new_version"
                update_expo_version "$new_version"
                update_changelog "$new_version" "$changes"
                create_git_tag "$new_version"
                ;;
            --finalize)
                new_version=$(finalize_prerelease)
                echo "Finalizing pre-release version from $(get_current_version) to $new_version"
                
                read -p "Enter changelog entries (press Ctrl+D when done):" -e -d $'\04' changes
                
                update_version "$new_version"
                update_expo_version "$new_version"
                update_changelog "$new_version" "$changes"
                create_git_tag "$new_version"
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                echo -e "${RED}Error: Unknown option $1${NC}"
                show_help
                exit 1
                ;;
        esac
        shift
    done
}

# Run the main function
main "$@"