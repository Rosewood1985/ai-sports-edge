#!/bin/bash

# Setup Backup System Script
# This script sets up automated backup procedures for AI Sports Edge

set -e

# Configuration
CONFIG_FILE="backup-config.json"
BACKUP_VAULT_NAME="ai-sports-edge-backup-vault"
IAM_ROLE_NAME="ai-sports-edge-backup-role"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}AI Sports Edge - Backup System Setup${NC}"
echo "=================================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}Error: Configuration file $CONFIG_FILE not found.${NC}"
    exit 1
fi

# Create AWS Backup vault if it doesn't exist
echo -e "${YELLOW}Creating AWS Backup vault...${NC}"
if ! aws backup describe-backup-vault --backup-vault-name "$BACKUP_VAULT_NAME" &>/dev/null; then
    aws backup create-backup-vault --backup-vault-name "$BACKUP_VAULT_NAME"
    echo -e "${GREEN}Backup vault created successfully.${NC}"
else
    echo -e "${GREEN}Backup vault already exists.${NC}"
fi

# Create IAM role for AWS Backup if it doesn't exist
echo -e "${YELLOW}Creating IAM role for AWS Backup...${NC}"
if ! aws iam get-role --role-name "$IAM_ROLE_NAME" &>/dev/null; then
    # Create trust policy
    cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "backup.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

    # Create the role
    aws iam create-role --role-name "$IAM_ROLE_NAME" --assume-role-policy-document file://trust-policy.json
    
    # Attach necessary policies
    aws iam attach-role-policy --role-name "$IAM_ROLE_NAME" --policy-arn arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup
    aws iam attach-role-policy --role-name "$IAM_ROLE_NAME" --policy-arn arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores
    
    # Clean up
    rm trust-policy.json
    
    echo -e "${GREEN}IAM role created successfully.${NC}"
else
    echo -e "${GREEN}IAM role already exists.${NC}"
fi

# Setup database backups
if [ "$(jq -r '.database.enabled' "$CONFIG_FILE")" == "true" ]; then
    echo -e "${YELLOW}Setting up database backups...${NC}"
    
    # Get database instance ID
    DB_INSTANCE_ID=$(jq -r '.database.instanceId' "$CONFIG_FILE")
    
    # Configure RDS backup retention period
    RETENTION_PERIOD=$(jq -r '.database.backupRetentionPeriod' "$CONFIG_FILE")
    aws rds modify-db-instance \
        --db-instance-identifier "$DB_INSTANCE_ID" \
        --backup-retention-period "$RETENTION_PERIOD" \
        --apply-immediately
    
    # Create daily backup plan
    if [ "$(jq -r '.database.snapshotSchedule.daily.enabled' "$CONFIG_FILE")" == "true" ]; then
        DAILY_TIME=$(jq -r '.database.snapshotSchedule.daily.time' "$CONFIG_FILE")
        DAILY_RETENTION=$(jq -r '.database.snapshotSchedule.daily.retentionDays' "$CONFIG_FILE")
        
        echo -e "${YELLOW}Creating daily database backup plan...${NC}"
        
        # Create backup plan
        PLAN_ID=$(aws backup create-backup-plan --backup-plan-name "ai-sports-edge-daily-db-backup" \
            --rules "[{\"RuleName\":\"DailyBackupRule\",\"TargetBackupVaultName\":\"$BACKUP_VAULT_NAME\",\"ScheduleExpression\":\"cron(0 ${DAILY_TIME%%:*} * * ? *)\",\"StartWindowMinutes\":60,\"CompletionWindowMinutes\":120,\"Lifecycle\":{\"DeleteAfterDays\":$DAILY_RETENTION}}]" \
            --query 'BackupPlanId' --output text)
        
        # Create backup selection
        aws backup create-backup-selection \
            --backup-plan-id "$PLAN_ID" \
            --backup-selection "{\"SelectionName\":\"DatabaseSelection\",\"IamRoleArn\":\"arn:aws:iam::$(aws sts get-caller-identity --query 'Account' --output text):role/$IAM_ROLE_NAME\",\"Resources\":[\"arn:aws:rds:$(aws configure get region):$(aws sts get-caller-identity --query 'Account' --output text):db:$DB_INSTANCE_ID\"]}"
        
        echo -e "${GREEN}Daily database backup plan created successfully.${NC}"
    fi
    
    echo -e "${GREEN}Database backup configuration completed.${NC}"
