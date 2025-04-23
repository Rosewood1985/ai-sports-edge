# AI Sports Edge VS Code SFTP Deployment

## Files to Deploy
- signup.html - New signup page with Firebase authentication
- login.html - Updated login page with link to signup
- index.html - Updated index page with navigation link to signup

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
   - Visit https://aisportsedge.app/signup.html
   - Visit https://aisportsedge.app/login.html
   - Visit https://aisportsedge.app/index.html

## Troubleshooting

If you encounter any issues:
- Check the Output panel in VS Code for SFTP logs
- Verify your SFTP configuration in .vscode/sftp.json
- Try manually uploading the files using an SFTP client
