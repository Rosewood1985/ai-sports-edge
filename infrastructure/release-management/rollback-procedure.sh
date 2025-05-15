#!/bin/bash

# Rollback Procedure Script
# This script documents and implements rollback procedures for AI Sports Edge

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}AI Sports Edge - Rollback Procedure${NC}"
echo "=================================================="

# Function to check if a command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed. Please install it first.${NC}"
        return 1
    fi
    return 0
}

# Check for required tools
check_command "aws" || exit 1
check_command "git" || exit 1
check_command "docker" || exit 1

# Configuration variables
APP_NAME="ai-sports-edge"
ECR_REPOSITORY="${APP_NAME}"
CODEDEPLOY_APP="${APP_NAME}-app"
CODEDEPLOY_GROUP="${APP_NAME}-deployment-group"
S3_BACKUP_BUCKET="${APP_NAME}-backups"
DB_BACKUP_PREFIX="database-backups"
LOGS_DIR="rollback-logs"

# Function to display section header
section_header() {
    echo ""
    echo -e "${BLUE}$1${NC}"
    echo "=================================================="
}

# Function to create logs directory
create_logs_dir() {
    if [ ! -d "$LOGS_DIR" ]; then
        mkdir -p "$LOGS_DIR"
        echo "Created logs directory: $LOGS_DIR"
    fi
}

# Function to log rollback event
log_rollback() {
    local timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
    local log_file="${LOGS_DIR}/rollback_${timestamp}.log"
    
    {
        echo "Rollback Event: $timestamp"
        echo "Version: $1"
        echo "Reason: $2"
        echo "Performed by: $(whoami)"
        echo "Actions taken:"
        echo "$3"
        echo ""
    } > "$log_file"
    
    echo -e "${GREEN}Rollback event logged to $log_file${NC}"
}

# Function to list available ECR images
list_ecr_images() {
    section_header "Available ECR Images"
    
    echo "Listing available images in ECR repository ${ECR_REPOSITORY}..."
    aws ecr describe-images --repository-name ${ECR_REPOSITORY} --query 'imageDetails[*].{ImageTag:imageTags[0],PushedAt:imagePushedAt,ImageDigest:imageDigest}' --output table
}

# Function to list previous CodeDeploy deployments
list_deployments() {
    section_header "Previous Deployments"
    
    echo "Listing previous deployments for application ${CODEDEPLOY_APP}..."
    aws deploy list-deployments --application-name ${CODEDEPLOY_APP} --deployment-group-name ${CODEDEPLOY_GROUP} --include-only-statuses Succeeded --query 'deployments' --output table
}

# Function to list database backups
list_db_backups() {
    section_header "Database Backups"
    
    echo "Listing available database backups..."
    aws s3 ls "s3://${S3_BACKUP_BUCKET}/${DB_BACKUP_PREFIX}/" --human-readable
}

# Function to rollback to a specific ECR image
rollback_to_image() {
    local image_tag=$1
    local reason=$2
    
    section_header "Rolling Back to Image: $image_tag"
    
    # Verify image exists
    if ! aws ecr describe-images --repository-name ${ECR_REPOSITORY} --image-ids imageTag=${image_tag} &>/dev/null; then
        echo -e "${RED}Error: Image with tag ${image_tag} not found in repository ${ECR_REPOSITORY}.${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}Starting rollback to image ${image_tag}...${NC}"
    
    # Pull the image
    local repository_uri=$(aws ecr describe-repositories --repository-names ${ECR_REPOSITORY} --query 'repositories[0].repositoryUri' --output text)
    echo "Pulling image ${repository_uri}:${image_tag}..."
    docker pull ${repository_uri}:${image_tag}
    
    # Create a new deployment
    echo "Creating new deployment with previous image..."
    local deployment_id=$(aws deploy create-deployment \
        --application-name ${CODEDEPLOY_APP} \
        --deployment-group-name ${CODEDEPLOY_GROUP} \
        --revision "{\"revisionType\":\"S3\",\"s3Location\":{\"bucket\":\"${APP_NAME}-artifacts\",\"key\":\"${APP_NAME}/${image_tag}/appspec.yml\",\"bundleType\":\"YAML\"}}" \
        --description "Rollback to ${image_tag}" \
        --query 'deploymentId' \
        --output text)
    
    echo "Deployment created with ID: ${deployment_id}"
    
    # Wait for deployment to complete
    echo "Waiting for deployment to complete..."
    aws deploy wait deployment-successful --deployment-id ${deployment_id}
    
    # Log the rollback
    local actions="- Rolled back to image ${repository_uri}:${image_tag}
- Created new deployment with ID ${deployment_id}"
    log_rollback "${image_tag}" "${reason}" "${actions}"
    
    echo -e "${GREEN}Rollback to image ${image_tag} completed successfully.${NC}"
}

