#!/bin/bash

# Deploy Claude Optimization Script
# This script deploys the Claude optimization service and updates AI services to use it

# Set default values
ENVIRONMENT="production"
BACKUP=true
VERBOSE=false
SKIP_CONFIRMATION=false

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --env) ENVIRONMENT="$2"; shift 2 ;;
    --no-backup) BACKUP=false; shift ;;
    --verbose) VERBOSE=true; shift ;;
    --yes) SKIP_CONFIRMATION=false; shift ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "development" ]]; then
  echo "Error: Environment must be one of: production, staging, development"
  exit 1
fi

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to log messages
log() {
  local level=$1
  local message=$2
  
  case $level in
    info)
      echo -e "${GREEN}[INFO]${NC} $message"
      ;;
    warn)
      echo -e "${YELLOW}[WARN]${NC} $message"
      ;;
    error)
      echo -e "${RED}[ERROR]${NC} $message"
      ;;
    *)
      echo "$message"
      ;;
  esac
}

# Function to log verbose messages
log_verbose() {
  if [[ "$VERBOSE" == true ]]; then
    log "info" "$1"
  fi
}

# Check if required files exist
if [[ ! -f "services/claudeOptimizationService.ts" ]]; then
  log "error" "Claude optimization service not found at services/claudeOptimizationService.ts"
  exit 1
fi

if [[ ! -f "scripts/claude-usage-report.sh" ]]; then
  log "error" "Claude usage report script not found at scripts/claude-usage-report.sh"
  exit 1
fi

# Check if required AI services exist
REQUIRED_SERVICES=(
  "services/aiSummaryService.ts"
  "services/aiPredictionService.ts"
  "services/aiNewsAnalysisService.ts"
  "services/aiPickSelector.ts"
)

for service in "${REQUIRED_SERVICES[@]}"; do
  if [[ ! -f "$service" ]]; then
    log "warn" "AI service not found at $service"
  fi
done

# Create backup if enabled
if [[ "$BACKUP" == true ]]; then
  BACKUP_DIR="backups/claude-optimization-$(date +%Y%m%d%H%M%S)"
  log "info" "Creating backup at $BACKUP_DIR"
  
  mkdir -p "$BACKUP_DIR/services"
  mkdir -p "$BACKUP_DIR/scripts"
  
  # Backup services
  for service in "${REQUIRED_SERVICES[@]}"; do
    if [[ -f "$service" ]]; then
      cp "$service" "$BACKUP_DIR/$service"
      log_verbose "Backed up $service"
    fi
  done
  
  # Backup scripts
  cp "scripts/claude-usage-report.sh" "$BACKUP_DIR/scripts/"
  log_verbose "Backed up scripts/claude-usage-report.sh"
  
  log "info" "Backup completed"
fi

# Ask for confirmation before proceeding
if [[ "$SKIP_CONFIRMATION" == false ]]; then
  read -p "Are you sure you want to deploy Claude optimization to $ENVIRONMENT? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "info" "Deployment cancelled"
    exit 0
  fi
fi

log "info" "Deploying Claude optimization to $ENVIRONMENT..."

# Update aiSummaryService.ts to use Claude optimization
if [[ -f "services/aiSummaryService.ts" ]]; then
  log "info" "Updating aiSummaryService.ts"
  
  # Create a temporary file
  TEMP_FILE=$(mktemp)
  
  # Add import for Claude optimization service
  sed '1s/^/import claudeOptimizationService, { ClaudeRequestType } from '\''\.\/claudeOptimizationService'\''\;\n/' services/aiSummaryService.ts > $TEMP_FILE
  
  # Update summarizeWithAI function to use Claude optimization
  sed -i '' 's/const generateMockSummary = (request: SummaryRequest): string => {/const generateMockSummary = (request: SummaryRequest): string => {\n  \/\/ This is a fallback function for development and testing/' $TEMP_FILE
  
  # Update summarizeWithAI function to use Claude optimization
  sed -i '' 's/export const summarizeWithAI = async (request: SummaryRequest): Promise<string> => {/export const summarizeWithAI = async (request: SummaryRequest): Promise<string> => {\n  \/\/ Use Claude optimization service for production\n  if (process.env.NODE_ENV === '\''production'\'') {\n    try {\n      const response = await claudeOptimizationService.processRequest({\n        type: ClaudeRequestType.SUMMARY,\n        prompt: request.content,\n        params: {\n          maxLength: request.maxLength,\n          focusOn: request.focusOn\n        }\n      });\n      \n      return response.content;\n    } catch (error) {\n      console.error('\''Error using Claude optimization service:'\'', error);\n      \/\/ Fall back to mock implementation\n    }\n  }\n  \n  \/\/ Development implementation/' $TEMP_FILE
  
  # Replace the original file
  mv $TEMP_FILE services/aiSummaryService.ts
  log_verbose "Updated aiSummaryService.ts"
