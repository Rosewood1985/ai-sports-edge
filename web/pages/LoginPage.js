import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NewsTicker from '../components/NewsTicker';
import '../styles/login.css';

/**
 * LoginPage component that displays a login form with email and password fields
 * @returns {JSX.Element} The LoginPage component
 */
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Add title animation effect
  useEffect(() => {
    document.body.classList.add('login-body');
    
    return () => {
      document.body.classList.remove('login-body');
    };
  }, []);

  /**
   * Handle form submission
   * @param {Event} e - The form submission event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simple validation
    if (!email || !password) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    // In a real app, this would make an API call to authenticate the user
    // For now, we'll simulate a successful login after a short delay
    setTimeout(() => {
      setIsLoading(false);
      
      // Store authentication state in localStorage
      localStorage.setItem('isAuthenticated', 'true');
      
      // Redirect to home page
      navigate('/');
    }, 1000);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title">AI Sports Edge</h1>
          <p className="login-subtitle">Powered by Advanced AI</p>
        </div>

        <div className="login-card">
          <div className="login-card-header">
            <h2>Sign In</h2>
          </div>
          <div className="login-card-body">
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <span className="input-icon">
                  <i className="fas fa-envelope"></i>
                </span>
                <input
                  type="email"
                  className="login-input"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="input-group">
                <span className="input-icon">
                  <i className="fas fa-lock"></i>
                </span>
                <input
                  type="password"
                  className="login-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="login-button"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
            
            <div className="forgot-password">
              <a href="#">Forgot Password?</a>
            </div>
          </div>
        </div>
        
        <div className="login-footer">
          <p>Don't have an account? <a href="#">Sign Up</a></p>
        </div>
        
        <div className="feature-icons">
          <div className="feature-icon">
            <div className="icon-circle">
              <i className="fas fa-robot"></i>
            </div>
            <span className="icon-text">AI Picks</span>
          </div>
          
          <div className="feature-icon">
            <div className="icon-circle">
              <i className="fas fa-chart-line"></i>
            </div>
            <span className="icon-text">Track Bets</span>
          </div>
          
          <div className="feature-icon">
            <div className="icon-circle">
              <i className="fas fa-trophy"></i>
            </div>
            <span className="icon-text">Rewards</span>
          </div>
          
          <div className="feature-icon">
            <div className="icon-circle">
              <i className="fas fa-bullseye"></i>
            </div>
            <span className="icon-text">Pro Analysis</span>
          </div>
          
          <div className="feature-icon">
            <div className="icon-circle">
              <i className="fas fa-question-circle"></i>
            </div>
            <span className="icon-text">Help & FAQ</span>
          </div>
        </div>
      </div>
      
      {/* News Ticker */}
      <NewsTicker />
    </div>
  );
};

export default LoginPage;