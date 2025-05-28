#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}AI Sports Edge GoDaddy Deployment${NC}"
echo -e "${BLUE}=========================================${NC}"

# Create a timestamp for logs
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="deploy-godaddy_${TIMESTAMP}.log"

# Function to log messages
log() {
  echo -e "$1" | tee -a "$LOG_FILE"
}

# Function to check if a command succeeded
check_status() {
  if [ $? -eq 0 ]; then
    log "${GREEN}✓ $1 completed successfully${NC}"
  else
    log "${RED}✗ $1 failed${NC}"
    exit 1
  fi
}

# Step 1: Check if the aisportsedge-deploy directory exists
log "\n${YELLOW}Step 1: Checking aisportsedge-deploy directory...${NC}"
if [ ! -d "aisportsedge-deploy" ]; then
  log "${RED}aisportsedge-deploy directory not found. Please make sure it exists.${NC}"
  exit 1
fi
check_status "aisportsedge-deploy directory check"

# Step 2: Create signup.html in the aisportsedge-deploy directory
log "\n${YELLOW}Step 2: Creating signup.html in aisportsedge-deploy...${NC}"

cat > aisportsedge-deploy/signup.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Sports Edge - Sign Up</title>
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="neon-ui.css">
  
  <!-- Firebase SDK -->
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-analytics.js"></script>
  
  <style>
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background-color: #121212;
    }
    
    .login-form-container {
      background-color: #1e1e1e;
      border-radius: 10px;
      padding: 30px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .login-logo {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .login-logo img {
      width: 80px;
      height: 80px;
      margin-bottom: 15px;
    }
    
    .login-logo h1 {
      font-size: 24px;
      color: #0066FF;
      margin: 0;
    }
    
    .login-form {
      width: 100%;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      color: #cccccc;
    }
    
    .form-group input {
      width: 100%;
      padding: 12px;
      border: 1px solid #333;
      border-radius: 6px;
      background-color: #333;
      color: #fff;
      font-size: 16px;
      box-sizing: border-box;
    }
    
    .login-button {
      width: 100%;
      padding: 12px;
      background-color: #0066FF;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      margin-top: 10px;
    }
    
    .login-button:hover {
      background-color: #0055CC;
    }
    
    .login-links {
      margin-top: 20px;
      text-align: center;
    }
    
    .login-links a {
      color: #0066FF;
      text-decoration: none;
      font-size: 14px;
    }
    
    .login-links a:hover {
      text-decoration: underline;
    }
    
    .login-error {
      background-color: rgba(255, 59, 48, 0.1);
      color: #FF3B30;
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 14px;
    }
    
    .login-success {
      background-color: rgba(52, 199, 89, 0.1);
      color: #34C759;
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 14px;
    }
    
    .password-strength-container {
      margin-top: 8px;
      margin-bottom: 8px;
    }
    
    .strength-meter-container {
      display: flex;
      height: 6px;
      border-radius: 3px;
      margin-bottom: 5px;
      overflow: hidden;
    }
    
    .strength-meter {
      flex: 1;
      height: 6px;
      margin: 0 1px;
    }
    
    .strength-text {
      font-size: 12px;
      text-align: right;
      color: #cccccc;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="login-form-container">
      <div class="login-logo">
        <img src="assets/logo.png" alt="AI Sports Edge Logo" />
        <h1>Create Account</h1>
      </div>
      
      <form class="login-form" id="signup-form">
        <div id="error-message" class="login-error" style="display: none;"></div>
        <div id="success-message" class="login-success" style="display: none;"></div>
        
        <div class="form-group">
          <label for="signup-email">Email</label>
          <input id="signup-email" type="email" required autocomplete="email" />
        </div>
        
        <div class="form-group">
          <label for="signup-password">Password</label>
          <input id="signup-password" type="password" required autocomplete="new-password" />
          <div class="password-strength-container" id="password-strength-container" style="display: none;">
            <div class="strength-meter-container">
              <div class="strength-meter" id="strength-meter-1"></div>
              <div class="strength-meter" id="strength-meter-2"></div>
              <div class="strength-meter" id="strength-meter-3"></div>
              <div class="strength-meter" id="strength-meter-4"></div>
              <div class="strength-meter" id="strength-meter-5"></div>
            </div>
            <div class="strength-text" id="strength-text"></div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="confirm-password">Confirm Password</label>
          <input id="confirm-password" type="password" required autocomplete="new-password" />
        </div>
        
        <button type="submit" class="login-button" id="signup-button">Sign Up</button>
        
        <div class="login-links">
          <a href="login.html">Already have an account? Sign in</a>
        </div>
      </form>
    </div>
  </div>
  
  <script>
    // Initialize Firebase
    const firebaseConfig = {
      apiKey: "AIzaSyDFps9-V4XXXXXXXXXXXXXXXXXXXXXXXXXX",
      authDomain: "ai-sports-edge.firebaseapp.com",
      projectId: "ai-sports-edge",
      storageBucket: "ai-sports-edge.appspot.com",
      messagingSenderId: "123456789012",
      appId: "1:123456789012:web:abcdef1234567890",
      measurementId: "G-XXXXXXXXXX"
    };
    
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const analytics = firebase.analytics();
    
    // Get user-friendly error message
    function getErrorMessage(errorCode) {
      switch (errorCode) {
        case 'auth/email-already-in-use':
          return 'This email is already in use. Please try another email or sign in.';
        case 'auth/invalid-email':
          return 'Invalid email address. Please check your email and try again.';
        case 'auth/weak-password':
          return 'Password is too weak. Please use a stronger password.';
        case 'auth/user-not-found':
          return 'No account found with this email. Please check your email or sign up.';
        case 'auth/wrong-password':
          return 'Incorrect password. Please try again or reset your password.';
        case 'auth/too-many-requests':
          return 'Too many unsuccessful login attempts. Please try again later.';
        case 'auth/network-request-failed':
          return 'Network error. Please check your internet connection and try again.';
        case 'auth/popup-closed-by-user':
          return 'Sign in popup was closed before completing the sign in process.';
        case 'auth/cancelled-popup-request':
          return 'The sign in popup was cancelled.';
        case 'auth/popup-blocked':
          return 'Sign in popup was blocked by your browser. Please allow popups for this site.';
        case 'auth/operation-not-allowed':
          return 'This operation is not allowed. Please contact support.';
        case 'auth/api-key-not-valid':
          return 'API key is not valid. Please contact support.';
        default:
          return 'An error occurred. Please try again later.';
      }
    }
    
    // Password strength meter
    const passwordInput = document.getElementById('signup-password');
    const strengthContainer = document.getElementById('password-strength-container');
    const strengthText = document.getElementById('strength-text');
    const strengthMeters = [
      document.getElementById('strength-meter-1'),
      document.getElementById('strength-meter-2'),
      document.getElementById('strength-meter-3'),
      document.getElementById('strength-meter-4'),
      document.getElementById('strength-meter-5')
    ];
    
    passwordInput.addEventListener('input', () => {
      const password = passwordInput.value;
      
      if (password.length === 0) {
        strengthContainer.style.display = 'none';
        return;
      }
      
      strengthContainer.style.display = 'block';
      
      let strength = 0;
      
      // Length check
      if (password.length >= 8) strength += 1;
      
      // Contains number
      if (/\d/.test(password)) strength += 1;
      
      // Contains lowercase
      if (/[a-z]/.test(password)) strength += 1;
      
      // Contains uppercase
      if (/[A-Z]/.test(password)) strength += 1;
      
      // Contains special character
      if (/[^A-Za-z0-9]/.test(password)) strength += 1;
      
      // Update strength meters
      for (let i = 0; i < 5; i++) {
        if (i < strength) {
          let color = '#FF3B30'; // Red for weak
          if (strength > 2 && strength < 5) color = '#FFCC00'; // Yellow for medium
          if (strength === 5) color = '#34C759'; // Green for strong
          
          strengthMeters[i].style.backgroundColor = color;
        } else {
          strengthMeters[i].style.backgroundColor = '#444';
        }
      }
      
      // Update strength text
      let strengthLabel = 'Too Weak';
      if (strength === 1) strengthLabel = 'Weak';
      if (strength === 2) strengthLabel = 'Fair';
      if (strength === 3) strengthLabel = 'Good';
      if (strength === 4) strengthLabel = 'Strong';
      if (strength === 5) strengthLabel = 'Very Strong';
      
      strengthText.textContent = strengthLabel;
    });
    
    // Handle form submission
    document.getElementById('signup-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Get form values
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      
      // Clear previous error messages
      const errorElement = document.getElementById('error-message');
      const successElement = document.getElementById('success-message');
      errorElement.style.display = 'none';
      successElement.style.display = 'none';
      
      // Validate form
      if (!email) {
        errorElement.textContent = 'Please enter your email address.';
        errorElement.style.display = 'block';
        return;
      }
      
      if (!password) {
        errorElement.textContent = 'Please enter a password.';
        errorElement.style.display = 'block';
        return;
      }
      
      if (password.length < 8) {
        errorElement.textContent = 'Password must be at least 8 characters long.';
        errorElement.style.display = 'block';
        return;
      }
      
      if (password !== confirmPassword) {
        errorElement.textContent = 'Passwords do not match.';
        errorElement.style.display = 'block';
        return;
      }
      
      // Disable the button and show loading state
      const signupButton = document.getElementById('signup-button');
      const originalButtonText = signupButton.textContent;
      signupButton.disabled = true;
      signupButton.textContent = 'Creating Account...';
      
      try {
        // Create user with Firebase Auth
        await firebase.auth().createUserWithEmailAndPassword(email, password);
        
        // Show success message
        successElement.textContent = 'Account created successfully! Redirecting to login...';
        successElement.style.display = 'block';
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
        
      } catch (error) {
        // Show error message
        errorElement.textContent = getErrorMessage(error.code);
        errorElement.style.display = 'block';
        
        console.error('Signup error:', error.code, error.message);
      } finally {
        // Re-enable the button
        signupButton.disabled = false;
        signupButton.textContent = originalButtonText;
      }
    });
  </script>
</body>
</html>
EOL

check_status "Creating signup.html"

# Step 3: Update login.html to include a link to signup.html
log "\n${YELLOW}Step 3: Updating login.html to include a link to signup.html...${NC}"

# Check if login.html exists
if [ ! -f "aisportsedge-deploy/login.html" ]; then
  log "${RED}login.html not found in aisportsedge-deploy directory.${NC}"
  exit 1
fi

# Create a backup of the original login.html
cp aisportsedge-deploy/login.html aisportsedge-deploy/login.html.backup
check_status "Creating backup of login.html"

# Add a link to signup.html in login.html
# This is a simple search and replace operation
# We're looking for a login-links div and adding a link to signup.html
sed -i.bak 's/<div class="login-links">/<div class="login-links">\n          <a href="signup.html">Don'\''t have an account? Sign up<\/a>\n          <br \/><br \/>/' aisportsedge-deploy/login.html
check_status "Updating login.html"

# Step 4: Update index.html to include a link to signup.html in the navigation
log "\n${YELLOW}Step 4: Updating index.html to include a link to signup.html in the navigation...${NC}"

# Check if index.html exists
if [ ! -f "aisportsedge-deploy/index.html" ]; then
  log "${RED}index.html not found in aisportsedge-deploy directory.${NC}"
  exit 1
fi

# Create a backup of the original index.html
cp aisportsedge-deploy/index.html aisportsedge-deploy/index.html.backup
check_status "Creating backup of index.html"

# Add a link to signup.html in the navigation
# This is a simple search and replace operation
# We're looking for the navigation ul and adding a link to signup.html
sed -i.bak 's/<a href="login.html">Login<\/a>/<a href="login.html">Login<\/a><\/li>\n                <li><a href="signup.html">Sign Up<\/a>/' aisportsedge-deploy/index.html
check_status "Updating index.html"

# Step 5: Create a deployment summary
log "\n${YELLOW}Step 5: Creating deployment summary...${NC}"

cat > "godaddy-deployment-summary.md" << EOL
# AI Sports Edge GoDaddy Deployment Summary

## Deployment Timestamp
${TIMESTAMP}

## Files Created/Updated
- aisportsedge-deploy/signup.html - New signup page with Firebase authentication
- aisportsedge-deploy/login.html - Updated to include a link to the signup page
- aisportsedge-deploy/index.html - Updated to include a link to the signup page in the navigation

## Features Implemented
- User registration with email/password
- Password strength meter
- Form validation with user-friendly error messages
- Firebase authentication integration
- Responsive design that matches the existing site

## Next Steps
1. Upload the updated files to the GoDaddy hosting server
2. Test the authentication flow end-to-end
3. Implement user profile creation after signup
4. Add email verification

## Deployment Instructions
To deploy these changes to the GoDaddy hosting server:

1. Use FTP or the GoDaddy file manager to upload the updated files:
   - Upload signup.html to the root directory
   - Replace the existing login.html with the updated version
   - Replace the existing index.html with the updated version

2. Test the site by navigating to:
   - https://aisportsedge.app/signup.html
   - https://aisportsedge.app/login.html
   - https://aisportsedge.app/index.html

3. Verify that the navigation links work correctly and that users can sign up and log in.
EOL

check_status "Creating deployment summary"

log "\n${GREEN}=========================================${NC}"
log "${GREEN}GoDaddy Deployment Files Prepared Successfully${NC}"
log "${GREEN}See godaddy-deployment-summary.md for details${NC}"
log "${GREEN}=========================================${NC}"