fi

# Setup S3 bucket backups
if [ "$(jq -r '.fileSystem.enabled' "$CONFIG_FILE")" == "true" ]; then
    echo -e "${YELLOW}Setting up S3 bucket backups...${NC}"
    
    # Process each S3 bucket
    jq -c '.fileSystem.s3Buckets[]' "$CONFIG_FILE" | while read -r bucket_config; do
        BUCKET_NAME=$(echo "$bucket_config" | jq -r '.name')
        
        echo -e "${YELLOW}Configuring bucket: $BUCKET_NAME${NC}"
        
        # Check if bucket exists
        if ! aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
            echo -e "${RED}Bucket $BUCKET_NAME does not exist. Skipping configuration.${NC}"
            continue
        fi
        
        # Enable versioning if configured
        if [ "$(echo "$bucket_config" | jq -r '.versioning')" == "true" ]; then
            aws s3api put-bucket-versioning --bucket "$BUCKET_NAME" --versioning-configuration Status=Enabled
            echo -e "${GREEN}Versioning enabled for bucket $BUCKET_NAME.${NC}"
        fi
        
        # Configure lifecycle rules
        if [ "$(echo "$bucket_config" | jq -r '.lifecycle.transitionToIA')" != "null" ]; then
            IA_DAYS=$(echo "$bucket_config" | jq -r '.lifecycle.transitionToIA')
            GLACIER_DAYS=$(echo "$bucket_config" | jq -r '.lifecycle.transitionToGlacier')
            EXPIRATION_DAYS=$(echo "$bucket_config" | jq -r '.lifecycle.expiration')
            
            # Create lifecycle configuration
            aws s3api put-bucket-lifecycle-configuration \
                --bucket "$BUCKET_NAME" \
                --lifecycle-configuration "{\"Rules\":[{\"ID\":\"TransitionRule\",\"Status\":\"Enabled\",\"Filter\":{},\"Transitions\":[{\"Days\":$IA_DAYS,\"StorageClass\":\"STANDARD_IA\"},{\"Days\":$GLACIER_DAYS,\"StorageClass\":\"GLACIER\"}],\"Expiration\":{\"Days\":$EXPIRATION_DAYS}}]}"
            
            echo -e "${GREEN}Lifecycle rules configured for bucket $BUCKET_NAME.${NC}"
        fi
    done
    
    echo -e "${GREEN}S3 bucket backup configuration completed.${NC}"
fi

# Setup DynamoDB backups
if [ "$(jq -r '.applicationState.enabled' "$CONFIG_FILE")" == "true" ]; then
    echo -e "${YELLOW}Setting up DynamoDB backups...${NC}"
    
    # Process each DynamoDB table
    jq -c '.applicationState.dynamoDBTables[]' "$CONFIG_FILE" | while read -r table_config; do
        TABLE_NAME=$(echo "$table_config" | jq -r '.name')
        
        echo -e "${YELLOW}Configuring DynamoDB table: $TABLE_NAME${NC}"
        
        # Check if table exists
        if ! aws dynamodb describe-table --table-name "$TABLE_NAME" &>/dev/null; then
            echo -e "${RED}DynamoDB table $TABLE_NAME does not exist. Skipping configuration.${NC}"
            continue
        fi
        
        # Enable point-in-time recovery if configured
        if [ "$(echo "$table_config" | jq -r '.pointInTimeRecovery')" == "true" ]; then
            aws dynamodb update-continuous-backups \
                --table-name "$TABLE_NAME" \
                --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
            
            echo -e "${GREEN}Point-in-time recovery enabled for table $TABLE_NAME.${NC}"
        fi
        
        # Create daily backup plan
        if [ "$(echo "$table_config" | jq -r '.backupSchedule.daily.enabled')" == "true" ]; then
            DAILY_TIME=$(echo "$table_config" | jq -r '.backupSchedule.daily.time')
            DAILY_RETENTION=$(echo "$table_config" | jq -r '.backupSchedule.daily.retentionDays')
            
            echo -e "${YELLOW}Creating daily DynamoDB backup plan for table $TABLE_NAME...${NC}"
            
            # Create backup plan
            PLAN_ID=$(aws backup create-backup-plan --backup-plan-name "ai-sports-edge-daily-dynamodb-backup-$TABLE_NAME" \
                --rules "[{\"RuleName\":\"DailyDynamoDBBackupRule\",\"TargetBackupVaultName\":\"$BACKUP_VAULT_NAME\",\"ScheduleExpression\":\"cron(0 ${DAILY_TIME%%:*} * * ? *)\",\"StartWindowMinutes\":60,\"CompletionWindowMinutes\":120,\"Lifecycle\":{\"DeleteAfterDays\":$DAILY_RETENTION}}]" \
                --query 'BackupPlanId' --output text)
            
            # Create backup selection
            aws backup create-backup-selection \
                --backup-plan-id "$PLAN_ID" \
                --backup-selection "{\"SelectionName\":\"DynamoDBSelection\",\"IamRoleArn\":\"arn:aws:iam::$(aws sts get-caller-identity --query 'Account' --output text):role/$IAM_ROLE_NAME\",\"Resources\":[\"arn:aws:dynamodb:$(aws configure get region):$(aws sts get-caller-identity --query 'Account' --output text):table/$TABLE_NAME\"]}"
            
            echo -e "${GREEN}Daily DynamoDB backup plan created successfully for table $TABLE_NAME.${NC}"
        fi
    done
    
    echo -e "${GREEN}DynamoDB backup configuration completed.${NC}"
