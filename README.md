# AI Sports Edge

A comprehensive sports betting app with AI-powered predictions, UFC fight tracking, and player prop bet analysis.

## Features

### 1. UFC API Integration

- **Sherdog API Integration**: Real-time fighter data, records, and upcoming events
- **Odds API Integration**: Live betting odds for UFC events
- **Fighter Search**: Search functionality with fallback mechanisms
- **Event Tracking**: Comprehensive event data including venue, date, and fight cards

### 2. Player Prop Bet Predictions (Premium Feature)

- **AI-Powered Analysis**: Machine learning models for player performance predictions
- **Multiple Sports Support**: Basketball, football, baseball, and hockey prop bets
- **Confidence Ratings**: High, medium, and low confidence indicators with reasoning
- **Premium Access Control**: Exclusive content for paid subscribers

### 3. Gamified Rewards Program

- **Tiered Loyalty System**: Free → Silver → Gold → Platinum progression
- **Daily Streaks**: Rewards for consistent app usage (7, 20, and 30 days)
- **UFC Engagement**: Special rewards for UFC betting activity
- **Referral System**: Incentives for bringing new users to the platform

## UI/UX Enhancements

### High-Contrast & Readable Design

#### Fighter Card Improvements
- Enhanced visual hierarchy with contrasting backgrounds
- Increased font size and letter spacing for fighter names
- Improved nickname display with better color contrast
- Highlighted container for fighter records
- Better image presentation with borders and default avatars

#### VS Section Enhancements
- Subtle background color for the VS section
- Enhanced VS text with larger font, better weight, and text shadow
- Dedicated container for weight class information
- Redesigned title fight badge with gold color, border, and shadow effects

#### Event Selection Improvements
- Added shadows and improved border radius
- Enhanced text with better font sizes and spacing
- Used opacity for secondary information to create hierarchy
- Improved selected state visibility

#### Overall Screen Enhancements
- Subtle background gradient at the top of the screen
- Enhanced header with a border and improved title styling
- Improved refresh button with a background color
- Proper spacing between sections

### Fast & Minimalist

- Card-based design with clear information hierarchy
- Focused content with minimal clutter
- Optimized whitespace for better readability
- Performance optimizations for faster loading

### Engaging & Interactive

- Visual feedback for user actions
- Micro-interactions for favoriting fighters
- Animated state changes for better engagement
- Progress indicators for live events

### Personalized & Dynamic

- Favorite fighter system with visual indicators
- Personalized recommendations based on user preferences
- Custom notifications for favorite fighters' upcoming fights
- Adaptive content based on user behavior

## Technical Implementation

### API Integration

```typescript
// Example of Sherdog API integration
async fetchFighterFromSherdog(fighterId: string): Promise<UFCFighter> {
  try {
    const fighter = await fetchFromSherdogApi<any>(`/fighters/${fighterId}`);
    return {
      id: `fighter-${fighter.id}`,
      name: fighter.name,
      nickname: fighter.nickname || '',
      weightClass: fighter.weight_class || 'Unknown',
      record: fighter.record || '0-0-0',
      imageUrl: fighter.image_url || '',
      country: fighter.nationality || 'Unknown',
      isActive: fighter.status === 'active'
    };
  } catch (error) {
    console.error(`Error fetching fighter from Sherdog:`, error);
    throw error;
  }
}
```

### UI Components

```typescript
// Example of high-contrast fighter card component
<View style={[
  styles.fighterContainer,
  { backgroundColor: isDark ? '#1A1A1A' : '#F8F8F8', borderRadius: 8 }
]}>
  <TouchableOpacity
    style={[
      styles.favoriteButton,
      { 
        backgroundColor: favoriteFighters.includes(fighter.id) 
          ? 'rgba(255, 215, 0, 0.2)' 
          : 'transparent',
        borderRadius: 20
      }
    ]}
    onPress={() => toggleFavoriteFighter(fighter.id)}
  >
    <Ionicons
      name={favoriteFighters.includes(fighter.id) ? 'star' : 'star-outline'}
      size={22}
      color={favoriteFighters.includes(fighter.id) ? '#FFD700' : colors.primary}
    />
  </TouchableOpacity>
  <View style={styles.fighterInfo}>
    <Text style={[
      styles.fighterName, 
      { 
        color: colors.text,
        fontSize: 17,
        letterSpacing: 0.3
      }
    ]}>
      {fighter.name}
    </Text>
    {fighter.nickname && (
      <Text style={[
        styles.fighterNickname, 
        { 
          color: isDark ? '#D0D0D0' : '#505050',
          fontSize: 13
        }
      ]}>
        "{fighter.nickname}"
      </Text>
    )}
    <View style={styles.recordContainer}>
      <Text style={[
        styles.fighterRecord, 
        { 
          color: isDark ? '#FFFFFF' : '#000000',
          fontWeight: '600',
          backgroundColor: isDark ? 'rgba(52, 152, 219, 0.2)' : 'rgba(52, 152, 219, 0.1)',
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 4
        }
      ]}>
        {fighter.record}
      </Text>
    </View>
  </View>
</View>
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/ai-sports-edge.git
cd ai-sports-edge
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Start the development server
```bash
npm start
# or
yarn start
```

4. Open the app on your device using Expo Go or run in a simulator

## Future Enhancements

- Live fight tracking with real-time updates
- Enhanced AI models for more accurate predictions
- Social features for sharing bets and predictions
- Advanced statistics and historical analysis
- Integration with more sports and betting markets
