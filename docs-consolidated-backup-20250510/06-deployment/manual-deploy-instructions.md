# AI Sports Edge Manual Deployment Instructions

## Overview
The SFTP deployment script was interrupted during credential entry. This document provides manual instructions to complete the deployment process.

## Files to Deploy
The following files have been prepared in the `aisportsedge-deploy` directory and need to be uploaded to your GoDaddy hosting:

1. `signup.html` - New signup page with Firebase authentication
2. `login.html` - Updated login page with link to signup
3. `index.html` - Updated index page with navigation link to signup

## Manual Deployment Steps

### Option 1: Using GoDaddy File Manager

1. Log in to your GoDaddy account
2. Navigate to your hosting control panel
3. Open the File Manager
4. Navigate to your website's root directory (typically `/public_html`)
5. Upload the following files from your local `aisportsedge-deploy` directory:
   - `signup.html`
   - `login.html` (replace existing file)
   - `index.html` (replace existing file)

### Option 2: Using an SFTP Client (FileZilla, Cyberduck, etc.)

1. Open your preferred SFTP client
2. Connect using these credentials:
   - Host: sftp.aisportsedge.app
   - Port: 22
   - Username: deploy@aisportsedge.app
   - Password: [your password]
   - Remote directory: /public_html
3. Upload the following files from your local `aisportsedge-deploy` directory:
   - `signup.html`
   - `login.html` (replace existing file)
   - `index.html` (replace existing file)

### Option 3: Using Command Line SFTP

```bash
# Connect to the SFTP server
sftp -P 22 deploy@aisportsedge.app

# Navigate to the public_html directory
cd /public_html

# Upload the files
put aisportsedge-deploy/signup.html signup.html
put aisportsedge-deploy/login.html login.html
put aisportsedge-deploy/index.html index.html

# Exit SFTP
bye
```

## Verification Steps

After uploading the files, verify the deployment by:

1. Visiting https://aisportsedge.app/signup.html
   - Confirm the signup page loads correctly
   - Test the password strength meter
   - Verify form validation works

2. Visiting https://aisportsedge.app/login.html
   - Confirm the "Don't have an account? Sign up" link appears
   - Verify the link correctly points to signup.html

3. Visiting https://aisportsedge.app/index.html
   - Confirm the navigation includes a "Sign Up" link
   - Verify the link correctly points to signup.html

## Troubleshooting

If the pages don't appear correctly:

1. Check file permissions (should be 644 for HTML files)
2. Verify the files were uploaded to the correct directory
3. Clear your browser cache or try in incognito/private mode
4. Check the browser console for JavaScript errors

## Next Steps

After successful deployment:

1. Implement user profile creation after signup
2. Add email verification
3. Add social login options (Google, Apple)
4. Implement account management features