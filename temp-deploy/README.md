# AI Sports Edge VS Code SFTP Deployment

## Files to Deploy
- signup.html - New signup page with Firebase authentication
- login.html - Updated login page with link to signup
- index.html - Updated index page with navigation link to signup
- .htaccess - Apache configuration for clean URLs and security

## Deployment Instructions

1. Install the VS Code SFTP extension if you haven't already:
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X or Cmd+Shift+X)
   - Search for "SFTP" by Natizyskunk
   - Click Install

2. Open this directory in VS Code:
   - File > Open Folder... > Select this directory

3. Deploy the files:
   - Right-click on each file in the Explorer
   - Select "SFTP: Upload"
   - Or use the keyboard shortcut Ctrl+Alt+U (Windows/Linux) or Cmd+Alt+U (Mac)

4. Verify the deployment:
   - Visit https://aisportsedge.app/signup
   - Visit https://aisportsedge.app/login
   - Visit https://aisportsedge.app/
   - Visit https://aisportsedge.app/deploy (should redirect to root)

## Troubleshooting

If you encounter any issues:
- Check the Output panel in VS Code for SFTP logs
- Verify your SFTP configuration in .vscode/sftp.json
- Try manually uploading the files using an SFTP client

### .htaccess Configuration Issues

If the clean URLs or redirects are not working:

1. **Check Server Configuration**
   - Ensure that your server's `AllowOverride` directive is set to `All` for the directory containing your website files.
   - This setting is typically found in the server's main configuration file (e.g., `httpd.conf` or `apache2.conf`):
   ```apache
   <Directory "/path/to/your/site">
       AllowOverride All
   </Directory>
   ```
   - If you don't have access to the server configuration files, contact your hosting provider's support team.

2. **Clear Browser Cache**
   - Browsers often cache redirects and other settings.
   - Clear your browser's cache or try accessing your site in an incognito/private browsing window.

3. **Test Rewrite Module**
   - Ensure that the Apache `mod_rewrite` module is enabled on your server.
   - You can test this by creating a simple test file with a basic rewrite rule.
   - If the module is not enabled, you may need to enable it in your server configuration or contact your hosting provider.

4. **Verify .htaccess File**
   - Confirm that the .htaccess file was uploaded correctly and has the proper permissions (typically 644).
   - Make sure the file contains all the necessary rules, especially:
   ```apache
   RewriteEngine On
   RewriteBase /

   # Remove .html extension
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteCond %{REQUEST_FILENAME}\.html -f
   RewriteRule ^([^/]+)$ $1.html [L]
   ```
