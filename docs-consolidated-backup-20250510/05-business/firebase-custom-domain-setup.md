# Setting Up Custom Domain with Firebase Hosting

This guide provides instructions for configuring your custom domain (aisportsedge.app) with Firebase Hosting.

## Prerequisites

- Firebase project with Hosting enabled
- Domain name registered (aisportsedge.app)
- Access to your domain's DNS settings

## Step 1: Add Custom Domain in Firebase Console

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Hosting** in the left sidebar
4. Click on **Add custom domain**
5. Enter your domain name: `aisportsedge.app`
6. Click **Continue**
7. Repeat for `www.aisportsedge.app` if you want to support the www subdomain

## Step 2: Verify Domain Ownership

Firebase will provide you with a TXT record to add to your DNS configuration to verify that you own the domain.

1. Copy the TXT record provided by Firebase
2. Log in to your domain registrar (where you purchased aisportsedge.app)
3. Navigate to the DNS settings or DNS management section
4. Add a new TXT record:
   - **Name/Host**: `@` (or sometimes left blank, representing the root domain)
   - **Value/Content**: Paste the verification code from Firebase
   - **TTL**: 3600 (or 1 hour)
5. Save the changes

> **Note**: DNS changes can take up to 48 hours to propagate, but typically take 15 minutes to a few hours.

## Step 3: Configure DNS Records

After domain verification, Firebase will provide you with the necessary DNS records to point your domain to Firebase Hosting.

### For the Root Domain (aisportsedge.app)

Add an **A record**:
- **Name/Host**: `@` (or leave blank)
- **Value/Content**: `151.101.1.195` and `151.101.65.195`
- **TTL**: 3600 (or 1 hour)

### For the www Subdomain (www.aisportsedge.app)

Add a **CNAME record**:
- **Name/Host**: `www`
- **Value/Content**: `aisportsedge-app.web.app` (your Firebase Hosting URL)
- **TTL**: 3600 (or 1 hour)

## Step 4: Set Up SSL Certificate

Firebase Hosting automatically provisions and renews SSL certificates for your custom domain. This process begins after your DNS records are properly configured.

1. Wait for DNS propagation (check using [dnschecker.org](https://dnschecker.org/))
2. Firebase will automatically provision an SSL certificate
3. This process can take up to 24 hours, but typically completes within a few hours

## Step 5: Test Your Custom Domain

After DNS propagation and SSL certificate provisioning:

1. Visit your custom domain in a browser: `https://aisportsedge.app`
2. Verify that your site loads correctly
3. Check that HTTPS is working properly (look for the lock icon in the browser)
4. Test the www subdomain as well: `https://www.aisportsedge.app`

## Troubleshooting

### DNS Issues

If your domain isn't pointing to Firebase Hosting:

1. Verify DNS records are correctly configured
2. Check DNS propagation using [dnschecker.org](https://dnschecker.org/)
3. Wait longer for DNS changes to propagate (up to 48 hours)

### SSL Certificate Issues

If you see SSL warnings:

1. Ensure DNS records are correctly configured
2. Wait for SSL certificate provisioning (up to 24 hours)
3. Check the Firebase Console for any certificate provisioning errors

### 404 Errors

If you see 404 errors:

1. Ensure your site has been deployed to Firebase Hosting
2. Check that the `firebase.json` file has the correct `public` directory specified
3. Verify that `index.html` exists in your public directory

## Additional Configuration

### Redirecting www to Non-www (or Vice Versa)

To redirect www to non-www, add this to your `firebase.json`:

```json
{
  "hosting": {
    "redirects": [
      {
        "source": "https://www.aisportsedge.app/:path*",
        "destination": "https://aisportsedge.app/:path",
        "type": 301
      }
    ]
  }
}
```

For non-www to www, reverse the source and destination.

### Custom Headers

To add custom headers (like security headers), add this to your `firebase.json`:

```json
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com 'unsafe-inline';"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          }
        ]
      }
    ]
  }
}
```

## Resources

- [Firebase Custom Domain Documentation](https://firebase.google.com/docs/hosting/custom-domain)
- [Firebase Hosting Configuration](https://firebase.google.com/docs/hosting/full-config)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)