# Firebase Authentication Setup Guide
## AI Sports Edge - Dev Container CI Token Authentication

**Date**: Sunday May 25, 2025

---

## 📊 **CURRENT CONFIGURATION STATUS**

### ✅ **Found Configuration**
- **Project**: `ai-sports-edge` (configured in .firebaserc)
- **Firebase CLI**: Version 14.4.0 (installed)
- **Functions Runtime**: nodejs20 (configured in firebase.json)
- **Hosting Site**: `aisportsedge-app`

### ❌ **Missing Authentication**
- No Firebase CI token configured
- No service account credentials
- No environment variables for authentication

---

## 🔧 **STEP 1: Generate Firebase CI Token (Local Machine Required)**

### **Prerequisites**
You'll need to run this on a local machine with browser access:

#### **1a. Install Firebase CLI Locally (if not installed)**
```bash
# On your local machine (not dev container)
npm install -g firebase-tools
```

#### **1b. Login to Firebase**
```bash
# On your local machine
firebase login

# This will open a browser window
# Sign in with your Google account that has access to the ai-sports-edge project
```

#### **1c. Generate CI Token**
```bash
# On your local machine, after successful login
firebase login:ci

# This will output a token like:
# ✔  Success! Use this token to login on a CI server:
# 1//0GtC9Gj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**🔒 Important**: Keep this token secure - it provides access to your Firebase project!

---

## 🔧 **STEP 2: Configure CI Token in Dev Container**

### **Option A: Environment Variable (Recommended)**

#### **2a. Set Environment Variable**
```bash
# In your dev container terminal
export FIREBASE_TOKEN="1//0GtC9Gj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# Add to your shell profile for persistence
echo 'export FIREBASE_TOKEN="1//0GtC9Gj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"' >> ~/.bashrc
source ~/.bashrc
```

#### **2b. Verify Token Setup**
```bash
# Check environment variable
echo "Firebase Token: ${FIREBASE_TOKEN:0:20}..."

# Test authentication
firebase use --token "$FIREBASE_TOKEN" ai-sports-edge
```

### **Option B: Direct Authentication**
```bash
# Use token directly with Firebase CLI
firebase login:ci --token "1//0GtC9Gj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

---

## 🔧 **STEP 3: Verify Authentication and Project Access**

### **3a. Check Authentication Status**
```bash
# Verify authentication
firebase projects:list --token "$FIREBASE_TOKEN"

# Expected output should include:
# ┌──────────────────┬─────────────────────┬────────────────┬──────────────────────┐
# │ Project Display  │ Project ID          │ Project Number │ Resource Location ID │
# │ Name             │                     │                │                      │
# ├──────────────────┼─────────────────────┼────────────────┼──────────────────────┤
# │ AI Sports Edge   │ ai-sports-edge      │ [number]       │ us-central           │
# └──────────────────┴─────────────────────┴────────────────┴──────────────────────┘
```

### **3b. Confirm Project Selection**
```bash
# Use the correct project
firebase use ai-sports-edge --token "$FIREBASE_TOKEN"

# Verify current project
firebase use --current --token "$FIREBASE_TOKEN"
# Should output: Currently using project ai-sports-edge
```

### **3c. Check Functions Access**
```bash
# List current Cloud Functions
firebase functions:list --token "$FIREBASE_TOKEN"

# Check Functions configuration
firebase functions:config:get --token "$FIREBASE_TOKEN"
```

### **3d. Verify Deployment Permissions**
```bash
# Test deployment permissions (dry run)
firebase deploy --only functions --debug --token "$FIREBASE_TOKEN" --dry-run 2>&1 | head -20
```

---

## 🔧 **STEP 4: Prepare Environment for Sentry Deployment**

### **4a. Validate Functions Configuration**
```bash
# Check functions/package.json dependencies
cd functions
cat package.json | grep -A 20 '"dependencies"'

# Verify Sentry dependencies are installed
npm list @sentry/google-cloud-serverless @sentry/node
```

### **4b. Environment Variables Setup**
```bash
# Set up required environment variables for deployment
export PROJECT_ID="ai-sports-edge"
export SENTRY_BACKEND_DSN="https://95b0deae4cc462e0d6f16c40a7417255@o4509368605081600.ingest.us.sentry.io/4509385370894336"

# Add to shell profile
cat >> ~/.bashrc << 'EOF'
# Firebase and Sentry Configuration
export PROJECT_ID="ai-sports-edge"
export SENTRY_BACKEND_DSN="https://95b0deae4cc462e0d6f16c40a7417255@o4509368605081600.ingest.us.sentry.io/4509385370894336"
EOF

source ~/.bashrc
```

### **4c. Update Deployment Script for CI Token**

We need to modify the deployment script to use the token:

