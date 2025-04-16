#!/bin/bash

# Firebase Custom Domains and SSL Setup Script
# This script sets up custom domains and SSL certificates for Firebase Hosting

set -e
# Configuration
PROJECT_ID="ai-sports-edge"
CONFIG_DIR="./config"
DOMAINS_CONFIG="${CONFIG_DIR}/custom-domains.json"
SSL_CONFIG="${CONFIG_DIR}/ssl-certificates.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are installed
command -v firebase >/dev/null 2>&1 || { echo -e "${RED}Error: firebase-tools is not installed. Run 'npm install -g firebase-tools'${NC}" >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo -e "${RED}Error: jq is not installed. Install it using your package manager.${NC}" >&2; exit 1; }

# Check if configuration files exist
if [ ! -f "$DOMAINS_CONFIG" ]; then
  echo -e "${RED}Error: Custom domains configuration file $DOMAINS_CONFIG not found${NC}"
  exit 1
fi

if [ ! -f "$SSL_CONFIG" ]; then
  echo -e "${RED}Error: SSL certificates configuration file $SSL_CONFIG not found${NC}"
  exit 1
fi

# Check if user is logged in to Firebase
firebase projects:list >/dev/null 2>&1 || { echo -e "${YELLOW}You are not logged in to Firebase. Please log in:${NC}"; firebase login; }

echo -e "${BLUE}=== Setting up Custom Domains and SSL Certificates for Firebase Hosting ===${NC}"
echo -e "${BLUE}Project: ${PROJECT_ID}${NC}"

# Ensure we're using the correct project
echo -e "${BLUE}Setting Firebase project to ${PROJECT_ID}...${NC}"
firebase use "$PROJECT_ID"

# Load configuration
echo -e "${BLUE}Loading configuration...${NC}"
DOMAINS=$(jq -r '.domains[].domainName' "$DOMAINS_CONFIG")
DEFAULT_DOMAIN=$(jq -r '.settings.defaultDomain' "$DOMAINS_CONFIG")

# Function to check if a domain is already connected
function is_domain_connected() {
  local domain=$1
  firebase hosting:sites:list | grep -q "$domain"
  return $?
}

# Function to check DNS configuration
function check_dns_configuration() {
  local domain=$1
  local domain_type=$(jq -r ".domains[] | select(.domainName == \"$domain\") | .type" "$DOMAINS_CONFIG")
  
  echo -e "${BLUE}Checking DNS configuration for ${domain}...${NC}"
  
  if [ "$domain_type" == "primary" ]; then
    echo -e "${YELLOW}For the primary domain ${domain}, please ensure the following DNS records are set:${NC}"
    jq -r ".domains[] | select(.domainName == \"$domain\") | .dnsRecords[] | \"Type: \\(.type), Name: \\(.name), Value: \\(.value), TTL: \\(.ttl)\"" "$DOMAINS_CONFIG"
  else
    echo -e "${YELLOW}For the ${domain_type} domain ${domain}, please ensure the following DNS records are set:${NC}"
    jq -r ".domains[] | select(.domainName == \"$domain\") | .dnsRecords[] | \"Type: \\(.type), Name: \\(.name), Value: \\(.value), TTL: \\(.ttl)\"" "$DOMAINS_CONFIG"
  fi
  
  echo -e "${YELLOW}Have you configured these DNS records? (y/n)${NC}"
  read -r dns_configured
  
  if [[ "$dns_configured" != "y" && "$dns_configured" != "Y" ]]; then
    echo -e "${RED}Please configure the DNS records before continuing.${NC}"
    exit 1
  fi
}

# Connect domains to Firebase Hosting
echo -e "${BLUE}Connecting domains to Firebase Hosting...${NC}"
for domain in $DOMAINS; do
  echo -e "${BLUE}Processing domain: ${domain}${NC}"
  
  # Check if domain is already connected
  if is_domain_connected "$domain"; then
    echo -e "${YELLOW}Domain ${domain} is already connected to Firebase Hosting.${NC}"
  else
    # Check DNS configuration before connecting
    check_dns_configuration "$domain"
    
    # Connect domain
    echo -e "${BLUE}Connecting domain ${domain} to Firebase Hosting...${NC}"
    firebase hosting:sites:create "$domain" || echo -e "${YELLOW}Site may already exist for ${domain}${NC}"
    firebase hosting:channel:deploy production --site "$domain"
    
    # Set default domain if this is the default
    if [ "$domain" == "$DEFAULT_DOMAIN" ]; then
      echo -e "${BLUE}Setting ${domain} as the default domain...${NC}"
      firebase hosting:sites:update "$domain" --set-default
    fi
  fi
done

# Set up SSL certificates
echo -e "${BLUE}Setting up SSL certificates...${NC}"
for domain in $DOMAINS; do
  echo -e "${BLUE}Setting up SSL certificate for ${domain}...${NC}"
  
  # Check certificate type
  cert_type=$(jq -r ".certificates[] | select(.domain == \"$domain\") | .type" "$SSL_CONFIG")
  
  if [ "$cert_type" == "managed" ]; then
    echo -e "${BLUE}Setting up managed SSL certificate for ${domain}...${NC}"
    firebase hosting:sites:update "$domain" --ssl auto
  else
    echo -e "${YELLOW}Custom SSL certificates are not supported through this script.${NC}"
    echo -e "${YELLOW}Please upload your custom certificate through the Firebase Console.${NC}"
  fi
done

# Configure SSL settings
echo -e "${BLUE}Configuring SSL settings...${NC}"
min_tls_version=$(jq -r '.settings.minimumTlsVersion' "$SSL_CONFIG")
hsts_enabled=$(jq -r '.settings.httpStrictTransportSecurity.enabled' "$SSL_CONFIG")
hsts_max_age=$(jq -r '.settings.httpStrictTransportSecurity.maxAge' "$SSL_CONFIG")
hsts_include_subdomains=$(jq -r '.settings.httpStrictTransportSecurity.includeSubdomains' "$SSL_CONFIG")
hsts_preload=$(jq -r '.settings.httpStrictTransportSecurity.preload' "$SSL_CONFIG")

echo -e "${YELLOW}SSL settings to be applied:${NC}"
echo -e "  - Minimum TLS Version: $min_tls_version"
echo -e "  - HSTS Enabled: $hsts_enabled"
echo -e "  - HSTS Max Age: $hsts_max_age"
echo -e "  - HSTS Include Subdomains: $hsts_include_subdomains"
echo -e "  - HSTS Preload: $hsts_preload"

# In a real implementation, these settings would be applied through the Firebase API
# For now, we'll just print what would be done
echo -e "${YELLOW}These settings need to be applied manually through the Firebase Console.${NC}"

# Verify domain connections
echo -e "${BLUE}Verifying domain connections...${NC}"
firebase hosting:sites:list

echo -e "${GREEN}=== Custom Domains and SSL Certificates Setup Completed ===${NC}"
echo -e "${GREEN}Please verify the domain connections and SSL certificates in the Firebase Console:${NC}"
echo -e "${GREEN}https://console.firebase.google.com/project/${PROJECT_ID}/hosting/sites${NC}"

echo -e "${YELLOW}Note: It may take up to 24 hours for SSL certificates to be provisioned and DNS changes to propagate.${NC}"