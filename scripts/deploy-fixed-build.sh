#!/bin/bash

# Deploy fixed build to aisportsedge.app
echo "Deploying fixed build to aisportsedge.app..."

# SFTP credentials
HOST="aisportsedge.app"
USER="deploy"
PASS="hTQ3LQ]#P(b,"
REMOTE_PATH="/home/q15133yvmhnq/public_html/aisportsedge.app"
LOCAL_PATH="./build"

# Create expect script for automated SFTP upload
cat > sftp_script.exp << EOL
#!/usr/bin/expect -f
set timeout -1
spawn sftp -o StrictHostKeyChecking=no $USER@$HOST
expect "password:"
send "$PASS\r"
expect "sftp>"
send "cd $REMOTE_PATH\r"
expect "sftp>"
send "put -r $LOCAL_PATH/*\r"
expect "sftp>"
send "bye\r"
expect eof
EOL

# Make the expect script executable
chmod +x sftp_script.exp

# Run the expect script
./sftp_script.exp

# Clean up
rm sftp_script.exp

echo "Deployment complete!"
echo "Verify at https://aisportsedge.app"