fi

# Update aiPredictionService.ts to use Claude optimization
if [[ -f "services/aiPredictionService.ts" ]]; then
  log "info" "Updating aiPredictionService.ts"
  
  # Create a temporary file
  TEMP_FILE=$(mktemp)
  
  # Add import for Claude optimization service
  sed '1s/^/import claudeOptimizationService, { ClaudeRequestType } from '\''\.\/claudeOptimizationService'\''\;\n/' services/aiPredictionService.ts > $TEMP_FILE
  
  # Update generateAIPrediction function to use Claude optimization
  sed -i '' 's/export const generateAIPrediction = async (/export const generateAIPrediction = async (/' $TEMP_FILE
  sed -i '' 's/try {/try {\n    \/\/ Use Claude optimization service for production\n    if (process.env.NODE_ENV === '\''production'\'') {\n      try {\n        const response = await claudeOptimizationService.processRequest({\n          type: ClaudeRequestType.PREDICTION,\n          prompt: JSON.stringify(game),\n          params: {\n            language\n          },\n          userId: auth.currentUser?.uid\n        });\n        \n        \/\/ Parse the response content as AIPrediction\n        const prediction = JSON.parse(response.content);\n        return prediction;\n      } catch (error) {\n        console.error('\''Error using Claude optimization service:'\'', error);\n        \/\/ Fall back to ML prediction service\n      }\n    }\n    \n    \/\/ Use ML prediction service as fallback/' $TEMP_FILE
  
  # Replace the original file
  mv $TEMP_FILE services/aiPredictionService.ts
  log_verbose "Updated aiPredictionService.ts"
fi

