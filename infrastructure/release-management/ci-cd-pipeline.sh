#!/bin/bash

# CI/CD Pipeline Configuration Script
# This script sets up and configures the CI/CD pipeline for AI Sports Edge

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}AI Sports Edge - CI/CD Pipeline Configuration${NC}"
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
REPO_NAME="ai-sports-edge"
ECR_REPOSITORY="${REPO_NAME}"
CODEBUILD_PROJECT="${REPO_NAME}-build"
CODEPIPELINE_NAME="${REPO_NAME}-pipeline"
CODEDEPLOY_APP="${REPO_NAME}-app"
CODEDEPLOY_GROUP="${REPO_NAME}-deployment-group"

# Function to create or update ECR repository
setup_ecr() {
    echo -e "${YELLOW}Setting up ECR repository...${NC}"
    
    # Check if repository exists
    if aws ecr describe-repositories --repository-names ${ECR_REPOSITORY} 2>/dev/null; then
        echo "ECR repository ${ECR_REPOSITORY} already exists."
    else
        echo "Creating ECR repository ${ECR_REPOSITORY}..."
        aws ecr create-repository --repository-name ${ECR_REPOSITORY} \
            --image-scanning-configuration scanOnPush=true
    fi
    
    # Set lifecycle policy to keep only the latest 10 images
    echo "Setting lifecycle policy..."
    aws ecr put-lifecycle-policy \
        --repository-name ${ECR_REPOSITORY} \
        --lifecycle-policy-text '{
            "rules": [
                {
                    "rulePriority": 1,
                    "description": "Keep only the latest 10 images",
                    "selection": {
                        "tagStatus": "any",
                        "countType": "imageCountMoreThan",
                        "countNumber": 10
                    },
                    "action": {
                        "type": "expire"
                    }
                }
            ]
        }'
    
    echo -e "${GREEN}ECR repository setup complete.${NC}"
}

# Function to set up CodeBuild project
setup_codebuild() {
    echo -e "${YELLOW}Setting up CodeBuild project...${NC}"
    
    # Check if CodeBuild project exists
    if aws codebuild batch-get-projects --names ${CODEBUILD_PROJECT} | grep -q "projects"; then
        echo "CodeBuild project ${CODEBUILD_PROJECT} already exists."
    else
        echo "Creating CodeBuild project ${CODEBUILD_PROJECT}..."
        aws codebuild create-project \
            --name ${CODEBUILD_PROJECT} \
            --source type=GITHUB,location=https://github.com/yourusername/${REPO_NAME}.git \
            --artifacts type=NO_ARTIFACTS \
            --environment type=LINUX_CONTAINER,image=aws/codebuild/amazonlinux2-x86_64-standard:3.0,computeType=BUILD_GENERAL1_SMALL,privilegedMode=true \
            --service-role codebuild-${REPO_NAME}-service-role \
            --environment-variables name=ECR_REPOSITORY,value=${ECR_REPOSITORY},type=PLAINTEXT
    fi
    
    echo -e "${GREEN}CodeBuild project setup complete.${NC}"
}

