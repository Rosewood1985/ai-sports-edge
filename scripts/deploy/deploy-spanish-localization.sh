#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}AI Sports Edge Spanish Localization Deployment${NC}"
echo -e "${BLUE}=========================================${NC}"

# Create a timestamp for logs
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="deploy-spanish-localization_${TIMESTAMP}.log"

# Function to log messages
log() {
  echo -e "$1" | tee -a "$LOG_FILE"
}

# Function to check if a command succeeded
check_status() {
  if [ $? -eq 0 ]; then
    log "${GREEN}✓ $1 completed successfully${NC}"
  else
    log "${RED}✗ $1 failed${NC}"
    exit 1
  fi
}

# Step 1: Install localization dependencies
log "\n${YELLOW}Step 1: Installing localization dependencies...${NC}"
npm install i18n-js expo-localization
check_status "Installing localization dependencies"

# Step 2: Create i18n language files and loader
log "\n${YELLOW}Step 2: Creating i18n language files and loader...${NC}"

# Create i18n directory if it doesn't exist
mkdir -p i18n
check_status "Creating i18n directory"

# Create en.ts
cat > i18n/en.ts << 'EOL'
export default {
  welcome: "Welcome",
  betNow: "Bet Now",
  odds: "Odds",
  settings: "Settings",
  notifications: "Notifications",
  soccer: "Soccer",
  topPicks: "Top Picks",
};
EOL
check_status "Creating i18n/en.ts"

# Create es.ts
cat > i18n/es.ts << 'EOL'
export default {
  welcome: "Bienvenido",
  betNow: "Apuesta ahora",
  odds: "Cuotas",
  settings: "Configuración",
  notifications: "Notificaciones",
  soccer: "Fútbol",
  topPicks: "Mejores apuestas",
};
EOL
check_status "Creating i18n/es.ts"

# Create i18n.ts
cat > i18n/i18n.ts << 'EOL'
import * as Localization from 'expo-localization';
import i18n from 'i18n-js';
import en from './en';
import es from './es';
i18n.fallbacks = true;
i18n.translations = { en, es };
i18n.locale = Localization.locale.startsWith('es') ? 'es' : 'en';
export default i18n;
EOL
check_status "Creating i18n/i18n.ts"

# Step 3: Create LanguageToggle component
log "\n${YELLOW}Step 3: Creating LanguageToggle component...${NC}"

# Create components directory if it doesn't exist
mkdir -p components
check_status "Creating components directory"

# Create LanguageToggle.tsx
cat > components/LanguageToggle.tsx << 'EOL'
import React from 'react';
import { View, Text, Switch } from 'react-native';
import i18n from '../i18n/i18n';
export default function LanguageToggle({ onChange }: { onChange?: () => void }) {
  const isSpanish = i18n.locale.startsWith('es');
  const toggleLanguage = () => {
    i18n.locale = isSpanish ? 'en' : 'es';
    onChange?.();
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
      <Text style={{ marginRight: 10 }}>{isSpanish ? 'Español' : 'English'}</Text>
      <Switch value={isSpanish} onValueChange={toggleLanguage} />
    </View>
  );
}
EOL
check_status "Creating components/LanguageToggle.tsx"

# Step 4: Create language detector and default preferences
log "\n${YELLOW}Step 4: Creating language detector and default preferences...${NC}"

# Create utils directory if it doesn't exist
mkdir -p utils
check_status "Creating utils directory"

# Create languageDetector.ts
cat > utils/languageDetector.ts << 'EOL'
import * as Localization from 'expo-localization';
export const getPreferredLanguage = (): 'en' | 'es' => {
  const locale = Localization.locale || 'en-US';
  return locale.startsWith('es') ? 'es' : 'en';
};
EOL
check_status "Creating utils/languageDetector.ts"

# Create defaultPreferences.ts
cat > utils/defaultPreferences.ts << 'EOL'
import { getPreferredLanguage } from './languageDetector';
export const getDefaultSport = () => getPreferredLanguage() === 'es' ? 'Soccer' : 'NBA';
export const getDefaultTeams = () =>
  getPreferredLanguage() === 'es'
    ? ['Inter Miami CF', 'FC Barcelona', 'Club América']
    : ['Lakers', 'Cowboys', 'Yankees'];
