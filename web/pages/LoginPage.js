import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import NewsTicker from '../components/NewsTicker';
import '../styles/login.css';
import '../components/NewsTicker.css';

/**
 * LoginPage component for user authentication
 * @returns {JSX.Element} The LoginPage component
 */
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Handle login form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      
      // Provide user-friendly error messages
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Failed to log in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* News Ticker at the top */}
      <div className="login-news-ticker">
        <NewsTicker
          maxItems={10}
          showSource={true}
          autoScroll={true}
          scrollSpeed={50}
          pauseOnHover={true}
          userPreferences={{
            bettingContentOnly: false,
            maxNewsItems: 20
          }}
        />
      </div>
      
      <div className="login-content">
        <div className="login-form-container">
          <div className="login-logo">
            <img src="/assets/logo.png" alt="AI Sports Edge Logo" />
            <h1>AI Sports Edge</h1>
          </div>
          
          <form className="login-form" onSubmit={handleSubmit}>
            <h2>Sign In</h2>
            
            {error && <div className="login-error">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            
            <button 
              type="submit" 
              className="login-button" 
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
            
            <div className="login-links">
              <Link to="/forgot-password">Forgot Password?</Link>
              <Link to="/signup">Create Account</Link>
            </div>
          </form>
          
          <div className="login-footer">
            <p>Get the latest sports predictions powered by AI</p>
            <div className="app-download-links">
              <a href="#" className="app-download-button">
                <img src="/assets/app-store.png" alt="Download on App Store" />
              </a>
              <a href="#" className="app-download-button">
                <img src="/assets/google-play.png" alt="Get it on Google Play" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="login-features">
          <h2>Why Choose AI Sports Edge?</h2>
          
          <div className="feature">
            <div className="feature-icon">📊</div>
            <div className="feature-text">
              <h3>AI-Powered Predictions</h3>
              <p>Our advanced machine learning models analyze thousands of data points to provide accurate predictions.</p>
            </div>
          </div>
          
          <div className="feature">
            <div className="feature-icon">📱</div>
            <div className="feature-text">
              <h3>Real-Time Updates</h3>
              <p>Get instant notifications and live updates for all your favorite sports and teams.</p>
            </div>
          </div>
          
          <div className="feature">
            <div className="feature-icon">🏆</div>
            <div className="feature-text">
              <h3>Comprehensive Coverage</h3>
              <p>From major leagues to niche sports, we've got you covered with in-depth analysis.</p>
            </div>
          </div>
          
          <div className="feature">
            <div className="feature-icon">📈</div>
            <div className="feature-text">
              <h3>Advanced Analytics</h3>
              <p>Access in-depth sports analytics and performance metrics to gain valuable insights.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;