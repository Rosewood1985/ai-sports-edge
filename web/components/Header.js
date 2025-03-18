import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/header.css';
import PersonalizationPanel from './PersonalizationPanel';
import BetNowButton from './BetNowButton';
import { useBettingAffiliate } from '../../contexts/BettingAffiliateContext';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [personalizationOpen, setPersonalizationOpen] = useState(false);
  const location = useLocation();
  const { showBetButton } = useBettingAffiliate();
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  const closeMenu = () => {
    setMenuOpen(false);
  };
  
  const togglePersonalization = () => {
    setPersonalizationOpen(!personalizationOpen);
    if (menuOpen) {
      setMenuOpen(false);
    }
  };
  
  const closePersonalization = () => {
    setPersonalizationOpen(false);
  };
  
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };
  
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo" onClick={closeMenu}>
            <img src="https://expo.dev/static/images/favicon-76x76.png" alt="AI Sports Edge Logo" />
            <span>AI Sports Edge</span>
          </Link>
          
          <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle menu">
            <span className={`hamburger ${menuOpen ? 'open' : ''}`}></span>
          </button>
          
          <nav className={`nav ${menuOpen ? 'open' : ''}`}>
            <ul className="nav-list">
              <li className="nav-item">
                <Link to="/" className={isActive('/')} onClick={closeMenu}>Home</Link>
              </li>
              <li className="nav-item">
                <Link to="/features" className={isActive('/features')} onClick={closeMenu}>Features</Link>
              </li>
              <li className="nav-item">
                <Link to="/odds" className={isActive('/odds')} onClick={closeMenu}>Live Odds</Link>
              </li>
              <li className="nav-item">
                <Link to="/pricing" className={isActive('/pricing')} onClick={closeMenu}>Pricing</Link>
              </li>
              <li className="nav-item">
                <Link to="/about" className={isActive('/about')} onClick={closeMenu}>About</Link>
              </li>
              <li className="nav-item">
                <button
                  className="personalize-button"
                  onClick={togglePersonalization}
                  aria-label="Personalize"
                >
                  <i className="fas fa-sliders-h"></i>
                  <span>Personalize</span>
                </button>
              </li>
              <li className="nav-item">
                <Link to="/download" className="download-button" onClick={closeMenu}>Download</Link>
              </li>
              {/* Add Bet Now button to header */}
              {showBetButton('header') && (
                <li className="nav-item">
                  <BetNowButton
                    size="small"
                    position="inline"
                    contentType="header"
                  />
                </li>
              )}
            </ul>
          </nav>
          
          {personalizationOpen && (
            <PersonalizationPanel onClose={closePersonalization} />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;