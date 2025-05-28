#!/bin/bash

# Server connection details
HOST="p3plzcpnl508920.prod.phx3.secureserver.net"
USER="deploy@aisportsedge.app"
PASS="hTQ3LQ]#P(b,"

# Commands to run on the server
COMMANDS="cd /home/q15133yvmhnq/public_html/aisportsedge.app && \
chmod +x fix-permissions-and-build.sh && \
./fix-permissions-and-build.sh && \
./scripts/detailed-deployment-check.sh"

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
  echo "❌ sshpass is not installed. Please install it first:"
  echo "  - macOS: brew install hudochenkov/sshpass/sshpass"
  echo "  - Ubuntu/Debian: sudo apt-get install sshpass"
  echo "  - CentOS/RHEL: sudo yum install sshpass"
  exit 1
fi

echo "🚀 Connecting to server and running commands..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$USER@$HOST" "$COMMANDS"

# Check if SSH command was successful
if [ $? -eq 0 ]; then
  echo "✅ Server commands executed successfully!"
else
  echo "❌ Failed to execute server commands. Please check the output for errors."
  exit 1
fi