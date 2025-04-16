#!/bin/bash

# Deploy Database Scaling Configuration
# This script deploys the RDS database configuration for AI Sports Edge

set -e

# Configuration
CONFIG_FILE="rds-config.json"
PARAM_GROUP_NAME="ai-sports-edge-params"
SUBNET_GROUP_NAME="ai-sports-edge-subnet-group"
VPC_ID=""  # Will be populated from environment or user input
SUBNETS="" # Will be populated from environment or user input
SECURITY_GROUP_NAME="ai-sports-edge-db-sg"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}AI Sports Edge - Database Scaling Deployment${NC}"
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

# Get DB password from environment or prompt
if [ -z "$DB_PASSWORD" ]; then
    echo -e "${YELLOW}Enter database master password:${NC}"
    read -s DB_PASSWORD
    echo ""
    
    if [ -z "$DB_PASSWORD" ]; then
        echo -e "${RED}Error: Database password cannot be empty.${NC}"
        exit 1
    fi
    
    # Validate password complexity
    if [[ ${#DB_PASSWORD} -lt 8 ]]; then
        echo -e "${RED}Error: Password must be at least 8 characters long.${NC}"
        exit 1
    fi
    
    if ! [[ "$DB_PASSWORD" =~ [A-Z] && "$DB_PASSWORD" =~ [a-z] && "$DB_PASSWORD" =~ [0-9] && "$DB_PASSWORD" =~ [^a-zA-Z0-9] ]]; then
        echo -e "${RED}Error: Password must contain uppercase, lowercase, numbers, and special characters.${NC}"
        exit 1
    fi
fi

# Get VPC ID if not provided
if [ -z "$VPC_ID" ]; then
    echo -e "${YELLOW}Getting default VPC...${NC}"
    VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text)
    
    if [ -z "$VPC_ID" ] || [ "$VPC_ID" == "None" ]; then
        echo -e "${YELLOW}No default VPC found. Please enter VPC ID:${NC}"
        read VPC_ID
    else
        echo -e "${GREEN}Using default VPC: $VPC_ID${NC}"
    fi
fi

# Get subnets if not provided
if [ -z "$SUBNETS" ]; then
    echo -e "${YELLOW}Getting subnets for VPC $VPC_ID...${NC}"
    SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[*].SubnetId" --output text)
    
    if [ -z "$SUBNETS" ]; then
        echo -e "${RED}Error: No subnets found for VPC $VPC_ID.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Found subnets: $SUBNETS${NC}"
fi

# Create DB subnet group if it doesn't exist
echo -e "${YELLOW}Checking if DB subnet group exists...${NC}"
if ! aws rds describe-db-subnet-groups --db-subnet-group-name "$SUBNET_GROUP_NAME" &>/dev/null; then
    echo -e "${YELLOW}Creating DB subnet group: $SUBNET_GROUP_NAME${NC}"
    
    # Convert space-separated subnet IDs to JSON array
    SUBNET_IDS_JSON=$(echo $SUBNETS | tr ' ' '\n' | jq -R . | jq -s .)
    
    aws rds create-db-subnet-group \
        --db-subnet-group-name "$SUBNET_GROUP_NAME" \
        --db-subnet-group-description "Subnet group for AI Sports Edge database" \
        --subnet-ids $SUBNET_IDS_JSON
    
    echo -e "${GREEN}DB subnet group created successfully.${NC}"
else
    echo -e "${GREEN}DB subnet group already exists.${NC}"
fi

# Create security group if it doesn't exist
echo -e "${YELLOW}Checking if security group exists...${NC}"
SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$SECURITY_GROUP_NAME" "Name=vpc-id,Values=$VPC_ID" --query "SecurityGroups[0].GroupId" --output text)

if [ -z "$SG_ID" ] || [ "$SG_ID" == "None" ]; then
    echo -e "${YELLOW}Creating security group: $SECURITY_GROUP_NAME${NC}"
    SG_ID=$(aws ec2 create-security-group \
        --group-name "$SECURITY_GROUP_NAME" \
        --description "Security group for AI Sports Edge database" \
        --vpc-id "$VPC_ID" \
        --query "GroupId" --output text)
    
    # Add PostgreSQL ingress rule
    aws ec2 authorize-security-group-ingress \
        --group-id "$SG_ID" \
        --protocol tcp \
        --port 5432 \
        --cidr "10.0.0.0/8"  # Adjust this to your VPC CIDR
    
    echo -e "${GREEN}Security group created successfully: $SG_ID${NC}"
else
    echo -e "${GREEN}Security group already exists: $SG_ID${NC}"
fi

# Update config file with security group ID
sed -i.bak "s/sg-XXXXXXXXXXXXXXXXX/$SG_ID/g" "$CONFIG_FILE"
rm "${CONFIG_FILE}.bak"

# Create DB parameter group if it doesn't exist
echo -e "${YELLOW}Checking if DB parameter group exists...${NC}"
if ! aws rds describe-db-parameter-groups --db-parameter-group-name "$PARAM_GROUP_NAME" &>/dev/null; then
    echo -e "${YELLOW}Creating DB parameter group: $PARAM_GROUP_NAME${NC}"
    
    # Extract parameter group configuration
    PARAM_GROUP_CONFIG=$(jq -c '.DBParameterGroup' "$CONFIG_FILE")
    
    # Create parameter group
    aws rds create-db-parameter-group \
        --db-parameter-group-name "$PARAM_GROUP_NAME" \
        --db-parameter-group-family "postgres13" \
        --description "Custom parameter group for AI Sports Edge production database"
    
    # Extract and apply parameters
    PARAMS=$(jq -r '.Parameters | to_entries[] | "\(.key)=\(.value)"' <<< "$PARAM_GROUP_CONFIG")
    
    for PARAM in $PARAMS; do
        KEY=$(echo $PARAM | cut -d= -f1)
        VALUE=$(echo $PARAM | cut -d= -f2-)
        
        echo -e "${YELLOW}Setting parameter: $KEY = $VALUE${NC}"
        aws rds modify-db-parameter-group \
            --db-parameter-group-name "$PARAM_GROUP_NAME" \
            --parameters "ParameterName=$KEY,ParameterValue=$VALUE,ApplyMethod=pending-reboot"
    done
    
    echo -e "${GREEN}DB parameter group created and configured successfully.${NC}"
else
    echo -e "${GREEN}DB parameter group already exists.${NC}"
fi

# Check if DB instance already exists
echo -e "${YELLOW}Checking if DB instance exists...${NC}"
DB_INSTANCE_ID=$(jq -r '.DBInstance.DBInstanceIdentifier' "$CONFIG_FILE")

if aws rds describe-db-instances --db-instance-identifier "$DB_INSTANCE_ID" &>/dev/null; then
    echo -e "${YELLOW}DB instance $DB_INSTANCE_ID already exists. Updating configuration...${NC}"
    
    # Update the DB instance
    aws rds modify-db-instance \
        --db-instance-identifier "$DB_INSTANCE_ID" \
        --db-parameter-group-name "$PARAM_GROUP_NAME" \
        --backup-retention-period $(jq -r '.DBInstance.BackupRetentionPeriod' "$CONFIG_FILE") \
        --preferred-backup-window $(jq -r '.DBInstance.PreferredBackupWindow' "$CONFIG_FILE") \
        --preferred-maintenance-window $(jq -r '.DBInstance.PreferredMaintenanceWindow' "$CONFIG_FILE") \
        --vpc-security-group-ids "$SG_ID" \
        --apply-immediately
    
    echo -e "${GREEN}DB instance updated successfully.${NC}"
else
    echo -e "${YELLOW}Creating new DB instance: $DB_INSTANCE_ID${NC}"
    
    # Replace password placeholder in config
    CONFIG_WITH_PASSWORD=$(jq --arg pwd "$DB_PASSWORD" '.DBInstance.MasterUserPassword = $pwd' "$CONFIG_FILE" | jq '.DBInstance')
    
    # Create the DB instance
    aws rds create-db-instance \
        --db-instance-identifier "$DB_INSTANCE_ID" \
        --db-instance-class $(jq -r '.DBInstanceClass' <<< "$CONFIG_WITH_PASSWORD") \
        --engine $(jq -r '.Engine' <<< "$CONFIG_WITH_PASSWORD") \
        --engine-version $(jq -r '.EngineVersion' <<< "$CONFIG_WITH_PASSWORD") \
        --master-username $(jq -r '.MasterUsername' <<< "$CONFIG_WITH_PASSWORD") \
        --master-user-password "$DB_PASSWORD" \
        --allocated-storage $(jq -r '.AllocatedStorage' <<< "$CONFIG_WITH_PASSWORD") \
        --max-allocated-storage $(jq -r '.MaxAllocatedStorage' <<< "$CONFIG_WITH_PASSWORD") \
        --storage-type $(jq -r '.StorageType' <<< "$CONFIG_WITH_PASSWORD") \
        --iops $(jq -r '.Iops' <<< "$CONFIG_WITH_PASSWORD") \
        --storage-throughput $(jq -r '.StorageThroughput' <<< "$CONFIG_WITH_PASSWORD") \
        --multi-az $(jq -r '.MultiAZ' <<< "$CONFIG_WITH_PASSWORD") \
        --publicly-accessible $(jq -r '.PubliclyAccessible' <<< "$CONFIG_WITH_PASSWORD") \
        --auto-minor-version-upgrade $(jq -r '.AutoMinorVersionUpgrade' <<< "$CONFIG_WITH_PASSWORD") \
        --backup-retention-period $(jq -r '.BackupRetentionPeriod' <<< "$CONFIG_WITH_PASSWORD") \
        --preferred-backup-window $(jq -r '.PreferredBackupWindow' <<< "$CONFIG_WITH_PASSWORD") \
        --preferred-maintenance-window $(jq -r '.PreferredMaintenanceWindow' <<< "$CONFIG_WITH_PASSWORD") \
        --port $(jq -r '.Port' <<< "$CONFIG_WITH_PASSWORD") \
        --db-parameter-group-name "$PARAM_GROUP_NAME" \
        --option-group-name $(jq -r '.OptionGroupName' <<< "$CONFIG_WITH_PASSWORD") \
        --vpc-security-group-ids "$SG_ID" \
        --db-subnet-group-name "$SUBNET_GROUP_NAME" \
        --enable-iam-database-authentication $(jq -r '.EnableIAMDatabaseAuthentication' <<< "$CONFIG_WITH_PASSWORD") \
        --enable-performance-insights $(jq -r '.EnablePerformanceInsights' <<< "$CONFIG_WITH_PASSWORD") \
        --performance-insights-retention-period $(jq -r '.PerformanceInsightsRetentionPeriod' <<< "$CONFIG_WITH_PASSWORD") \
        --deletion-protection $(jq -r '.DeletionProtection' <<< "$CONFIG_WITH_PASSWORD") \
        --copy-tags-to-snapshot $(jq -r '.CopyTagsToSnapshot' <<< "$CONFIG_WITH_PASSWORD") \
        --monitoring-interval $(jq -r '.MonitoringInterval' <<< "$CONFIG_WITH_PASSWORD") \
        --monitoring-role-arn $(jq -r '.MonitoringRoleArn' <<< "$CONFIG_WITH_PASSWORD") \
        --enable-cloudwatch-logs-exports $(jq -r '.EnableCloudwatchLogsExports | join(" ")' <<< "$CONFIG_WITH_PASSWORD") \
        --tags $(jq -c '.Tags' <<< "$CONFIG_WITH_PASSWORD")
    
    echo -e "${GREEN}DB instance creation initiated. This may take 10-20 minutes to complete.${NC}"
    echo -e "${YELLOW}Waiting for DB instance to become available...${NC}"
    
    aws rds wait db-instance-available --db-instance-identifier "$DB_INSTANCE_ID"
    
    echo -e "${GREEN}DB instance created successfully.${NC}"
fi

# Check if read replica exists
echo -e "${YELLOW}Checking if read replica exists...${NC}"
READ_REPLICA_ID=$(jq -r '.ReadReplica.DBInstanceIdentifier' "$CONFIG_FILE")

if aws rds describe-db-instances --db-instance-identifier "$READ_REPLICA_ID" &>/dev/null; then
    echo -e "${YELLOW}Read replica $READ_REPLICA_ID already exists.${NC}"
else
    echo -e "${YELLOW}Creating read replica: $READ_REPLICA_ID${NC}"
    
    # Extract read replica configuration
    READ_REPLICA_CONFIG=$(jq -c '.ReadReplica' "$CONFIG_FILE")
    
    # Create the read replica
    aws rds create-db-instance-read-replica \
        --db-instance-identifier "$READ_REPLICA_ID" \
        --source-db-instance-identifier "$DB_INSTANCE_ID" \
        --db-instance-class $(jq -r '.DBInstanceClass' <<< "$READ_REPLICA_CONFIG") \
        --multi-az $(jq -r '.MultiAZ' <<< "$READ_REPLICA_CONFIG") \
        --publicly-accessible $(jq -r '.PubliclyAccessible' <<< "$READ_REPLICA_CONFIG") \
        --auto-minor-version-upgrade $(jq -r '.AutoMinorVersionUpgrade' <<< "$READ_REPLICA_CONFIG") \
        --port $(jq -r '.Port' <<< "$READ_REPLICA_CONFIG") \
        --enable-performance-insights $(jq -r '.EnablePerformanceInsights' <<< "$READ_REPLICA_CONFIG") \
        --performance-insights-retention-period $(jq -r '.PerformanceInsightsRetentionPeriod' <<< "$READ_REPLICA_CONFIG") \
        --monitoring-interval $(jq -r '.MonitoringInterval' <<< "$READ_REPLICA_CONFIG") \
        --monitoring-role-arn $(jq -r '.MonitoringRoleArn' <<< "$READ_REPLICA_CONFIG") \
        --enable-cloudwatch-logs-exports $(jq -r '.EnableCloudwatchLogsExports | join(" ")' <<< "$READ_REPLICA_CONFIG") \
        --tags $(jq -c '.Tags' <<< "$READ_REPLICA_CONFIG")
    
    echo -e "${GREEN}Read replica creation initiated. This may take 10-20 minutes to complete.${NC}"
    echo -e "${YELLOW}Waiting for read replica to become available...${NC}"
    
    aws rds wait db-instance-available --db-instance-identifier "$READ_REPLICA_ID"
    
    echo -e "${GREEN}Read replica created successfully.${NC}"
fi

# Set up CloudWatch alarms for monitoring
echo -e "${YELLOW}Setting up CloudWatch alarms for database monitoring...${NC}"

# Extract monitoring thresholds
CPU_THRESHOLD=$(jq -r '.Monitoring.CPUUtilizationThreshold' "$CONFIG_FILE")
MEMORY_THRESHOLD=$(jq -r '.Monitoring.FreeableMemoryThreshold' "$CONFIG_FILE")
STORAGE_THRESHOLD=$(jq -r '.Monitoring.FreeStorageSpaceThreshold' "$CONFIG_FILE")
CONNECTIONS_THRESHOLD=$(jq -r '.Monitoring.DatabaseConnectionsThreshold' "$CONFIG_FILE")
READ_IOPS_THRESHOLD=$(jq -r '.Monitoring.ReadIOPSThreshold' "$CONFIG_FILE")
WRITE_IOPS_THRESHOLD=$(jq -r '.Monitoring.WriteIOPSThreshold' "$CONFIG_FILE")
READ_LATENCY_THRESHOLD=$(jq -r '.Monitoring.ReadLatencyThreshold' "$CONFIG_FILE")
WRITE_LATENCY_THRESHOLD=$(jq -r '.Monitoring.WriteLatencyThreshold' "$CONFIG_FILE")
QUEUE_DEPTH_THRESHOLD=$(jq -r '.Monitoring.DiskQueueDepthThreshold' "$CONFIG_FILE")
REPLICA_LAG_THRESHOLD=$(jq -r '.Monitoring.ReplicaLagThreshold' "$CONFIG_FILE")

# Create CPU utilization alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "${DB_INSTANCE_ID}-high-cpu" \
    --alarm-description "Alarm when CPU exceeds ${CPU_THRESHOLD}%" \
    --metric-name "CPUUtilization" \
    --namespace "AWS/RDS" \
    --statistic "Average" \
    --period 300 \
    --threshold $CPU_THRESHOLD \
    --comparison-operator "GreaterThanThreshold" \
    --dimensions "Name=DBInstanceIdentifier,Value=${DB_INSTANCE_ID}" \
    --evaluation-periods 2 \
    --alarm-actions "arn:aws:sns:us-east-1:XXXXXXXXXXXX:ai-sports-edge-alerts" \
    --ok-actions "arn:aws:sns:us-east-1:XXXXXXXXXXXX:ai-sports-edge-alerts"

# Create freeable memory alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "${DB_INSTANCE_ID}-low-memory" \
    --alarm-description "Alarm when freeable memory is below ${MEMORY_THRESHOLD} bytes" \
    --metric-name "FreeableMemory" \
    --namespace "AWS/RDS" \
    --statistic "Average" \
    --period 300 \
    --threshold $MEMORY_THRESHOLD \
    --comparison-operator "LessThanThreshold" \
    --dimensions "Name=DBInstanceIdentifier,Value=${DB_INSTANCE_ID}" \
    --evaluation-periods 2 \
    --alarm-actions "arn:aws:sns:us-east-1:XXXXXXXXXXXX:ai-sports-edge-alerts" \
    --ok-actions "arn:aws:sns:us-east-1:XXXXXXXXXXXX:ai-sports-edge-alerts"

# Create free storage space alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "${DB_INSTANCE_ID}-low-storage" \
    --alarm-description "Alarm when free storage space is below ${STORAGE_THRESHOLD} bytes" \
    --metric-name "FreeStorageSpace" \
    --namespace "AWS/RDS" \
    --statistic "Average" \
    --period 300 \
    --threshold $STORAGE_THRESHOLD \
    --comparison-operator "LessThanThreshold" \
    --dimensions "Name=DBInstanceIdentifier,Value=${DB_INSTANCE_ID}" \
    --evaluation-periods 2 \
    --alarm-actions "arn:aws:sns:us-east-1:XXXXXXXXXXXX:ai-sports-edge-alerts" \
    --ok-actions "arn:aws:sns:us-east-1:XXXXXXXXXXXX:ai-sports-edge-alerts"

# Create database connections alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "${DB_INSTANCE_ID}-high-connections" \
    --alarm-description "Alarm when database connections exceed ${CONNECTIONS_THRESHOLD}" \
    --metric-name "DatabaseConnections" \
    --namespace "AWS/RDS" \
    --statistic "Average" \
    --period 300 \
    --threshold $CONNECTIONS_THRESHOLD \
    --comparison-operator "GreaterThanThreshold" \
    --dimensions "Name=DBInstanceIdentifier,Value=${DB_INSTANCE_ID}" \
    --evaluation-periods 2 \
    --alarm-actions "arn:aws:sns:us-east-1:XXXXXXXXXXXX:ai-sports-edge-alerts" \
    --ok-actions "arn:aws:sns:us-east-1:XXXXXXXXXXXX:ai-sports-edge-alerts"

# Create replica lag alarm (only for read replica)
aws cloudwatch put-metric-alarm \
    --alarm-name "${READ_REPLICA_ID}-high-replica-lag" \
    --alarm-description "Alarm when replica lag exceeds ${REPLICA_LAG_THRESHOLD} seconds" \
    --metric-name "ReplicaLag" \
    --namespace "AWS/RDS" \
    --statistic "Average" \
    --period 300 \
    --threshold $REPLICA_LAG_THRESHOLD \
    --comparison-operator "GreaterThanThreshold" \
    --dimensions "Name=DBInstanceIdentifier,Value=${READ_REPLICA_ID}" \
    --evaluation-periods 2 \
    --alarm-actions "arn:aws:sns:us-east-1:XXXXXXXXXXXX:ai-sports-edge-alerts" \
    --ok-actions "arn:aws:sns:us-east-1:XXXXXXXXXXXX:ai-sports-edge-alerts"

echo -e "${GREEN}CloudWatch alarms created successfully.${NC}"

echo -e "${GREEN}Database scaling deployment completed successfully!${NC}"
echo "=================================================="
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update your application's database connection string to use the new database:"
echo "   Primary DB Endpoint: $(aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE_ID --query 'DBInstances[0].Endpoint.Address' --output text)"
echo "   Read Replica Endpoint: $(aws rds describe-db-instances --db-instance-identifier $READ_REPLICA_ID --query 'DBInstances[0].Endpoint.Address' --output text)"
echo ""
echo "2. Configure your application to use connection pooling with these settings:"
echo "   Min Connections: $(jq -r '.ConnectionPooling.MinConnections' "$CONFIG_FILE")"
echo "   Max Connections: $(jq -r '.ConnectionPooling.MaxConnections' "$CONFIG_FILE")"
echo "   Idle Timeout: $(jq -r '.ConnectionPooling.IdleTimeout' "$CONFIG_FILE") seconds"
echo "   Connection Timeout: $(jq -r '.ConnectionPooling.ConnectionTimeout' "$CONFIG_FILE") seconds"
echo "   Max Lifetime: $(jq -r '.ConnectionPooling.MaxLifetime' "$CONFIG_FILE") seconds"
echo ""
echo "3. Implement read/write splitting in your application to direct read queries to the replica"
echo "=================================================="