// AI Sports Edge application
console.log('AI Sports Edge application loaded');

// Initialize Firebase
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDFps9-V4XXXXXXXXXXXXXXXXXXXXXXXXXX',
  authDomain: 'ai-sports-edge.firebaseapp.com',
  projectId: 'ai-sports-edge',
  storageBucket: 'ai-sports-edge.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef1234567890',
  measurementId: 'G-XXXXXXXXXX',
};

// Initialize Firebase - MUST be called before any Firebase services are used
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
  firebase.auth().onAuthStateChanged(user => {
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
  document.getElementById('root').innerHTML = `
    <div class="login-container">
      <div class="login-form-container">
        <div class="login-logo">
          <img src="ai_logo_new.svg" alt="AI Sports Edge Logo" />
          <h1>Login to AI Sports Edge</h1>
        </div>
        <form class="login-form" id="login-form">
          <div id="error-message" class="login-error" style="display: none;"></div>
          <div id="success-message" class="login-success" style="display: none;"></div>
          
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" type="email" required autocomplete="email" />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" type="password" required autocomplete="current-password" />
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
  `;

  document.getElementById('login-form').addEventListener('submit', async e => {
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
  document.getElementById('root').innerHTML = `
    <div class="login-container">
      <div class="login-form-container">
        <div class="login-logo">
          <img src="ai_logo_new.svg" alt="AI Sports Edge Logo" />
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
          </div>
          <div class="form-group">
            <label for="confirm-password">Confirm Password</label>
            <input id="confirm-password" type="password" required autocomplete="new-password" />
          </div>
          <button type="submit" class="login-button" id="signup-button">Sign Up</button>
          <div class="login-links">
            <a href="#/login">Already have an account? Sign in</a>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('signup-form').addEventListener('submit', async e => {
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
  document.getElementById('root').innerHTML = `
    <div class="login-container">
      <div class="login-form-container">
        <div class="login-logo">
          <img src="ai_logo_new.svg" alt="AI Sports Edge Logo" />
          <h1>Reset Password</h1>
        </div>
        <form class="login-form" id="reset-form">
          <div id="error-message" class="login-error" style="display: none;"></div>
          <div id="success-message" class="login-success" style="display: none;"></div>
          
          <div class="form-group">
            <label for="reset-email">Email</label>
            <input id="reset-email" type="email" required autocomplete="email" />
          </div>
          <button type="submit" class="login-button" id="reset-button">Send Reset Email</button>
          <div class="login-links">
            <a href="#/login">Back to login</a>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('reset-form').addEventListener('submit', async e => {
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