EOL
check_status "Creating utils/defaultPreferences.ts"

# Step 5: Update userService.ts
log "\n${YELLOW}Step 5: Updating userService.ts...${NC}"

# Create services directory if it doesn't exist
mkdir -p services
check_status "Creating services directory"

# Check if userService.ts exists
if [ -f "services/userService.ts" ]; then
  # Append to userService.ts
  cat >> services/userService.ts << 'EOL'
import { getDefaultSport, getDefaultTeams } from '../utils/defaultPreferences';
import { getPreferredLanguage } from '../utils/languageDetector';
export const createUserDefaults = (userId: string) => {
  const lang = getPreferredLanguage();
  return firestore().collection('users').doc(userId).set({
    language: lang,
    favoriteSport: getDefaultSport(),
    favoriteTeams: getDefaultTeams(),
    oddsFormat: getDefaultOddsFormat(lang),
  });
};
EOL
  check_status "Updating services/userService.ts"
else
  # Create userService.ts
  cat > services/userService.ts << 'EOL'
import firestore from '@react-native-firebase/firestore';
import { getDefaultSport, getDefaultTeams } from '../utils/defaultPreferences';
import { getPreferredLanguage } from '../utils/languageDetector';
import { getDefaultOddsFormat } from '../utils/oddsFormatter';

export const createUserDefaults = (userId: string) => {
  const lang = getPreferredLanguage();
  return firestore().collection('users').doc(userId).set({
    language: lang,
    favoriteSport: getDefaultSport(),
    favoriteTeams: getDefaultTeams(),
    oddsFormat: getDefaultOddsFormat(lang),
  });
};

export const getUserProfile = (userId: string) => {
  return firestore().collection('users').doc(userId).get();
};

export const updateUserProfile = (userId: string, data: any) => {
  return firestore().collection('users').doc(userId).update(data);
};
EOL
  check_status "Creating services/userService.ts"
fi

# Step 6: Create Firebase function for language behavior tracking
log "\n${YELLOW}Step 6: Creating Firebase function for language behavior tracking...${NC}"

# Create functions directory if it doesn't exist
mkdir -p functions/src
check_status "Creating functions/src directory"

# Create updateLanguageBasedOnBehavior.ts
cat > functions/src/updateLanguageBasedOnBehavior.ts << 'EOL'
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const updateLanguageBasedOnBehavior = functions.firestore
  .document('users/{userId}/activity/{logId}')
  .onCreate(async (snap, context) => {
    const userId = context.params.userId;
    const activity = snap.data();
    if (activity.type === 'viewed_soccer') {
      const userRef = admin.firestore().doc(`users/${userId}`);
      const userDoc = await userRef.get();
      const previous = userDoc.data()?.soccerViews ?? 0;
      await userRef.set(
        {
          soccerViews: previous + 1,
          suggestedLanguage: previous >= 3 ? 'es' : null,
        },
        { merge: true }
      );
    }
  });
EOL
check_status "Creating functions/src/updateLanguageBasedOnBehavior.ts"

# Update index.ts in functions
if [ -f "functions/src/index.ts" ]; then
  # Append to index.ts
  cat >> functions/src/index.ts << 'EOL'
export { updateLanguageBasedOnBehavior } from './updateLanguageBasedOnBehavior';
EOL
  check_status "Updating functions/src/index.ts"
else
  # Create index.ts
  cat > functions/src/index.ts << 'EOL'
import * as admin from 'firebase-admin';
admin.initializeApp();

export { updateLanguageBasedOnBehavior } from './updateLanguageBasedOnBehavior';
EOL
  check_status "Creating functions/src/index.ts"
fi

# Step 7: Create odds formatter
log "\n${YELLOW}Step 7: Creating odds formatter...${NC}"

# Create oddsFormatter.ts
cat > utils/oddsFormatter.ts << 'EOL'
export const formatOdds = (odds: number, type: 'decimal' | 'american') => {
  if (type === 'decimal') return odds.toFixed(2);
  // Convert decimal to American odds
  if (odds >= 2) return `+${((odds - 1) * 100).toFixed(0)}`;
  return `-${(100 / (odds - 1)).toFixed(0)}`;
};

export const getDefaultOddsFormat = (lang: string): 'decimal' | 'american' =>
  lang === 'es' ? 'decimal' : 'american';
