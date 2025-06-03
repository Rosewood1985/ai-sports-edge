import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

import '../styles/about.css';
import '../styles/overlay-fix.css'; // Import emergency fix for overlay issues
import ThemeToggle from '../components/ThemeToggle';

// Custom header component to avoid using the shared header that might have issues
const SimpleHeader = () => (
  <header className="simple-header">
    <div className="container">
      <div className="header-content">
        <Link to="/" className="logo">
          <img src="https://expo.dev/static/images/favicon-76x76.png" alt="AI Sports Edge Logo" />
          <span>AI Sports Edge</span>
        </Link>

        <nav className="nav">
          <ul className="nav-list">
            <li className="nav-item">
              <Link to="/">Home</Link>
            </li>
            <li className="nav-item">
              <Link to="/features">Features</Link>
            </li>
            <li className="nav-item">
              <Link to="/pricing">Pricing</Link>
            </li>
            <li className="nav-item">
              <Link to="/about" className="active">
                About
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/odds">Live Odds</Link>
            </li>
            <li className="nav-item">
              <Link to="/download" className="download-button">
                Download
              </Link>
            </li>
            <li className="nav-item">
              <ThemeToggle />
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </header>
);

// Custom footer component to avoid using the shared footer that might have issues
const SimpleFooter = () => (
  <footer className="simple-footer">
    <div className="container">
      <p>&copy; {new Date().getFullYear()} AI Sports Edge. All rights reserved.</p>
    </div>
  </footer>
);

const AboutPage = () => {
  return (
    <div className="about-page-container" style={{ position: 'relative', zIndex: 9999 }}>
      <Helmet>
        <style type="text/css">{`
         /* Subtle inline styles to fix overlay issues while preserving aesthetics */
         body.about-page .pricing-overlay,
         body.about-page .pricing-modal,
         body.about-page .elite-plan-modal,
         body.about-page .pro-plan-modal,
         body.about-page .bet-now-popup-overlay,
         body.about-page [id^="pricing-"],
         body.about-page [class^="pricing-"] {
           display: none !important;
           opacity: 0 !important;
           visibility: hidden !important;
           pointer-events: none !important;
         }
         
         .about-page-container {
           position: relative;
           z-index: 5;
         }
         
         /* Preserve original styling while fixing overlay issues */
         .about-hero, .about-mission, .about-story, .about-team, .about-values, .about-cta {
           position: relative;
           z-index: 2;
         }
         
         /* Simple header and footer styles that match the original design */
         .simple-header, .simple-footer {
           background-color: #121212;
           padding: 1rem 0;
           position: relative;
           z-index: 10;
         }
         
         .simple-footer {
           text-align: center;
           padding: 2rem 0;
           color: #fff;
         }
       `}</style>
      </Helmet>

      <SimpleHeader />
      <Helmet>
        <title>About Us - AI Sports Edge</title>
        <meta
          name="description"
          content="Learn about AI Sports Edge, our mission, and the team behind the revolutionary sports betting app."
        />
        <meta
          name="keywords"
          content="AI Sports Edge, about us, sports betting app, company mission"
        />
        <link rel="canonical" href="https://aisportsedge.app/about" />
      </Helmet>

      <section className="about-hero">
        <div className="container">
          <div className="about-hero-content">
            <h1>About AI Sports Edge</h1>
            <p>Revolutionizing sports betting with artificial intelligence and data science.</p>
          </div>
        </div>
      </section>

      <section className="about-mission">
        <div className="container">
          <div className="mission-content">
            <h2>About Us</h2>
            <p>
              AI Sports Edge combines cutting-edge artificial intelligence with comprehensive sports
              analytics to provide bettors with powerful tools and insights.
            </p>
          </div>
        </div>
      </section>

      <section className="about-story">
        <div className="container">
          <div className="story-content">
            <h2>Our Story</h2>
            <p>
              AI Sports Edge was founded in 2023 by a team of sports enthusiasts, data scientists,
              and software engineers who saw an opportunity to apply advanced machine learning
              techniques to the world of sports betting.
            </p>
            <p>
              What began as a passion project quickly evolved into a comprehensive platform that
              analyzes vast amounts of sports data to generate accurate predictions and valuable
              insights. Our team has grown, but our core mission remains the same: to help bettors
              make smarter decisions through technology and data.
            </p>
            <p>
              Today, AI Sports Edge serves thousands of users across the globe, providing them with
              AI-powered predictions, real-time analytics, and a supportive community of like-minded
              bettors.
            </p>
          </div>
        </div>
      </section>

      <section className="about-team">
        <div className="container">
          <h2>Our Team</h2>
          <p className="team-intro">Meet the passionate individuals behind AI Sports Edge.</p>

          <div className="team-grid">
            <div className="team-member">
              <div className="team-member-image">
                <div className="placeholder-avatar" aria-label="Team member photo" />
              </div>
              <h3>Samuel Johnson</h3>
              <p className="team-member-title">Founder & CEO</p>
              <p className="team-member-bio">
                Former sports analyst with a background in machine learning and a passion for sports
                betting.
              </p>
            </div>

            <div className="team-member">
              <div className="team-member-image">
                <div className="placeholder-avatar" aria-label="Team member photo" />
              </div>
              <h3>Emily Chen</h3>
              <p className="team-member-title">Chief Data Scientist</p>
              <p className="team-member-bio">
                PhD in Statistics with expertise in predictive modeling and sports analytics.
              </p>
            </div>

            <div className="team-member">
              <div className="team-member-image">
                <div className="placeholder-avatar" aria-label="Team member photo" />
              </div>
              <h3>Marcus Williams</h3>
              <p className="team-member-title">Lead Developer</p>
              <p className="team-member-bio">
                Full-stack engineer with a focus on mobile app development and real-time data
                processing.
              </p>
            </div>

            <div className="team-member">
              <div className="team-member-image">
                <div className="placeholder-avatar" aria-label="Team member photo" />
              </div>
              <h3>Sophia Rodriguez</h3>
              <p className="team-member-title">Head of Product</p>
              <p className="team-member-bio">
                Product strategist with experience in sports media and betting platforms.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-values">
        <div className="container">
          <h2>Our Values</h2>

          <div className="values-grid">
            <div className="value-item">
              <div className="value-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3>Accuracy</h3>
              <p>
                We're committed to providing the most accurate predictions and insights possible,
                constantly refining our algorithms and models.
              </p>
            </div>

            <div className="value-item">
              <div className="value-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3>Integrity</h3>
              <p>
                We operate with transparency and honesty, ensuring our users can trust the
                information and tools we provide.
              </p>
            </div>

            <div className="value-item">
              <div className="value-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4l3 3" />
                </svg>
              </div>
              <h3>Innovation</h3>
              <p>
                We continuously push the boundaries of what's possible with AI and sports analytics,
                staying at the forefront of technology.
              </p>
            </div>

            <div className="value-item">
              <div className="value-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3>Community</h3>
              <p>
                We foster a supportive community where bettors can learn from each other and grow
                together.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-cta">
        <div className="container">
          <h2>Join the AI Sports Edge Community</h2>
          <p>Experience the future of sports betting with our AI-powered platform.</p>
          <Link to="/download" className="button primary-button">
            Download Now
          </Link>
        </div>
      </section>

      <SimpleFooter />
    </div>
  );
};

export default AboutPage;
