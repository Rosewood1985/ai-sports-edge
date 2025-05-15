#!/bin/bash
# Script to run the sportsbookreview.com scraper and integrate the data with the ML model

# Navigate to the project root directory
cd /Users/lisadario/Desktop/ai-sports-edge

# Set text colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to display section headers
section() {
    echo -e "\n${BLUE}==== $1 ====${NC}\n"
}

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 is not installed. Please install Python 3 to run this script.${NC}"
    exit 1
fi

# Parse command line arguments
SPORT=""
START_DATE=""
END_DATE=""
CSV=false
ML_FORMAT=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --sport)
            SPORT="$2"
            shift 2
            ;;
        --start-date)
            START_DATE="$2"
            shift 2
            ;;
        --end-date)
            END_DATE="$2"
            shift 2
            ;;
        --csv)
            CSV=true
            shift
            ;;
        --no-ml-format)
            ML_FORMAT=false
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Validate required arguments
if [ -z "$SPORT" ]; then
    echo -e "${RED}Error: Sport is required. Available sports: nba, nfl, mlb, nhl, ncaab, ncaaf${NC}"
    exit 1
fi

if [ -z "$START_DATE" ]; then
    echo -e "${RED}Error: Start date is required (format: YYYY-MM-DD)${NC}"
    exit 1
fi

if [ -z "$END_DATE" ]; then
    echo -e "${RED}Error: End date is required (format: YYYY-MM-DD)${NC}"
    exit 1
fi

# Install required Python packages
section "Installing required Python packages"
pip3 install -r api/ml-sports-edge/requirements.txt
pip3 install pandas requests

# Run the scraper
section "Running sportsbookreview.com scraper"
echo -e "Sport: ${YELLOW}${SPORT}${NC}"
echo -e "Date Range: ${YELLOW}${START_DATE}${NC} to ${YELLOW}${END_DATE}${NC}"

# Build the command
CMD="python3 api/ml-sports-edge/data/sportsbookreview_scraper.py ${SPORT} --start-date ${START_DATE} --end-date ${END_DATE}"

if [ "$CSV" = true ]; then
    CMD="${CMD} --csv"
fi

if [ "$ML_FORMAT" = true ]; then
    CMD="${CMD} --ml-format"
fi

# Execute the command
eval $CMD

# If ML format is enabled, integrate with the ML model
if [ "$ML_FORMAT" = true ]; then
    section "Integrating data with ML model"
    
    # Create a temporary JavaScript file to run the integration
    TMP_JS_FILE=$(mktemp)
    cat > "$TMP_JS_FILE" << EOF
const fs = require('fs');
const path = require('path');

// Path to the scraped data in ML format
const scrapedDataPath = path.join(__dirname, 'api/ml-sports-edge/data/historical/sportsbookreview/${SPORT}_ml_format_${START_DATE}_to_${END_DATE}.json');

// Path to the historical data directory
const historicalDataDir = path.join(__dirname, 'api/ml-sports-edge/data/historical');

// Ensure the directory exists
if (!fs.existsSync(historicalDataDir)) {
    fs.mkdirSync(historicalDataDir, { recursive: true });
}

// Load the scraped data
console.log('Loading scraped data from', scrapedDataPath);
let scrapedData;
try {
    scrapedData = JSON.parse(fs.readFileSync(scrapedDataPath, 'utf8'));
    console.log(\`Loaded \${scrapedData.length} games from scraped data\`);
} catch (error) {
    console.error('Error loading scraped data:', error.message);
    process.exit(1);
}

// Create a historical data file in the format expected by the ML model
const historicalData = {
    sport: '${SPORT.toUpperCase()}',
    startDate: '${START_DATE}',
    endDate: '${END_DATE}',
    games: scrapedData
};

// Save the historical data
const historicalDataPath = path.join(historicalDataDir, \`\${SPORT.toLowerCase()}_historical_\${START_DATE}_to_\${END_DATE}.json\`);
fs.writeFileSync(historicalDataPath, JSON.stringify(historicalData, null, 2));
console.log(\`Saved \${scrapedData.length} games to \${historicalDataPath}\`);

// Now run the feature extraction on this data
const { extractFeatures } = require('./api/ml-sports-edge/models/features');
console.log('Extracting features from historical data...');
const features = extractFeatures('${SPORT.toUpperCase()}');
console.log('Feature extraction completed');

console.log('Integration with ML model completed successfully');
EOF

    # Run the temporary JavaScript file
    node "$TMP_JS_FILE"

    # Remove the temporary file
    rm "$TMP_JS_FILE"
fi

section "Scraping and integration completed"
echo -e "${GREEN}Historical odds data has been scraped and integrated with the ML model.${NC}"
echo -e "The data is available in the following locations:"
echo -e "  - Raw JSON files: ${YELLOW}api/ml-sports-edge/data/historical/sportsbookreview/${SPORT}/${NC}"
if [ "$CSV" = true ]; then
    echo -e "  - CSV file: ${YELLOW}api/ml-sports-edge/data/historical/sportsbookreview/${SPORT}_${START_DATE}_to_${END_DATE}.csv${NC}"
fi
if [ "$ML_FORMAT" = true ]; then
    echo -e "  - ML format: ${YELLOW}api/ml-sports-edge/data/historical/sportsbookreview/${SPORT}_ml_format_${START_DATE}_to_${END_DATE}.json${NC}"
    echo -e "  - Integrated with ML model: ${YELLOW}api/ml-sports-edge/data/historical/${SPORT.toLowerCase()}_historical_${START_DATE}_to_${END_DATE}.json${NC}"
    echo -e "  - Features extracted: ${YELLOW}api/ml-sports-edge/data/features/${NC}"
fi

echo -e "\n${GREEN}You can now use this historical data for ML model training.${NC}"
echo -e "To train models with the collected data, run:"
echo -e "  ${YELLOW}./scripts/train-models.sh${NC}"