# Function to set up CodePipeline
setup_codepipeline() {
    echo -e "${YELLOW}Setting up CodePipeline...${NC}"
    
    # Check if CodePipeline exists
    if aws codepipeline get-pipeline --name ${CODEPIPELINE_NAME} 2>/dev/null; then
        echo "CodePipeline ${CODEPIPELINE_NAME} already exists."
    else
        echo "Creating CodePipeline ${CODEPIPELINE_NAME}..."
        aws codepipeline create-pipeline \
            --pipeline-name ${CODEPIPELINE_NAME} \
            --pipeline-definition '{
                "version": 1,
                "name": "'${CODEPIPELINE_NAME}'",
                "roleArn": "arn:aws:iam::ACCOUNT_ID:role/service-role/codepipeline-'${REPO_NAME}'-service-role",
                "artifactStore": {
                    "type": "S3",
                    "location": "'${REPO_NAME}'-artifacts"
                },
                "stages": [
                    {
                        "name": "Source",
                        "actions": [
                            {
                                "name": "Source",
                                "actionTypeId": {
                                    "category": "Source",
                                    "owner": "AWS",
                                    "provider": "CodeStarSourceConnection",
                                    "version": "1"
                                },
                                "configuration": {
                                    "ConnectionArn": "arn:aws:codestar-connections:REGION:ACCOUNT_ID:connection/CONNECTION_ID",
                                    "FullRepositoryId": "yourusername/'${REPO_NAME}'",
                                    "BranchName": "main"
                                },
                                "outputArtifacts": [
                                    {
                                        "name": "SourceCode"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "name": "Build",
                        "actions": [
                            {
                                "name": "BuildAndTest",
                                "actionTypeId": {
                                    "category": "Build",
                                    "owner": "AWS",
                                    "provider": "CodeBuild",
                                    "version": "1"
                                },
                                "configuration": {
                                    "ProjectName": "'${CODEBUILD_PROJECT}'"
                                },
                                "inputArtifacts": [
                                    {
                                        "name": "SourceCode"
                                    }
                                ],
                                "outputArtifacts": [
                                    {
                                        "name": "BuildOutput"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "name": "Deploy",
                        "actions": [
                            {
                                "name": "Deploy",
                                "actionTypeId": {
                                    "category": "Deploy",
                                    "owner": "AWS",
                                    "provider": "CodeDeploy",
                                    "version": "1"
                                },
                                "configuration": {
                                    "ApplicationName": "'${CODEDEPLOY_APP}'",
                                    "DeploymentGroupName": "'${CODEDEPLOY_GROUP}'"
                                },
                                "inputArtifacts": [
                                    {
                                        "name": "BuildOutput"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }'
    fi
    
    echo -e "${GREEN}CodePipeline setup complete.${NC}"
}

# Function to set up CodeDeploy
setup_codedeploy() {
    echo -e "${YELLOW}Setting up CodeDeploy...${NC}"
    
    # Check if CodeDeploy application exists
    if aws deploy get-application --application-name ${CODEDEPLOY_APP} 2>/dev/null; then
        echo "CodeDeploy application ${CODEDEPLOY_APP} already exists."
    else
        echo "Creating CodeDeploy application ${CODEDEPLOY_APP}..."
        aws deploy create-application --application-name ${CODEDEPLOY_APP}
    fi
    
    # Check if deployment group exists
    if aws deploy get-deployment-group --application-name ${CODEDEPLOY_APP} --deployment-group-name ${CODEDEPLOY_GROUP} 2>/dev/null; then
        echo "Deployment group ${CODEDEPLOY_GROUP} already exists."
    else
        echo "Creating deployment group ${CODEDEPLOY_GROUP}..."
        aws deploy create-deployment-group \
            --application-name ${CODEDEPLOY_APP} \
            --deployment-group-name ${CODEDEPLOY_GROUP} \
            --deployment-config-name CodeDeployDefault.OneAtATime \
            --service-role-arn arn:aws:iam::ACCOUNT_ID:role/service-role/codedeploy-${REPO_NAME}-service-role \
            --auto-scaling-groups ${REPO_NAME}-asg
    fi
    
    echo -e "${GREEN}CodeDeploy setup complete.${NC}"
}

# Function to create buildspec.yml if it doesn't exist
create_buildspec() {
    echo -e "${YELLOW}Creating buildspec.yml template...${NC}"
    
    if [ -f "../buildspec.yml" ]; then
        echo "buildspec.yml already exists. Skipping creation."
    else
        cat > "../buildspec.yml" << 'EOF'
version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$ECR_REPOSITORY
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=${COMMIT_HASH:=latest}
      - echo Running tests...
      - npm install
      - npm test
  build:
    commands:
      - echo Build started on `date`
      - echo Building the Docker image...
      - docker build -t $REPOSITORY_URI:latest .
      - docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on `date`
      - echo Pushing the Docker images...
      - docker push $REPOSITORY_URI:latest
      - docker push $REPOSITORY_URI:$IMAGE_TAG
      - echo Writing image definitions file...
      - echo "{\"ImageURI\":\"$REPOSITORY_URI:$IMAGE_TAG\"}" > imageDefinitions.json
      - echo Creating appspec.yml...
      - |
        cat > appspec.yml << 'APPSPEC'
        version: 0.0
        os: linux
        files:
          - source: /
            destination: /var/www/html/
        hooks:
          BeforeInstall:
            - location: scripts/before_install.sh
              timeout: 300
              runas: root
          AfterInstall:
            - location: scripts/after_install.sh
              timeout: 300
              runas: root
          ApplicationStart:
            - location: scripts/application_start.sh
              timeout: 300
              runas: root
          ApplicationStop:
            - location: scripts/application_stop.sh
              timeout: 300
              runas: root
        APPSPEC

artifacts:
  files:
    - imageDefinitions.json
    - appspec.yml
    - scripts/**/*
EOF
    fi
    
    echo -e "${GREEN}buildspec.yml template created.${NC}"
}

# Main function
main() {
    echo "Setting up CI/CD pipeline for ${REPO_NAME}..."
    
    # Create deployment scripts directory if it doesn't exist
    mkdir -p ../scripts
    
    # Create deployment scripts
    if [ ! -f "../scripts/before_install.sh" ]; then
        echo -e "${YELLOW}Creating deployment scripts...${NC}"
        
        # Before install script
        cat > "../scripts/before_install.sh" << 'EOF'
#!/bin/bash
# Stop and remove any existing containers
if [ "$(docker ps -aq)" ]; then
    docker stop $(docker ps -aq)
    docker rm $(docker ps -aq)
fi
EOF
        
        # After install script
        cat > "../scripts/after_install.sh" << 'EOF'
#!/bin/bash
# Pull the latest image
aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
docker pull $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$ECR_REPOSITORY:latest
EOF
        
        # Application start script
        cat > "../scripts/application_start.sh" << 'EOF'
#!/bin/bash
# Run the container
docker run -d -p 80:3000 --name ai-sports-edge $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$ECR_REPOSITORY:latest
EOF
        
        # Application stop script
        cat > "../scripts/application_stop.sh" << 'EOF'
#!/bin/bash
# Stop the container
if [ "$(docker ps -q -f name=ai-sports-edge)" ]; then
    docker stop ai-sports-edge
    docker rm ai-sports-edge
fi
EOF
        
        # Make scripts executable
        chmod +x ../scripts/*.sh
        
        echo -e "${GREEN}Deployment scripts created.${NC}"
    fi
    
    # Set up each component
    setup_ecr
    setup_codebuild
    setup_codedeploy
    setup_codepipeline
    create_buildspec
    
    echo -e "${GREEN}CI/CD pipeline setup complete!${NC}"
    echo "You may need to update the following in the pipeline configuration:"
    echo "1. AWS account ID"
    echo "2. AWS region"
    echo "3. GitHub repository details"
    echo "4. IAM role ARNs"
    echo "5. Auto-scaling group name"
}

# Run the main function
main