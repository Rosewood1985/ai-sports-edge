import React from 'react';
import { Helmet } from 'react-helmet-async';
import '../styles/download.css';

const DownloadPage = () => {
  return (
    <>
      <Helmet>
        <title>Download AI Sports Edge - Get Started Today</title>
        <meta
          name="description"
          content="Download AI Sports Edge for iOS and Android. Get started with AI-powered sports betting predictions and analytics."
        />
        <meta
          name="keywords"
          content="download, AI Sports Edge, sports betting app, iOS, Android"
        />
        <link rel="canonical" href="https://aisportsedge.app/download" />
      </Helmet>

      <section className="download-hero">
        <div className="container">
          <div className="download-hero-content">
            <h1>Download AI Sports Edge</h1>
            <p className="download-subtitle">
              Get started with AI-powered sports betting predictions today.
            </p>
          </div>
        </div>
      </section>

      <section className="download-options">
        <div className="container">
          <div className="download-grid">
            <div className="download-option">
              <div className="download-option-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              </div>
              <h2>iOS App</h2>
              <p>Download AI Sports Edge for iPhone and iPad.</p>
              <div className="download-buttons">
                <a href="#" className="button disabled">
                  Coming Soon to App Store
                </a>
                <a href="exp://exp.host/@aisportsedge/ai-sports-edge" className="button secondary">
                  Open in Expo Go
                </a>
              </div>
              <div className="beta-option">
                <h3>iOS Beta Testing</h3>
                <p>Join our TestFlight beta program to get early access.</p>
                <a href="#" className="button secondary">
                  Join TestFlight Beta
                </a>
              </div>
            </div>

            <div className="download-option">
              <div className="download-option-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.523 15.34l.5-.87-1.52-.88-1.51-.87-1.51-.87-1.52-.88-.5.87-.5.87.5.87.51.88 1.52.87 1.5.87 1.51.88.52-.87zM6.67 14.86l1.51.88 1.52.87.5-.87.5-.87-.5-.87-.5-.87-1.52.87-1.5.87-.52.87.51.87zM15.01 11.8l1.51.88 1.52.87.5-.87.5-.87-.5-.87-.5-.87-1.52.87-1.51.87-.5.87.5.87zM6.67 11.8l1.51.87 1.52.88.5-.88.5-.87-.5-.87-.5-.87-1.52.87-1.5.87-.52.87.51.87zM13.49 10.26l1.51.88 1.52.87.5-.87.5-.87-.5-.87-.5-.87-1.52.87-1.51.87-.5.87.5.87zM8.18 10.26l1.51.88 1.52.87.5-.87.5-.87-.5-.87-.5-.87-1.52.87-1.51.87-.5.87.5.87zM9.7 8.72l1.51.88 1.52.87.5-.87.5-.87-.5-.87-.5-.87-1.52.87-1.51.87-.5.87.5.87zM11.22 7.19l1.51.87 1.52.88.5-.88.5-.87-.5-.87-.5-.87-1.52.87-1.51.87-.5.87.5.87z" />
                </svg>
              </div>
              <h2>Android App</h2>
              <p>Download AI Sports Edge for Android devices.</p>
              <div className="download-buttons">
                <a href="#" className="button disabled">
                  Coming Soon to Google Play
                </a>
                <a href="exp://exp.host/@aisportsedge/ai-sports-edge" className="button secondary">
                  Open in Expo Go
                </a>
              </div>
              <div className="beta-option">
                <h3>Android Beta Testing</h3>
                <p>Download our beta APK directly to your device.</p>
                <a href="#" className="button secondary">
                  Download Beta APK
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="expo-option">
        <div className="container">
          <h2>Quick Access with Expo Go</h2>
          <p>The fastest way to try AI Sports Edge is through Expo Go.</p>

          <div className="expo-steps">
            <div className="expo-step">
              <div className="step-number">1</div>
              <p>
                Download{' '}
                <a href="https://expo.dev/client" target="_blank" rel="noopener noreferrer">
                  Expo Go
                </a>{' '}
                from the App Store or Google Play
              </p>
            </div>
            <div className="expo-step">
              <div className="step-number">2</div>
              <p>Open Expo Go and scan the QR code below</p>
            </div>
            <div className="expo-step">
              <div className="step-number">3</div>
              <p>Enjoy AI Sports Edge with all features enabled</p>
            </div>
          </div>

          <div className="qr-code">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=exp://exp.host/@aisportsedge/ai-sports-edge"
              alt="Expo Go QR Code"
            />
            <p>Scan with your phone camera or Expo Go app</p>
          </div>

          <div className="expo-button">
            <a href="exp://exp.host/@aisportsedge/ai-sports-edge" className="button primary-button">
              Open in Expo Go
            </a>
          </div>
        </div>
      </section>

      <section className="developer-option">
        <div className="container">
          <h2>For Developers</h2>
          <p>Want to run the app locally or contribute to development?</p>

          <div className="code-block">
            <pre>
              <code>
                {`# Clone the repository
git clone https://github.com/aisportsedge/ai-sports-edge.git

# Install dependencies
cd ai-sports-edge
npm install

# Start the development server
npx expo start`}
              </code>
            </pre>
          </div>

          <div className="github-button">
            <a
              href="https://github.com/aisportsedge/ai-sports-edge"
              target="_blank"
              rel="noopener noreferrer"
              className="button secondary-button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ marginRight: '8px' }}
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default DownloadPage;