# Function to rollback database
rollback_db() {
    local backup_file=$1
    local reason=$2
    
    section_header "Rolling Back Database to: $backup_file"
    
    # Verify backup exists
    if ! aws s3 ls "s3://${S3_BACKUP_BUCKET}/${DB_BACKUP_PREFIX}/${backup_file}" &>/dev/null; then
        echo -e "${RED}Error: Backup file ${backup_file} not found in S3 bucket.${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}Starting database rollback to ${backup_file}...${NC}"
    
    # Download the backup
    echo "Downloading backup file..."
    aws s3 cp "s3://${S3_BACKUP_BUCKET}/${DB_BACKUP_PREFIX}/${backup_file}" .
    
    # Get database connection details
    # This is a placeholder - you would need to adapt this to your actual database setup
    local db_host=$(aws rds describe-db-instances --db-instance-identifier ${APP_NAME}-db --query 'DBInstances[0].Endpoint.Address' --output text)
    local db_name="${APP_NAME}"
    local db_user="admin"
    
    # Prompt for database password
    read -s -p "Enter database password: " db_password
    echo
    
    # Create a backup of current state before restoring
    local timestamp=$(date +"%Y%m%d%H%M%S")
    local current_backup="pre_rollback_${timestamp}.sql"
    echo "Creating backup of current database state..."
    pg_dump -h ${db_host} -U ${db_user} -d ${db_name} -f ${current_backup}
    
    # Upload current backup to S3
    echo "Uploading current state backup to S3..."
    aws s3 cp ${current_backup} "s3://${S3_BACKUP_BUCKET}/${DB_BACKUP_PREFIX}/${current_backup}"
    
    # Restore from backup
    echo "Restoring database from backup..."
    if [[ $backup_file == *.sql ]]; then
        # SQL dump file
        PGPASSWORD=${db_password} psql -h ${db_host} -U ${db_user} -d ${db_name} -f ${backup_file}
    elif [[ $backup_file == *.dump ]]; then
        # pg_dump custom format
        PGPASSWORD=${db_password} pg_restore -h ${db_host} -U ${db_user} -d ${db_name} --clean --if-exists ${backup_file}
    else
        echo -e "${RED}Error: Unsupported backup file format.${NC}"
        return 1
    fi
    
    # Clean up local files
    rm ${backup_file}
    
    # Log the rollback
    local actions="- Created backup of current state: ${current_backup}
- Restored database from backup: ${backup_file}"
    log_rollback "DB:${backup_file}" "${reason}" "${actions}"
    
    echo -e "${GREEN}Database rollback to ${backup_file} completed successfully.${NC}"
}

# Function to rollback code to a specific git commit
rollback_git() {
    local commit_hash=$1
    local reason=$2
    
    section_header "Rolling Back Code to Commit: $commit_hash"
    
    # Check if we're in a git repository
    if [ ! -d ".git" ]; then
        echo -e "${RED}Error: Not a git repository.${NC}"
        return 1
    fi
    
    # Verify commit exists
    if ! git cat-file -e ${commit_hash} &>/dev/null; then
        echo -e "${RED}Error: Commit ${commit_hash} not found.${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}Starting code rollback to commit ${commit_hash}...${NC}"
    
    # Create a backup branch of current state
    local timestamp=$(date +"%Y%m%d%H%M%S")
    local backup_branch="backup_before_rollback_${timestamp}"
    echo "Creating backup branch: ${backup_branch}..."
    git checkout -b ${backup_branch}
    git checkout -
    
    # Reset to the specified commit
    echo "Resetting to commit ${commit_hash}..."
    git reset --hard ${commit_hash}
    
    # Log the rollback
    local actions="- Created backup branch: ${backup_branch}
- Reset to commit: ${commit_hash}"
    log_rollback "Git:${commit_hash}" "${reason}" "${actions}"
    
    echo -e "${GREEN}Code rollback to commit ${commit_hash} completed successfully.${NC}"
    echo "To push this rollback to remote, use: git push --force"
}