# Update aiNewsAnalysisService.ts to use Claude optimization
if [[ -f "services/aiNewsAnalysisService.ts" ]]; then
  log "info" "Updating aiNewsAnalysisService.ts"
  
  # Create a temporary file
  TEMP_FILE=$(mktemp)
  
  # Add import for Claude optimization service
  sed '1s/^/import claudeOptimizationService, { ClaudeRequestType } from '\''\.\/claudeOptimizationService'\''\;\n/' services/aiNewsAnalysisService.ts > $TEMP_FILE
  
  # Update analyzeSentiment function to use Claude optimization
  sed -i '' 's/export const analyzeSentiment = async (newsItem: NewsItem): Promise<SentimentAnalysis> => {/export const analyzeSentiment = async (newsItem: NewsItem): Promise<SentimentAnalysis> => {\n  \/\/ Use Claude optimization service for production\n  if (process.env.NODE_ENV === '\''production'\'') {\n    try {\n      const response = await claudeOptimizationService.processRequest({\n        type: ClaudeRequestType.NEWS_ANALYSIS,\n        prompt: JSON.stringify(newsItem),\n        params: {\n          analysisType: '\''sentiment'\''\n        },\n        userId: auth.currentUser?.uid\n      });\n      \n      \/\/ Parse the response content as SentimentAnalysis\n      const analysis = JSON.parse(response.content);\n      return analysis;\n    } catch (error) {\n      console.error('\''Error using Claude optimization service:'\'', error);\n      \/\/ Fall back to mock implementation\n    }\n  }\n  \n  \/\/ Development implementation/' $TEMP_FILE
  
  # Update predictOddsImpact function to use Claude optimization
  sed -i '' 's/export const predictOddsImpact = async (newsItem: NewsItem): Promise<OddsImpactPrediction> => {/export const predictOddsImpact = async (newsItem: NewsItem): Promise<OddsImpactPrediction> => {\n  \/\/ Use Claude optimization service for production\n  if (process.env.NODE_ENV === '\''production'\'') {\n    try {\n      const response = await claudeOptimizationService.processRequest({\n        type: ClaudeRequestType.NEWS_ANALYSIS,\n        prompt: JSON.stringify(newsItem),\n        params: {\n          analysisType: '\''oddsImpact'\''\n        },\n        userId: auth.currentUser?.uid\n      });\n      \n      \/\/ Parse the response content as OddsImpactPrediction\n      const prediction = JSON.parse(response.content);\n      return prediction;\n    } catch (error) {\n      console.error('\''Error using Claude optimization service:'\'', error);\n      \/\/ Fall back to mock implementation\n    }\n  }\n  \n  \/\/ Development implementation/' $TEMP_FILE
  
  # Update generatePersonalizedSummary function to use Claude optimization
  sed -i '' 's/export const generatePersonalizedSummary = async (newsItem: NewsItem): Promise<PersonalizedNewsSummary> => {/export const generatePersonalizedSummary = async (newsItem: NewsItem): Promise<PersonalizedNewsSummary> => {\n  \/\/ Use Claude optimization service for production\n  if (process.env.NODE_ENV === '\''production'\'') {\n    try {\n      \/\/ Get user'\''s betting history summary\n      const bettingHistory = await getUserBettingHistorySummary();\n      \n      const response = await claudeOptimizationService.processRequest({\n        type: ClaudeRequestType.PERSONALIZED,\n        prompt: JSON.stringify({\n          newsItem,\n          bettingHistory\n        }),\n        userId: auth.currentUser?.uid\n      });\n      \n      \/\/ Parse the response content as PersonalizedNewsSummary\n      const summary = JSON.parse(response.content);\n      return summary;\n    } catch (error) {\n      console.error('\''Error using Claude optimization service:'\'', error);\n      \/\/ Fall back to mock implementation\n    }\n  }\n  \n  \/\/ Development implementation/' $TEMP_FILE
  
  # Replace the original file
  mv $TEMP_FILE services/aiNewsAnalysisService.ts
  log_verbose "Updated aiNewsAnalysisService.ts"
fi

# Update aiPickSelector.ts to use Claude optimization
if [[ -f "services/aiPickSelector.ts" ]]; then
  log "info" "Updating aiPickSelector.ts"
  
  # Create a temporary file
  TEMP_FILE=$(mktemp)
  
  # Add import for Claude optimization service
  sed '1s/^/import claudeOptimizationService, { ClaudeRequestType } from '\''\.\/claudeOptimizationService'\''\;\n/' services/aiPickSelector.ts > $TEMP_FILE
  
  # Find the main function that generates picks and update it to use Claude optimization
  # This is a simplified approach; in a real scenario, you'd need to analyze the file structure
  sed -i '' 's/export const generateAIPicks = async (/export const generateAIPicks = async (/' $TEMP_FILE
  sed -i '' 's/try {/try {\n    \/\/ Use Claude optimization service for production\n    if (process.env.NODE_ENV === '\''production'\'') {\n      try {\n        const response = await claudeOptimizationService.processRequest({\n          type: ClaudeRequestType.PREDICTION,\n          prompt: JSON.stringify(games),\n          params: {\n            pickCount: 3,\n            confidenceThreshold: '\''medium'\''\n          },\n          userId: auth.currentUser?.uid\n        });\n        \n        \/\/ Parse the response content\n        const picks = JSON.parse(response.content);\n        return picks;\n      } catch (error) {\n        console.error('\''Error using Claude optimization service:'\'', error);\n        \/\/ Fall back to original implementation\n      }\n    }\n    \n    \/\/ Original implementation/' $TEMP_FILE
  
  # Replace the original file
  mv $TEMP_FILE services/aiPickSelector.ts
  log_verbose "Updated aiPickSelector.ts"
fi

# Set up Firestore collections for Claude optimization
log "info" "Setting up Firestore collections for Claude optimization"

