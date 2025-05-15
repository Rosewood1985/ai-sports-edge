#!/bin/bash
# Script to run the ML Sports Edge pipeline

# Navigate to the project root directory
cd /Users/lisadario/Desktop/ai-sports-edge

# Set text colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to display section headers
section() {
    echo -e "\n${BLUE}==== $1 ====${NC}\n"
}

# Function to display help
show_help() {
    echo -e "${BLUE}ML Sports Edge Pipeline${NC}"
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --all                 Run the pipeline for all configured sports and leagues"
    echo "  --sport SPORT         Run the pipeline for a specific sport (e.g., basketball, football)"
    echo "  --league LEAGUE       Run the pipeline for a specific league (e.g., nba, nfl)"
    echo "  --target TARGET       Target variable to predict (default: home_team_winning)"
    echo "  --train               Train new models"
    echo "  --predictions         Get latest predictions"
    echo "  --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --all              Run the pipeline for all sports and leagues"
    echo "  $0 --sport basketball --league nba  Run the pipeline for NBA"
    echo "  $0 --sport football --league nfl --train  Train new models for NFL"
    echo "  $0 --predictions      Get latest predictions"
}

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
        --help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Check if virtual environment exists
if [ ! -d "api/ml-sports-edge/venv" ]; then
    section "Creating virtual environment"
    python3 -m venv api/ml-sports-edge/venv
fi

# Activate virtual environment
section "Activating virtual environment"
source api/ml-sports-edge/venv/bin/activate

# Install dependencies if needed
if [ ! -f "api/ml-sports-edge/venv/.dependencies_installed" ]; then
    section "Installing dependencies"
    pip install -r api/ml-sports-edge/requirements.txt
    touch api/ml-sports-edge/venv/.dependencies_installed
fi

# Run the ML Sports Edge pipeline
section "Running ML Sports Edge pipeline"

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
    show_help
    exit 1
fi

# Deactivate virtual environment
deactivate

section "Pipeline execution completed"