#!/bin/bash
# Script to run the ML Sports Edge pipeline with Pinnacle and BetMGM integration

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

# Check if Python virtual environment exists
if [ ! -d "api/ml-sports-edge/venv" ]; then
    section "Creating Python virtual environment"
    python3 -m venv api/ml-sports-edge/venv
fi

# Activate virtual environment
section "Activating virtual environment"
source api/ml-sports-edge/venv/bin/activate

# Install dependencies
section "Installing dependencies"
pip install -r api/ml-sports-edge/requirements.txt

# Create .env files from examples if they don't exist
section "Setting up environment files"

if [ ! -f "api/ml-sports-edge/.env.pinnacle" ]; then
    echo -e "${YELLOW}Creating .env.pinnacle file from example${NC}"
    cp api/ml-sports-edge/.env.pinnacle.example api/ml-sports-edge/.env.pinnacle
    echo -e "${RED}Please edit api/ml-sports-edge/.env.pinnacle with your Pinnacle API credentials${NC}"
fi

if [ ! -f "api/ml-sports-edge/.env.betmgm" ]; then
    echo -e "${YELLOW}Creating .env.betmgm file from example${NC}"
    cp api/ml-sports-edge/.env.betmgm.example api/ml-sports-edge/.env.betmgm
    echo -e "${RED}Please edit api/ml-sports-edge/.env.betmgm with your BetMGM API credentials${NC}"
fi

if [ ! -f "api/ml-sports-edge/.env.bet365" ]; then
    echo -e "${YELLOW}Creating .env.bet365 file from example${NC}"
    cp api/ml-sports-edge/.env.bet365.example api/ml-sports-edge/.env.bet365
    echo -e "${RED}Please edit api/ml-sports-edge/.env.bet365 with your Bet365 API credentials${NC}"
fi

# Parse command line arguments
SPORT=""
LEAGUE=""
TARGET="home_team_winning"
TRAIN=false
ALL=false
PREDICTIONS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --sport)
            SPORT="$2"
            shift 2
            ;;
        --league)
            LEAGUE="$2"
            shift 2
            ;;
        --target)
            TARGET="$2"
            shift 2
            ;;
        --train)
            TRAIN=true
            shift
            ;;
        --all)
            ALL=true
            shift
            ;;
        --predictions)
            PREDICTIONS=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run the ML Sports Edge pipeline
section "Running ML Sports Edge pipeline with Pinnacle and BetMGM integration"

cd api/ml-sports-edge

if [ "$PREDICTIONS" = true ]; then
    echo -e "${YELLOW}Getting latest predictions${NC}"
    if [ -n "$SPORT" ]; then
        python main.py --predictions --sport "$SPORT"
    elif [ -n "$LEAGUE" ]; then
        python main.py --predictions --league "$LEAGUE"
    else
        python main.py --predictions
    fi
elif [ "$ALL" = true ]; then
    echo -e "${YELLOW}Running pipeline for all sports and leagues${NC}"
    if [ "$TRAIN" = true ]; then
        python main.py --all --train
    else
        python main.py --all
    fi
elif [ -n "$SPORT" ] && [ -n "$LEAGUE" ]; then
    echo -e "${YELLOW}Running pipeline for $SPORT/$LEAGUE${NC}"
    if [ "$TRAIN" = true ]; then
        python main.py --sport "$SPORT" --league "$LEAGUE" --target "$TARGET" --train
    else
        python main.py --sport "$SPORT" --league "$LEAGUE" --target "$TARGET"
    fi
else
    echo -e "${YELLOW}No valid options provided${NC}"
    echo "Usage: $0 [--sport SPORT] [--league LEAGUE] [--target TARGET] [--train] [--all] [--predictions]"
    exit 1
fi

# Deactivate virtual environment
deactivate

section "Pipeline execution completed"
echo -e "${GREEN}ML Sports Edge pipeline with Pinnacle and BetMGM integration completed successfully!${NC}"
echo "The pipeline has:"
echo "1. Collected data from ESPN API"
echo "2. Collected odds data from Bet365 API"
echo "3. Collected odds data from Pinnacle API"
echo "4. Collected odds data from BetMGM API"
echo "5. Calculated EV (Expected Value) for bets by comparing BetMGM odds against devigged Pinnacle odds"
echo "6. Processed and merged all data sources"
echo "7. Extracted features for machine learning"
if [ "$TRAIN" = true ]; then
    echo "8. Trained machine learning models"
fi
echo "9. Made predictions for upcoming games"
echo "10. Identified value betting opportunities"

echo -e "\n${YELLOW}To view the results:${NC}"
echo "- Processed data: api/ml-sports-edge/data/processed/"
echo "- Extracted features: api/ml-sports-edge/data/features/"
echo "- Trained models: api/ml-sports-edge/models/"
echo "- Predictions: api/ml-sports-edge/predictions/"
echo "- EV bets: api/ml-sports-edge/data/ev_bets/"