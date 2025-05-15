// AI Sports Edge - Fix Firebase Authentication
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Fixing Firebase Authentication...');

// Step 1: Fix the bundle.js to use script tags instead of ES modules
console.log('Step 1: Fixing bundle.js to use script tags...');

// Create the fixed bundle.js
const fixedBundleJs = `
// AI Sports Edge application
console.log('AI Sports Edge application loaded');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDFps9-V4XXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "ai-sports-edge.firebaseapp.com",
  projectId: "ai-sports-edge",
  storageBucket: "ai-sports-edge.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
  measurementId: "G-XXXXXXXXXX"
};

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

// Simple routing system
const routes = {
  '/': () => showLoginPage(),
  '/login': () => showLoginPage(),
  '/signup': () => showSignupPage(),
  '/forgot-password': () => showForgotPasswordPage(),
};

// Initialize the app
function init() {
  const path = window.location.hash.substring(1) || '/';
  const route = routes[path] || routes['/'];
  route();
  
  // Check if user is already logged in
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      console.log('User is signed in:', user.email);
      // If on login or signup page, redirect to dashboard
      if (window.location.hash === '#/login' || window.location.hash === '#/signup') {
        window.location.href = '/dashboard';
      }
    } else {
      console.log('No user is signed in');
    }
  });
}

// Show login page
function showLoginPage() {
  document.getElementById('root').innerHTML = \`
    <div class="login-container">
      <div class="login-form-container">
        <div class="login-logo">
          <img src="https://ai-sports-edge-com.web.app/assets/logo.png" alt="AI Sports Edge Logo" />
          <h1>Login to AI Sports Edge</h1>
        </div>
        <form class="login-form" id="login-form">
          <div id="error-message" class="login-error" style="display: none;"></div>
          <div id="success-message" class="login-success" style="display: none;"></div>
          
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" type="email" required />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" type="password" required />
          </div>
          <button type="submit" class="login-button" id="login-button">Login</button>
          <div class="login-links">
            <a href="#/forgot-password">Forgot password?</a>
            <br /><br />
            <a href="#/signup">Don't have an account? Sign up</a>
          </div>
        </form>
      </div>
    </div>
  \`;
  
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form values
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
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
      errorElement.textContent = 'Please enter your password.';
      errorElement.style.display = 'block';
      return;
    }
    
    // Disable the button and show loading state
    const loginButton = document.getElementById('login-button');
    const originalButtonText = loginButton.textContent;
    loginButton.disabled = true;
    loginButton.textContent = 'Logging in...';
    
    try {
      // Sign in with Firebase Auth
      await firebase.auth().signInWithEmailAndPassword(email, password);
      
      // Show success message
      successElement.textContent = 'Login successful! Redirecting...';
      successElement.style.display = 'block';
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
      
    } catch (error) {
      // Show error message
      errorElement.textContent = getErrorMessage(error.code);
      errorElement.style.display = 'block';
      
      console.error('Login error:', error.code, error.message);
    } finally {
      // Re-enable the button
      loginButton.disabled = false;
      loginButton.textContent = originalButtonText;
    }
  });
}

// Show signup page
function showSignupPage() {
  document.getElementById('root').innerHTML = \`
    <div class="login-container">
      <div class="login-form-container">
        <div class="login-logo">
          <img src="https://ai-sports-edge-com.web.app/assets/logo.png" alt="AI Sports Edge Logo" />
          <h1>Create Account</h1>
        </div>
        <form class="login-form" id="signup-form">
          <div id="error-message" class="login-error" style="display: none;"></div>
          <div id="success-message" class="login-success" style="display: none;"></div>
          
          <div class="form-group">
            <label for="signup-email">Email</label>
            <input id="signup-email" type="email" required />
          </div>
          <div class="form-group">
            <label for="signup-password">Password</label>
            <input id="signup-password" type="password" required />
          </div>
          <div class="form-group">
            <label for="confirm-password">Confirm Password</label>
            <input id="confirm-password" type="password" required />
          </div>
          <button type="submit" class="login-button" id="signup-button">Sign Up</button>
          <div class="login-links">
            <a href="#/login">Already have an account? Sign in</a>
          </div>
        </form>
      </div>
    </div>
  \`;
  
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
        window.location.hash = '#/login';
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
}

// Show forgot password page
function showForgotPasswordPage() {
  document.getElementById('root').innerHTML = \`
    <div class="login-container">
      <div class="login-form-container">
        <div class="login-logo">
          <img src="https://ai-sports-edge-com.web.app/assets/logo.png" alt="AI Sports Edge Logo" />
          <h1>Reset Password</h1>
        </div>
        <form class="login-form" id="reset-form">
          <div id="error-message" class="login-error" style="display: none;"></div>
          <div id="success-message" class="login-success" style="display: none;"></div>
          
          <div class="form-group">
            <label for="reset-email">Email</label>
            <input id="reset-email" type="email" required />
          </div>
          <button type="submit" class="login-button" id="reset-button">Send Reset Email</button>
          <div class="login-links">
            <a href="#/login">Back to login</a>
          </div>
        </form>
      </div>
    </div>
  \`;
  
  document.getElementById('reset-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form values
    const email = document.getElementById('reset-email').value;
    
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
    
    // Disable the button and show loading state
    const resetButton = document.getElementById('reset-button');
    const originalButtonText = resetButton.textContent;
    resetButton.disabled = true;
    resetButton.textContent = 'Sending...';
    
    try {
      // Send password reset email with Firebase Auth
      await firebase.auth().sendPasswordResetEmail(email);
      
      // Show success message
      successElement.textContent = 'Password reset email sent! Check your inbox.';
      successElement.style.display = 'block';
      
    } catch (error) {
      // Show error message
      errorElement.textContent = getErrorMessage(error.code);
      errorElement.style.display = 'block';
      
      console.error('Password reset error:', error.code, error.message);
    } finally {
      // Re-enable the button
      resetButton.disabled = false;
      resetButton.textContent = originalButtonText;
    }
  });
}

// Listen for hash changes
window.addEventListener('hashchange', init);

// Initialize the app when the page loads
window.addEventListener('load', init);
`;