```bash
# Update deploy-sentry-functions.sh to use CI token
cd /workspaces/ai-sports-edge-restore/functions

# Backup original script
cp deploy-sentry-functions.sh deploy-sentry-functions.sh.backup

# Create token-aware version
cat > deploy-sentry-functions-ci.sh << 'EOF'
#!/bin/bash
# Firebase Functions Deployment Script with CI Token Support
# AI Sports Edge - Complete Monitoring Setup

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 AI Sports Edge - Sentry-Monitored Functions Deployment (CI Mode)${NC}"
echo "=================================================================="

# Check for Firebase token
if [ -z "$FIREBASE_TOKEN" ]; then
    echo -e "${RED}❌ FIREBASE_TOKEN environment variable not set${NC}"
    echo "Please set your Firebase CI token:"
    echo "export FIREBASE_TOKEN=\"your-firebase-ci-token\""
    exit 1
fi

echo -e "${GREEN}✅ Firebase CI token configured${NC}"

# Use token for all Firebase commands
FB_CMD="firebase --token $FIREBASE_TOKEN"

# Your existing deployment logic here, but with $FB_CMD instead of firebase
echo "Testing authentication..."
$FB_CMD projects:list >/dev/null 2>&1 || {
    echo -e "${RED}❌ Firebase authentication failed${NC}"
    exit 1
}

echo -e "${GREEN}✅ Firebase authentication successful${NC}"

# Continue with deployment
echo "Deploying functions..."
$FB_CMD deploy --only functions

echo -e "${GREEN}🎉 Deployment complete!${NC}"
EOF

chmod +x deploy-sentry-functions-ci.sh
```

---

## 🔧 **STEP 5: Test Authentication and Deployment Readiness**

### **5a. Authentication Test Script**
```bash
# Create authentication test script
cat > test-firebase-auth.sh << 'EOF'
#!/bin/bash

echo "🔍 Firebase Authentication Test"
echo "=============================="

# Check token
if [ -z "$FIREBASE_TOKEN" ]; then
    echo "❌ FIREBASE_TOKEN not set"
    exit 1
fi

echo "✅ Firebase token configured"

# Test commands
echo "Testing project access..."
firebase projects:list --token "$FIREBASE_TOKEN" || exit 1

echo "Testing project selection..."
firebase use ai-sports-edge --token "$FIREBASE_TOKEN" || exit 1

echo "Testing functions access..."
firebase functions:list --token "$FIREBASE_TOKEN" || exit 1

echo "🎉 All authentication tests passed!"
EOF

chmod +x test-firebase-auth.sh
```

### **5b. Run Authentication Tests**
```bash
# Run the authentication test
./test-firebase-auth.sh
```

### **5c. Verify Sentry Configuration**
```bash
# Check Sentry configuration files
echo "📋 Sentry Configuration Verification:"
echo "====================================="

# Backend DSN
grep -n "95b0deae4cc462e0d6f16c40a7417255" functions/sentryConfig.js functions/sentryCronConfig.js

# Function exports
grep -n "exports\." functions/index.js | head -10

echo "✅ Sentry configuration verified"
```

---

## 📋 **EXECUTION CHECKLIST**

### **Local Machine Tasks (Required First)**
- [ ] Install Firebase CLI locally: `npm install -g firebase-tools`
- [ ] Login to Firebase: `firebase login`
- [ ] Generate CI token: `firebase login:ci`
- [ ] Copy the generated token (starts with `1//`)

### **Dev Container Tasks**
- [ ] Set FIREBASE_TOKEN environment variable
- [ ] Add token to ~/.bashrc for persistence
- [ ] Test authentication: `firebase projects:list --token "$FIREBASE_TOKEN"`
- [ ] Verify project access: `firebase use ai-sports-edge --token "$FIREBASE_TOKEN"`
- [ ] Check functions permissions: `firebase functions:list --token "$FIREBASE_TOKEN"`
- [ ] Update deployment scripts for CI token usage
- [ ] Run authentication test script
- [ ] Verify Sentry configuration files

### **Pre-Deployment Verification**
- [ ] All Sentry configuration files present
- [ ] Correct DSNs configured in backend functions
- [ ] Function exports properly configured
- [ ] Dependencies installed and up to date
- [ ] Environment variables set correctly

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues**

#### **1. "Failed to authenticate" Error**
```bash
# Check token format
echo "Token length: ${#FIREBASE_TOKEN}"
# Should be 100+ characters starting with "1//"

# Test token manually
firebase projects:list --token "$FIREBASE_TOKEN"
```

#### **2. "Permission denied" Error**
```bash
# Check project permissions in Firebase Console
# Ensure your account has "Firebase Admin" or "Editor" role
```

#### **3. "Project not found" Error**
```bash
# Verify project ID
firebase projects:list --token "$FIREBASE_TOKEN" | grep ai-sports-edge
```

#### **4. Functions deployment fails**
```bash
# Check Node.js version compatibility
node --version  # Should be 20.x for functions runtime

# Check function dependencies
cd functions && npm install
```

---

## 🎯 **NEXT STEPS AFTER AUTHENTICATION**

Once authentication is working:

1. **Deploy Functions**: `./functions/deploy-sentry-functions-ci.sh`
2. **Configure Sentry Alerts**: Follow the alerts configuration guide
3. **Run Tests**: `./run-comprehensive-sentry-tests.sh`
4. **Set Up Dashboards**: Configure Sentry monitoring views

---

## 📞 **NEED HELP?**

If you encounter issues:

1. **Check Firebase Console**: https://console.firebase.google.com/project/ai-sports-edge
2. **Verify IAM Permissions**: Ensure your account has proper roles
3. **Check Token Expiry**: CI tokens can expire, regenerate if needed
4. **Contact Firebase Support**: For project access issues

---

*This guide ensures secure, token-based authentication for Firebase deployment in dev containers while maintaining security best practices.*