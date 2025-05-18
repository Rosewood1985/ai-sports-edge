import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import '../styles/login.css'; // Reuse dark mode styles

// Inappropriate content patterns to restrict in usernames
const INAPPROPRIATE_PATTERNS = [
  /\b(fuck|shit|ass|bitch|cunt|dick|pussy|cock|whore|slut)\b/i,
  /\b(nazi|hitler|kkk|terrorist|jihad)\b/i,
  /\b(n[i1]gg[e3]r|f[a@]gg?[o0]t|ch[i1]nk|sp[i1]c|k[i1]k[e3]|w[e3]tb[a@]ck)\b/i,
];

const SignupPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Validate username when it changes
  useEffect(() => {
    validateUsername(username);
  }, [username]);

  // Username validation function
  const validateUsername = value => {
    setUsernameError('');

    if (!value) {
      return;
    }

    // Check length requirements
    if (value.length < 3) {
      setUsernameError('Username must be at least 3 characters long');
      return;
    }

    if (value.length > 20) {
      setUsernameError('Username cannot exceed 20 characters');
      return;
    }

    // Check for valid characters (alphanumeric, underscore, hyphen)
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      setUsernameError('Username can only contain letters, numbers, underscores, and hyphens');
      return;
    }

    // Check for inappropriate content
    for (const pattern of INAPPROPRIATE_PATTERNS) {
      if (pattern.test(value)) {
        setUsernameError('Username contains inappropriate content');
        return;
      }
    }
  };

  const handleSignup = async e => {
    e.preventDefault();
    setError('');

    // Validate username
    validateUsername(username);
    if (usernameError) {
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    try {
      setLoading(true);
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile with username
      await updateProfile(userCredential.user, {
        displayName: username,
      });

      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        <div className="login-logo">
          <img src="/assets/logo.png" alt="AI Sports Edge Logo" />
          <h1>Create Account</h1>
        </div>

        <form className="login-form" onSubmit={handleSignup}>
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="signup-username">Username</label>
            <input
              id="signup-username"
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
            />
            {usernameError && <div className="input-error">{usernameError}</div>}
            <small className="input-help">
              3-20 characters, letters, numbers, underscores, and hyphens only
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>

          <div className="login-links">
            <Link to="/login">Already have an account? Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
