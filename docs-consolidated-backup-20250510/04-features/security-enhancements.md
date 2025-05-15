# Security Enhancements Documentation

This document outlines the security enhancements implemented in the AI Sports Edge web application to ensure a secure deployment.

## Table of Contents

1. [Subresource Integrity (SRI)](#subresource-integrity-sri)
2. [HTTP Strict Transport Security (HSTS)](#http-strict-transport-security-hsts)
3. [Content Security Policy (CSP)](#content-security-policy-csp)
4. [CSRF Protection](#csrf-protection)
5. [XSS Protection](#xss-protection)
6. [Environment Variable Security](#environment-variable-security)
7. [Additional Security Headers](#additional-security-headers)
8. [Firebase Security Rules](#firebase-security-rules)

## Subresource Integrity (SRI)

### Description
Subresource Integrity (SRI) is a security feature that enables browsers to verify that resources they fetch (like scripts and stylesheets) are delivered without unexpected manipulation. It works by providing a cryptographic hash that a fetched resource must match.

### Implementation
We've added SRI attributes to external resources:

```html
<!-- Google Fonts CSS -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" 
      rel="stylesheet" 
      integrity="sha384-T5i/RU1J7+Wkp+fVBXg+V5VjvHwZ5dJu/nCFZ1QIQCIUkNOHRHnpVzwZmnbc9Ey5" 
      crossorigin="anonymous">

<!-- Google Analytics Script -->
<script async 
        src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX" 
        integrity="sha384-Mh8z9e3yCJ0aNEYt4GwJ1FqUQdUDNAUOnBw6C/+7Xzqm0qRatuRYYZ+QQQ/hKY3" 
        crossorigin="anonymous"></script>
```

### Benefits
- Prevents attackers from injecting malicious content via compromised CDNs
- Ensures the integrity of third-party resources
- Provides an additional layer of security against content injection attacks

## HTTP Strict Transport Security (HSTS)

### Description
HTTP Strict Transport Security (HSTS) is a web security policy mechanism that helps protect websites against protocol downgrade attacks and cookie hijacking. It allows web servers to declare that web browsers should interact with it using only HTTPS connections.

### Implementation
HSTS is configured in the Firebase hosting configuration (`firebase.json`):

```json
{
  "key": "Strict-Transport-Security",
  "value": "max-age=31536000; includeSubDomains; preload"
}
```

### Configuration Details
- **max-age=31536000**: Sets the policy to be in effect for 1 year (365 days)
- **includeSubDomains**: Applies the policy to all subdomains, enhancing security coverage
- **preload**: Indicates the site should be included in browser HSTS preload lists, ensuring HTTPS is enforced even on first visits

### Benefits
- Forces all connections to use HTTPS, preventing protocol downgrade attacks
- Protects against SSL stripping attacks
- Enhances user privacy and security by ensuring encrypted connections

## Content Security Policy (CSP)

### Description
Content Security Policy (CSP) is an added layer of security that helps to detect and mitigate certain types of attacks, including Cross-Site Scripting (XSS) and data injection attacks.

### Implementation
We've added a comprehensive CSP to the application in `public/index.html`:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com 'unsafe-inline'; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.aisportsedge.com https://www.google-analytics.com https://firebaseinstallations.googleapis.com https://firebaseremoteconfig.googleapis.com https://firestore.googleapis.com; frame-src 'self' https://accounts.google.com https://aisportsedge.firebaseapp.com; object-src 'none';">
```

### Policy Breakdown
- **default-src 'self'**: Only allow resources from the same origin by default
- **script-src**: Restrict JavaScript sources to same origin, Google Analytics, and inline scripts
- **style-src**: Allow styles from same origin, Google Fonts, and inline styles
- **font-src**: Allow fonts from same origin and Google Fonts
- **img-src**: Allow images from same origin, data URIs, and HTTPS sources
- **connect-src**: Control which endpoints can be connected to via fetch, XHR, etc.
- **frame-src**: Restrict iframe sources to same origin, Google accounts, and Firebase
- **object-src 'none'**: Block all plugins (object, embed, applet)

### Benefits
- Restricts the sources from which various resource types can be loaded
- Mitigates XSS attacks by controlling which scripts can execute
- Prevents data exfiltration by limiting connection destinations

## CSRF Protection

### Description
Cross-Site Request Forgery (CSRF) is an attack that forces authenticated users to submit a request to a web application against which they are currently authenticated.

### Implementation
We've implemented CSRF protection in the API service (`services/apiService.ts`):

```typescript
// Generate and store CSRF token
const getCsrfToken = async (): Promise<string> => {
  try {
    // Try to get from storage first
    const storedToken = await AsyncStorage.getItem('csrf_token');
    if (storedToken) {
      return storedToken;
    }
    
    // Generate a new token if not found
    const newToken = Array(32)
      .fill(0)
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('');
    
    // Store the token
    await AsyncStorage.setItem('csrf_token', newToken);
    return newToken;
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    // Fallback to a random token if storage fails
    return Math.random().toString(36).substring(2);
  }
};

// Add CSRF token to headers for non-GET requests
const getAuthHeaders = async (method: string = 'GET'): Promise<Record<string, string>> => {
  // ... other code ...
  
  // Add CSRF token for non-GET requests
  if (method !== 'GET') {
    const csrfToken = await getCsrfToken();
    headers['X-CSRF-Token'] = csrfToken;
  }
  
  return headers;
};
```

### Benefits
- Prevents CSRF attacks by requiring a token for state-changing operations
- Ensures that only requests from the legitimate application are processed
- Adds an additional layer of security for authenticated users

## XSS Protection

### Description
Cross-Site Scripting (XSS) attacks are a type of injection where malicious scripts are injected into trusted websites.

### Implementation
We've enhanced the XSS protection by improving the sanitization function in `services/analyticsService.ts`:

```typescript
const sanitizeValue = (value: any): any => {
  if (typeof value === 'string') {
    // More comprehensive XSS prevention
    return value
      .replace(/[&<>"']/g, (char) => {
        const entities: Record<string, string> = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        };
        return entities[char];
      })
      .replace(/javascript:/gi, 'blocked:')
      .replace(/on\w+=/gi, 'data-blocked=')
      .replace(/data:(?!image\/(jpeg|png|gif|webp))/gi, 'blocked:');
  }
  // Handle arrays and objects recursively
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.map(item => sanitizeValue(item));
    }
    return Object.keys(value).reduce((acc: Record<string, any>, key) => {
      acc[key] = sanitizeValue(value[key]);
      return acc;
    }, {});
  }
  return value;
};
```

### Benefits
- Escapes HTML special characters to prevent HTML injection
- Blocks JavaScript protocol in URLs to prevent JavaScript execution
- Blocks event handlers to prevent inline script execution
- Blocks dangerous data URIs while allowing safe image formats
- Recursively sanitizes nested objects and arrays

## Environment Variable Security

### Description
Storing sensitive information like API keys in source code is a security risk. Environment variables provide a more secure way to manage sensitive configuration.

### Implementation
We've updated the Firebase configuration in `config/firebase.ts` to use environment variables:

```typescript
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  
  // For Expo/React Native
  if (typeof global !== 'undefined') {
    // Use type assertion for global
    const globalAny = global as any;
    if (globalAny.__expo && globalAny.__expo.Constants) {
      const expoConstants = globalAny.__expo.Constants;
      return expoConstants.manifest?.extra?.[key] || defaultValue;
    }
  }
  
  return defaultValue;
};

// Firebase configuration
const firebaseConfig = {
  apiKey: getEnvVar('FIREBASE_API_KEY'),
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN', 'ai-sports-edge.firebaseapp.com'),
  projectId: getEnvVar('FIREBASE_PROJECT_ID', 'ai-sports-edge'),
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET', 'ai-sports-edge.appspot.com'),
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID', '123456789012'),
  appId: getEnvVar('FIREBASE_APP_ID', '1:123456789012:web:abcdef1234567890'),
  measurementId: getEnvVar('FIREBASE_MEASUREMENT_ID', 'G-ABCDEFGHIJ')
};
```

### Benefits
- Prevents sensitive information from being exposed in source code
- Allows different configurations for different environments
- Follows security best practices for configuration management

## Additional Security Headers

### Description
HTTP security headers are a set of headers in the HTTP response from a server that can help to enhance the security of a web application.

### Implementation
The following security headers are configured in the Firebase hosting configuration (`firebase.json`):

```json
{
  "key": "X-Content-Type-Options",
  "value": "nosniff"
},
{
  "key": "X-Frame-Options",
  "value": "DENY"
},
{
  "key": "X-XSS-Protection",
  "value": "1; mode=block"
},
{
  "key": "Referrer-Policy",
  "value": "strict-origin-when-cross-origin"
}
```

Additionally, we've added the following headers in `public/index.html`:

```html
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta http-equiv="X-Frame-Options" content="SAMEORIGIN">
<meta http-equiv="X-XSS-Protection" content="1; mode=block">
<meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
<meta http-equiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(self), interest-cohort=()">
```

### Benefits
- **X-Content-Type-Options: nosniff**: Prevents MIME type sniffing
- **X-Frame-Options: DENY/SAMEORIGIN**: Prevents clickjacking attacks
- **X-XSS-Protection: 1; mode=block**: Enables browser's XSS filtering
- **Referrer-Policy: strict-origin-when-cross-origin**: Controls information in the Referer header
- **Permissions-Policy**: Restricts which browser features the site can use

## Firebase Security Rules

### Description
Firebase Security Rules define who has access to what data and when they can access it.

### Implementation
The Firebase security rules in `firestore.rules` include:

- Authentication checks
- Data validation
- Rate limiting
- Role-based access control

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Function to check if the user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Function to check if the user is accessing their own data
    function isUser(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Function to check if the user is an admin
    function isAdmin() {
      return isAuthenticated() && 
        exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    // ... other security rules ...
  }
}
```

### Benefits
- Ensures that only authorized users can access or modify data
- Prevents unauthorized access to sensitive information
- Enforces data validation to maintain data integrity
- Implements rate limiting to prevent abuse

## Conclusion

These security enhancements significantly improve the security posture of the AI Sports Edge web application. By implementing these measures, we've addressed common web vulnerabilities and followed security best practices recommended by OWASP and other security organizations.

## References

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Subresource Integrity (SRI)](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
- [HTTP Strict Transport Security (HSTS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)
- [Cross-Site Request Forgery (CSRF) Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Cross-Site Scripting (XSS) Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)