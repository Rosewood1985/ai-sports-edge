import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import '../styles/not-found.css';

const NotFoundPage = () => {
  return (
    <>
      <Helmet>
        <title>Page Not Found - AI Sports Edge</title>
        <meta name="description" content="The page you are looking for does not exist." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="not-found">
        <div className="container">
          <div className="not-found-content">
            <h1>404</h1>
            <h2>Page Not Found</h2>
            <p>The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
            <Link to="/" className="button">Go to Homepage</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;