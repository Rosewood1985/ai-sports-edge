#!/bin/bash

# check-security-policies.sh
#
# This script verifies security policies and configurations in the AI Sports Edge project.
# It checks for potential security issues, validates configurations, and ensures
# that security best practices are being followed.
#
# Usage:
#   ./scripts/check-security-policies.sh
#
# Runs every 24 hours via .cronrc

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print a message with a colored prefix
print_message() {
  local prefix=$1
  local message=$2
  local color=$3
  
  echo -e "${color}[$prefix]${NC} $message"
}

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOGS_DIR="$PROJECT_ROOT/logs"
STATUS_DIR="$PROJECT_ROOT/status"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$STATUS_DIR/security-audit-$TIMESTAMP.md"
LOG_FILE="$LOGS_DIR/security-audit-$TIMESTAMP.log"

# Ensure directories exist
mkdir -p "$LOGS_DIR"
mkdir -p "$STATUS_DIR"

# Log function
log() {
  local message=$1
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $message" | tee -a "$LOG_FILE"
}

# Check for sensitive information in code
check_sensitive_info() {
  print_message "INFO" "Checking for sensitive information in code..." "$BLUE"
  log "Checking for sensitive information in code..."
  
  # Create a temporary file to store results
  local temp_file=$(mktemp)
  
  # Check for potential API keys
  print_message "INFO" "Checking for API keys..." "$BLUE"
  grep -r "key\|api\|token\|secret\|password\|credential" --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" --include="*.json" "$PROJECT_ROOT" | grep -v "node_modules" | grep -i "['\"].*[a-zA-Z0-9_-]\{20,\}['\"]" > "$temp_file"
  
  local api_key_count=$(wc -l < "$temp_file")
  echo "- Found $api_key_count potential API keys or secrets"
  
  # Check for Firebase config files
  print_message "INFO" "Checking Firebase configurations..." "$BLUE"
  local firebase_configs=$(find "$PROJECT_ROOT" -name "*firebase*config*.js" -o -name "*firebase*config*.json" | grep -v "node_modules")
  
  if [ -n "$firebase_configs" ]; then
    echo "- Found Firebase configuration files:"
    echo "$firebase_configs" | while read -r file; do
      local rel_path="${file#$PROJECT_ROOT/}"
      echo "  - $rel_path"
    done
  else
    echo "- No Firebase configuration files found"
  fi
  
  # Clean up
  rm -f "$temp_file"
}

# Check for insecure dependencies
check_dependencies() {
  print_message "INFO" "Checking for insecure dependencies..." "$BLUE"
  log "Checking for insecure dependencies..."
  
  # Check if package.json exists
  if [ -f "$PROJECT_ROOT/package.json" ]; then
    # Check if npm is available
    if command -v npm >/dev/null 2>&1; then
      echo "- package.json found, checking for vulnerabilities..."
      
      # Run npm audit if available
      if npm audit --help >/dev/null 2>&1; then
        local audit_result=$(npm --prefix "$PROJECT_ROOT" audit --json 2>/dev/null)
        
        if [ -n "$audit_result" ]; then
          local vulnerability_count=$(echo "$audit_result" | grep -o '"vulnerabilities":{' | wc -l)
          
          if [ "$vulnerability_count" -gt 0 ]; then
            echo "- Vulnerabilities found in dependencies"
            echo "- Run 'npm audit' for details"
          else
            echo "- No vulnerabilities found in dependencies"
          fi
        else
          echo "- Unable to run npm audit"
        fi
      else
        echo "- npm audit not available, skipping vulnerability check"
      fi
    else
      echo "- npm not available, skipping dependency check"
    fi
  else
    echo "- No package.json found"
  fi
}

# Check for environment files
check_env_files() {
  print_message "INFO" "Checking environment files..." "$BLUE"
  log "Checking environment files..."
  
  # Find .env files
  local env_files=$(find "$PROJECT_ROOT" -name ".env*" | grep -v "node_modules")
  
  if [ -n "$env_files" ]; then
    echo "- Found environment files:"
    echo "$env_files" | while read -r file; do
      local rel_path="${file#$PROJECT_ROOT/}"
      echo "  - $rel_path"
      
      # Check if .env file is in .gitignore
      if [ -f "$PROJECT_ROOT/.gitignore" ]; then
        if ! grep -q "$(basename "$file")" "$PROJECT_ROOT/.gitignore"; then
          echo "    WARNING: This file may not be in .gitignore"
        fi
      fi
    done
  else
    echo "- No environment files found"
  fi
}

# Check for proper CORS configuration
check_cors_config() {
  print_message "INFO" "Checking CORS configuration..." "$BLUE"
  log "Checking CORS configuration..."
  
  # Look for CORS settings in code
  local cors_settings=$(grep -r "cors\|CORS\|Access-Control-Allow" --include="*.js" --include="*.ts" "$PROJECT_ROOT" | grep -v "node_modules")
  
  if [ -n "$cors_settings" ]; then
    echo "- Found CORS configurations:"
    echo "$cors_settings" | head -n 5 | while read -r line; do
      echo "  - $line"
    done
    
    # Check for potential security issues
    if echo "$cors_settings" | grep -q "Access-Control-Allow-Origin.*\*"; then
      echo "  WARNING: Found wildcard CORS origin (*), which may pose security risks"
    fi
  else
    echo "- No CORS configurations found"
  fi
}

# Check for proper Content Security Policy
check_csp() {
  print_message "INFO" "Checking Content Security Policy..." "$BLUE"
  log "Checking Content Security Policy..."
  
  # Look for CSP settings in code
  local csp_settings=$(grep -r "Content-Security-Policy\|CSP" --include="*.js" --include="*.ts" --include="*.html" "$PROJECT_ROOT" | grep -v "node_modules")
  
  if [ -n "$csp_settings" ]; then
    echo "- Found Content Security Policy configurations:"
    echo "$csp_settings" | head -n 5 | while read -r line; do
      echo "  - $line"
    done
  else
    echo "- No Content Security Policy configurations found"
    echo "  RECOMMENDATION: Implement a Content Security Policy to prevent XSS attacks"
  fi
}

# Check for proper authentication
check_authentication() {
  print_message "INFO" "Checking authentication mechanisms..." "$BLUE"
  log "Checking authentication mechanisms..."
  
  # Look for authentication code
  local auth_code=$(grep -r "auth\|login\|authenticate\|session\|token\|jwt\|password" --include="*.js" --include="*.ts" "$PROJECT_ROOT" | grep -v "node_modules")
  
  if [ -n "$auth_code" ]; then
    echo "- Found authentication-related code"
    
    # Check for potential security issues
    if echo "$auth_code" | grep -q "md5\|sha1"; then
      echo "  WARNING: Found potentially insecure hash algorithms (MD5, SHA1)"
    fi
    
    if echo "$auth_code" | grep -q "localStorage.*token\|localStorage.*auth"; then
      echo "  WARNING: Storing authentication tokens in localStorage may be insecure"
    fi
  else
    echo "- No authentication-related code found"
  fi
}

# Check for proper HTTPS usage
check_https() {
  print_message "INFO" "Checking HTTPS usage..." "$BLUE"
  log "Checking HTTPS usage..."
  
  # Look for HTTP URLs
  local http_urls=$(grep -r "http://" --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" --include="*.json" "$PROJECT_ROOT" | grep -v "node_modules" | grep -v "localhost")
  
  if [ -n "$http_urls" ]; then
    echo "- Found non-HTTPS URLs:"
    echo "$http_urls" | head -n 5 | while read -r line; do
      echo "  - $line"
    done
    echo "  RECOMMENDATION: Use HTTPS for all external URLs"
  else
    echo "- No non-HTTPS URLs found (excluding localhost)"
  fi
}

# Check Firebase security rules
check_firebase_rules() {
  print_message "INFO" "Checking Firebase security rules..." "$BLUE"
  log "Checking Firebase security rules..."
  
  # Look for Firebase security rules files
  local rules_files=$(find "$PROJECT_ROOT" -name "firestore.rules" -o -name "database.rules.json" -o -name "storage.rules")
  
  if [ -n "$rules_files" ]; then
    echo "- Found Firebase security rules files:"
    echo "$rules_files" | while read -r file; do
      local rel_path="${file#$PROJECT_ROOT/}"
      echo "  - $rel_path"
      
      # Check for potential security issues
      if grep -q "allow read, write" "$file" || grep -q "allow read, write: if true" "$file"; then
        echo "    WARNING: Found potentially insecure rules allowing unrestricted access"
      fi
    done
  else
    echo "- No Firebase security rules files found"
  fi
}

# Generate security audit report
generate_report() {
  print_message "INFO" "Generating security audit report..." "$BLUE"
  log "Generating security audit report..."
  
  # Create report file
  cat > "$REPORT_FILE" << EOF
# Security Audit Report - $(date +"%Y-%m-%d")

This report provides an overview of the security audit performed on the AI Sports Edge project.

## Sensitive Information

$(check_sensitive_info)

## Dependency Security

$(check_dependencies)

## Environment Files

$(check_env_files)

## CORS Configuration

$(check_cors_config)

## Content Security Policy

$(check_csp)

## Authentication Mechanisms

$(check_authentication)

## HTTPS Usage

$(check_https)

## Firebase Security Rules

$(check_firebase_rules)

## Recommendations

1. Ensure all API keys and secrets are stored securely and not committed to the repository
2. Address any vulnerabilities in dependencies
3. Make sure all environment files are properly gitignored
4. Configure CORS properly to restrict access to trusted domains
5. Implement a Content Security Policy to prevent XSS attacks
6. Use secure authentication mechanisms and avoid storing sensitive data in localStorage
7. Use HTTPS for all external URLs
8. Review Firebase security rules to ensure proper access controls

## Next Steps

- Address any security issues identified in this report
- Implement security best practices for areas not covered by this audit
- Consider a professional security audit for critical components

Report generated on $(date +"%Y-%m-%d %H:%M:%S")
EOF
  
  # Create a symlink to the latest report
  ln -sf "$REPORT_FILE" "$STATUS_DIR/latest-security-audit.md"
  
  print_message "SUCCESS" "Security audit report generated: $REPORT_FILE" "$GREEN"
  log "Security audit report generated: $REPORT_FILE"
}

# Main function
main() {
  print_message "INFO" "Starting security policy check..." "$BLUE"
  log "Starting security policy check..."
  
  # Generate report
  generate_report
  
  print_message "SUCCESS" "Security policy check completed" "$GREEN"
  log "Security policy check completed"
}

# Run the script
main