# AI Sports Edge Deployment Scripts

This directory contains scripts for deploying the AI Sports Edge application to production servers.

## Secure SFTP Deployment

The recommended deployment method is using the secure SFTP script:

```bash
./scripts/secure-sftp-deploy.sh
```

### Security Features

- Uses environment variables instead of hardcoded credentials
- Supports SSH key-based authentication
- No credentials stored in version control
- Creates temporary configuration files that are deleted after use

### Setup Instructions

1. **Set required environment variables**:

   ```bash
   export SFTP_HOST=sftp.aisportsedge.app
   export SFTP_USER=deploy@aisportsedge.app
   export SFTP_REMOTE_PATH=/home/q15133yvmhnq/public_html/aisportsedge.app
   ```

2. **Choose an authentication method**:

   **Option A: SSH Key Authentication (Recommended)**
   ```bash
   # Generate a new SSH key if you don't have one
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/aisportsedge_deploy
   
   # Add your public key to the server's authorized_keys
   # (Contact server admin to add your key)
   
   # Set the key path in your environment
   export SFTP_KEY_PATH=~/.ssh/aisportsedge_deploy
   ```

   **Option B: Password Authentication**
   ```bash
   export SFTP_PASSWORD=your_secure_password
   ```

3. **Optional configuration**:

   ```bash
   export SFTP_PORT=22  # Default is 22
   export SFTP_LOCAL_DIR=./dist  # Default is ./dist
   export SFTP_EXCLUDE='[".htaccess", ".DS_Store"]'  # Default is [".htaccess"]
   ```

4. **Run the deployment**:

   ```bash
   ./scripts/secure-sftp-deploy.sh
   ```

### Adding to CI/CD

For GitHub Actions or other CI/CD systems, store these variables as secrets and include them in your workflow:

```yaml
# Example GitHub Actions workflow snippet
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        env:
          SFTP_HOST: ${{ secrets.SFTP_HOST }}
          SFTP_USER: ${{ secrets.SFTP_USER }}
          SFTP_REMOTE_PATH: ${{ secrets.SFTP_REMOTE_PATH }}
          SFTP_PASSWORD: ${{ secrets.SFTP_PASSWORD }}
          # Or for SSH key authentication:
          # SFTP_KEY_PATH: ~/.ssh/deploy_key
        run: |
          # If using SSH key, set it up first
          # echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/deploy_key
          # chmod 600 ~/.ssh/deploy_key
          ./scripts/secure-sftp-deploy.sh
```

## Legacy Deployment Scripts

The following scripts are maintained for backward compatibility but are not recommended for security reasons:

- `sftp-deploy.sh` - Uses npm package with hardcoded credentials
- `direct-sftp-deploy.sh` - Uses sshpass with hardcoded credentials
- `native-sftp-deploy.sh` - Uses native sftp command with manual password entry

## Post-Deployment Verification

After deployment, always verify:

1. Visit https://aisportsedge.app in incognito or hard refresh
2. Ensure no reload loop
3. Check for integrity, MIME, or CSP errors in Console
4. Confirm Firebase and routing work as expected
5. Verify language toggle works and Spanish text appears when selected