EOL
check_status "Creating utils/oddsFormatter.ts"

# Step 8: Create OddsToggle component
log "\n${YELLOW}Step 8: Creating OddsToggle component...${NC}"

# Create OddsToggle.tsx
cat > components/OddsToggle.tsx << 'EOL'
import React from 'react';
import { View, Text, Picker } from 'react-native';
import { useUser } from '../contexts/UserContext';

export default function OddsToggle() {
  const { user, updateUser } = useUser();
  return (
    <View>
      <Text>Odds Format:</Text>
      <Picker
        selectedValue={user.oddsFormat}
        onValueChange={(value) => updateUser({ oddsFormat: value })}
      >
        <Picker.Item label="American (+150)" value="american" />
        <Picker.Item label="Decimal (2.50)" value="decimal" />
      </Picker>
    </View>
  );
};
EOL
check_status "Creating components/OddsToggle.tsx"

# Step 9: Create Spanish-themed team cards
log "\n${YELLOW}Step 9: Creating Spanish-themed team cards...${NC}"

# Create SpanishTeamCard.tsx
cat > components/SpanishTeamCard.tsx << 'EOL'
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
export default function SpanishTeamCard({ team }) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: team.logo }} style={styles.logo} />
      <Text style={styles.caption}>#{team.hashtag}</Text>
      <Text style={styles.name}>{team.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#333',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  caption: {
    fontSize: 12,
    color: '#C62828',
    fontWeight: 'bold',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
  },
});
EOL
check_status "Creating components/SpanishTeamCard.tsx"

# Step 10: Create sample Spanish teams data
log "\n${YELLOW}Step 10: Creating sample Spanish teams data...${NC}"

# Create data directory if it doesn't exist
mkdir -p data
check_status "Creating data directory"

# Create teams.ts
cat > data/teams.ts << 'EOL'
export const teams = [
  { name: 'Lakers', logo: 'https://example.com/lakers.png' },
  { name: 'Cowboys', logo: 'https://example.com/cowboys.png' },
  { name: 'Yankees', logo: 'https://example.com/yankees.png' },
];

export const spanishTeams = [
  { name: 'Club América', logo: 'https://example.com/america.png', hashtag: 'VamosÁguilas' },
  { name: 'Real Madrid', logo: 'https://example.com/realmadrid.png', hashtag: 'HalaMadrid' },
  { name: 'Inter Miami CF', logo: 'https://example.com/intermiami.png', hashtag: 'SomosLaFamilia' },
];
EOL
check_status "Creating data/teams.ts"

# Step 11: Create a summary report
log "\n${YELLOW}Step 11: Creating summary report...${NC}"

cat > "spanish-localization-summary.md" << EOL
# Spanish Localization Deployment Summary

## Deployment Timestamp
${TIMESTAMP}

## Steps Completed
1. ✓ Installed localization dependencies (i18n-js, expo-localization)
2. ✓ Created i18n language files and loader
3. ✓ Created LanguageToggle component
4. ✓ Created language detector and default preferences
5. ✓ Updated userService.ts
6. ✓ Created Firebase function for language behavior tracking
7. ✓ Created odds formatter
8. ✓ Created OddsToggle component
9. ✓ Created Spanish-themed team cards
10. ✓ Created sample Spanish teams data

## Next Steps
1. Update BetCard component to use the odds formatter
2. Update TeamList component to use the Spanish team cards
3. Add LanguageToggle and OddsToggle to the settings screen
4. Deploy the Firebase function for language behavior tracking
5. Test the localization with Spanish and English users

## Files Created
- i18n/en.ts
- i18n/es.ts
- i18n/i18n.ts
- components/LanguageToggle.tsx
- utils/languageDetector.ts
- utils/defaultPreferences.ts
- utils/oddsFormatter.ts
- components/OddsToggle.tsx
- components/SpanishTeamCard.tsx
- data/teams.ts
- functions/src/updateLanguageBasedOnBehavior.ts
EOL

check_status "Creating summary report"

log "\n${GREEN}=========================================${NC}"
log "${GREEN}Spanish Localization Deployment Completed Successfully${NC}"
log "${GREEN}See spanish-localization-summary.md for details${NC}"
log "${GREEN}=========================================${NC}"