# Firebase Hosting Integration for AI Sports Edge

This document provides an overview of how AI Sports Edge is integrated with Firebase Hosting using the custom domain aisportsedge.app.

## Overview

Firebase Hosting provides fast, secure hosting for web applications. For AI Sports Edge, we've configured Firebase Hosting to serve our web application using our custom domain (aisportsedge.app).

## Architecture

The integration follows this architecture:

```
                                 ┌─────────────────┐
                                 │                 │
                                 │  GitHub Repo    │
                                 │                 │
                                 └────────┬────────┘
                                          │
                                          │ Push to main
                                          ▼
┌─────────────────┐            ┌─────────────────┐
│                 │            │                 │
│  Custom Domain  │            │  GitHub Actions │
│  aisportsedge.app│◄───DNS────┤                 │
│                 │            │                 │
└────────┬────────┘            └────────┬────────┘
         │                              │
         │                              │ Deploy
         │                              ▼
         │                     ┌─────────────────┐
         │                     │                 │
         └──────HTTPS─────────►│ Firebase Hosting│
                               │                 │
                               └─────────────────┘
```

## Components

### 1. Firebase Project

- **Project ID**: `ai-sports-edge-final`
- **Hosting Site**: `aisportsedge-app`
- **Default URL**: `aisportsedge-app.web.app`

### 2. Custom Domain

- **Primary Domain**: `aisportsedge.app`
- **Subdomain**: `www.aisportsedge.app`
- **SSL**: Automatically provisioned by Firebase

### 3. Deployment Pipeline

- **Source Control**: GitHub repository
- **CI/CD**: GitHub Actions
- **Trigger**: Push to main branch
- **Build Process**: Consolidates assets and updates configuration
- **Deployment**: Automatic deployment to Firebase Hosting

## Integration Scripts

### 1. Design Integration Script

The `scripts/integrate_existing_design.js` script:

- Searches through project directories for web assets
- Consolidates HTML, CSS, JavaScript, and image files
- Fixes relative paths in HTML and CSS files
- Prepares the `dist` directory for deployment

### 2. Firebase Configuration Script

The `scripts/update_firebase_config.js` script:

- Updates the Firebase configuration for hosting
- Configures custom domains
- Sets up security headers and HTTPS enforcement
- Configures redirects and rewrites for SPA functionality

## Deployment Process

1. **Local Development**:
   - Make changes to the codebase
   - Test locally using `firebase serve`
   - Commit and push changes to GitHub

2. **Automated Deployment**:
   - GitHub Actions workflow is triggered on push to main
   - Integration scripts run to prepare files
   - Firebase configuration is updated
   - Files are deployed to Firebase Hosting

3. **Verification**:
   - Deployment is verified automatically
   - Site is accessible via custom domain

## Security Considerations

The Firebase hosting configuration includes several security enhancements:

- **HTTPS Enforcement**: All traffic is served over HTTPS
- **Security Headers**:
  - Content-Security-Policy
  - X-Frame-Options
  - X-Content-Type-Options
  - X-XSS-Protection
  - Referrer-Policy
- **Cache Control**: Optimized for different asset types

## Performance Optimizations

- **CDN Distribution**: Firebase Hosting uses a global CDN
- **Caching Strategy**: Different cache durations for different file types
- **Compression**: Automatic Brotli and gzip compression
- **Fast Response Times**: Low TTFB (Time To First Byte)

## Monitoring and Maintenance

- **Firebase Console**: Provides hosting usage statistics
- **GitHub Actions**: Logs deployment history and status
- **Regular Audits**: Performance and security audits

## Troubleshooting

Common issues and their solutions:

1. **Deployment Failures**:
   - Check GitHub Actions logs
   - Verify Firebase configuration
   - Ensure all dependencies are installed

2. **Domain Issues**:
   - Verify DNS configuration
   - Check SSL certificate status
   - Confirm domain verification

3. **Performance Issues**:
   - Review asset sizes and loading times
   - Check for render-blocking resources
   - Optimize images and scripts

## Related Documentation

- [Firebase Custom Domain Setup](./firebase-custom-domain-setup.md)
- [GitHub Actions Setup for Firebase](./firebase-github-actions-setup.md)

## Future Improvements

- Implement preview deployments for pull requests
- Add performance monitoring with Firebase Performance Monitoring
- Set up A/B testing with Firebase Remote Config
- Integrate Firebase Analytics for user behavior tracking