# Firebase Security Assessment and Recommendations

## Executive Summary

This document provides a security assessment of the current Firebase configuration in the AI Sports Edge application and recommends a more secure approach for handling Firebase credentials. The current implementation exposes API keys and other sensitive credentials in client-side code, which poses several security risks. This document outlines these risks and provides a detailed plan for implementing a more secure approach.

## Current Implementation

The Firebase configuration is currently stored in `src/config/firebase.js` with hardcoded API keys and credentials:

```javascript
// src/config/firebase.js
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDxLufbPyNYpax2MmE5ff27MHA-js9INBw",
  authDomain: "ai-sports-edge.firebaseapp.com",
  projectId: "ai-sports-edge",
  storageBucket: "ai-sports-edge.appspot.com",
  messagingSenderId: "63216708515",
  appId: "1:63216708515:android:209e6baf130386edb00816"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export default firebase;
```

This file is imported in `web/index.js` and used throughout the application.

## Security Risks

### 1. Exposed API Keys

The Firebase API key and other credentials are hardcoded in client-side code, making them visible to anyone who inspects the application code. While Firebase API keys themselves are not considered highly sensitive secrets (as they are meant to be used in client-side code), they should still be handled with care.

### 2. Potential Abuse

Exposed API keys could be used by malicious actors to:
- Make unauthorized API calls to Firebase services
- Potentially incur costs on your Firebase account through excessive usage
- Access your Firebase project if not properly secured with security rules

### 3. Lack of Environment Separation

Using the same hardcoded configuration for all environments (development, staging, production) makes it difficult to manage different Firebase projects for different environments. This can lead to:
- Accidental modification of production data during development
- Difficulty in testing changes in isolation
- Challenges in managing different security rules for different environments

### 4. Version Control Risks

Storing sensitive credentials in code that's committed to version control increases the risk of credential exposure, especially if:
- The repository is public or becomes public in the future
- Access to the repository is not properly controlled
- Developers clone the repository to insecure environments

## Best Practices for Firebase Credentials

### 1. Use Environment Variables

Store Firebase configuration in environment variables and access them at runtime. This approach:
- Keeps sensitive information out of the codebase
- Allows for different configurations in different environments
- Follows the principle of separation of configuration from code

### 2. Implement Proper Security Rules

Firebase security rules are the primary defense mechanism for protecting your data. Ensure that:
- Firestore rules restrict access to authorized users only
- Storage rules prevent unauthorized uploads or downloads
- Database rules enforce proper data validation and access control

### 3. Use Firebase App Check

Firebase App Check helps prevent unauthorized access to your Firebase resources by verifying that incoming requests are from your app. It:
- Adds an additional layer of security beyond API keys
- Helps prevent abuse from unauthorized sources
- Can be integrated with reCAPTCHA, DeviceCheck, or Play Integrity

### 4. Restrict API Key Usage

Configure API key restrictions in the Google Cloud Console to:
- Limit which Firebase services can be accessed with the key
- Restrict usage to specific websites or IP addresses
- Set quotas to prevent excessive usage

### 5. Environment-Specific Configurations

Use different Firebase projects or configurations for different environments to:
- Isolate development and testing from production data
- Apply different security rules for different environments
- Manage costs and usage separately

### 6. Secure CI/CD Pipelines

Ensure that environment variables are securely managed in CI/CD pipelines by:
- Using secret management services provided by your CI/CD platform
- Limiting access to secrets to authorized personnel only
- Avoiding printing secrets in build logs

## Recommended Approach

We recommend implementing a solution that:

1. Uses environment variables to store Firebase configuration
2. Loads these variables at build time using webpack
3. Supports different configurations for different environments
4. Follows security best practices for handling credentials

## Implementation Plan

### 1. Create Environment Files

1. Create environment-specific files:
   - `.env.development` for development environment
   - `.env.production` for production environment

2. Move Firebase configuration to these files:
   ```
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your_auth_domain
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_storage_bucket
   FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   FIREBASE_APP_ID=your_app_id
   ```

