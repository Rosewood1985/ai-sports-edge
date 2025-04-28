#!/bin/bash
# Script to collect historical sports data for ML model training

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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js to run this script.${NC}"
    exit 1
fi

# Parse command line arguments
START_YEAR=""
END_YEAR=""
SPORT=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --start-year)
            START_YEAR="$2"
            shift 2
            ;;
        --end-year)
            END_YEAR="$2"
            shift 2
            ;;
        --sport)
            SPORT="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Set default values if not provided
if [ -z "$START_YEAR" ]; then
    START_YEAR=$(date -v-5y +%Y)  # 5 years ago
fi

if [ -z "$END_YEAR" ]; then
    END_YEAR=$(date -v-1y +%Y)  # Last year
fi

section "Collecting Historical Sports Data"
echo -e "Start Year: ${YELLOW}${START_YEAR}${NC}"
echo -e "End Year: ${YELLOW}${END_YEAR}${NC}"
if [ -n "$SPORT" ]; then
    echo -e "Sport: ${YELLOW}${SPORT}${NC}"
else
    echo -e "Sport: ${YELLOW}All Sports${NC}"
fi

# Create a temporary JavaScript file to run the historical data collection
TMP_JS_FILE=$(mktemp)
cat > "$TMP_JS_FILE" << EOF
const { 
    fetchNBAHistoricalData,
    fetchNFLHistoricalData,
    fetchMLBHistoricalData,
    fetchNHLHistoricalData,
    fetchNCAAMensHistoricalData,
    fetchNCAAWomensHistoricalData,
    fetchHistoricalDataForSeasons
} = require('./api/ml-sports-edge/data/historical_data_collector');

async function main() {
    const startYear = ${START_YEAR};
    const endYear = ${END_YEAR};
    
    try {
        if ('${SPORT}' === 'nba' || '${SPORT}' === '') {
            console.log('Collecting NBA historical data...');
            await fetchNBAHistoricalData(startYear, endYear);
        }
        
        if ('${SPORT}' === 'nfl' || '${SPORT}' === '') {
            console.log('Collecting NFL historical data...');
            await fetchNFLHistoricalData(startYear, endYear);
        }
        
        if ('${SPORT}' === 'mlb' || '${SPORT}' === '') {
            console.log('Collecting MLB historical data...');
            await fetchMLBHistoricalData(startYear, endYear);
        }
        
        if ('${SPORT}' === 'nhl' || '${SPORT}' === '') {
            console.log('Collecting NHL historical data...');
            await fetchNHLHistoricalData(startYear, endYear);
        }
        
        if ('${SPORT}' === 'ncaa-mens' || '${SPORT}' === '') {
            console.log('Collecting NCAA Men\'s Basketball historical data...');
            await fetchNCAAMensHistoricalData(startYear, endYear);
        }
        
        if ('${SPORT}' === 'ncaa-womens' || '${SPORT}' === '') {
            console.log('Collecting NCAA Women\'s Basketball historical data...');
            await fetchNCAAWomensHistoricalData(startYear, endYear);
        }
        
        // Custom sport/league
        if ('${SPORT}'.includes('/')) {
            const [sport, league] = '${SPORT}'.split('/');
            console.log(\`Collecting \${sport}/\${league} historical data...\`);
            await fetchHistoricalDataForSeasons(sport, league, startYear, endYear);
        }
        
        console.log('Historical data collection completed successfully');
    } catch (error) {
        console.error('Error collecting historical data:', error);
        process.exit(1);
    }
}

main();
EOF

# Run the temporary JavaScript file
section "Running Historical Data Collection"
node "$TMP_JS_FILE"

# Remove the temporary file
rm "$TMP_JS_FILE"

section "Historical Data Collection Completed"
echo -e "${GREEN}Historical data has been collected and saved to:${NC}"
echo -e "  - Raw data: ${YELLOW}api/ml-sports-edge/data/historical/${NC}"
echo -e "  - Processed data: ${YELLOW}api/ml-sports-edge/data/processed/${NC}"

echo -e "\n${GREEN}You can now use this historical data for ML model training.${NC}"
echo -e "To train models with the collected data, run:"
echo -e "  ${YELLOW}./scripts/train-models.sh${NC}"