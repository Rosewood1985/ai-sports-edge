#!/bin/bash

# Automated SFTP Snapshot Backup Script for AI Sports Edge
# This script creates a full backup of the production environment

# Set default values
BACKUP_DIR="./backups"
DATE_FORMAT=$(date +"%Y-%m-%d")
BACKUP_FILE="${BACKUP_DIR}/${DATE_FORMAT}.tar.gz"
BACKUP_BRANCH="backups"
BACKUP_REMOTE="origin"
BACKUP_COMMIT_MSG="Automated backup ${DATE_FORMAT}"
BACKUP_LOG="${BACKUP_DIR}/backup-${DATE_FORMAT}.log"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Start logging
exec > >(tee -a "${BACKUP_LOG}") 2>&1

echo "🔄 Starting automated backup at $(date)"
echo "📂 Backup will be saved to: ${BACKUP_FILE}"

# Load SFTP configuration from VS Code settings
if [ -f ".vscode/sftp.json" ]; then
  echo "📋 Loading SFTP configuration from .vscode/sftp.json..."
  
  # Extract values from sftp.json using grep and sed
  SFTP_HOST=$(grep -o '"host": *"[^"]*"' .vscode/sftp.json | sed 's/"host": *"\(.*\)"/\1/')
  SFTP_USER=$(grep -o '"username": *"[^"]*"' .vscode/sftp.json | sed 's/"username": *"\(.*\)"/\1/')
  SFTP_REMOTE_PATH=$(grep -o '"remotePath": *"[^"]*"' .vscode/sftp.json | sed 's/"remotePath": *"\(.*\)"/\1/')
  SFTP_PASSWORD=$(grep -o '"password": *"[^"]*"' .vscode/sftp.json | sed 's/"password": *"\(.*\)"/\1/')
  SFTP_PORT=$(grep -o '"port": *[0-9]*' .vscode/sftp.json | sed 's/"port": *\([0-9]*\)/\1/')
  
  echo "✅ Loaded SFTP configuration from .vscode/sftp.json"
else
  # Check for environment variables
  if [ -z "$SFTP_HOST" ] || [ -z "$SFTP_USER" ] || [ -z "$SFTP_REMOTE_PATH" ]; then
    echo "❌ Missing SFTP configuration. Please set up .vscode/sftp.json or environment variables."
    exit 1
  fi
fi

# Create temporary directory for backup
TEMP_DIR=$(mktemp -d)
echo "📁 Created temporary directory: ${TEMP_DIR}"

# Download files from remote server
echo "🔄 Downloading files from ${SFTP_HOST}:${SFTP_REMOTE_PATH}..."