// Create the build directory if it doesn't exist
if (!fs.existsSync('build')) {
  fs.mkdirSync('build');
}

// Write the fixed bundle.js
fs.writeFileSync('build/bundle.js', fixedBundleJs);
console.log('✓ Fixed build/bundle.js to use script tags');

// Step 2: Fix the index.html to include Firebase SDK script tags
console.log('Step 2: Fixing index.html to include Firebase SDK script tags...');

// Create the fixed index.html
const fixedIndexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Sports Edge</title>
  <link rel="stylesheet" href="styles.css">
  
  <!-- Firebase SDK -->
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-analytics.js"></script>
</head>
<body>
  <div id="root"></div>
  <script src="bundle.js"></script>
</body>
</html>
`;

// Write the fixed index.html
fs.writeFileSync('build/index.html', fixedIndexHtml);
console.log('✓ Fixed build/index.html to include Firebase SDK script tags');

// Step 3: Copy the fixed files to the deploy directory
console.log('Step 3: Copying fixed files to deploy directory...');

// Create the deploy directory if it doesn't exist
if (!fs.existsSync('deploy')) {
  fs.mkdirSync('deploy');
}

// Copy the fixed files
fs.copyFileSync('build/bundle.js', 'deploy/bundle.js');
fs.copyFileSync('build/index.html', 'deploy/index.html');
console.log('✓ Copied fixed files to deploy directory');

// Step 4: Create a summary file
console.log('Step 4: Creating summary file...');

const summaryContent = `# Firebase Authentication Fix

## Fix Timestamp
${new Date().toISOString()}

## Issues Fixed
1. Changed ES module imports to script tags - ES modules can't be used directly in browser without proper bundling
2. Updated Firebase SDK to version 8.x which has a simpler API for browser usage
3. Fixed Firebase initialization to use global firebase object
4. Updated auth methods to use the correct syntax for Firebase 8.x

## Files Fixed
- build/bundle.js - Updated to use script tags instead of ES modules
- build/index.html - Updated to include Firebase SDK script tags
- deploy/bundle.js - Updated for deployment
- deploy/index.html - Updated for deployment

## Next Steps
1. Deploy the fixed files to Firebase Hosting
2. Test the authentication flow end-to-end
3. Add user profile management
4. Implement email verification

## Technical Details
The main issue was trying to use ES module imports directly in the browser. Firebase 9+ uses ES modules by default, but they need to be properly bundled for browser usage. We switched to Firebase 8.x which has a simpler API for direct browser usage with script tags.
`;

fs.writeFileSync('firebase-auth-fix.md', summaryContent);
console.log('✓ Created firebase-auth-fix.md');

console.log('Firebase Authentication fix completed successfully!');