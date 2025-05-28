#!/bin/bash
# setup-ml-dependencies.sh
#
# This script sets up the ML dependencies for the AI Sports Edge app
# - Creates a service account key for Firebase authentication
# - Installs required Python packages
# - Creates sample data for initial training

set -e  # Exit on any error

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up ML dependencies for AI Sports Edge...${NC}"

# Step 1: Create directories if they don't exist
echo -e "${YELLOW}Step 1: Creating directories...${NC}"
mkdir -p ml/training/data
mkdir -p ml/models

# Step 2: Set up service account key
echo -e "${YELLOW}Step 2: Setting up service account key...${NC}"

if [ -f "serviceAccountKey.json" ]; then
  echo -e "${GREEN}Service account key already exists.${NC}"
else
  echo -e "${YELLOW}Service account key not found.${NC}"
  echo -e "To create a service account key:"
  echo -e "1. Go to Firebase console: https://console.firebase.google.com/"
  echo -e "2. Select your project"
  echo -e "3. Go to Project Settings > Service accounts"
  echo -e "4. Click 'Generate new private key'"
  echo -e "5. Save the file as 'serviceAccountKey.json' in the project root directory"
  
  read -p "Have you downloaded the service account key? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Service account key is required for ML pipeline. Exiting.${NC}"
    exit 1
  fi
  
  read -p "Enter the path to the downloaded service account key: " key_path
  if [ -f "$key_path" ]; then
    cp "$key_path" serviceAccountKey.json
    echo -e "${GREEN}Service account key copied to project root.${NC}"
  else
    echo -e "${RED}File not found. Please download the service account key and try again.${NC}"
    exit 1
  fi
fi

# Step 3: Install Python packages
echo -e "${YELLOW}Step 3: Installing Python packages...${NC}"

# Check if pip is installed
if ! command -v pip &> /dev/null; then
  echo -e "${RED}pip is not installed. Please install Python and pip first.${NC}"
  exit 1
fi

# Install required packages
echo "Installing required Python packages..."
pip install pandas numpy scikit-learn xgboost firebase-admin matplotlib seaborn

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to install Python packages. Please check your Python installation.${NC}"
  exit 1
else
  echo -e "${GREEN}Python packages installed successfully.${NC}"
fi

# Step 4: Create sample data for initial training
echo -e "${YELLOW}Step 4: Creating sample data for initial training...${NC}"

