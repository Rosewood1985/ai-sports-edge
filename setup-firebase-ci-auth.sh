#!/bin/bash

# Firebase CI Token Authentication Setup Script
# This script sets up Firebase authentication using a CI token for dev container deployment

set -e

echo "🔧 Firebase CI Token Authentication Setup"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI is not installed. Installing..."
    npm install -g firebase-tools
    print_status "Firebase CLI installed successfully"
fi

# Check for existing CI token in environment
if [ -n "$FIREBASE_TOKEN" ]; then
    print_status "Firebase CI token found in environment"
    
    # Test the token
    echo "Testing Firebase authentication..."
    if firebase projects:list --token "$FIREBASE_TOKEN" > /dev/null 2>&1; then
        print_status "Firebase CI token is valid and working"
        firebase projects:list --token "$FIREBASE_TOKEN"
        exit 0
    else
        print_error "Firebase CI token is invalid or expired"
        unset FIREBASE_TOKEN
    fi
fi

# Check for token in .env file
if [ -f ".env" ] && grep -q "FIREBASE_TOKEN" .env; then
    print_warning "Found FIREBASE_TOKEN in .env file"
    source .env
    if [ -n "$FIREBASE_TOKEN" ]; then
        echo "Testing Firebase token from .env..."
        if firebase projects:list --token "$FIREBASE_TOKEN" > /dev/null 2>&1; then
            print_status "Firebase token from .env is valid"
            export FIREBASE_TOKEN
            firebase projects:list --token "$FIREBASE_TOKEN"
            exit 0
        else
            print_error "Firebase token from .env is invalid"
        fi
    fi
fi

# Guide user through CI token generation
echo ""
print_warning "No valid Firebase CI token found. You need to generate one."
echo ""
echo "📋 INSTRUCTIONS FOR GENERATING FIREBASE CI TOKEN:"
echo "================================================="
echo ""
echo "Since this is a dev container environment, you need to generate a CI token"
echo "on a machine with browser access (your local machine) and then use it here."
echo ""
echo "1. On your LOCAL MACHINE (not in this dev container), run:"
echo "   firebase login:ci"
echo ""
echo "2. This will:"
echo "   - Open a browser for Firebase authentication"
echo "   - After successful login, display a CI token"
echo ""
echo "3. Copy the CI token that looks like:"
echo "   1//0GiXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
echo ""
echo "4. Then return here and paste the token when prompted."
echo ""

# Prompt for CI token
read -p "Enter your Firebase CI token: " FIREBASE_TOKEN

if [ -z "$FIREBASE_TOKEN" ]; then
    print_error "No token provided. Exiting."
    exit 1
fi

# Test the provided token
echo "Testing provided Firebase CI token..."
if firebase projects:list --token "$FIREBASE_TOKEN" > /dev/null 2>&1; then
    print_status "Firebase CI token is valid!"
    
    # Save token to .env file
    if [ ! -f ".env" ]; then
        touch .env
    fi
    
    # Remove existing FIREBASE_TOKEN line if present
    sed -i '/^FIREBASE_TOKEN=/d' .env
    
    # Add new token
    echo "FIREBASE_TOKEN=$FIREBASE_TOKEN" >> .env
    print_status "Firebase CI token saved to .env file"
    
    # Export for current session
    export FIREBASE_TOKEN
    
    # Show projects
    echo ""
    echo "Available Firebase projects:"
    firebase projects:list --token "$FIREBASE_TOKEN"
    
    print_status "Firebase authentication setup complete!"
    echo ""
    echo "🚀 You can now run Firebase commands using:"
    echo "   firebase <command> --token \$FIREBASE_TOKEN"
    echo ""
    echo "Or source the .env file:"
    echo "   source .env && firebase <command> --token \$FIREBASE_TOKEN"
    
else
    print_error "Invalid Firebase CI token. Please check and try again."
    exit 1
fi