# Create a temporary file for the Firestore setup script
TEMP_SCRIPT=$(mktemp)

# Write the Firestore setup script
cat > $TEMP_SCRIPT << EOL
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function setupFirestoreCollections() {
  try {
    // Create claudeUsage collection
    const globalStatsRef = db.collection('claudeUsage').doc('global');
    await globalStatsRef.set({
      monthly: {},
      lastUpdated: Date.now()
    }, { merge: true });
    
    // Create cache_stats document
    const cacheStatsRef = db.collection('claudeUsage').doc('cache_stats');
    await cacheStatsRef.set({
      hits: {},
      misses: {},
      total: {},
      lastUpdated: Date.now()
    }, { merge: true });
    
    // Create claudeCache collection with TTL index
    // Note: TTL indexes must be created in the Firebase console or using the Firebase CLI
    
    // Create claudeRateLimit collection with TTL index
    // Note: TTL indexes must be created in the Firebase console or using the Firebase CLI
    
    console.log('Firestore collections set up successfully');
  } catch (error) {
    console.error('Error setting up Firestore collections:', error);
    process.exit(1);
  }
}

setupFirestoreCollections();
EOL

# Check if Firebase CLI is installed
if command -v firebase &> /dev/null; then
  # Export the Firebase service account key
  FIREBASE_PROJECT_ID="ai-sports-edge"
  TEMP_DIR=$(mktemp -d)
  
  firebase projects:sdkconfig web --project $FIREBASE_PROJECT_ID > $TEMP_DIR/firebase-config.json
  
  # Extract the service account key from the Firebase config
  if command -v jq &> /dev/null; then
    jq '.serviceAccount' $TEMP_DIR/firebase-config.json > $TEMP_DIR/serviceAccountKey.json
    
    # Run the Firestore setup script
    node $TEMP_SCRIPT
    
    # Clean up
    rm -rf $TEMP_DIR
  else
    log "warn" "jq not installed. Skipping Firestore setup."
    log "warn" "Please run the following commands manually:"
    log "warn" "1. firebase projects:sdkconfig web --project $FIREBASE_PROJECT_ID > firebase-config.json"
    log "warn" "2. Extract the serviceAccount field from firebase-config.json"
    log "warn" "3. Save it as serviceAccountKey.json"
    log "warn" "4. node $TEMP_SCRIPT"
  fi
else
  log "warn" "Firebase CLI not installed. Skipping Firestore setup."
  log "warn" "Please install Firebase CLI and run the setup script manually."
fi

# Clean up
rm $TEMP_SCRIPT

# Make claude-usage-report.sh executable
chmod +x scripts/claude-usage-report.sh
log_verbose "Made claude-usage-report.sh executable"

# Deploy to the specified environment
if [[ "$ENVIRONMENT" == "production" ]]; then
  log "info" "Deploying to production..."
  
  # Check if deploy script exists
  if [[ -f "deploy.sh" ]]; then
    ./deploy.sh
  elif [[ -f "scripts/deploy.sh" ]]; then
    ./scripts/deploy.sh
  else
    log "warn" "No deploy script found. Please deploy manually."
  fi
elif [[ "$ENVIRONMENT" == "staging" ]]; then
  log "info" "Deploying to staging..."
  
  # Check if staging deploy script exists
  if [[ -f "deploy-staging.sh" ]]; then
    ./deploy-staging.sh
  elif [[ -f "scripts/deploy-staging.sh" ]]; then
    ./scripts/deploy-staging.sh
  else
    log "warn" "No staging deploy script found. Please deploy manually."
  fi
else
  log "info" "Skipping deployment for development environment"
fi

log "info" "Claude optimization deployment completed"
log "info" "To generate a usage report, run: ./scripts/claude-usage-report.sh"

# Add a reminder to set up TTL indexes
log "warn" "Remember to set up TTL indexes for claudeCache and claudeRateLimit collections in the Firebase console"
log "warn" "1. Go to Firebase Console > Firestore Database > Indexes"
log "warn" "2. Add TTL index for claudeCache collection on 'timestamp' field"
log "warn" "3. Add TTL index for claudeRateLimit collection on 'lastUpdated' field"