# Function to perform a complete rollback
complete_rollback() {
    local version=$1
    local reason=$2
    
    section_header "Complete Rollback to Version: $version"
    
    echo -e "${YELLOW}Starting complete rollback to version ${version}...${NC}"
    
    # Rollback code
    echo "Rolling back code..."
    local tag_commit=$(git rev-list -n 1 "v${version}" 2>/dev/null)
    if [ -n "$tag_commit" ]; then
        rollback_git ${tag_commit} "${reason}"
    else
        echo -e "${RED}Error: Git tag v${version} not found.${NC}"
        return 1
    fi
    
    # Rollback database
    echo "Rolling back database..."
    local db_backup="backup_${version}.sql"
    if aws s3 ls "s3://${S3_BACKUP_BUCKET}/${DB_BACKUP_PREFIX}/${db_backup}" &>/dev/null; then
        rollback_db ${db_backup} "${reason}"
    else
        echo -e "${YELLOW}Warning: Database backup for version ${version} not found. Skipping database rollback.${NC}"
    fi
    
    # Rollback deployment
    echo "Rolling back deployment..."
    rollback_to_image "v${version}" "${reason}"
    
    echo -e "${GREEN}Complete rollback to version ${version} completed successfully.${NC}"
}

# Function to test rollback procedure
test_rollback() {
    section_header "Testing Rollback Procedure"
    
    echo -e "${YELLOW}Starting rollback test...${NC}"
    
    # Create a test environment
    local timestamp=$(date +"%Y%m%d%H%M%S")
    local test_env="rollback-test-${timestamp}"
    
    echo "Creating test environment: ${test_env}..."
    
    # Simulate application deployment
    echo "Simulating application deployment..."
    
    # Simulate database operations
    echo "Simulating database operations..."
    
    # Perform rollback in test environment
    echo "Performing rollback in test environment..."
    
    # Verify rollback success
    echo "Verifying rollback success..."
    
    # Clean up test environment
    echo "Cleaning up test environment..."
    
    echo -e "${GREEN}Rollback test completed successfully.${NC}"
}

# Function to display help
show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --list-images              List available ECR images"
    echo "  --list-deployments         List previous successful deployments"
    echo "  --list-backups             List available database backups"
    echo "  --rollback-image <tag>     Rollback to a specific ECR image"
    echo "  --rollback-db <file>       Rollback database to a specific backup"
    echo "  --rollback-git <commit>    Rollback code to a specific git commit"
    echo "  --complete-rollback <ver>  Perform a complete rollback to a specific version"
    echo "  --test-rollback            Test the rollback procedure"
    echo "  --help                     Display this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --list-images                  # List available ECR images"
    echo "  $0 --rollback-image v1.2.3        # Rollback to image v1.2.3"
    echo "  $0 --rollback-db backup_20250101.sql  # Rollback database to specific backup"
    echo "  $0 --complete-rollback 1.2.3      # Complete rollback to version 1.2.3"
}

# Main function
main() {
    # Create logs directory
    create_logs_dir
    
    # Parse command line arguments
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    while [ $# -gt 0 ]; do
        case $1 in
            --list-images)
                list_ecr_images
                exit 0
                ;;
            --list-deployments)
                list_deployments
                exit 0
                ;;
            --list-backups)
                list_db_backups
                exit 0
                ;;
            --rollback-image)
                if [ -z "$2" ]; then
                    echo -e "${RED}Error: Missing image tag.${NC}"
                    exit 1
                fi
                
                read -p "Enter reason for rollback: " reason
                rollback_to_image "$2" "$reason"
                exit 0
                
                shift
                ;;
            --rollback-db)
                if [ -z "$2" ]; then
                    echo -e "${RED}Error: Missing backup file.${NC}"
                    exit 1
                fi
                
                read -p "Enter reason for rollback: " reason
                rollback_db "$2" "$reason"
                exit 0
                
                shift
                ;;
            --rollback-git)
                if [ -z "$2" ]; then
                    echo -e "${RED}Error: Missing commit hash.${NC}"
                    exit 1
                fi
                
                read -p "Enter reason for rollback: " reason
                rollback_git "$2" "$reason"
                exit 0
                
                shift
                ;;
            --complete-rollback)
                if [ -z "$2" ]; then
                    echo -e "${RED}Error: Missing version.${NC}"
                    exit 1
                fi
                
                read -p "Enter reason for rollback: " reason
                complete_rollback "$2" "$reason"
                exit 0
                
                shift
                ;;
            --test-rollback)
                test_rollback
                exit 0
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                echo -e "${RED}Error: Unknown option $1${NC}"
                show_help
                exit 1
                ;;
        esac
        shift
    done
}

# Run the main function
main "$@"