3. Update `.gitignore` to exclude these files:
   ```
   # Environment files
   .env
   .env.local
   .env.development
   .env.production
   ```

### 2. Update Webpack Configuration

1. Install required packages:
   ```
   npm install --save-dev dotenv-webpack
   ```

2. Update `webpack.config.js` to use environment variables:
   ```javascript
   const Dotenv = require('dotenv-webpack');
   
   // In the plugins section:
   plugins: [
     // ... other plugins
     new Dotenv({
       path: `./.env.${process.env.NODE_ENV}`, // Load based on environment
       safe: true, // Load .env.example as a fallback
       systemvars: true, // Load system environment variables as well
     }),
   ],
   ```

3. Update `webpack.prod.js` to include Firebase environment variables:
   ```javascript
   new webpack.DefinePlugin({
     'process.env.NODE_ENV': JSON.stringify('production'),
     'process.env.FIREBASE_API_KEY': JSON.stringify(process.env.FIREBASE_API_KEY),
     'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.FIREBASE_AUTH_DOMAIN),
     'process.env.FIREBASE_PROJECT_ID': JSON.stringify(process.env.FIREBASE_PROJECT_ID),
     'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.FIREBASE_STORAGE_BUCKET),
     'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.FIREBASE_MESSAGING_SENDER_ID),
     'process.env.FIREBASE_APP_ID': JSON.stringify(process.env.FIREBASE_APP_ID),
   }),
   ```

### 3. Modify Firebase Configuration

Update `src/config/firebase.js` to use environment variables:

```javascript
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

// Validate that required environment variables are set
const validateEnv = () => {
  const requiredVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID'
  ];
  
  const missingVars = requiredVars.filter(
    varName => !process.env[varName]
  );
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
};

// In development, validate environment variables
if (process.env.NODE_ENV !== 'production') {
  validateEnv();
}

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase only once
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export default firebase;
```

### 4. Update Build Scripts

Update `package.json` to include environment-specific build scripts:

```json
"scripts": {
  "start": "NODE_ENV=development webpack serve --config webpack.config.js",
  "build:dev": "NODE_ENV=development webpack --config webpack.config.js",
  "build:prod": "NODE_ENV=production webpack --config webpack.prod.js"
}
```

### 5. Additional Security Measures

#### Configure Firebase Security Rules

Review and update Firestore security rules in `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Default deny all
    match /{document=**} {
      allow read, write: if false;
    }
    
    // User data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Add more specific rules for other collections
  }
}
```

#### Set Up API Key Restrictions

1. Go to the Google Cloud Console
2. Navigate to APIs & Services > Credentials
3. Find your API key and click "Edit"
4. Add restrictions:
   - Application restrictions: HTTP referrers (websites)
   - Add your website domains
   - API restrictions: Restrict to specific APIs needed by your app

#### Implement Firebase App Check

1. Install required packages:
   ```
   npm install firebase/app-check
   ```

2. Update Firebase configuration to include App Check:
   ```javascript
   import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

   // After initializing Firebase
   if (process.env.NODE_ENV === 'production') {
     initializeAppCheck(firebase.app(), {
       provider: new ReCaptchaV3Provider('your-recaptcha-site-key'),
       isTokenAutoRefreshEnabled: true
     });
   }
   ```

## Conclusion

Implementing these recommendations will significantly improve the security of your Firebase configuration. By using environment variables, properly configuring security rules, and adding additional security measures like API key restrictions and App Check, you can protect your Firebase resources from unauthorized access and potential abuse.

Remember that security is an ongoing process, and you should regularly review and update your security measures as your application evolves and new security best practices emerge.

## References

- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase App Check](https://firebase.google.com/docs/app-check)
- [Google Cloud API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)
- [Webpack Environment Variables](https://webpack.js.org/plugins/environment-plugin/)
- [Dotenv Webpack Plugin](https://github.com/mrsteele/dotenv-webpack)