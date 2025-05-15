#!/bin/bash

# Deploy CloudFront CDN Configuration
# This script deploys the CloudFront CDN configuration for AI Sports Edge

set -e

# Configuration
CONFIG_FILE="cloudfront-config.json"
S3_BUCKET="ai-sports-edge-static"
DISTRIBUTION_ID=""  # Will be populated after initial creation or from existing distribution

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}AI Sports Edge - CloudFront CDN Deployment${NC}"
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

# Create S3 bucket if it doesn't exist
echo -e "${YELLOW}Checking if S3 bucket exists...${NC}"
if ! aws s3api head-bucket --bucket "$S3_BUCKET" 2>/dev/null; then
    echo -e "${YELLOW}Creating S3 bucket: $S3_BUCKET${NC}"
    aws s3api create-bucket --bucket "$S3_BUCKET" --acl private
    
    # Enable versioning on the bucket
    aws s3api put-bucket-versioning --bucket "$S3_BUCKET" --versioning-configuration Status=Enabled
    
    # Configure bucket for static website hosting
    aws s3 website "s3://$S3_BUCKET" --index-document index.html --error-document error.html
    
    echo -e "${GREEN}S3 bucket created successfully.${NC}"
else
    echo -e "${GREEN}S3 bucket already exists.${NC}"
fi

# Create CloudFront Origin Access Identity if it doesn't exist
echo -e "${YELLOW}Creating CloudFront Origin Access Identity...${NC}"
OAI_RESULT=$(aws cloudfront create-cloud-front-origin-access-identity --cloud-front-origin-access-identity-config CallerReference="$(date +%s)" 2>/dev/null || echo "OAI_EXISTS")

if [[ "$OAI_RESULT" != "OAI_EXISTS" ]]; then
    OAI_ID=$(echo "$OAI_RESULT" | jq -r '.CloudFrontOriginAccessIdentity.Id')
    echo -e "${GREEN}Created Origin Access Identity: $OAI_ID${NC}"
    
    # Update the config file with the new OAI
    sed -i.bak "s/E1XXXXXXXXXXXX/$OAI_ID/g" "$CONFIG_FILE"
    rm "${CONFIG_FILE}.bak"
    
    # Update S3 bucket policy to allow CloudFront access
    POLICY='{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "1",
                "Effect": "Allow",
                "Principal": {
                    "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity '"$OAI_ID"'"
                },
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::'"$S3_BUCKET"'/*"
            }
        ]
    }'
    
    echo "$POLICY" > bucket-policy.json
    aws s3api put-bucket-policy --bucket "$S3_BUCKET" --policy file://bucket-policy.json
    rm bucket-policy.json
else
    echo -e "${YELLOW}Using existing Origin Access Identity.${NC}"
    # Here you would need to get the existing OAI ID and update the config file
    # This is simplified for the example
fi

# Check if distribution already exists
echo -e "${YELLOW}Checking for existing CloudFront distributions...${NC}"
DISTRIBUTIONS=$(aws cloudfront list-distributions)
EXISTING_DIST=$(echo "$DISTRIBUTIONS" | jq -r '.DistributionList.Items[] | select(.Origins.Items[].DomainName | contains("'"$S3_BUCKET"'")) | .Id')

if [ -n "$EXISTING_DIST" ]; then
    DISTRIBUTION_ID=$EXISTING_DIST
    echo -e "${YELLOW}Found existing distribution: $DISTRIBUTION_ID${NC}"
    
    # Get the current configuration
    aws cloudfront get-distribution-config --id "$DISTRIBUTION_ID" > current-config.json
    ETAG=$(jq -r '.ETag' current-config.json)
    
    # Update the distribution
    echo -e "${YELLOW}Updating CloudFront distribution...${NC}"
    
    # Prepare the update configuration
    jq '.DistributionConfig' current-config.json > distribution-config.json
    
    # Merge with our configuration updates
    # Note: In a real scenario, you would need a more sophisticated merge strategy
    # This is simplified for the example
    jq -s '.[0] * .[1]' distribution-config.json <(jq 'del(.Comment, .Origins[0].S3OriginConfig.OriginAccessIdentity)' "$CONFIG_FILE") > updated-config.json
    
    # Update the distribution
    aws cloudfront update-distribution --id "$DISTRIBUTION_ID" --distribution-config file://updated-config.json --if-match "$ETAG"
    
    # Clean up temporary files
    rm current-config.json distribution-config.json updated-config.json
    
    echo -e "${GREEN}CloudFront distribution updated successfully.${NC}"
else
    # Create a new distribution
    echo -e "${YELLOW}Creating new CloudFront distribution...${NC}"
    RESULT=$(aws cloudfront create-distribution --distribution-config file://"$CONFIG_FILE")
    DISTRIBUTION_ID=$(echo "$RESULT" | jq -r '.Distribution.Id')
    DOMAIN_NAME=$(echo "$RESULT" | jq -r '.Distribution.DomainName')
    
    echo -e "${GREEN}CloudFront distribution created successfully.${NC}"
    echo -e "${GREEN}Distribution ID: $DISTRIBUTION_ID${NC}"
    echo -e "${GREEN}Domain Name: $DOMAIN_NAME${NC}"
    
    # Save the distribution ID for future updates
    echo "$DISTRIBUTION_ID" > distribution-id.txt
fi

echo -e "${GREEN}CDN deployment completed successfully!${NC}"
echo "=================================================="
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Upload your static assets to the S3 bucket:"
echo "   aws s3 sync ./dist s3://$S3_BUCKET --acl private"
echo ""
echo "2. Invalidate the CloudFront cache after major updates:"
echo "   aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths \"/*\""
echo ""
echo "3. Configure your DNS to point to the CloudFront distribution"
echo "=================================================="