# Create sample data CSV
cat > ml/training/data/games_data.csv << EOL
game_id,team_a,team_b,team_a_score,team_b_score,sport,league,date,spread,over_under,public_betting_percentage,sharp_betting_percentage,line_movement,weather_conditions,team_a_form,team_b_form,team_a_injuries,team_b_injuries,result
g001,Lakers,Celtics,105,98,NBA,NBA,2025-01-01,-3.5,220.5,65,45,1.5,Indoor,WWLWW,LWWLW,Minor,Moderate,team_a
g002,Chiefs,49ers,28,21,NFL,NFL,2025-01-02,-2.5,48.5,55,60,-0.5,Cold,WWWLW,WLWWW,Moderate,Minor,team_a
g003,Yankees,Red Sox,5,7,MLB,MLB,2025-01-03,1.5,8.5,48,65,-1.0,Clear,LWWLW,WWLWL,Minor,Minor,team_b
g004,Bruins,Maple Leafs,2,3,NHL,NHL,2025-01-04,0.5,5.5,52,48,0.0,Indoor,LLWWL,WLWLW,Moderate,Moderate,team_b
g005,Warriors,Nets,112,105,NBA,NBA,2025-01-05,-4.5,225.0,70,55,2.0,Indoor,WWWLW,LWLLW,Minor,Major,team_a
g006,Packers,Cowboys,24,28,NFL,NFL,2025-01-06,2.5,47.5,45,52,-1.5,Rainy,WLWLW,WWWLL,Minor,Minor,team_b
g007,Dodgers,Giants,4,2,MLB,MLB,2025-01-07,-1.5,7.5,58,62,0.5,Clear,WWWWL,LWLWW,Minor,Moderate,team_a
g008,Avalanche,Golden Knights,4,3,NHL,NHL,2025-01-08,-0.5,6.0,53,55,0.0,Indoor,WLWWW,WWLWL,Minor,Minor,team_a
g009,Bucks,76ers,108,115,NBA,NBA,2025-01-09,1.5,218.0,42,58,-2.0,Indoor,LWLWL,WWWLW,Moderate,Minor,team_b
g010,Ravens,Bills,21,17,NFL,NFL,2025-01-10,-3.0,45.5,62,58,1.0,Snowy,WWWWL,LWWWL,Minor,Moderate,team_a
g011,Astros,Braves,3,5,MLB,MLB,2025-01-11,0.5,8.0,48,52,-0.5,Clear,WLWLW,WWLWW,Minor,Minor,team_b
g012,Penguins,Capitals,2,1,NHL,NHL,2025-01-12,-1.0,5.0,55,60,0.5,Indoor,LWWWL,WLLWW,Moderate,Minor,team_a
g013,Heat,Knicks,98,92,NBA,NBA,2025-01-13,-2.5,210.0,58,48,1.0,Indoor,WWLWW,LWLWL,Minor,Moderate,team_a
g014,Eagles,Rams,31,24,NFL,NFL,2025-01-14,-4.5,49.5,65,52,2.0,Clear,WWWLW,LWWLL,Minor,Major,team_a
g015,Cubs,Cardinals,2,4,MLB,MLB,2025-01-15,1.0,7.5,45,55,-1.0,Rainy,LLWLW,WWLWW,Moderate,Minor,team_b
g016,Rangers,Islanders,3,2,NHL,NHL,2025-01-16,-0.5,5.5,52,48,0.0,Indoor,WLWWL,LWLWW,Minor,Minor,team_a
g017,Suns,Mavericks,110,118,NBA,NBA,2025-01-17,2.5,228.0,42,58,-1.5,Indoor,LWLWL,WWWLW,Major,Minor,team_b
g018,Steelers,Browns,17,14,NFL,NFL,2025-01-18,-1.5,42.0,55,52,0.5,Cold,WLWWW,LWLWL,Minor,Moderate,team_a
g019,Mets,Phillies,6,3,MLB,MLB,2025-01-19,-1.0,8.0,58,62,0.5,Clear,WWLWW,LWLWL,Minor,Minor,team_a
g020,Canadiens,Bruins,1,4,NHL,NHL,2025-01-20,3.0,5.5,35,42,-1.0,Indoor,LLWLL,WWWLW,Moderate,Minor,team_b
EOL

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create sample data.${NC}"
  exit 1
else
  echo -e "${GREEN}Sample data created successfully.${NC}"
fi

# Step 5: Verify setup
echo -e "${YELLOW}Step 5: Verifying setup...${NC}"

# Check service account key
if [ ! -f "serviceAccountKey.json" ]; then
  echo -e "${RED}Service account key not found.${NC}"
  exit 1
fi

# Check Python packages
echo "Checking Python packages..."
python -c "import pandas, numpy, sklearn, xgboost, firebase_admin, matplotlib, seaborn; print('All packages imported successfully.')"

if [ $? -ne 0 ]; then
  echo -e "${RED}Python packages verification failed.${NC}"
  exit 1
else
  echo -e "${GREEN}Python packages verified successfully.${NC}"
fi

# Check sample data
if [ ! -f "ml/training/data/games_data.csv" ]; then
  echo -e "${RED}Sample data not found.${NC}"
  exit 1
else
  echo -e "${GREEN}Sample data verified successfully.${NC}"
fi

echo -e "${GREEN}ML dependencies setup completed successfully!${NC}"
echo -e "You can now run the ML training pipeline with:"
echo -e "  ./ml/training/train_and_push.sh"
echo -e "Or deploy all components with:"
echo -e "  ./deploy-ai-features.sh"