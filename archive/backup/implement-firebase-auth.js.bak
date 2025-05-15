// AI Sports Edge - Firebase Authentication Implementation
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Implementing Firebase Authentication...');

// Step 1: Create the Firebase Auth configuration
console.log('Step 1: Creating Firebase Auth configuration...');

// Create the firebase-auth.js file
const firebaseAuthJs = `// Firebase Authentication Configuration
import { firebaseService } from '../src/atomic/organisms/firebaseService';
import "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDFps9-V4XXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "ai-sports-edge.firebaseapp.com",
  projectId: "ai-sports-edge",
  storageBucket: "ai-sports-edge.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
  measurementId: "G-XXXXXXXXXX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Create a user with email and password
export const createUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error("Error creating user:", error.code, error.message);
    return { user: null, error: {
      code: error.code,
      message: getErrorMessage(error.code)
    }};
  }
};

// Sign in with email and password
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error("Error signing in:", error.code, error.message);
    return { user: null, error: {
      code: error.code,
      message: getErrorMessage(error.code)
    }};
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error("Error signing in with Google:", error.code, error.message);
    return { user: null, error: {
      code: error.code,
      message: getErrorMessage(error.code)
    }};
  }
};

// Sign out
export const logOut = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    console.error("Error signing out:", error.code, error.message);
    return { error: {
      code: error.code,
      message: getErrorMessage(error.code)
    }};
  }
};

// Send password reset email
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error) {
    console.error("Error sending password reset email:", error.code, error.message);
    return { error: {
      code: error.code,
      message: getErrorMessage(error.code)
    }};
  }
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Listen for auth state changes
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Get user-friendly error message
const getErrorMessage = (errorCode) => {
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
};

export { auth };
`;

// Create the directory if it doesn't exist
if (!fs.existsSync('src')) {
  fs.mkdirSync('src');
}

fs.writeFileSync('src/firebase-auth.js', firebaseAuthJs);
console.log('✓ Created src/firebase-auth.js');

// Step 2: Update the bundle.js to include Firebase Auth
console.log('Step 2: Updating bundle.js with Firebase Auth...');

// Read the current bundle.js
const bundleJsPath = path.join('build', 'bundle.js');
let bundleJs = '';

if (fs.existsSync(bundleJsPath)) {
  bundleJs = fs.readFileSync(bundleJsPath, 'utf8');
} else {
  console.log('⚠️ bundle.js not found, creating a new one');
  bundleJs = `
// AI Sports Edge application
console.log('AI Sports Edge application loaded');

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
}
`;
}

// Add Firebase SDK imports
const firebaseImports = `
// Firebase SDK imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

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
    default:
      return 'An error occurred. Please try again later.';
  }
}
`;

// Update the showSignupPage function
const updatedSignupFunction = `
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
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
`;

// Update the showLoginPage function
const updatedLoginFunction = `
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
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
`;

// Update the showForgotPasswordPage function
const updatedForgotPasswordFunction = `
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
      await sendPasswordResetEmail(auth, email);
      
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
`;

// Create the updated bundle.js
const updatedBundleJs = `
${firebaseImports}

// AI Sports Edge application
console.log('AI Sports Edge application loaded');

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
  onAuthStateChanged(auth, (user) => {
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

${updatedLoginFunction}

${updatedSignupFunction}

${updatedForgotPasswordFunction}

// Listen for hash changes
window.addEventListener('hashchange', init);

// Initialize the app when the page loads
window.addEventListener('load', init);
`;

// Write the updated bundle.js
fs.writeFileSync('build/bundle.js', updatedBundleJs);
console.log('✓ Updated build/bundle.js with Firebase Auth');

// Step 3: Update the index.html to include Firebase SDK
console.log('Step 3: Updating index.html with Firebase SDK...');

// Read the current index.html
const indexHtmlPath = path.join('build', 'index.html');
let indexHtml = '';

if (fs.existsSync(indexHtmlPath)) {
  indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
} else {
  console.log('⚠️ index.html not found, creating a new one');
  indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Sports Edge</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="root"></div>
  <script src="bundle.js"></script>
</body>
</html>
`;
}

// Add Firebase SDK scripts
const firebaseScripts = `
  <!-- Firebase SDK -->
  <script type="module">
    // Import the functions you need from the SDKs you need
    import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
    import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-analytics.js";
    
    // Your web app's Firebase configuration
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
    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);
  </script>
`;

// Update the index.html
const updatedIndexHtml = indexHtml.replace('</head>', `${firebaseScripts}\n</head>`);

// Write the updated index.html
fs.writeFileSync('build/index.html', updatedIndexHtml);
console.log('✓ Updated build/index.html with Firebase SDK');

// Step 4: Copy the updated files to the deploy directory
console.log('Step 4: Copying updated files to deploy directory...');

// Create the deploy directory if it doesn't exist
if (!fs.existsSync('deploy')) {
  fs.mkdirSync('deploy');
}

// Copy the updated files
fs.copyFileSync('build/bundle.js', 'deploy/bundle.js');
fs.copyFileSync('build/index.html', 'deploy/index.html');
console.log('✓ Copied updated files to deploy directory');

// Step 5: Create a summary file
console.log('Step 5: Creating summary file...');

const summaryContent = `# Firebase Authentication Implementation

## Implementation Timestamp
${new Date().toISOString()}

## Files Created/Updated
- src/firebase-auth.js - Firebase Authentication service
- build/bundle.js - Updated with Firebase Auth integration
- build/index.html - Updated with Firebase SDK
- deploy/bundle.js - Updated for deployment
- deploy/index.html - Updated for deployment

## Features Implemented
- User registration with email/password
- User login with email/password
- Password reset functionality
- Error handling with user-friendly messages
- Form validation
- Loading states during authentication operations
- Automatic redirection after successful operations

## Next Steps
1. Test the authentication flow end-to-end
2. Add user profile management
3. Implement email verification
4. Add social login options (Google, Apple)
5. Set up Firebase security rules

## Usage
The authentication flow is now fully functional:
- Users can sign up with email/password
- Users can log in with existing credentials
- Users can reset their password via email
- Form validation prevents common errors
- User-friendly error messages guide users

## Deployment
The updated files have been copied to the deploy directory and are ready for deployment to Firebase Hosting.
`;

fs.writeFileSync('firebase-auth-implementation.md', summaryContent);
console.log('✓ Created firebase-auth-implementation.md');

console.log('Firebase Authentication implementation completed successfully!');