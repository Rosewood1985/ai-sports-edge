import { sendPasswordResetEmail } from 'firebase/auth';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { auth } from '../firebase';
import '../styles/login.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleReset = async e => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Check your inbox for the reset link.');
    } catch (err) {
      console.error(err);
      setError('Failed to send reset email. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        <div className="login-logo">
          <img src="/assets/logo.png" alt="AI Sports Edge Logo" />
          <h1>Reset Password</h1>
        </div>

        <form className="login-form" onSubmit={handleReset}>
          {message && <div className="login-success">{message}</div>}
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="reset-email">Email</label>
            <input
              id="reset-email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <button type="submit" className="login-button">
            Send Reset Email
          </button>

          <div className="login-links">
            <Link to="/login">Back to login</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