fi

# Create backup verification script
echo -e "${YELLOW}Creating backup verification script...${NC}"
cat > verify-backups.sh << 'EOF'
#!/bin/bash

# Backup Verification Script
# This script verifies the integrity of backups

set -e

# Configuration
BACKUP_VAULT_NAME="ai-sports-edge-backup-vault"
VERIFICATION_DATE=$(date +"%Y-%m-%d")
VERIFICATION_LOG="backup-verification-${VERIFICATION_DATE}.log"

echo "AI Sports Edge - Backup Verification" | tee "$VERIFICATION_LOG"
echo "==================================================" | tee -a "$VERIFICATION_LOG"
echo "Date: $(date)" | tee -a "$VERIFICATION_LOG"

# List all recovery points in the backup vault
echo "Listing all backups in vault $BACKUP_VAULT_NAME..." | tee -a "$VERIFICATION_LOG"
aws backup list-recovery-points-by-backup-vault \
    --backup-vault-name "$BACKUP_VAULT_NAME" \
    --max-results 10 \
    --query 'RecoveryPoints[*].{RecoveryPointArn:RecoveryPointArn,ResourceType:ResourceType,Status:Status,CreationDate:CreationDate}' \
    --output table | tee -a "$VERIFICATION_LOG"

echo "Backup verification completed." | tee -a "$VERIFICATION_LOG"
EOF

chmod +x verify-backups.sh
echo -e "${GREEN}Backup verification script created successfully.${NC}"

# Create CloudWatch alarms for backup monitoring
if [ "$(jq -r '.monitoring.enabled' "$CONFIG_FILE")" == "true" ]; then
    echo -e "${YELLOW}Setting up backup monitoring...${NC}"
    
    # Get SNS topic ARN
    SNS_TOPIC_ARN=$(jq -r '.monitoring.snsTopicArn' "$CONFIG_FILE")
    
    # Create alarm for failed backups
    aws cloudwatch put-metric-alarm \
        --alarm-name "AWSBackupJobFailure" \
        --alarm-description "Alarm when a backup job fails" \
        --metric-name "BackupJobsFailed" \
        --namespace "AWS/Backup" \
        --statistic "Sum" \
        --period 86400 \
        --threshold 1 \
        --comparison-operator "GreaterThanOrEqualToThreshold" \
        --evaluation-periods 1 \
        --alarm-actions "$SNS_TOPIC_ARN"
    
    echo -e "${GREEN}Backup monitoring configured successfully.${NC}"
fi

echo -e "${GREEN}Backup system setup completed successfully!${NC}"
echo "=================================================="
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Verify that the backup configurations are correct:"
echo "   aws backup list-backup-plans"
echo ""
echo "2. Run a manual backup to test the configuration:"
echo "   aws backup start-backup-job --backup-vault-name $BACKUP_VAULT_NAME --resource-arn <resource-arn> --iam-role-arn arn:aws:iam::$(aws sts get-caller-identity --query 'Account' --output text):role/$IAM_ROLE_NAME"
echo ""
echo "3. Set up a cron job to run the verification script regularly:"
echo "   0 8 * * 1 /path/to/verify-backups.sh"
echo "=================================================="
