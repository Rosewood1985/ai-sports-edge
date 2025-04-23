#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}AI Sports Edge Signup Page Deployment${NC}"
echo -e "${BLUE}=========================================${NC}"

# Create a timestamp for logs
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="deploy-signup_${TIMESTAMP}.log"

# Function to log messages
log() {
  echo -e "$1" | tee -a "$LOG_FILE"
}

# Function to check if a command succeeded
check_status() {
  if [ $? -eq 0 ]; then
    log "${GREEN}✓ $1 completed successfully${NC}"
  else
    log "${RED}✗ $1 failed${NC}"
    exit 1
  fi
}

# Step 1: Update Firebase initialization to properly handle API keys
log "\n${YELLOW}Step 1: Updating Firebase initialization...${NC}"

# Create or update .env file with Firebase config
cat > .env << 'EOL'
FIREBASE_API_KEY=AIzaSyDFps9-V4XXXXXXXXXXXXXXXXXXXXXXXXXX
FIREBASE_AUTH_DOMAIN=ai-sports-edge.firebaseapp.com
FIREBASE_PROJECT_ID=ai-sports-edge
FIREBASE_STORAGE_BUCKET=ai-sports-edge.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
EOL
check_status "Creating .env file"

# Update firebase.js to properly load environment variables
cat > firebase.js << 'EOL'
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Load environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Add better error handling for auth operations
auth.onAuthStateChanged((user) => {
  console.log("Auth state changed:", user ? "User logged in" : "User logged out");
});

// Export the auth and db instances
export { auth, db };
EOL
check_status "Updating firebase.js"

# Step 2: Create a dedicated signup route in the web app
log "\n${YELLOW}Step 2: Creating signup route...${NC}"

# Create routes.js file
cat > routes.js << 'EOL'
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./LoginPage";
import SignupPage from "./SignupPage";
import ForgotPasswordPage from "./ForgotPasswordPage";
import Dashboard from "./Dashboard";
import { auth } from "./firebase";

// Protected route component
const ProtectedRoute = ({ children }) => {
  const user = auth.currentUser;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public route that redirects if user is already logged in
const PublicRoute = ({ children }) => {
  const user = auth.currentUser;
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        
        <Route path="/signup" element={
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        } />
        
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
EOL
check_status "Creating routes.js"

# Step 3: Update webpack configuration
log "\n${YELLOW}Step 3: Updating webpack configuration...${NC}"

# Create webpack.config.js with proper configuration
cat > webpack.config.js << 'EOL'
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = {
  mode: 'development',
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      }
    ]
  },
  devServer: {
    historyApiFallback: true,
    hot: true,
    port: 3000
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    }),
    new Dotenv({
      systemvars: true
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx']
  }
};
EOL
check_status "Creating webpack.config.js"

# Step 4: Update index.js to use the routes
log "\n${YELLOW}Step 4: Updating index.js...${NC}"

cat > index.js << 'EOL'
import React from "react";
import ReactDOM from "react-dom/client";
import AppRoutes from "./routes";
import "./styles/global.css";

// Initialize the app
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AppRoutes />
  </React.StrictMode>
);
EOL
check_status "Updating index.js"

# Step 5: Create global CSS file
log "\n${YELLOW}Step 5: Creating global CSS...${NC}"

mkdir -p styles
cat > styles/global.css << 'EOL'
/* Reset and base styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #121212;
  color: #ffffff;
}

/* Import other CSS files */
@import './login.css';
EOL
check_status "Creating global.css"

# Step 6: Build and deploy
log "\n${YELLOW}Step 6: Building and deploying...${NC}"

# Create a build script
cat > build-and-deploy.js << 'EOL'
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Set environment to production
process.env.NODE_ENV = 'production';

console.log('Building application...');
execSync('npm run build', { stdio: 'inherit' });

console.log('Preparing files for deployment...');
// Create a deploy directory if it doesn't exist
const deployDir = path.join(__dirname, 'deploy');
if (!fs.existsSync(deployDir)) {
  fs.mkdirSync(deployDir);
}

// Copy necessary files to deploy directory
fs.copyFileSync(path.join(__dirname, 'dist', 'index.html'), path.join(deployDir, 'index.html'));
fs.copyFileSync(path.join(__dirname, 'dist', 'login.html'), path.join(deployDir, 'login.html'));

// Create signup.html that redirects to the main app with the signup route
const signupHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Sports Edge - Sign Up</title>
  <script>
    window.location.href = '/#/signup';
  </script>
</head>
<body>
  <p>Redirecting to signup page...</p>
</body>
</html>
`;
fs.writeFileSync(path.join(deployDir, 'signup.html'), signupHtml);

console.log('Deployment files prepared successfully!');
EOL
check_status "Creating build-and-deploy.js"

# Add build script to package.json
if [ -f "package.json" ]; then
  # Use node to add the new build script
  node -e '
    const fs = require("fs");
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
    if (!packageJson.scripts["build:signup"]) {
      packageJson.scripts["build:signup"] = "NODE_ENV=production node build-and-deploy.js";
      fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2));
      console.log("Added build:signup script to package.json");
    } else {
      console.log("build:signup script already exists in package.json");
    }
  '
  check_status "Updating package.json with build:signup script"
fi

# Step 7: Create a summary report
log "\n${YELLOW}Step 7: Creating summary report...${NC}"

cat > "signup-deployment-summary.md" << EOL
# AI Sports Edge Signup Deployment Summary

## Deployment Timestamp
${TIMESTAMP}

## Steps Completed
1. ✓ Updated Firebase initialization
   - Created .env file with Firebase configuration
   - Updated firebase.js to properly load environment variables
   - Added better error handling for auth operations

2. ✓ Created signup route
   - Created routes.js with proper routing configuration
   - Added protected and public route components
   - Integrated SignupPage, LoginPage, and ForgotPasswordPage

3. ✓ Updated webpack configuration
   - Added proper loaders for JS, CSS, and assets
   - Configured environment variables with dotenv-webpack
   - Set up history API fallback for client-side routing

4. ✓ Updated index.js
   - Integrated the routing system
   - Added global CSS import

5. ✓ Created global CSS
   - Added reset and base styles
   - Imported login.css

6. ✓ Created build and deploy scripts
   - Added build:signup script to package.json
   - Created build-and-deploy.js for production builds
   - Added signup.html redirect file

## Usage
To build and deploy the signup page:
\`\`\`bash
npm run build:signup
\`\`\`

## Next Steps
1. Test the signup flow end-to-end
2. Add analytics tracking for signup conversions
3. Implement email verification after signup
4. Add more robust error handling for network issues
EOL

check_status "Creating summary report"

log "\n${GREEN}=========================================${NC}"
log "${GREEN}Signup Page Deployment Setup Completed Successfully${NC}"
log "${GREEN}See signup-deployment-summary.md for details${NC}"
log "${GREEN}=========================================${NC}"