if [ ! -z "$SFTP_PASSWORD" ]; then
  # Use sshpass if password is provided
  sshpass -p "$SFTP_PASSWORD" sftp -r -P ${SFTP_PORT:-22} $SFTP_USER@$SFTP_HOST:$SFTP_REMOTE_PATH/* $TEMP_DIR/
  DOWNLOAD_STATUS=$?
else
  # Use SSH key
  sftp -r -P ${SFTP_PORT:-22} $SFTP_USER@$SFTP_HOST:$SFTP_REMOTE_PATH/* $TEMP_DIR/
  DOWNLOAD_STATUS=$?
fi

# Check if download was successful
if [ $DOWNLOAD_STATUS -ne 0 ]; then
  echo "❌ Failed to download files from remote server."
  echo "🔄 Trying alternative method with scp..."
  
  if [ ! -z "$SFTP_PASSWORD" ]; then
    # Use sshpass with scp if password is provided
    sshpass -p "$SFTP_PASSWORD" scp -r -P ${SFTP_PORT:-22} $SFTP_USER@$SFTP_HOST:$SFTP_REMOTE_PATH/* $TEMP_DIR/
    DOWNLOAD_STATUS=$?
  else
    # Use SSH key with scp
    scp -r -P ${SFTP_PORT:-22} $SFTP_USER@$SFTP_HOST:$SFTP_REMOTE_PATH/* $TEMP_DIR/
    DOWNLOAD_STATUS=$?
  fi
  
  if [ $DOWNLOAD_STATUS -ne 0 ]; then
    echo "❌ Failed to download files using alternative method."
    echo "🧹 Cleaning up temporary directory..."
    rm -rf $TEMP_DIR
    exit 1
  fi
fi

echo "✅ Files downloaded successfully."

# Create compressed archive
echo "🔄 Creating compressed archive..."
tar -czf $BACKUP_FILE -C $TEMP_DIR .
COMPRESS_STATUS=$?

# Check if compression was successful
if [ $COMPRESS_STATUS -ne 0 ]; then
  echo "❌ Failed to create compressed archive."
  echo "🧹 Cleaning up temporary directory..."
  rm -rf $TEMP_DIR
  exit 1
fi

echo "✅ Compressed archive created: ${BACKUP_FILE}"

# Clean up temporary directory
echo "🧹 Cleaning up temporary directory..."
rm -rf $TEMP_DIR

# Generate backup report
BACKUP_REPORT="${BACKUP_DIR}/backup-report-${DATE_FORMAT}.md"
echo "📝 Generating backup report..."

cat > $BACKUP_REPORT << EOL
# AI Sports Edge Backup Report

- **Date:** $(date)
- **Backup File:** ${BACKUP_FILE}
- **Size:** $(du -h ${BACKUP_FILE} | cut -f1)
- **Remote Server:** ${SFTP_HOST}
- **Remote Path:** ${SFTP_REMOTE_PATH}

## Files Included

\`\`\`
$(tar -tzf ${BACKUP_FILE} | sort)
\`\`\`

## Backup Status

✅ Backup completed successfully
EOL

echo "✅ Backup report generated: ${BACKUP_REPORT}"

# Check if S3 credentials are available
if [ ! -z "$AWS_ACCESS_KEY_ID" ] && [ ! -z "$AWS_SECRET_ACCESS_KEY" ] && [ ! -z "$S3_BUCKET" ]; then
  echo "🔄 Uploading backup to S3..."
  
  # Check if AWS CLI is installed
  if command -v aws &> /dev/null; then
    aws s3 cp ${BACKUP_FILE} s3://${S3_BUCKET}/backups/
    aws s3 cp ${BACKUP_REPORT} s3://${S3_BUCKET}/backups/
    echo "✅ Backup uploaded to S3: s3://${S3_BUCKET}/backups/$(basename ${BACKUP_FILE})"
  else
    echo "⚠️ AWS CLI not installed. Skipping S3 upload."
  fi
fi

# Check if Google Drive credentials are available
if [ ! -z "$GDRIVE_CREDENTIALS" ] && [ ! -z "$GDRIVE_FOLDER_ID" ]; then
  echo "🔄 Uploading backup to Google Drive..."
  
  # Check if gdrive CLI is installed
  if command -v gdrive &> /dev/null; then
    gdrive upload --parent ${GDRIVE_FOLDER_ID} ${BACKUP_FILE}
    gdrive upload --parent ${GDRIVE_FOLDER_ID} ${BACKUP_REPORT}
    echo "✅ Backup uploaded to Google Drive folder: ${GDRIVE_FOLDER_ID}"
  else
    echo "⚠️ gdrive CLI not installed. Skipping Google Drive upload."
  fi
fi

# Commit to backup branch if git is available
if command -v git &> /dev/null; then
  echo "🔄 Committing backup to ${BACKUP_BRANCH} branch..."
  
  # Save current branch
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  
  # Check if backup branch exists
  if git show-ref --verify --quiet refs/heads/${BACKUP_BRANCH}; then
    # Branch exists, switch to it
    git checkout ${BACKUP_BRANCH}
  else
    # Branch doesn't exist, create it
    git checkout -b ${BACKUP_BRANCH}
  fi
  
  # Add backup files
  git add ${BACKUP_FILE} ${BACKUP_REPORT}
  
  # Commit changes
  git commit -m "${BACKUP_COMMIT_MSG}"
  
  # Push to remote if specified
  if [ ! -z "$BACKUP_REMOTE" ]; then
    git push ${BACKUP_REMOTE} ${BACKUP_BRANCH}
    echo "✅ Backup pushed to ${BACKUP_REMOTE}/${BACKUP_BRANCH}"
  fi
  
  # Switch back to original branch
  git checkout ${CURRENT_BRANCH}
  echo "✅ Switched back to ${CURRENT_BRANCH} branch"
else
  echo "⚠️ git not available. Skipping commit to backup branch."
fi

echo "✅ Backup completed successfully at $(date)"
echo "📂 Backup saved to: ${BACKUP_FILE}"
echo "📝 Backup report: ${BACKUP_REPORT}"
echo "📋 Backup log: ${BACKUP_LOG}"